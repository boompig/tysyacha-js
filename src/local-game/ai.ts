/**
 * This is a temporary measure until we train a strong AI
 * Just bid some random amount
 */

import { Bid, canPlayCard, getWinningBid, ITrickCard, MIN_BID_POINTS } from "../game-mechanics";
import { Hand, Card } from "../cards";
import { randInt } from "../utils";


function getBid(biddingHistory: Bid[], playerName: string): Bid {
    // given the bidding history of other players, return a bet


    const winningBid = getWinningBid(biddingHistory);
    if (winningBid) {
        // randomly we can bid higher or no
        if (Math.random() < .5) {
            // pass
            return {
                player: playerName,
                points: 0,
            };
        } else {
            return {
                player: playerName,
                points: winningBid.points + 5,
            };
        }
    } else {
        // randomly we can bid 60 (minimum) or pass
        if (Math.random() < .5) {
            // pass
            return {
                player: playerName,
                points: 0,
            };
        } else {
            return {
                player: playerName,
                points: MIN_BID_POINTS,
            };
        }
    }
}

/**
 * @returns The card index to player relative to `playerHand.cards`
 */
function getCard(playerHand: Hand, currentTrick: ITrickCard[]): number {
    if (playerHand.cards.length === 0) {
        throw new Error("player hand cannot be empty");
    }

    // right now it's not very sophisticated
    // just choose randomly from the cards that the person can play
    const possibleCards = playerHand.cards.filter((card: Card) => {
        return canPlayCard(playerHand, currentTrick, card);
    });

    if (possibleCards.length === 0) {
        throw new Error("somehow cannot play any card in my hand");
    }

    const i = randInt(0, possibleCards.length);
    const card = possibleCards[i];
    const j = playerHand.cards.indexOf(card);
    return j;
}

export default {
    getBid,
    getCard,
};