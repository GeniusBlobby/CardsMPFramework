import type { Server } from "socket.io";
import type { Suggestion, SuggestionResult, Person, Card, Weapon, Room} from "@shared/card";
import { SUSPECTS, SuspectToPerson, WeaponToSmallWeapon, RoomToSmallRoom } from "@shared/card";
import { Game, SerializedGame, GamePhase, stringifyLocation, destringifyLocation } from "@shared/game";
import { PlayerStatus, Player } from "@shared/player";
import {
	MAX_ROOM_PLAYERS,
	MIN_ROOM_PLAYERS,
	gameRoom,
	RoomStatus,
} from "@shared/gameRoom";
import type { GameSocket } from "./index";
import { io, MENU_ROOM, rooms, profiles } from "./index";
import { emit } from "node:process";

const ROOM_CODE_PATTERN = /^[A-Z0-9]{4}$/;
const DISCONNECT_GRACE_MS = 15_000;
const pendingDisconnects = new Map<string, ReturnType<typeof setTimeout>>();

export function setupHandlers(socket: GameSocket): void {
	socket.on("ping", () => {
		socket.emit("pong");
	});

	socket.on("set-name", (name: unknown) => {
		const trimmedName = normalizeName(name);
		if (trimmedName === undefined) return;

		socket.player.name = trimmedName;

		const profile = profiles.get(socket.player.id);
		if (profile) {
			profile.name = trimmedName;
			profile.lastSeen = Date.now();
		}

		const roomPlayer = socket.room?.players.get(socket.player.id);
		if (roomPlayer) roomPlayer.name = trimmedName;
	});

	socket.on("create-room", () => {
		if (isRateLimited(socket, "create-room", 5, 60_000)) {
			socket.emit("error", "Too many rooms created. Please wait.");
			return;
		}

		const code = createRoom();
		if (!code) {
			socket.emit("error", "Room limit reached");
			return;
		}

		joinRoom(socket, io, code);
	});

	socket.on("join-room", (code: unknown) => {
		const roomCode = normalizeRoomCode(code);
		if (!roomCode) {
			socket.emit("error", "Invalid room code");
			return;
		}

		joinRoom(socket, io, roomCode);
	});

	socket.on("disconnect", () => {
		handlePlayerLeave(socket);
	});

	socket.on("reset-room", () => {
		if (
			!socket.room ||
			//socket.room.game.phase !== GamePhase.RESET ||
			socket.room.status !== RoomStatus.LOBBY
		)
			return;

		if (!socket.room.tryStartRoom()) {
			socket.emit("error", `Need ${MIN_ROOM_PLAYERS}-${MAX_ROOM_PLAYERS} players`);
			return;
		}

		broadcastSystemChat(socket.room, "New mystery started.");
		emitStartedRoom(socket.room);
	});

	socket.on("select-character", (selectedCharacter: unknown) => {
		if (!socket.room)
		{
			return;
		}

		if (typeof selectedCharacter !== "string" ||
			!SUSPECTS.includes(selectedCharacter)) 
		{
			return;
		}

		const roomPlayer = socket.room?.players.get(socket.player.id);
		const character = SuspectToPerson[selectedCharacter];

		for (const [id, player] of socket.room.players)
		{
			if(player.character === character && id !== roomPlayer!.id)
			{
				broadcastSystemChat(socket.room, player.name + " already selected " + selectedCharacter)
				return;
			}
		}

		roomPlayer!.character = character;

		io.to(socket.room.code).emit("character-selected", roomPlayer!.id, character);
		broadcastSystemChat(socket.room, roomPlayer!.name + " selected " + roomPlayer!.character);
	})

	socket.on("roll-dice", () =>{
		const game = socket.room!.game;
		const diceroll = game.generateDiceRoll();
		const roomPlayer = socket.room?.players.get(socket.player.id);
		game.rolledDice = true;

		socket.emit("dice-rolled", diceroll);
		broadcastSystemChat(socket.room!, roomPlayer!.name + " rolled a " + diceroll);
	})

	socket.on("player-moved", (loc: string) => {
		if (!socket.room)
		{
			return;
		}

		const roomPlayer = socket.room?.players.get(socket.player.id);

		socket.room?.game.moveCurrentPlayer(destringifyLocation(loc));
		io.to(socket.room.code).emit("player-moved", roomPlayer!.id, loc);
	})

	socket.on("make-suggestion", (suspect: string, weapon: string) => {
		if (!canTakeTurn(socket)) 
		{
			return;
		}

		const room = socket.room;
		if (!room)
		{
			return;
		}

		const game = socket.room?.game;

		const realSuspect = SuspectToPerson[suspect];
		const realWeapon = WeaponToSmallWeapon[weapon];
		const realRoom = game!.getRoom(game!.players[game!.currentPlayerIndex]);

		const suggestion: Suggestion = {
			suspect: realSuspect,
			weapon: realWeapon,
			room: realRoom
		}

		console.log(suggestion);
		const cardsToShow = room.game.makeSuggestion(socket.player.id, suggestion);

		const suggestee = room.game.players.find(player => player.id === socket.player.id);
		const refuter = room.game.players[(suggestee!.index! + 1) % room.game.players.length];

		const socketRefuter = [...io.sockets.sockets.values()].find(
				(candidate) => (candidate as GameSocket).player?.id === refuter.id,
			) as GameSocket | undefined;
		
		broadcastSystemChat(socket.room!, suggestee!.name + " suggested " 
			+ suggestion.suspect + " with the " + suggestion.weapon + " in the " + suggestion.room);

		socketRefuter?.emit("respond-suggestion", cardsToShow);
		socket.emit("made-suggestion");
	});

	socket.on("showed-card", (shownCard: Card, shower: Player) => {
		socket.emit("clear-suggestion-response");

		const suggesteeId = socket.room?.game.currentSuggesteeId;
		const suggestee = socket.room?.game.players.find(player => player.id === suggesteeId);
		const suggesteeName = suggestee?.name;

		const socketSuggestee = [...io.sockets.sockets.values()].find(
				(candidate) => (candidate as GameSocket).player?.id === suggesteeId,
			) as GameSocket | undefined;

		broadcastSystemChat(socket.room!, suggesteeName + " was refuted by " + shower.name);
		socketSuggestee?.emit("shown-card", shownCard);
	});

	socket.on("suggestion-pass", (refuterId: string) => {
		

		const room = socket.room;
		const currentRefuter = room!.game.players.find(player => player.id === refuterId);
		const refuter = room!.game.players[(currentRefuter!.index! + 1) % room!.game.players.length];

		console.log(currentRefuter!.name);
		console.log(currentRefuter!.hand);
		const validPass = socket.room?.game.isValidPass(currentRefuter!.id);

		console.log(validPass);
		if (!validPass)
		{
			const hasLies = socket.room?.game.hasLies(currentRefuter!.id);

			if (!hasLies)
			{
				return;
			}
			else
			{
				socket.room?.game.invalidPass(currentRefuter!.id);
				socket.emit("invalid-pass", socket.room?.game.playerLies[currentRefuter!.id]);
			}
		}

		socket.emit("clear-suggestion-response");

		const result = socket.room?.game.passSuggestion(refuter.id);

		broadcastSystemChat(room!, currentRefuter!.name + " passed");

		if (result === 0)   //Looped back around
		{
			broadcastSystemChat(room!, "Nobody showed a card");
			return;
		}

		const socketRefuter = [...io.sockets.sockets.values()].find(
			(candidate) => (candidate as GameSocket).player?.id === refuter.id,
		) as GameSocket | undefined;
		
		socketRefuter?.emit("respond-suggestion", result as Card[] | undefined);
	})

	socket.on("make-accusation", (accusedSuspect: Person, acccusedWeapon: Weapon, accusedRoom: Room) => {
		if (!canTakeTurn(socket)) return;
		const room = socket.room;
		if (!room) return;

		const suggestion: Suggestion = {
			suspect: SuspectToPerson[accusedSuspect],
			weapon: WeaponToSmallWeapon[acccusedWeapon],
			room: RoomToSmallRoom[accusedRoom]
		}

		const result = room.game.verifyAccusation(suggestion);

		if (result) {
			broadcastSystemChat(
				room,
				`${socket.player.name || "A player"} solved the case.`,
			);
			room.endRoom();
		} 
		else 
			{
			broadcastSystemChat(
				room,
				`${socket.player.name || "A player"} made a false accusation and is out of the case.`,
			);
		}

		emitGameSnapshot(room);
	});

	socket.on("end-turn", () => {
		if (!canTakeTurn(socket)) return;

		socket.emit("clear-shown-card");

		const room = socket.room;
		if (!room) return;

		if (!room.game.endTurn(socket.player.id)) {
			socket.emit("error", "Cannot end turn");
			return;
		}

		for (const player of room.game.players)
		{
			if (!room.game.playerInGame[player.id])
			{
				room.game.endTurn(player.id);
			}
			else
			{
				break;
			}
		}

		emitGameSnapshot(room);
	});

	socket.on("send-chat", (rawMessage: string) => {
		if (!socket.room || typeof rawMessage !== "string") return;
		if (isRateLimited(socket, "send-chat", 8, 10_000)) {
			socket.emit("error", "Chat is sending too quickly.");
			return;
		}

		const message = rawMessage.trim().slice(0, 200);
		if (!message) return;

		socket.room.chat.push(socket.player.id, message);
		io.to(socket.room.code).emit("p-sent-chat", socket.player.id, message);
	});
}

function canTakeTurn(socket: GameSocket): boolean {
	return (
		!!socket.room &&
		socket.room.status === RoomStatus.PLAYING &&
		socket.room.game.phase === GamePhase.INPROGRESS &&
		socket.room.game.players[socket.room.game.currentPlayerIndex].id === socket.player.id
	);
}

function normalizeName(name: unknown): string | undefined {
	if (typeof name !== "string") return;
	return name.trim().slice(0, 20);
}

function normalizeRoomCode(code: unknown): string | undefined {
	if (typeof code !== "string") return;
	const normalized = code.trim().toUpperCase();
	if (!ROOM_CODE_PATTERN.test(normalized)) return;
	return normalized;
}

function isRateLimited(
	socket: GameSocket,
	key: string,
	limit: number,
	windowMs: number,
): boolean {
	const now = Date.now();
	const data = socket.data as {
		rateLimits?: Record<string, { count: number; resetAt: number }>;
	};
	data.rateLimits ??= {};

	const current = data.rateLimits[key];
	if (!current || current.resetAt <= now) {
		data.rateLimits[key] = { count: 1, resetAt: now + windowMs };
		return false;
	}

	current.count++;
	return current.count > limit;
}

function broadcastSystemChat(room: gameRoom, message: string): void {
	room.chat.push("server", message);
	io.to(room.code).emit("p-sent-chat", "server", message);
}

function emitGameSnapshot(room: gameRoom): void {
	for (const player of room.players.values()) {
		const socket = [...io.sockets.sockets.values()].find(
			(candidate) => (candidate as GameSocket).player?.id === player.id,
		) as GameSocket | undefined;


		if (socket) {
			socket.emit("game-updated", room.game.serialize(player.id) satisfies SerializedGame);
		}
	}
}

function applyWinScore(room: gameRoom, winnerId: string): void {
	for (const player of room.players.values()) {
		if (player.id === winnerId) player.score += 1;
		const gamePlayer = room.game.players.find((p) => p.id === player.id);
		if (gamePlayer) gamePlayer.score = player.score;
		io.to(room.code).emit("p-score-updated", player.id, player.score);
	}
}

function emitStartedRoom(room: gameRoom): void {
	for (const player of room.players.values()) {
		const socket = [...io.sockets.sockets.values()].find(
			(candidate) => (candidate as GameSocket).player?.id === player.id,
		) as GameSocket | undefined;
		if (socket) socket.emit("started-room", room.game.serialize(player.id));
	}
}

function createRoom(roomCode?: string): string | undefined {
	if (rooms.size >= 10_000) return;
	const code = roomCode || randomCode();
	const room = new gameRoom(code);
	rooms.set(code, room);

	return code;
}

function joinRoom(socket: GameSocket, ioServer: Server, code: string): void {
	const room = rooms.get(code);

	if (!room) {
		socket.emit("error", "Room not found");
		return;
	}

	const playerInRoom = room.players.get(socket.player.id);
	if (playerInRoom) {
		cancelPendingDisconnect(socket.player.id);
		socket.leave(MENU_ROOM);
		socket.join(code);
		socket.room = room;
		socket.player.name = playerInRoom.name;
		playerInRoom.status = PlayerStatus.NOT_READY;
		socket.emit("joined-room", room.serialize(socket.player.id));
		socket
			.to(socket.room.code)
			.emit("p-set-status", socket.player.id, PlayerStatus.NOT_READY);
	} else {
		if (room.status !== RoomStatus.LOBBY) {
			socket.emit("error", "Game already in progress");
			return;
		}

		if (room.players.size >= MAX_ROOM_PLAYERS) {
			socket.emit("error", "Room is full");
			return;
		}

		socket.leave(MENU_ROOM);
		socket.join(code);
		socket.room = room;
		socket.player.status = PlayerStatus.NOT_READY;
		room.addPlayer(socket.player);
		ioServer.to(socket.room.code).emit(
			"p-joined-room",
			socket.player.id,
			socket.player.name,
		);
		socket.emit("joined-room", room.serialize(socket.player.id));
	}
}

function handlePlayerLeave(socket: GameSocket): void {
	const room = socket.room;
	if (!room) return;

	socket.leave(room.code);

	if (room.status === RoomStatus.LOBBY) handleLobbyPlayerLeave(socket, room);
	else handleGamePlayerDisconnect(socket, room);

	if (room.status === RoomStatus.LOBBY && shouldDeleteRoom(room))
		deleteRoom(room.code);
}

function handleLobbyPlayerLeave(socket: GameSocket, room: gameRoom): void {
	room.removePlayer(socket.player.id);
	socket.to(room.code).emit("p-left-room", socket.player.id);
}

function handleGamePlayerDisconnect(socket: GameSocket, room: gameRoom): void {
	const player = room.players.get(socket.player.id);
	if (player) {
		player.status = PlayerStatus.DISCONNECTED;
		socket
			.to(room.code)
			.emit("p-set-status", socket.player.id, PlayerStatus.DISCONNECTED);
		scheduleDisconnectCleanup(socket.player.id, room.code);
	}
}

function scheduleDisconnectCleanup(playerId: string, roomCode: string): void {
	cancelPendingDisconnect(playerId);

	pendingDisconnects.set(
		playerId,
		setTimeout(() => {
			pendingDisconnects.delete(playerId);
			const room = rooms.get(roomCode);
			const player = room?.players.get(playerId);
			if (!room || player?.status !== PlayerStatus.DISCONNECTED) return;

			if (room.status === RoomStatus.PLAYING) {
				const reason = `${player.name || "A player"} disconnected. Case ended.`;
				io.to(room.code).emit("ended-room", reason);
				broadcastSystemChat(room, reason);
				room.endRoom();
			} else {
				room.removePlayer(playerId);
				io.to(room.code).emit("p-left-room", playerId);
			}

			if (shouldDeleteRoom(room)) deleteRoom(room.code);
		}, DISCONNECT_GRACE_MS),
	);
}

function cancelPendingDisconnect(playerId: string): void {
	const timeout = pendingDisconnects.get(playerId);
	if (!timeout) return;

	clearTimeout(timeout);
	pendingDisconnects.delete(playerId);
}

function shouldDeleteRoom(room: gameRoom): boolean {
	return room.allPlayersDisconnected();
}

function deleteRoom(roomCode: string): void {
	rooms.delete(roomCode);
}

function randomCode(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let result = "";
	do {
		result = "";
		for (let index = 0; index < 4; index++)
			result += chars.charAt(Math.floor(Math.random() * chars.length));
	} while (rooms.has(result));

	return result;
}
