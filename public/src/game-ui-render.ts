import { Card, Suggestion, CARD_DEFINITIONS, SUSPECTS, WEAPONS, ROOMS, Person, Weapon, Room } from "@shared/card";
import { GamePhase, BOARDHEIGHT, BOARDWIDTH, stringifyLocation, destringifyLocation } from "@shared/game"
import { PersonToSuspect } from "@shared/card"
import type { Player } from "@shared/player";
import { PlayerStatus } from "@shared/player";
import { MAX_ROOM_PLAYERS, MIN_ROOM_PLAYERS, RoomStatus } from "@shared/gameRoom";
import { gs } from "./session";
import {
    clearGameArea,
    escapeHtml,
    getClueCardImagePath,
    makeBtn,
	makeMoveBtn
} from "./game-ui-utils";

const characterColors: Record<string, string> = {
	"scarlet": "red",
	"peacock": "blue",
	"white": "white",
	"green": "green",
	"plum": "purple",
	"mustard": "yellow"
}

const RoomRenderLocations: Record<Room, [number, number]> = {
	"library": [18, 85],
	"lounge": [28.2, 50],
	"kitchen": [20.5, 18],
	"dining": [50.5, 13.2],
	"conservatory": [83, 13.4],
	"cellar": [81, 43],
	"attic": [81, 64],
	"study": [75.4, 87.5],
	"billiard": [50.5, 73.2],
	"filler": [0, 0]
}

const ROOM_CHARACTER_ICON_SPACING_PX = 26;

function isPlayersTurn(): boolean {
    const game = gs.room?.game;
    if (!gs.player || !game) return false;
	if (game.playerInGame[gs.player.index!] === false) return false;
    return gs.player.index === game.currentPlayerIndex;
}

export function showRoomElements(): void {
	for (const screen of document.querySelectorAll(".screen"))
		screen.classList.add("hidden");

	const gameScreen = document.querySelector("#game") as HTMLDivElement;
	gameScreen.classList.remove("hidden");

	const codeEl = document.querySelector(
		"#game-room-code",
	) as HTMLButtonElement;
	if (codeEl) {
		const roomCode = gs.room.code || "";
		codeEl.textContent = roomCode;
		codeEl.title = roomCode
			? "Click to copy invite link"
			: "No room code available";
		codeEl.classList.toggle("is-clickable", !!roomCode);
		codeEl.disabled = !roomCode;
		codeEl.onclick = roomCode ? () => copyRoomInviteLink(roomCode) : null;
	}

	clearGameArea();
}

async function copyRoomInviteLink(roomCode: string): Promise<void> {
	const inviteLink = `${globalThis.location.origin}/games/${roomCode}`;

	try {
		await globalThis.navigator.clipboard?.writeText(inviteLink);
		return;
	} catch {}

	const textarea = document.createElement("textarea");
	textarea.value = inviteLink;
	textarea.setAttribute("readonly", "true");
	textarea.style.position = "fixed";
	textarea.style.top = "-1000px";
	textarea.style.opacity = "0";
	document.body.append(textarea);
	textarea.select();
	document.execCommand("copy");
	textarea.remove();
}

export function updateUIPlayerList(): void {
	if (!gs.room) return;

	const playerList = document.querySelector("#player-list");
	if (!playerList) return;

	playerList.innerHTML = "";
	for (const player of getSortedRoomPlayers()) {
		const div = document.createElement("div");
		div.className = "player-item";

		const isYou = player.id === gs.player.id;
		const character = player.character;
		const status =
			player.status === PlayerStatus.ELIMINATED
				? "Out"
				: player.status === PlayerStatus.DISCONNECTED
					? "Away"
					: `${player.score ?? 0} solved`;

		div.innerHTML = `
			<div class="player-name" style="color: ${character? characterColors[character] : "grey"}">
				${escapeHtml(player.name || "?")}
				${isYou ? " (You)" : ""}
				${character ? " -- " + PersonToSuspect[character] : ""}
				</div>
			<div class="card-count">${escapeHtml(status)}</div>
		`;
		playerList.append(div);
	}
}

export function updateUIGame(): void {

	if (!gs.room || !gs.player) return;

	clearMoveOptions();
	updateUIPlayerList();
	renderEvidenceHand();
	renderActionButtons();
	renderTurnBanner();
	updateGameInfoUI();

	if (gs.room.game.phase === GamePhase.INPROGRESS)
	{
		renderCharacterIcons();
	}
}

function getSeatedPlayers(): Player[] {
	if (!gs.room || !gs.player) return [];

	const gamePlayers = gs.room.game.players;
	const myGameIndex = gs.player.index;
	if (gamePlayers.length > 0 && myGameIndex !== undefined) {
		return [...gamePlayers].sort((a, b) => {
			const aRel =
				((a.index ?? 0) - myGameIndex + gamePlayers.length) %
				gamePlayers.length;
			const bRel =
				((b.index ?? 0) - myGameIndex + gamePlayers.length) %
				gamePlayers.length;
			return aRel - bRel;
		});
	}

	const players = getSortedRoomPlayers();
	const ownIndex = players.findIndex((player) => player.id === gs.player.id);
	if (ownIndex <= 0) return players;
	return [...players.slice(ownIndex), ...players.slice(0, ownIndex)];
}

function getSortedRoomPlayers(): Player[] {
	if (!gs.room) return [];

	const players = [...gs.room.players.values()];

	return players.sort((a, b) => {
		const aHasIndex = a.index !== undefined;
		const bHasIndex = b.index !== undefined;
		if (aHasIndex || bHasIndex) {
			if (!aHasIndex) return 1;
			if (!bHasIndex) return -1;
			if (a.index !== b.index) return (a.index ?? 0) - (b.index ?? 0);
		}

		return (a.name || a.id).localeCompare(b.name || b.id);
	});
}

function getNameplatePositionClass(relativeIndex: number): string {
	if (relativeIndex === 0) return "nameplate-own";
	if (relativeIndex === 1) return "nameplate-right";
	if (relativeIndex === 2) return "nameplate-top";
	if (relativeIndex === 3) return "nameplate-left";
	if (relativeIndex === 4) return "nameplate-left";
	return "nameplate-top";
}

function renderTurnBanner(): void {
    const banner = document.querySelector("#turn-banner") as HTMLElement;
    if (!banner) return;

    const game = gs.room?.game;
    if (!game || game.currentPlayerIndex === undefined || gs.player?.index === undefined) {
        banner.style.display = "none";
        return;
    }

    const currentName = game.players[game.currentPlayerIndex]?.name || "Unknown";
    const isYou = game.currentPlayerIndex === gs.player.index;

    banner.textContent = isYou
        ? "Your turn to investigate."
        : `${currentName}'s turn to investigate.`;
    banner.style.display = "flex";
}

function createTablePanel(
	title: string,
	body: string,
	card?: Card,
): HTMLElement {
	const panel = document.createElement("div");
	panel.className = "clue-table-panel";
	const imagePath = card ? getClueCardImagePath(card) : "";
	panel.innerHTML = `
		<div class="table-play-title"><strong>${escapeHtml(title)}</strong></div>
		${
			imagePath
				? `<img class="clue-table-card-image" src="${imagePath}" alt="${escapeHtml(card!.value ?? "")}" draggable="false" />`
				: ""
		}
		<div class="clue-table-body">${escapeHtml(body)}</div>
	`;
	return panel;
}

export function renderEvidenceHand(): void {
	const handArea = document.querySelector("#card-hand-area") as HTMLElement;
	if (!handArea) return;
	handArea.innerHTML = "";

	const game = gs.room.game;
	if (!game?.players || gs.player.index === undefined) return;

	const myPlayer = game.players[gs.player.index];
	if (!myPlayer) return;

	for (const card of myPlayer.hand) {
		handArea.append(createEvidenceCard(card));
	}
}

export function renderSuggestionEvidenceHand(cardsToShow: Card[]): void {
	const handArea = document.querySelector("#card-hand-area") as HTMLElement;
	if (!handArea) return;
	handArea.innerHTML = "";

	const game = gs.room.game;
	if (!game?.players || gs.player.index === undefined) return;

	const myPlayer = game.players[gs.player.index];
	if (!myPlayer) return;

	for (const card of myPlayer.hand) {
		if (cardsToShow.find(c => c.value===card.value))
		{
			handArea.append(createEvidenceButton(card, () => {
				gs.socket.emit("showed-card", card, myPlayer);
			}));
		}
		else
		{
			handArea.append(createEvidenceCard(card));
		}
	}

}

function createEvidenceCard(card: Card): HTMLElement {
	const el = document.createElement("div");
	el.className = `clue-card clue-card-${card.cardtype}`;
	const imagePath = getClueCardImagePath(card);
	el.innerHTML = `
		${
			imagePath
				? `<img class="clue-card-image" src="${imagePath}" alt="${escapeHtml(card.value)}" draggable="false" />`
				: ""
		}
		<div class="clue-card-fallback">
			<div class="clue-card-category">${escapeHtml(card.cardtype)}</div>
			<div class="clue-card-name">${escapeHtml(card.value)}</div>
		</div>
	`;
	return el;
}

function createSuggestionCard(card: Card): HTMLElement {
	const el = document.createElement("div");
	const imagePath = getClueCardImagePath(card);
	el.innerHTML = `
		${
			imagePath
				? `<img class="clue-card-suggestion-image" src="${imagePath}" alt="${escapeHtml(card.value)}" draggable="false" />`
				: ""
		}
	`;
	return el;
}

function createEvidenceButton(card: Card, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = "clue-card-button";

    const imagePath = getClueCardImagePath(card);

    btn.innerHTML = `
        <img
            class="clue-card-image"
            src="${imagePath}"
            alt="${escapeHtml(card.value)}"
        >
    `;

	btn.addEventListener("click", onClick);

    return btn;
}

export function renderPassButton(): void {
	const container = document.querySelector("#pass-button");
	if (container) container.innerHTML = "";

	const btn = makeBtn("Pass", "", () => {
		gs.socket.emit("suggestion-pass", gs.player.id)
	})

	container?.append(btn);
}

export function renderLies(numLies: number): void {
	const container = document.querySelector("#lies");
	if (container) container.innerHTML = "";

	const el = document.createElement("div");
	el.innerHTML = `Lies remaining: ${numLies}`

	container?.append(el);
}

export function clearSuggestionButtons(): void {
	const suggestContainer = document.querySelector("#suggestions");
	suggestContainer!.innerHTML = "";
}

export function clearSuggestionResponses(): void {
	renderEvidenceHand();
	const container = document.querySelector("#pass-button");
	if (container) container.innerHTML = "";
}

export function renderShownCard(card: Card): void {
	const container = document.querySelector("#shown-cards");
	container?.append(createSuggestionCard(card));
}

export function clearShownCard(): void {
	const container = document.querySelector("#shown-cards");
	container!.innerHTML = "";
}

export function renderActionButtons(): void {
    const container = document.querySelector("#action-buttons") as HTMLElement;
	if (container) container.innerHTML = "";

    const room = gs.room;
    const game = room?.game;
	const player = game.players.find(player => player.id == gs.player.id)

    // Show start/reset when the room is in the lobby (server handles actual start validation)
    if (room && room.status === RoomStatus.LOBBY) {
        const playerCount = room.players.size;
        const needsPlayers =
            playerCount < MIN_ROOM_PLAYERS || playerCount > MAX_ROOM_PLAYERS;
		let charactersChosen = true;
		for (const [id, player] of room.players)
		{
			if (!player.character)
			{
				charactersChosen = false;
			}
		}

		if (!(room.players.get(gs.player.id)!.character))
		{
			const controls = document.createElement("div");
    		controls.className = "clue-controls";
			const character = createSelect("select-character", SUSPECTS);
			const chooseCharacter = makeBtn("Choose", "", 
				() => {gs.socket.emit("select-character", readCharacter(controls));});
			controls.append(character, chooseCharacter);
			container.append(controls);
		}

        if (needsPlayers) {
            const needsPlayersBtn = makeBtn(
                `Need ${MIN_ROOM_PLAYERS}-${MAX_ROOM_PLAYERS} Players`,
                "",
                () => {},
            );
            needsPlayersBtn.disabled = true;
            container.append(needsPlayersBtn);
        } 
		else if (!charactersChosen)
		{	
			const chooseCharactersBtn = makeBtn(`Need everyone to choose a character`, "", () => {})
			chooseCharactersBtn.disabled = true;
            container.append(chooseCharactersBtn);
		}
		else
		{
            const resetBtn = makeBtn("Start Case", "", () =>
                gs.socket.emit("reset-room"),
            );
            container.append(resetBtn);
        }
        return;
    }

	if (container) container.remove();

	const accuseContainer = document.querySelector("#accusation");
	accuseContainer!.innerHTML = "";
	const endTurnContainer = document.querySelector("#end-turn");
	endTurnContainer!.innerHTML = "";
	const suggestContainer = document.querySelector("#suggestions");
	suggestContainer!.innerHTML = "";
	const rollContainer = document.querySelector("#dice-roll");
	rollContainer!.innerHTML = "";

    // Only show in-game controls if it's your turn
    if (!isPlayersTurn()) return;

	if (!gs.room.game.playerInGame[gs.player.id]) return;

	
	if (!game.rolled(player!))       //Generate buttons for rolling the dice
	{
		const controls = document.createElement("div");
		controls.className = "roll-controls";

		const rollBtn = makeBtn("Roll Dice", "", () => {
			gs.socket.emit("roll-dice");
		});

		controls.append(rollBtn);
		rollContainer?.append(controls);
	}
	
	if (game.enteredRoom(player!))   //Generate buttons and selectors for suggestions
	{
		
		const suggestSelectorContainer = document.createElement("div");
		suggestSelectorContainer.id = "suggest-selector-container";

		const suspect = createSelect("suspect-select", SUSPECTS);
    	const weapon = createSelect("weapon-select", WEAPONS);

		suggestSelectorContainer.append(suspect, weapon);

		const suggestBtn = makeBtn("Suggest", "", () => {
        	gs.socket.emit("make-suggestion", suspect.value, weapon.value);
    	});

		suggestContainer?.append(suggestSelectorContainer, suggestBtn);
    	
	}

	const accuseSelectorContainer = document.createElement("div");
	accuseSelectorContainer.id = "accuse-selector-container"
	const suspect = createSelect("suspect-select-accusation", SUSPECTS);
	const weapon = createSelect("weapon-select-accusation", WEAPONS);
	const roomAccusation = createSelect("room-select-accusation", ROOMS);

	accuseSelectorContainer.append(suspect, weapon, roomAccusation);

    const accuseBtn = makeBtn("Accuse", "danger", () => {
        gs.socket.emit("make-accusation", suspect.value, weapon.value, roomAccusation.value);
    });

	accuseBtn.id = "accuse-button";
	
	accuseContainer?.append(accuseSelectorContainer, accuseBtn);

    const endTurnBtn = makeBtn("End Turn", "", () => {
        gs.socket.emit("end-turn");
    });

	endTurnContainer?.append(endTurnBtn);
}

export function createMoveOptions(diceroll: number): void {
	const board = document.getElementById("ui-layer");

    const room = gs.room;
    const game = room?.game;
	const player = game.players.find(player => player.id == gs.player.id)

	if(!isPlayersTurn())
	{
		return;
	}

	board!.querySelectorAll(".move-button-container").forEach(icon => icon.remove());

	const availableMoves = game.findAvailableMovesforPlayer(player!, diceroll);

	for(const loc of availableMoves)
	{
		const [x, y] = destringifyLocation(loc);

		let moveBtnContainer;
		if(loc === "-3,-3" && stringifyLocation(game.playerLocations[player!.id]) === "-8,-8") //shortcut from study to kitchen
		{
			moveBtnContainer = makeMoveBtn(4.7, 23, () => {
				gs.socket.emit("player-moved", stringifyLocation([-3, -3]));
			})
		}
		else if(loc === "-8,-8" && stringifyLocation(game.playerLocations[player!.id]) === "-3,-3") //shortcut from kitchen to study
		{
			moveBtnContainer = makeMoveBtn(23, 2.7, () => {
				gs.socket.emit("player-moved", stringifyLocation([-8, -8]));
			})
		}
		else if(loc === "-5,-5" && stringifyLocation(game.playerLocations[player!.id]) === "-1,-1") //shortcut from library to conservatory
		{
			moveBtnContainer = makeMoveBtn(22, 19.3, () => {
				gs.socket.emit("player-moved", stringifyLocation([-5, -5]));
			})
		}
		else if(loc === "-1,-1" && stringifyLocation(game.playerLocations[player!.id]) === "-5,-5") //shortcut from conservatory to library
		{
			moveBtnContainer = makeMoveBtn(0, 4.7, () => {
				gs.socket.emit("player-moved", stringifyLocation([-1, -1]));
			})
		}
		else
		{
			moveBtnContainer = makeMoveBtn(x, y, () => {
				gs.socket.emit("player-moved", stringifyLocation([x, y]));
			})
		}
		board?.append(moveBtnContainer);
	}
}

export function clearMoveOptions(): void {
	const board = document.getElementById("ui-layer");
	board!.querySelectorAll(".move-button-container").forEach(icon => icon.remove());
}

export function renderSuggestionButtons(cardsToShow: Card[]): void {

}

function createSelect(name: string, options: string[]): HTMLSelectElement {
	const select = document.createElement("select");
	select.name = name;
	select.className = "clue-select";
	for (const option of options) {
		const el = document.createElement("option");
		el.value = option;
		el.textContent = option;
		select.append(el);
	}
	return select;
}

function readSuggestion(container: HTMLElement): Suggestion {
	return {
		suspect: getSelectValue(container, "suspect-select") as Person,
		weapon: getSelectValue(container, "weapon-select") as Weapon,
		room: getSelectValue(container, "room-select") as Room,
	};
}

function readCharacter(container: HTMLElement): Person {
	return getSelectValue(container, "select-character") as Person
}

function getSelectValue(container: HTMLElement, name: string): string {
	const select = container.querySelector(
		`select[name="${name}"]`,
	) as HTMLSelectElement;
	return select.value;
}

function updateGameInfoUI(): void {
	const game = gs.room.game;
	const gameInfo = document.querySelector("#game-info") as HTMLDivElement;
	if (!gameInfo) return;

	if (!game || game.phase === GamePhase.FINISHED) {
		gameInfo.innerHTML = "";
		return;
	}

	gameInfo.innerHTML = `
		<div class="info-row">
			<span class="info-label">Phase</span>
			<span class="info-value">Investigation</span>
		</div>
		<div class="info-row">
			<span class="info-label">Current</span>
			<span class="info-value">${escapeHtml(game.players[game.currentPlayerIndex]?.name || "—")}</span>
		</div>
	`;
}

export function renderCharacterIcons(): void {
	const game = gs.room.game;
	const board = document.getElementById("piece-layer");

	if (!board || !game) {
		return;
	}

	board.querySelectorAll(".character-icon").forEach(icon => icon.remove());

	const locatedPlayers = Object.keys(game.playerLocations)
		.map((id) => game.players.find(player => player.id === id))
		.filter((player): player is Player => Boolean(player))
		.sort(
			(a, b) =>
				(a.index ?? Number.MAX_SAFE_INTEGER) -
				(b.index ?? Number.MAX_SAFE_INTEGER),
		);

	const roomIconCounts = new Map<Room, number>();
	for (const player of locatedPlayers) {
		if (!game.checkInRoom(player)) continue;
		const room = game.getRoom(player);
		roomIconCounts.set(room, (roomIconCounts.get(room) ?? 0) + 1);
	}

	const roomIconIndexes = new Map<Room, number>();
	for (const player of locatedPlayers) {
		const location = game.playerLocations[player.id];
		if (!location) continue;

		const [x, y] = location;
		const icon = document.createElement("div");
		icon.className = "character-icon";

		icon.style.setProperty("--character-icon-room-offset", "0px");

		if (game.checkInRoom(player)) {
			const room = game.getRoom(player);
			const roomIconIndex = roomIconIndexes.get(room) ?? 0;
			const roomIconCount = roomIconCounts.get(room) ?? 1;
			const roomIconOffset =
				(roomIconIndex - (roomIconCount - 1) / 2) *
				ROOM_CHARACTER_ICON_SPACING_PX;

			roomIconIndexes.set(room, roomIconIndex + 1);

			icon.style.left = `${RoomRenderLocations[room][0]}%`;
			icon.style.top = `${RoomRenderLocations[room][1]}%`;
			icon.style.setProperty(
				"--character-icon-room-offset",
				`${roomIconOffset}px`,
			);
		} else {
			icon.style.left = `${8.9 + x * 3.6}%`; //tuned 8.9 and 3.6
			icon.style.top = `${92.6 - y * 3.6}%`; //tuned 92.6 and 3.6
		}
		icon.style.backgroundColor =
			characterColors[player.character!] ?? "black";

		board.appendChild(icon);
	}
}

export function startGameUI(): void {
	updateUIGame();
}

export function endGameUI(): void {
	updateUIGame();
}

function formatSuggestion(suggestion: Suggestion): string {
	return `${suggestion.suspect} with the ${suggestion.weapon} in the ${suggestion.room}`;
}
