//(0,0) on the board is the bottom left corner in the library
//rooms are assigned locations as (-x, -x) with x = 1 as library and increasing going clockwise, so billiard has x = 9

import { Card, CARD_DEFINITIONS, Person, Weapon, Room, Suggestion, SuggestionResult, AccusationResult } from "./card";
import { Player, SerializedPlayer } from "./player";

const boardWidth: number = 24; //1 indexed
const boardHeight: number = 25; //1 indexed

export const BOARDWIDTH: number = 24;
export const BOARDHEIGHT: number = 25;

const validMoves: boolean[][] = [
    [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false], //1st line
    [false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false],   //2nd line
    [false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false],   //3rd line
    [false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, true, true, true, false, false, false, false, false, false],    //4th line
    [false, false, false, false, false, false, false, true, true, false, false, false, false, false, true, true, true, true, true, true, true, true, true, false],          //5th line
    [false, false, false, false, false, false, true, true, true, false, false, false, false, false, false, true, true, true, true, true, true, true, true, true],           //6th line
    [false, true, true, true, true, true, true, true, true, false, false, true, true, false, false, true, true, true, false, false, false, false, false, false],            //7th line
    [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false],                //8th line
    [false, true, true, true, true, true, true, true, true, true, false, false, false, false, false, true, true, true, false, false, false, false, false, false],           //9th line
    [false, false, false, false, false, false, true, false, true, true, false, false, false, false, false, true, true, false, false, false, false, false, false, false],    //10th line
    [false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, true, true, true, false, false, true, false, false, false],    //11th line
    [false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, true, true, true, true, true, true, true, true, false],         //12th line
    [false, false, false, false, false, false, false, true, true, true, false, false, false, false, false, true, true, true, false, false, false, false, true, false],      //13th line
    [false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, true, true, true, false, false, false, false, false, false],    //14th line
    [false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, true, true, true, false, false, false, false, false, false],    //15th line
    [false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false],             //16th line
    [false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false],                //17th line
    [true, true, true, true, true, true, true, true, false, true, false, false, false, false, true, false, true, true, true, true, true, true, true, false],                //18th line
    [false, false, false, false, true, false, true, true, false, false, false, false, false, false, false, false, true, true, true, true, true, true, true, true],          //19th line
    [false, false, false, false, false, false, true, true, true, false, false, false, false, false, false, true, true, true, true, true, false, false, false, false],       //20th line
    [false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false],   //21st line
    [false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false],   //22nd line
    [false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false],   //23rd line
    [false, false, false, false, false, false, false, true, true, true, false, false, false, false, true, true, true, false, false, false, false, false, false, false],     //24th line
    [false, false, false, false, false, false, false, false, false, true, false, false, false, false, true, false, false, false, false, false, false, false, false, false]
]

export function stringifyLocation(loc: [number, number]): string
{
    return `${loc[0]},${loc[1]}`;
}

export function destringifyLocation(str: string): [number, number]
{
    const [a, b] = str.split(",").map(Number) as [number, number];
    return [a, b];
}

export const RoomEntrances: Record<string, Room> = {
    "6,5": "library",
    "6,9": "lounge",
    "7,12": "lounge",
    "4,18": "kitchen",
    "8,19": "dining",
    "9,17": "dining",
    "14,17": "dining",
    "15,19": "dining",
    "19,19": "conservatory",
    "18,15": "cellar",
    "22,12": "cellar",
    "17,8": "attic",
    "20,10": "attic",
    "17,3": "study",
    "11,6": "billiard",
    "12,6": "billiard",
    "14,4": "billiard"
};

export const RoomLocations: Record<string, [number, number]> = {
    "library": [-1, -1],
    "lounge": [-2, -2],
    "kitchen": [-3, -3],
    "dining": [-4, -4],
    "conservatory": [-5, -5],
    "cellar": [-6, -6],
    "attic": [-7, -7],
    "study": [-8, -8],
    "billiard": [-9, -9]
}

export const Rooms: Record<string, Room> = {
    "-1,-1": "library",
    "-2,-2": "lounge",
    "-3,-3": "kitchen",
    "-4,-4": "dining",
    "-5,-5": "conservatory",
    "-6,-6": "cellar",
    "-7,-7": "attic",
    "-8,-8": "study",
    "-9,-9": "billiard"
}

export enum GamePhase
{
    RESET = "reset",
    INPROGRESS = "inprogress",
    FINISHED = "finished"
}

export interface SerializedGame 
{
    players: SerializedPlayer[];
    currentPlayerIndex: number;
    playerLocations: Record<string, [number, number]>;
    playerLies: Record<string, number>;
    crime: Card[];
    deck: Card[];
    phase: string;
    playerEnteredRoom: boolean;
    playerMoved: boolean;
    rolledDice: boolean;
    currentSuggesteeId: string;
    currentRefuterId: string;
    currentSuggestion: Suggestion,
    playerInGame: Record<string, boolean>;
    suggestionInProgress: boolean;
}

export class Game
{
    players: Player[] = [];
    currentPlayerIndex: number = 0;
    playerLocations: Record<string, [number, number]> = {}; //defined using player.id instead of player for easier serialization
    playerLies: Record<string, number> = {};
    crime: Card[] = [];
    deck: Card[] = [];
    phase: string = "";
    playerEnteredRoom: boolean = false;
    playerMoved: boolean = false;
    rolledDice: boolean = false;
    currentSuggesteeId: string = "";
    currentRefuterId: string = "";
    currentSuggestion: Suggestion = {
        suspect: "filler",
        weapon: "filler",
        room: "filler"
    };
    playerInGame: Record<string, boolean> = {};
    suggestionInProgress: boolean = false;

    constructor() {};

    serialize(viewerId?: string): SerializedGame 
    {
        const serializedPlayers = this.players.map(p => p.serialize(viewerId));
        return {
            players: serializedPlayers,
            currentPlayerIndex: this.currentPlayerIndex,
            playerLocations: this.playerLocations,
            playerLies: this.playerLies,
            crime: this.crime,
            deck: this.deck,
            phase: this.phase,
            playerEnteredRoom: this.playerEnteredRoom,
            playerMoved: this.playerMoved,
            rolledDice: this.rolledDice,
            currentSuggesteeId: this.currentSuggesteeId,
            currentRefuterId: this.currentRefuterId,
            currentSuggestion: this.currentSuggestion,
            playerInGame: this.playerInGame,
            suggestionInProgress: this.suggestionInProgress
        };
	}

    static deserialize(data: SerializedGame): Game {
		const game = new Game();
        game.players = data.players.map((p) => Player.deserialize(p));
		game.currentPlayerIndex = data.currentPlayerIndex;
        game.playerLocations = data.playerLocations;
        game.playerLies = data.playerLies;
        game.crime = data.crime;
        game.deck = data.deck;
        game.phase = data.phase;
        game.playerEnteredRoom = data.playerEnteredRoom;
        game.playerMoved = data.playerMoved;
        game.rolledDice = data.rolledDice;
        game.currentSuggesteeId = data.currentSuggesteeId;
        game.currentRefuterId = data.currentRefuterId;
        game.currentSuggestion = data.currentSuggestion;
        game.playerInGame = data.playerInGame;
        game.suggestionInProgress = data.suggestionInProgress;
		return game;
	}

    get currentPlayer(): Player 
    {
        return this.players[this.currentPlayerIndex];
    }

    startGame(players: Player[]): void
    {
        this.players = [...players];

        for (const [index, player] of this.players.entries())
			player.index = index;

        this.generateCrimeandDeal();
        this.placePlayers();
        
        for (const player of this.players)
        {
            this.playerLies[player.id] = 2;
            this.playerInGame[player.id] = true;
        }

        this.currentPlayerIndex = 0;
        this.phase = GamePhase.INPROGRESS;
    }

   //Generates crime and deals cards
    private generateCrimeandDeal(): void
    {
        //Select suspect
        const personIndex = Math.floor(Math.random() * 6);
        this.crime.push(CARD_DEFINITIONS[personIndex]);

        //Select Weapon
        const weaponIndex = Math.floor(Math.random() * 6) + 6;
        this.crime.push(CARD_DEFINITIONS[weaponIndex]);

        //Select Room
        const roomIndex = Math.floor(Math.random() * 9 + 12);
        this.crime.push(CARD_DEFINITIONS[roomIndex]);

        let dealOrder: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        dealOrder.splice(personIndex, 1);
        dealOrder.splice(weaponIndex - 1, 1); //-1 because personIndex made the list one shorter, so everything shifted to the left one
        dealOrder.splice(roomIndex - 2, 1); //-2 because personIndex and weaponIndex made the list two shorter, so everything shifter to the left two

        for (let i = dealOrder.length - 1; i > 0; i--)
        {
            const j = Math.floor(Math.random() * (i + 1));
            [dealOrder[i], dealOrder[j]] = [dealOrder[j], dealOrder[i]];
        }

        //deals cards
        let index = 0;
        for (const i of dealOrder)
        {
            this.players[index%this.players.length].hand.push(CARD_DEFINITIONS[i]);
            index++;
        }
    }

    private placePlayers(): void
    {
        for (const player of this.players)
        {

            if (!player.character)
            {
                throw new Error(player.name + " has not selected a character");
            }
            if (player.character === "green")
            {
                if (!this.playerLocations[player.id])
                {
                    this.playerLocations[player.id] = [14, 24];
                }
                else
                {
                    throw new Error("Duplicate characters detected")
                }
            }
            else if (player.character === "plum")
            {
                if (!this.playerLocations[player.id])
                {
                    this.playerLocations[player.id] = [23, 5];
                }
                else
                {
                    throw new Error("Duplicate characters detected")
                }
            }
            else if (player.character === "mustard")
            {
                if (!this.playerLocations[player.id])
                {
                    this.playerLocations[player.id] = [0, 7];
                }
                else
                {
                    throw new Error("Duplicate characters detected")
                }
            }
            else if (player.character === "scarlet")
            {
                if (!this.playerLocations[player.id])
                {
                    this.playerLocations[player.id] = [7, 0];
                }
                else
                {
                    throw new Error("Duplicate characters detected")
                }
            }
            else if (player.character === "peacock")
            {
                if (!this.playerLocations[player.id])
                {
                    this.playerLocations[player.id] = [23, 18];
                }
                else
                {
                    throw new Error("Duplicate characters detected")
                }
            }
            else if (player.character === "white")
            {
                if (!this.playerLocations[player.id])
                {
                    this.playerLocations[player.id] = [9, 24];
                }
                else
                {
                    throw new Error("Duplicate characters detected")
                }
            }
        }
    }

    suggest(suspect: Person, weapon: Weapon): Suggestion
    {
        return {
            suspect,
            weapon,
            room: this.getRoom(this.players[this.currentPlayerIndex])
        }
    }

    checkInRoom(player: Player): boolean
    {
        return this.playerLocations[player.id][0] === -1 ||
               this.playerLocations[player.id][0] === -2 ||
               this.playerLocations[player.id][0] === -3 ||
               this.playerLocations[player.id][0] === -4 ||
               this.playerLocations[player.id][0] === -5 ||
               this.playerLocations[player.id][0] === -6 ||
               this.playerLocations[player.id][0] === -7 ||
               this.playerLocations[player.id][0] === -8 ||
               this.playerLocations[player.id][0] === -9;
    }

    getRoom(player: Player): Room
    {
        if (this.playerLocations[player.id][0] === -1)
        {
            return "library";
        }
        else if (this.playerLocations[player.id][0] === -2)
        {
            return "lounge";
        }
        else if (this.playerLocations[player.id][0] === -3)
        {
            return "kitchen";
        }
        else if (this.playerLocations[player.id][0] === -4)
        {
            return "dining";
        }
        else if (this.playerLocations[player.id][0] === -5)
        {
            return "conservatory";
        }
        else if (this.playerLocations[player.id][0] === -6)
        {
            return "cellar";
        }
        else if (this.playerLocations[player.id][0] === -7)
        {
            return "attic";
        }
        else if (this.playerLocations[player.id][0] === -8)
        {
            return "study";
        }
        else
        {
            return "billiard";
        }
    }

    inRoom(player: Player): boolean
    {
        if(this.playerLocations[player.id][0] < 0)
        {
            return true;
        }

        return false;
    }

    getRoomLocation(room: Room): string
    {
        if (room === "library")
        {
            return stringifyLocation([-1, -1]);
        }
        else if (room === "lounge")
        {
            return stringifyLocation([-2, -2]);
        }
        else if (room === "kitchen")
        {
            return stringifyLocation([-3, -3]);
        }
        else if (room === "dining")
        {
            return stringifyLocation([-4, -4]);
        }
        else if (room === "conservatory")
        {
            return stringifyLocation([-5, -5]);
        }
        else if (room === "cellar")
        {
            return stringifyLocation([-6, -6]);
        }
        else if (room === "attic")
        {
            return stringifyLocation([-7, -7]);
        }
        else if (room === "study")
        {
            return stringifyLocation([-8, -8]);
        }
        else
        {
            return stringifyLocation([-9, -9]);
        }
    }

    accuse(suspect: Person, weapon: Weapon, room: Room): Suggestion
    {
        return {
            suspect,
            weapon,
            room
        }
    }

    checkAccusation(accusation: Suggestion): boolean
    {
        return accusation.suspect === this.crime[0].value &&
               accusation.weapon === this.crime[1].value &&
               accusation.room === this.crime[2].value
    }

    moveCurrentPlayer(location: [number, number]): void
    {
        const roomEntrance = RoomEntrances[stringifyLocation(location)];
        if (roomEntrance)
        {
            this.playerLocations[this.players[this.currentPlayerIndex].id] = RoomLocations[roomEntrance];
            this.playerEnteredRoom = true;
        }
        else
        {
            this.playerLocations[this.players[this.currentPlayerIndex].id] = location;

            if (location[0] < 0)  //detects the shortcuts
            {
                this.playerEnteredRoom = true; 
            }
        }

        this.playerMoved =  true;
    }

    movePlayer(player: Player, room: Room)
    {
        const loc = RoomLocations[room];
        this.playerLocations[player.id] = loc;
    }

    findAvailableMoves(moves: number, startLocation: [number, number]): Set<string>
    {
        let availableMoves: Set<string> = new Set<string>();

        const queue: {x: number, y: number, dist: number}[] = [
            {
                x: startLocation[0], 
                y: startLocation[1], 
                dist: 0
            }
        ]

        const visited = new Set<string>();

        while (queue.length > 0)
        {
            const {x, y, dist} = queue.shift()!;

            if (dist > moves)
            {
                continue;
            }

            if(this.isValidLocation([x, y], visited, dist, moves))
            {
                visited.add(stringifyLocation([x, y]));

                availableMoves.add(stringifyLocation([x, y]));

                if ((x-1 !== 6 || y!==5) && (x-1 !== 16 || y !== 3)) //cutting through library wall
                {
                    queue.push({x: x-1, y: y, dist: dist+1});
                }

                if (x !== 19 || y+1 !== 19) //cutting through conservatory wall
                {
                    queue.push({x: x, y: y+1, dist: dist+1});
                }

                if ((x+1 !== 17 || y !== 3) && (x+1 !== 7 || y !== 5)) //cutting through study wall and library exit
                {
                    queue.push({x: x+1, y: y, dist: dist+1});
                }

                if (x !== 19 || y-1 !== 18) //cutting conservatory exit
                {
                    queue.push({x: x, y: y-1, dist: dist+1});
                } 
            }
        }

        availableMoves.delete(stringifyLocation(startLocation));

        if (startLocation[0] === 11 && startLocation[1] === 6)
        {
            availableMoves.delete(stringifyLocation([12, 6]));
        }
        if (startLocation[0] === 12 && startLocation[1] === 6)
        {
            availableMoves.delete(stringifyLocation([11, 6]));
        }

        return availableMoves;
    }

    isValidLocation(location: [number, number], visited: Set<string>, dist: number, maxMoves: number): boolean
    {
        if (location[0] < 0 || location[1] < 0 || location[0] >= boardWidth || location[1] >= boardHeight)
        {
            return false;
        }

        if (!validMoves[location[1]][location[0]])
        {
            return false;
        }

        if (visited.has(stringifyLocation(location)))
        {
            return false;
        }

        for (const player of this.players)
        {
            if (stringifyLocation(location) === stringifyLocation(this.playerLocations[player.id]) &&
            stringifyLocation(location) !== stringifyLocation(this.playerLocations[this.players[this.currentPlayerIndex].id]))
            {
                return false;
            }
        }
        
        if (dist > maxMoves)
        {
            return false;
        }

        return true;
    }

    isRoomEntrance(loc: string): Room | undefined
    {
        for (const [location, room] of Object.entries(RoomEntrances))
        {
            if (location === loc)
            {
                return room;
            }
        }

        return undefined;
    }

    findAvailableMovesforPlayer(player: Player, moves: number): Set<string>
    {
        let availableMoves: Set<string> = new Set<string>();

        let tempMoves: Set<string> = new Set<string>();
        let tempMoves1: Set<string> = new Set<string>();
        let tempMoves2: Set<string> = new Set<string>();
        let tempMoves3: Set<string> = new Set<string>();
        if (this.checkInRoom(player))
        {
            const room: Room = this.getRoom(player);
            if (room === "library")
            {
                tempMoves = this.findAvailableMoves(moves, [6, 5]);
                tempMoves.add(stringifyLocation([-5, -5]));    //shortcut to conservatory
            }
            else if (room === "lounge")
            {
                tempMoves = this.findAvailableMoves(moves, [6, 9]);
                tempMoves1 = this.findAvailableMoves(moves, [7, 12]);
            }
            else if (room === "kitchen")
            {
                tempMoves = this.findAvailableMoves(moves, [4, 18]);
                tempMoves.add(stringifyLocation([-8, -8]));     //shortcut to study
            }
            else if (room === "dining")
            {
                tempMoves = this.findAvailableMoves(moves, [8, 19]);
                tempMoves1 = this.findAvailableMoves(moves, [9, 17]);
                tempMoves2 = this.findAvailableMoves(moves, [14, 17]);
                tempMoves3 = this.findAvailableMoves(moves, [15, 19]);
            }
            else if (room === "conservatory")
            {
                tempMoves = this.findAvailableMoves(moves, [19, 19]);
                tempMoves.add(stringifyLocation([-1, -1]));      //shortcut to library
            }
            else if (room === "cellar")
            {
                tempMoves = this.findAvailableMoves(moves, [18, 15]);
                tempMoves1 = this.findAvailableMoves(moves, [22, 12]);
            }
            else if (room === "attic")
            {
                tempMoves = this.findAvailableMoves(moves, [17, 8]);
                tempMoves1 = this.findAvailableMoves(moves, [20, 10]);
            }
            else if (room === "study")
            {
                tempMoves = this.findAvailableMoves(moves, [17, 3]);
                tempMoves.add(stringifyLocation([-3, -3]));
            }
            else if (room === "billiard")
            {
                tempMoves = this.findAvailableMoves(moves, [11, 6]);
                tempMoves1 = this.findAvailableMoves(moves, [12, 6]);
                tempMoves2 = this.findAvailableMoves(moves, [14, 4]);
            }
            else
            {
                throw new Error("not in a room");
            }

            for (const str of tempMoves)
            {
                availableMoves.add(str);
            }
            for (const str of tempMoves1)
            {
                availableMoves.add(str);
            }
            for (const str of tempMoves2)
            {
                availableMoves.add(str);
            }
            for (const str of tempMoves3)
            {
                availableMoves.add(str);
            }
        }
        else
        {
            availableMoves = this.findAvailableMoves(moves, this.playerLocations[player.id])
        }

        return availableMoves;
    }

    generateDiceRoll(): number
    {
        this.rolledDice = true;
        return Math.ceil(Math.random() * 6);
    }

    normalizeSuggestion(suggestion: unknown): Suggestion | undefined
    {
        if (suggestion && typeof suggestion === "object" && 
            "suspect" in suggestion && 
            "weapon" in suggestion && 
            "room" in suggestion &&
            Object.keys(suggestion).length === 3)
        {
            let suspect, weapon, room;
            if (suggestion.suspect === "Ms. Scarlet")
            {
                suspect = "scarlet";
            }
            else if (suggestion.suspect === "Mrs. White")
            {
                suspect = "white";
            }
            else if (suggestion.suspect === "Mrs. Peacock")
            {
                suspect = "peacock";
            }
            else if (suggestion.suspect === "Mr. Green")
            {
                suspect = "green";
            }
            else if (suggestion.suspect === "Professor Plum")
            {
                suspect = "plum";
            }
            else if (suggestion.suspect === "Colonel Mustard")
            {
                suspect = "mustard";
            }


            if (suggestion.weapon === "Fire Poker")
            {
                weapon = "firepoker";
            }
            else if (suggestion.weapon === "Letter Opener")
            {
                weapon = "letteropener";
            }
            else if (suggestion.weapon === "Candelabra")
            {
                weapon = "candelabra";
            }
            else if (suggestion.weapon === "Rope")
            {
                weapon = "rope";
            }
            else if (suggestion.weapon === "Lead Pipe")
            {
                weapon = "leadpipe";
            }
            else if (suggestion.weapon === "Poison")
            {
                weapon = "poison";
            }


            if (suggestion.room === "Library")
            {
                room = "library";
            }
            else if (suggestion.room === "Lounge")
            {
                room = "lounge";
            }
            else if (suggestion.room === "Kitchen")
            {
                room = "kitchen";
            }
            else if (suggestion.room === "Dining Room")
            {
                room = "dining";
            }
            else if (suggestion.room === "Conservatory")
            {
                room = "conservatory";
            }
            else if (suggestion.room === "Wine Cellar")
            {
                room = "cellar";
            }
            else if (suggestion.room === "Attic")
            {
                room = "attic";
            }
            else if (suggestion.room === "Study")
            {
                room = "study";
            }
            else if (suggestion.room === "Billiard Room")
            {
                room = "billiard";
            }

            const normalizedSuggestion: Suggestion = {
                suspect: suspect as Person,
                weapon: weapon as Weapon,
                room: room as Room
            }

            return normalizedSuggestion;
        }
        else
        {
            return;
        }
    }

    //returns the cards which can be showed of the next person
    makeSuggestion(id: string, s: Suggestion): Card[] | undefined
    {
        this.suggestionInProgress = true;

        let result: Card[] | undefined = undefined;

        const suggestee = this.players.find(player => player.id === id);

        if (!suggestee)
        {
            return
        }

        this.currentSuggesteeId = suggestee.id;

        const refuter = this.players[(suggestee.index! + 1) % this.players.length];

        for (const card of refuter.hand)
        {
            if (s.suspect === card.value || s.weapon === card.value || s.room === card.value)
            {
                if (!result)
                {
                    result = [];
                    result.push(card);
                }
                else
                {
                    result.push(card);
                }
            }
        }

        this.currentSuggestion = s;

        return result;
    }

    //takes in the passer's id and returns the cards of the next person which can be showed, or returns 0 if nobody can show a card
    passSuggestion(id: string): Card[] | undefined | number {
        if (this.currentSuggesteeId === id)
        {
            this.suggestionInProgress = false;
            return 0;
        }

        let result: Card[] | undefined = undefined;

        const refuter = this.players.find(player => player.id === id);
        this.currentRefuterId = refuter!.id;

        for (const card of refuter!.hand)
        {
            if (this.currentSuggestion.suspect === card.value || 
                this.currentSuggestion.weapon === card.value || 
                this.currentSuggestion.room === card.value)
            {
                if (!result)
                {
                    result = [];
                    result.push(card);
                }
                else
                {
                    result.push(card);
                }
            }
        }

        return result;
    }

    isValidPass(passerId: string): boolean
    {
        let result: Card[] | undefined = undefined;

        const refuter = this.players.find(player => player.id === passerId);

        for (const card of refuter!.hand)
        {
            if (this.currentSuggestion.suspect === card.value || 
                this.currentSuggestion.weapon === card.value || 
                this.currentSuggestion.room === card.value)
            {
                if (!result)
                {
                    result = [];
                    result.push(card);
                }
                else
                {
                    result.push(card);
                }
            }
        }

        if (result)
        {
            return false;
        }
        else
        {
            return true;
        }
    }

    hasLies(passerId: string): boolean
    {
        if(this.playerLies[passerId] > 0)
        {
            return true;
        }
        return false;
    }

    invalidPass(passerId: string): void
    {
        this.playerLies[passerId]--;
    }

    verifyAccusation(s: Suggestion): boolean
    {
        if (s.suspect === this.crime[0].value &&
            s.weapon === this.crime[1].value &&
            s.room === this.crime[2].value
        )
        return true;

        else
        {
            this.playerInGame[this.players[this.currentPlayerIndex].id] = false;
            this.endTurnUntilValidPlayer();
            return false;
        }
    }

    enteredRoom(p: Player): boolean
    {
        return this.playerEnteredRoom;
    }

    moved(p: Player): boolean
    {
        return this.playerMoved;
    }

    rolled(p: Player): boolean
    {
        return this.rolledDice;
    }

    clearSuggestion(): void
    {
        this.suggestionInProgress = false;
    }

    endTurn(id: string): number | undefined
    {
        const p = this.players.find(player => player.id === id);
        if (p!.index !== this.currentPlayerIndex)
        {
            throw new Error("index mismatch");
        }

        this.currentPlayerIndex++;
        this.currentPlayerIndex = this.currentPlayerIndex % this.players.length;

        this.playerEnteredRoom = false;
        this.playerMoved = false;
        this.rolledDice = false;
        this.suggestionInProgress = false;

        return 1;
    }

    endTurnUntilValidPlayer(): number
    {
        console.log(this);
        let i = this.currentPlayerIndex + 1;
        const currentCurrentPlayerIndex = this.currentPlayerIndex;
        i = i % this.players.length;

        this.endTurn(this.players[this.currentPlayerIndex].id);

        while (i % this.players.length !== currentCurrentPlayerIndex)
        {
            console.log(i);
            if (this.playerInGame[this.players[i].id])
            {
                return 1;
            }
            else
            {
                this.endTurn(this.players[i].id);
                i++;
                i = i % this.players.length;
            }
        }

        return 0;
    }
}
//game