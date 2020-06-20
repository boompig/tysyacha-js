import { Card, Hand, CardValue, Suit, ICard } from "./cards";

export enum GamePhase {
    NOT_DEALT = 0,
    BIDDING = 1,
    REVEAL_TREASURE = 2,
    DISTRIBUTE_CARDS = 3,
    PLAYING = 4,
}

/**
 * A bid of 0 -> pass
 */
export type Bid = {
    points: number;
    player: string;
}

export interface ITrickCard {
    player: string;
    card: ICard;
}

export interface IPastTrick {
    trick: ITrickCard[];
    // winning player
    winner: string;
}

/**
 * NOTE: perhaps in the future a user should manually specify this
 * For now we specify for the user
 * If they can play a marriage with a given card, they do.
 */
export function isMarriagePlayed(card: Card, hand: Hand, totalTricks: number, isFirstCardInTrick: boolean): boolean {
    if (!isFirstCardInTrick) {
        return false;
    }
    if ((card.value === CardValue.QUEEN || card.value === CardValue.KING) && hand.marriages.includes(card.suit)) {
        // we have the marriage. is this the first trick
        return totalTricks > 0;
    }
    return false;
}

export function getWinningCard(cards: ITrickCard[], marriage: null | Suit): ITrickCard {
    if (cards.length !== 3) {
        throw new Error('There must be only 3 cards be trick');
    }
    let winningP = cards[0].player;
    let bestCard = cards[0].card;

    for(let tc of cards) {
        let isBetter = false;
        if (marriage && tc.card.suit === marriage) {
            if (bestCard.suit === marriage) {
                isBetter = tc.card.value > bestCard.value;
            } else {
                isBetter = true
            }
        } else {
            isBetter = tc.card.value > bestCard.value;
        }

        if (isBetter) {
            bestCard = tc.card;
            winningP = tc.player;
        }
    }

    return {
        player: winningP,
        card: bestCard,
    };
}

/**
 * Compute the winning bid from the bid history
 * If all people pass, return null
 * @param {Bid[]} bidHistory
 * @returns {Bid | null} winning bid
 */
export function getWinningBid(bidHistory: Bid[]): Bid | null {
    let contractPts = 0;
    let contractPlayer : string | null = null;
    for(let bid of bidHistory) {
        if (bid.points > contractPts) {
            contractPts = bid.points;
            contractPlayer = bid.player;
        }
    }

    if (!contractPlayer) {
        return null;
    }

    return {
        player: contractPlayer,
        points: contractPts,
    } as Bid;
}