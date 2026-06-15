import type { Card, Person } from "./card";

export enum PlayerStatus 
{
	NOT_READY = "not_ready",
	DISCONNECTED = "disconnected",
	ELIMINATED = "eliminated",
}

export interface SerializedPlayer 
{
	id: string;
	name: string;
	hand: Card[];
	cardCount: number;
	status: PlayerStatus;
	gameIndex?: number;
	score: number;
	character?: Person;
}

export class Player 
{
	id: string;
	name: string;
	hand: Card[];
	cardCount: number;
	status: PlayerStatus;
	index: number | undefined;
	score: number;
	character: Person | undefined;

	constructor(id: string, name?: string) 
	{
		this.id = id;
		this.name = name ?? id;
		this.hand = [];
		this.cardCount = 0;
		this.status = PlayerStatus.NOT_READY;
		this.index = undefined;
		this.score = 0;
		this.character = undefined;
	}

	serialize(viewerId?: string): SerializedPlayer 
	{
		return {
			id: this.id,
			name: this.name,
			hand: viewerId === this.id ? this.hand : [],
			cardCount: this.cardCount,
			status: this.status,
			gameIndex: this.index,
			score: this.score,
			character: this.character,
		};
	}

	static deserialize(data: SerializedPlayer): Player 
	{
		const player = new Player(data.id, data.name);
		player.hand = data.hand;
		player.cardCount = data.cardCount ?? player.hand.length;
		player.status = data.status;
		player.index = data.gameIndex;
		player.score = data.score ?? 0;
		player.character = data.character;
		return player;
	}
}
