/**
 * Alright this file will estimate bids in a very simple way
 * Basically if
 */

import {Suit, Card, Hand, CardValue} from "./cards";

type Discard = {[key: number]: Card[]};
type Hands = {[key: number]: Card[]};

export class GameState {
    marriage: Suit | null;
    discard: Discard;
    hands: Hands;
    currentTrick: Card[];
    turn: number;

    constructor(hands: Hands, turn: number, currentTrick: Card[], marriage? : Suit | null, discard?: Discard) {
        this.hands = hands;
        this.turn = turn;
        this.currentTrick = currentTrick;

        this.marriage = marriage || null;

        if(discard) {
            this.discard = discard;
        } else {
            this.discard = {};
            for(let i = 0; i < 3; i++) {
                this.discard[i] = [];
            }
        }
    }

    /**
     * Find the card that wins the trick
     */
    winningCardIndex(cards: Card[], trumpSuit: Suit | null): number {
        // find the highest index in the starting suit
        let bestCardIndex = 0;
        let maxValue = cards[0].value;
        let startingSuit = cards[0].suit;

        for(let i = 1; i < cards.length; i++) {
            if(cards[i].suit === startingSuit && cards[i].value > maxValue) {
                maxValue = cards[i].value;
                bestCardIndex = i;
            }
        }

        // find the highest index in the trump suit
        let bestTrumpIndex = -1;
        let trumpMaxValue = -1;

        if(trumpSuit) {
            for(let i = 0; i < cards.length; i++) {
                if(cards[i].suit === trumpSuit && cards[i].value > trumpMaxValue) {
                    trumpMaxValue = cards[i].value;
                    bestTrumpIndex = i;
                }
            }
        }

        if(trumpSuit && trumpMaxValue !== -1) {
            return bestTrumpIndex;
        } else {
            return bestCardIndex;
        }
    }

    /**
     * Marriage always stays the same when the last person plays card on trick
     */
    evalTrick(trick: Card[], lastPlayer: number): number {
        let winningIndex = this.winningCardIndex(trick, this.marriage);
        const firstPlayer = (lastPlayer + 1) % 3;
        // calculate who actually won the trick based on the index of the last player
        const winningPlayer = (winningIndex + firstPlayer) % 3;
        return winningPlayer;
    }

    // a given player plays a given card
    playCard(card: Card, cardIndex: number, player: number, isMarriage: boolean): GameState {
        // player should === this.turn

        const nextHands : Hands = {};
        let nextMarriage = this.marriage;
        for(let i = 0; i < 3; i++) {
            if(i === player) {
                nextHands[i] = [...this.hands[i].slice(0, cardIndex),
                    ...this.hands[i].slice(cardIndex + 1)];
            } else {
                nextHands[i] = this.hands[i];
            }
        }

        if(isMarriage) {
            // TODO can only set marriage as first move
            nextMarriage = card.suit;
        }

        let nextCurrentTrick = [
            ...this.currentTrick,
            card
        ];

        if(nextCurrentTrick.length === 3) {
            // evaluate the trick winner
            const winningPlayer = this.evalTrick(nextCurrentTrick, player);
            // entire trick goes into winning player's discard pile
            const nextDiscard : Discard = {}
            for(let i = 0; i < 3; i++) {
                if(i === winningPlayer) {
                    nextDiscard[i] = [...this.discard[i],
                        ...nextCurrentTrick];
                } else {
                    nextDiscard[i] = this.discard[i];
                }
            }

            return new GameState(
                nextHands,
                winningPlayer,
                [],
                nextMarriage,
                nextDiscard
            );
        } else {
            return new GameState(
                nextHands,
                (this.turn + 1) % 3,
                nextCurrentTrick,
                nextMarriage,
                this.discard
            );
        }
    }
}

/**
 * The simplest implementation possible
 * If there's a marriage and an ace, then return 100
 * Otherwise pass
 */
export function getBidForHand(hand: Hand): number {
    let bid = 0;
    if(hand.marriages.length > 0 && hand.hasCard(CardValue.ACE)) {
        bid = 100;
    }
    return bid;
}