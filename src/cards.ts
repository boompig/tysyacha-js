import seedrandom from "seedrandom";
import * as _ from "lodash";

export enum CardValue {
    NINE = 0,
    JACK = 2,
    QUEEN = 3,
    KING = 4,
    TEN = 10,
    ACE = 11
}

export enum Suit {
    HEARTS = "♥",
    DIAMONDS = "♦",
    CLUBS = "♣",
    SPADES = "♠"
}

/**
 * Suits are returned in the order they are displayed
 */
export function getSuits(): Suit[] {
    return [Suit.HEARTS, Suit.CLUBS, Suit.DIAMONDS, Suit.SPADES];
}

function getCardValues(): CardValue[] {
    return [
        CardValue.NINE,
        CardValue.JACK,
        CardValue.QUEEN,
        CardValue.KING,
        CardValue.TEN,
        CardValue.ACE
    ];
}

export function suitToString(suit: Suit): string {
    return suit.valueOf();
}

function valueToString(value: CardValue): string {
    switch(value) {
        case CardValue.ACE:
            return "A";
        case CardValue.KING:
            return "K";
        case CardValue.QUEEN:
            return "Q";
        case CardValue.JACK:
            return "J";
        case CardValue.TEN:
            return "10";
        case CardValue.NINE:
            return "9";
    }
}

export class Card {
    suit: Suit;
    value: CardValue;

    constructor(value: CardValue, suit: Suit) {
        this.suit = suit;
        this.value = value;
    }

    valueToString(): string {
        return valueToString(this.value);
    }

    toString(): string {
        const v = valueToString(this.value);
        const s = suitToString(this.suit);
        return s + v;
    }
}

type CardsBySuit = {[key: string]: Card[]};

/**
 * Utility functions for a hand
 */
export class Hand {
    cards: Card[];
    /**
     * Cards sorted according to their suit
     * Guaranteed to be ordered with highest value first
     */
    cardsBySuit: CardsBySuit;

    /**
     * Computed once, can be reused
     */
    marriages: Suit[];

    constructor(cards: Card[]) {
        this.cards = cards;

        // sort the cards by suit
        this.cardsBySuit = this._sortCardsBySuit(cards)
        this.marriages = this._findMarriages();
    }

    hasCard(value: CardValue): boolean {
        const values = (this.cards as Card[]).map((card) => {
            return card.value;
        });
        return values.includes(value);
    }

    _sortCardsBySuit(cards: Card[]): CardsBySuit {
        const cardsBySuit = {} as any;
        for(let suit of getSuits()) {
            cardsBySuit[suit] = [] as Card[];
        }

        cards.forEach((card: Card) => {
            cardsBySuit[card.suit].push(card);
        });

        for(let [suit, cards] of Object.entries(cardsBySuit)) {
            // cards within a suit should be sorted by VALUE (descending)
            (cards as Card[]).sort((a: Card, b: Card) => {
                return b.value - a.value;
            });
        }

        return cardsBySuit;
    }

    _findMarriages(): Suit[] {
        const marriages: Suit[] = [];
        for(let [suit, cards] of Object.entries(this.cardsBySuit)) {
            const l = (cards as Card[]).map((card: Card) => card.valueToString());
            const hasMarriage = (l.includes("Q") && l.includes("K"));
            if(hasMarriage) {
                marriages.push(suit as Suit);
            }
        }
        return marriages;
    }

    /**
     * Get the number of points in the hand
     * Don't include marriages
     */
    getPoints(): number {
        let pts = 0;
        for(let [suit, cards] of Object.entries(this.cardsBySuit)) {
            pts += (cards as Card[]).reduce((acc: number, cur: Card) => {
                return acc + cur.value;
            }, 0);
        }
        return pts;
    }
}

/**
 * Standard deck in marriage
 */
export class Deck {
    randomSeed: number;
    cards: Card[];

    constructor(randomSeed: number) {
        this.randomSeed = randomSeed;
        this.cards = [];

        // create the deck
        for(let suit of getSuits()) {
            for(let value of getCardValues()) {
                this.cards.push(new Card(value, suit));
            }
        }

        // seed random number generator
        seedrandom(randomSeed.toString(), {global: true});

        // shuffle the deck
        this.cards = _.shuffle(this.cards);
    }

    pop(): Card {
        const card = this.cards.pop();
        if(typeof card === "undefined") {
            throw new Error("Deck is empty");
        }
        return card;
    }
}