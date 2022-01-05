/**
 * This is a temporary measure until we train a strong AI
 * For now the rules are relatively procedural
 */

import { Bid, canPlayCard, getWinningBid, ITrickCard, MIN_BID_POINTS } from "../game-mechanics";
import { Hand, Card, CardValue, Suit, getMarriageValue } from "../cards";
import { randInt } from "../utils";

/**
 * Return true iff this hand has at least 1 ace
 */
function _hasAce(hand: Hand): boolean {
    for(let card of hand.cards) {
        if (card.value === CardValue.ACE) {
            return true;
        }
    }
    return false;
}

function _bestMarriageSuit(hand: Hand): Suit | null {
    let bestSuit = null as Suit | null;
    let bestV = 0;
    for (let suit of hand.marriages) {
        let v = getMarriageValue(suit)
        if (v > bestV) {
            bestV = v;
            bestSuit = suit;
        }
    }
    return bestSuit;
}


/**
 * Return a bid given this player's hand and the bidding history
 * @param biddingHistory An array with each element representing both a bid and a player, in temporal order (last element is most recent)
 * @param hand The player's hand
 * @param playerName The name of this AI player
 * @returns A bid, representing this AI. Guaranteed to be valid.
 */
function getBid(biddingHistory: Bid[], hand: Hand, playerName: string): Bid {
    // given the bidding history of other players, return a bet

    const winningBid = getWinningBid(biddingHistory);
    const PASS : Bid = {
        player: playerName,
        points: 0,
    };

    // make some assumptions about how many points we can take
    let expectedPoints = 0;
    const hasAce = _hasAce(hand);
    const bestMarriageSuit = _bestMarriageSuit(hand);
    if (hasAce && bestMarriageSuit) {
        // for now we just assume that we can only make this amount
        expectedPoints = 15 + getMarriageValue(bestMarriageSuit);
    } else {
        expectedPoints = 0;
    }

    if ((winningBid && expectedPoints > winningBid.points) || (!winningBid && expectedPoints >= MIN_BID_POINTS)) {
        return {
            points: expectedPoints,
            player: playerName,
        };
    } else {
        return PASS;
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