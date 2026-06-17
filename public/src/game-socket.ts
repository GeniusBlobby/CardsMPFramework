import { Player, type PlayerStatus } from "@shared/player";
import type { SerializedGame } from "@shared/game";
import { destringifyLocation, Game, GamePhase, Rooms } from "@shared/game";
import { Person, Card } from "@shared/card";
import { gameRoom, RoomStatus, type SerializedRoom } from "@shared/gameRoom";
import {
	endGameUI,
	showRoomElements,
	startGameUI,
	updateUIGame,
	updateUIPlayerList,
	createMoveOptions,
	renderActionButtons,
	renderSuggestionEvidenceHand,
	renderPassButton,
	clearSuggestionButtons,
	renderShownCard,
	clearSuggestionResponses,
	clearShownCard,
	renderLies,
	renderCharacterIcons,
	clearMoveOptions,
	renderWinScreen,
	clearWinArea,
	renderEvidenceHand,
	renderTurnBanner
} from "./game-ui-render";
import { updateUIAllChat, updateUIPushChat } from "./game-ui-chat";
import { gs } from "./session";
import { updateURL } from "./url";

export function initGameSocket(): void {
	gs.socket.on("sent-player", (name: string) => {
		gs.player.name = name;
	});

	gs.socket.on("joined-room", (raw: SerializedRoom) => {
		const room = gameRoom.deserialize(raw);
		updateURL(room.code);

		gs.room = room;
		gs.player = room.players.get(gs.player.id) ?? gs.player;

		syncRoomPlayersFromGame();

		showRoomElements();
		updateUIPlayerList();
		updateUIAllChat();
		updateUIGame();

		if (room.status === RoomStatus.PLAYING) startGameUI();
		else endGameUI();
	});

	gs.socket.on("p-joined-room", (id: string, name: string) => {
		if (id === gs.player.id) return;

		gs.room.addPlayer(new Player(id, name));
		updateUIGame();
	});

	gs.socket.on("p-left-room", (id: string) => {
		gs.room.removePlayer(id);
		updateUIGame();
	});

	gs.socket.on("p-set-status", (id: string, status: PlayerStatus) => {
		const player = gs.room.getPlayer(id);
		if (!player) return;

		player.status = status;
		updateUIGame();
	});

	gs.socket.on("started-room", (raw: SerializedGame) => {
		gs.room.status = RoomStatus.PLAYING;
		gs.room.game = Game.deserialize(raw);

		gs.player =
			gs.room.game.players.find(p => p.id === gs.player.id) ?? gs.player;

		syncRoomPlayersFromGame();
		startGameUI();
	});

	gs.socket.on("game-updated", (raw: SerializedGame) => {
		gs.room.game = Game.deserialize(raw);

		gs.player =
			gs.room.game?.players.find(p => p.id === gs.player.id) ?? gs.player;

		syncRoomPlayersFromGame();
		updateUIGame();
		renderLies(gs.room.game.playerLies[gs.player.id]);
	});

	gs.socket.on("character-selected", (id: string, character: Person) => {
		const player = gs.room.getPlayer(id);
		if(!player) return;

		player.character = character;

		updateUIGame();
	});

	gs.socket.on("dice-rolled", (diceroll: number) => {
		gs.room.game.rolledDice = true;
		createMoveOptions(diceroll);
		renderActionButtons();
	});

	gs.socket.on("player-moved", (suspectId: string | undefined, loc: string) => {
		const game = gs.room.game;
		game.moveCurrentPlayer(destringifyLocation(loc));

		if (suspectId)
		{
			game.movePlayer(game.players.find(player => player.id === suspectId)!, Rooms[loc]);
		}

		if (gs.room.game.phase === GamePhase.INPROGRESS)
		{
			renderCharacterIcons();
			clearMoveOptions();
		}
	});

	gs.socket.on("entered-room", () => {
		renderActionButtons();
	})

	gs.socket.on("respond-suggestion", (cardsToShow: Card[] | undefined) => {
		if (cardsToShow)
		{
			renderSuggestionEvidenceHand(cardsToShow);
		}

		renderPassButton();
	});

	gs.socket.on("made-suggestion", () => {
		clearSuggestionButtons();
	});

	gs.socket.on("shown-card", (card: Card) => {
		renderShownCard(card);
	});

	gs.socket.on("clear-shown-card", () => {
		clearShownCard();
	});

	gs.socket.on("invalid-pass", (lies: number) => {
		renderLies(lies);
	})

	gs.socket.on("clear-suggestion-response", () => {
		clearSuggestionResponses();
	})

	gs.socket.on("player-won", (winnerId: string) => {
		const winner = gs.room.players.get(winnerId);
		renderWinScreen(winner!.name);
	})

	gs.socket.on("p-score-updated", (id: string, score: number) => {
		applyScoreUpdate(id, score);
		updateUIPlayerList();
	});

	gs.socket.on("reset-room", (room: SerializedRoom) => {
		gs.room = gameRoom.deserialize(room);
		gs.room.status = RoomStatus.LOBBY;
		
		gs.player = gs.room.players.get(gs.player.id)!;

		clearWinArea();
		renderEvidenceHand();
		renderTurnBanner();
		updateUIPlayerList();
		renderActionButtons();
	});

	gs.socket.on("ended-room", (reason: string) => {
		gs.room.status = RoomStatus.LOBBY;
		gs.room.endRoom();

		endGameUI();

		updateUIPushChat({
			id: "server",
			message: reason,
		});
	});

	gs.socket.on("p-sent-chat", (id: string, message: string) => {
		gs.room.chat.push(id, message);

		updateUIPushChat({ id, message });
	});
}

function applyScoreUpdate(id: string, score: number): void {
	const roomPlayer = gs.room.players.get(id);
	if (roomPlayer) roomPlayer.score = score;

	const gamePlayer = gs.room.game?.players.find(player => player.id === id);
	if (gamePlayer) gamePlayer.score = score;

	if (gs.player.id === id) gs.player.score = score;
}

function syncRoomPlayersFromGame(): void {
	if (!gs.room.game) return;

	for (const gamePlayer of gs.room.game.players) {
		const roomPlayer = gs.room.players.get(gamePlayer.id);
		if (!roomPlayer) continue;

		roomPlayer.cardCount = gamePlayer.cardCount;
		roomPlayer.score = gamePlayer.score;
		roomPlayer.status = gamePlayer.status;
		roomPlayer.index = gamePlayer.index;
		roomPlayer.character = gamePlayer.character;
	}
}