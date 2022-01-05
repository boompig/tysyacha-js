/**
 * This is a temporary measure until we train a strong AI
 * Just bid some random amount
 */

import { Bid, canPlayCard, getWinningBid, ITrickCard, MIN_BID_POINTS } from "../game-mechanics";
import { Hand, Card } from "../cards";
import { randInt } from "../utils";


function getBid(biddingHistory: Bid[], hand: Hand, playerName: string): Bid {
    // given the bidding history of other players, return a bet

    const winningBid = getWinningBid(biddingHistory);
    const PASS : Bid = {
        player: playerName,
        points: 0,
    };

    if (winningBid) {
        if (winningBid.points >= 120) {
            // the rule is, to bid over 120 you must have at least 1 marriage
            if (hand.marriages.length === 0) {
                return PASS;
            }
        }

        // randomly we can bid higher or no
        if (Math.random() < .5) {
            return PASS;
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
            return PASS;
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

/**
 * This AI holds the contract
 * Re-evaluate what we want to bid in the fact of the newly revealed treasure cards
 * The number returned is *guaranteed* to be >= `currentContract`
 */
function reevalContract(hand: Hand, treasureCards: Card[], currentContract: number): number {
    // TODO for now always keep it the same
    return currentContract;
}

/**
 * @param hand The hand contains the treasure cards
 * @param playerNames Array of player names
 * @param playerIndex The index of this AI in the array of player names
 * @returns A map from player names to the cards they will hold
 * It is guaranteed that each player name (that is not the AI) will have a not-null card assigned to them
 */
function distributeCards(hand: Hand, playerNames: string[], playerIndex: number): {[key: string]: Card} {
    const assignment = {} as {[key: string]: Card};

    const otherPlayerNames = playerNames.filter((name: string, i: number) => {
        return i !== playerIndex;
    });

    // TODO assigns random cards to each of the two other players
    for (let i = 0; i < otherPlayerNames.length; i++) {
        let name = otherPlayerNames[i];
        let cardIndex = randInt(0, hand.cards.length);
        assignment[name] = hand.cards[cardIndex];
    }

    return assignment;
}

export default {
    getBid,
    getCard,
    reevalContract,
    distributeCards,
};