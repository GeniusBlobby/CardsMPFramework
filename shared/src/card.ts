import { Player } from "./player";

export type Person = "scarlet" | "white" | "peacock" | "green" | "plum" | "mustard" | "filler";
export type Weapon = "firepoker" | "leadpipe" | "rope" | "poison" | "candelabra" | "letteropener" | "filler";
export type Room = "kitchen" | "study" | "attic" | "lounge" | "library" | "billiard" | "dining" | "conservatory" | "cellar" | "filler";
export type CardType = "person" | "weapon" | "room";

export const SUSPECTS = ["Ms. Scarlet", "Mrs. White", "Mrs. Peacock", "Mr. Green", "Professor Plum", "Colonel Mustard"];

export const WEAPONS = ["Fire Poker", "Lead Pipe", "Rope", "Poison", "Candelabra", "Letter Opener"]

export const ROOMS = ["Kitchen", "Study", "Attic", "Lounge", "Library", "Billiard Room", "Dining Room", "Conservatory", "Wine Cellar"]

export const SuspectToPerson: Record<string, Person> = {
	"Ms. Scarlet": "scarlet",
	"Mrs. White": "white",
	"Mrs. Peacock": "peacock",
	"Mr. Green": "green",
	"Professor Plum": "plum",
	"Colonel Mustard": "mustard"
}

export const PersonToSuspect: Record<Person, string> = {
	"scarlet": "Ms. Scarlet",
	"white": "Mrs. White",
	"peacock": "Mrs. Peacock",
	"green": "Mr. Green",
	"plum": "Professor Plum",
	"mustard": "Colonel Mustard",
	"filler": "filler"
}

export const WeaponToSmallWeapon: Record<string, Weapon> = {
	"Fire Poker": "firepoker",
	"Lead Pipe": "leadpipe",
	"Rope": "rope",
	"Poison": "poison",
	"Candelabra": "candelabra",
	"Letter Opener": "letteropener"
}

export const SmallWeaponToWeapon: Record<Weapon, string> = {
	"firepoker": "Fire Poker",
	"leadpipe": "Lead Pipe",
	"rope": "Rope",
	"poison": "Poison",
	"candelabra": "Candelabra",
	"letteropener": "Letter Opener",
	"filler": "filler"
}

export const RoomToSmallRoom: Record<string, Room> = {
	"Kitchen": "kitchen",
	"Study": "study",
	"Attic": "attic",
	"Lounge": "lounge",
	"Library": "library",
	"Billiard Room": "billiard",
	"Dining Room": "dining", 
	"Conservatory": "conservatory", 
	"Wine Cellar": "cellar"
}

export const SmallRoomToRoom: Record<Room, string> = {
	"kitchen": "Kitchen",
	"study": "Study",
	"attic": "Attic",
	"lounge": "Lounge",
	"library": "Library",
	"billiard": "Billiard Room",
	"dining": "Dining Room",
	"conservatory": "Conservatory",
	"cellar": "Wine Cellar",
	"filler": "filler"
}

export type Card = 
{
	cardtype: CardType;
	filename: string;
	value: Person | Weapon | Room;
};

export const CARD_DEFINITIONS: Card[] = 
[
	{ cardtype: "person", filename: "Scarlet.png", value: "scarlet" },
	{ cardtype: "person", filename: "White.png", value: "white" },
	{ cardtype: "person", filename: "Peacock.png", value: "peacock" },
	{ cardtype: "person", filename: "Green.png",value: "green" },
	{ cardtype: "person", filename: "Plum.png", value: "plum" },
	{ cardtype: "person", filename: "Mustard.png", value: "mustard" },
	{ cardtype: "weapon", filename: "FirePoker.png", value: "firepoker" },
	{ cardtype: "weapon", filename: "LeadPipe.png", value: "leadpipe" },
	{ cardtype: "weapon", filename: "Rope.png", value: "rope" },
	{ cardtype: "weapon", filename: "Poison.png", value: "poison" },
	{ cardtype: "weapon", filename: "Candelabra.png", value: "candelabra" },
	{ cardtype: "weapon", filename: "LetterOpener.png", value: "letteropener" },
	{ cardtype: "room", filename: "Kitchen.png", value: "kitchen" },
	{ cardtype: "room", filename: "Study.png", value: "study" },
	{ cardtype: "room", filename: "Attic.png", value: "attic" },
	{ cardtype: "room", filename: "Lounge.png", value: "lounge" },
	{ cardtype: "room", filename: "Library.png", value: "library" },
	{ cardtype: "room", filename: "Billiard.png", value: "billiard" },
	{ cardtype: "room", filename: "Dining.png", value: "dining" },
	{ cardtype: "room", filename: "Conservatory.png", value: "conservatory" },
	{ cardtype: "room", filename: "Cellar.png", value: "cellar" },
];

export function cardToString(card: Card): string 
{
	return card.cardtype + "_" + card.filename + "_" + card.value;
}

export type Suggestion =
{
    suspect: Person;
    weapon: Weapon;
    room: Room;
}



export type SuggestionResult = 
{
	suggestee: Player;
	refuter: Player;
	cardShown: Card;
	suggestion: Suggestion
}

export type AccusationResult = 
{
	accuser: Player;
	correct: boolean;
}