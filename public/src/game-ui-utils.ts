import { Card } from "@shared/card";

export function clearGameArea(): void {
	for (const el of document.querySelectorAll(".player-seat"))
		el.remove();

	for (const el of document.querySelectorAll(".player-nameplate"))
		el.remove();

	const handArea = document.querySelector("#card-hand-area");
	if (handArea) handArea.innerHTML = "";

	const actionArea = document.querySelector("#action-buttons");
	if (actionArea) actionArea.innerHTML = "";

	const banner = document.querySelector("#turn-banner") as HTMLElement;
	if (banner) banner.style.display = "none";

	const msg = document.querySelector("#table-center-message") as HTMLElement;
	if (msg) {
		msg.classList.add("is-empty");
		msg.innerHTML = "";
		msg.style.display = "flex";
	}
}

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

export function makeBtn(
	label: string,
	className: string,
	onClick: () => void,
): HTMLButtonElement {
	const btn = document.createElement("button");
	btn.className = `btn-white-transparent ${className}`;
	btn.textContent = label;
	btn.addEventListener("click", onClick);
	return btn;
}

export function makeMoveBtn(
	x: number,
	y: number,
	onClick: () => void,
): HTMLDivElement {

	const btnContainer = document.createElement("div");
	const btn = document.createElement("button");
	btn.className = `move-button`;
	btnContainer.className = `move-button-container`;
	btnContainer.append(btn);

	btnContainer.style.left = `${8.9 + x * 3.6}%`;
	btnContainer.style.top = `${92.6 - y * 3.6}%`;
	btn.addEventListener("click", onClick);
	return btnContainer;
}
export function getClueCardImagePath(card: Card): string {
	const filename = card.filename;
	return filename ? `/assets/${filename}` : "";
}
