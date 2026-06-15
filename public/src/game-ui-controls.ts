import { sendChatMessage } from "./game-ui-chat";
import { gs } from "./session";

function isPlayersTurn(): boolean {
	return gs.player.index === gs.room.game.currentPlayerIndex;
}

export function initGameControls(): void {
	const chatInput = document.querySelector("#chat-input") as HTMLInputElement;
	chatInput?.addEventListener("keydown", (e: Event) => {
		const ke = e as KeyboardEvent;
		e.stopPropagation();
		if (ke.key === "Enter") {
			ke.preventDefault();
			sendChatMessage(chatInput);
		}
	});

	document.addEventListener("keydown", (event: Event) => {
		const ke = event as KeyboardEvent;
		const target = ke.target as HTMLElement;
		if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

		if ((ke.key === "e" || ke.key === "E") && isPlayersTurn()) {
			ke.preventDefault();
			gs.socket.emit("end-turn");
		}
	});
}
