import type { Card } from "@shared/card";

export function getCardKey(card: Card): string {
	return card.value;
}
