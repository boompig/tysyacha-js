/**
 * This is a temporary measure until we train a strong AI
 * For now the rules are relatively procedural
 */

import { Bid, canPlayCard, getWinningBid, ITrickCard, MIN_BID_POINTS, UNSAFE_getWinningCard } from "../game-mechanics";
import { Hand, Card, CardValue, Suit, getMarriageValue, ICard } from "../cards";
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

function _getBestMarriageSuit(hand: Hand): Suit | null {
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
 * Find the index of a given card in the hand.
 * This card is not a card object that exists in hand.cards but a description of the card
 * @returns index into hand.cards if found, -1 otherwise
 */
function _findCard(hand: Hand, card: ICard): number {
    for (let i = 0; i < hand.cards.length; i++) {
        let handCard = hand.cards[i];
        if (handCard.suit === card.suit && handCard.value === card.value) {
            return i;
        }
    }
    return -1;
}

function _findCardValue(hand: Hand, cardValue: CardValue): number {
    for(let i = 0; i < hand.cards.length; i++) {
        let card = hand.cards[i];
        if (card.value === cardValue) {
            return i;
        }
    }
    return -1;
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
    const bestMarriageSuit = _getBestMarriageSuit(hand);
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
 * Very basic implementation of `getCard` - return a random card from the list of cards that can be played
 */
function _playRandomCard(hand: Hand, currentTrick: ITrickCard[], trumpSuit: Suit | null) : number {
    const possibleCards = hand.cards.filter((card: Card) => {
        return canPlayCard(hand, currentTrick, card);
    });

    if (possibleCards.length === 0) {
        throw new Error("somehow cannot play any card in my hand");
    }

    const i = randInt(0, possibleCards.length);
    const card = possibleCards[i];
    const j = hand.cards.indexOf(card);
    return j;
}

/**
 * Return the card this player will play in the current trick
 * @param hand The hand of this player
 * @param currentTrick A list of cards currently played in the current trick
 * @param tricksTaken A map from player names to an array of tricks that have already been taken.
 * Each player name is guaranteed to exist in this map (but array may be of length 0).
 * AI should probably remember this itself but it's a machine so that's not very hard.
 * @param trumpSuit Null if no current trump. Otherwise the current trump suit.
 * @returns The card index to player relative to `playerHand.cards`
 */
function getCard(hand: Hand, currentTrick: ITrickCard[], tricksTaken: {[key: string]: ITrickCard[][]}, trumpSuit: Suit | null, playerName: string): number {
    if (hand.cards.length === 0) {
        throw new Error("player hand cannot be empty");
    }

    // right now it's not very sophisticated
    // if this is not our trick, sacrifice the lowest-value card in that suit
    if (currentTrick.length === 0) {
        // our trick

        const hasTakenTrick = tricksTaken[playerName].length > 0;
        if (hasTakenTrick && hand.marriages.length > 0) {
            // play our marriage
            const bestMarriageSuit = _getBestMarriageSuit(hand);
            if (!bestMarriageSuit) {
                throw new Error('best marriage suit cannot be null if hand has marriages');
            }
            // always play the queen
            return _findCard(hand, {
                value: CardValue.QUEEN,
                suit: bestMarriageSuit,
            });
        } else {
            const hasAce = _hasAce(hand);
            if (hasAce) {
                // play the ace
                return _findCardValue(hand, CardValue.ACE);
            } else {
                return _playRandomCard(hand, currentTrick, trumpSuit);
            }
        }
    } else {
        const leadingSuit = currentTrick[0].card.suit;
        const winningCard = UNSAFE_getWinningCard(currentTrick, trumpSuit).card;

        // someone else's trick
        if (hand.cardsBySuit[leadingSuit].length > 0) {
            // we have this suit

            // since cardsBySuit ordered by value, this is the highest card
            // not empty in this block
            const ourBestCard = hand.cardsBySuit[leadingSuit][0];
            let cbsIndex = 0;

            if (winningCard.suit !== leadingSuit || ourBestCard.value < winningCard.value) {
                // we are going to lose this trick. put down our lowest card.
                cbsIndex = hand.cardsBySuit[leadingSuit].length - 1;
            } else {
                // we are winning this trick. put down our best card.
                cbsIndex = 0;
            }
            const ourCard = hand.cardsBySuit[leadingSuit][cbsIndex];
            return hand.cards.indexOf(ourCard);
        } else if (trumpSuit && hand.cardsBySuit[trumpSuit].length > 0) {
            // we don't have the leading suit but we have a trump
            // we *do not* go into this block if the leading card was a trump

            let cbsIndex = 0;
            if (winningCard.suit === leadingSuit || winningCard.suit !== trumpSuit) {
                // no one else has placed a trump card
                // play our lowest trump
                cbsIndex = hand.cardsBySuit[trumpSuit].length - 1;
            } else {
                // someone else has already placed a trump card
                const ourBestCard = hand.cardsBySuit[trumpSuit][0];
                if (ourBestCard.value > winningCard.value) {
                    // play our highest trump to beat it
                    cbsIndex = 0;
                } else {
                    // our highest trump cannot beat it, so play our lowest trump
                    cbsIndex = hand.cardsBySuit[trumpSuit].length - 1;
                }
            }
            const ourCard = hand.cardsBySuit[leadingSuit][cbsIndex];
            return hand.cards.indexOf(ourCard);
        } else {
            // we don't have the leading suit or a trump
            // we will throw away our lowest remaining card
            let lowestV = 1000;
            let lowestCard = hand.cards[0];
            for (let card of hand.cards) {
                if (card.value < lowestV) {
                    lowestCard = card;
                    lowestV = card.value;
                }
            }
            return hand.cards.indexOf(lowestCard);
        }
    }
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