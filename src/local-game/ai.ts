/**
 * This is a temporary measure until we train a strong AI
 * For now the rules are relatively procedural
 */

import { Bid, canPlayCard, getWinningBid, ITrickCard, MIN_BID_POINTS, UNSAFE_getWinningCard } from "../game-mechanics";
import { Hand, Card, CardValue, Suit, getMarriageValue, getCardValues } from "../cards";
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
 * Make an estimation for how many points we can take with this hand
 * Return value *guaranteed* to be a multiple of 5.
 */
function _evaluateHand(hand: Hand): number {
    // TODO algo here is very primitive

    if (hand.cards.length !== 7 && hand.cards.length !== 8) {
        throw new Error(`[AI] Expected hand to have 7 or 8 cards in evaluation, found ${hand.cards.length}`);
    }

    let expectedPoints = 0;

    // right now we assume we can't declare a marriage without an ace
    const hasAce = _hasAce(hand);
    const bestMarriageSuit = _getBestMarriageSuit(hand);
    if (hasAce && bestMarriageSuit) {
        expectedPoints += getMarriageValue(bestMarriageSuit);
    }

    // calculate how many points
    for (let suit of Object.keys(hand.cardsBySuit)) {
        const cardVals = getCardValues();

        for (let i = 0; i < hand.cardsBySuit[suit].length; i++) {
            // right now we only calculate our own points
            let card = hand.cardsBySuit[suit][i];
            if (card.value === cardVals[i]) {
                expectedPoints += card.value;
            }
        }
    }

    if (expectedPoints % 5 <= 2) {
        // 0, 1, 2 -> 0
        return expectedPoints - (expectedPoints % 5);
    } else {
        // 3, 4 -> 5
        return expectedPoints - (expectedPoints % 5) + 5;
    }
}

/**
 * Return a bid given this player's hand and the bidding history
 * @param biddingHistory An array with each element representing both a bid and a player, in temporal order (last element is most recent)
 * @param hand The player's hand
 * @param playerName The name of this AI player
 * @returns A bid, representing this AI. Guaranteed to be valid.
 */
function getBid(biddingHistory: Bid[], hand: Hand, playerName: string): Bid {
    // for now the AI doesn't bluff

    const winningBid = getWinningBid(biddingHistory);
    const PASS : Bid = {
        player: playerName,
        points: 0,
    };

    const expectedPoints = _evaluateHand(hand);
    console.debug(`${playerName} AI evaluated hand at ${expectedPoints} points`);

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
    if (j === -1) {
        throw new Error('bug in playRandomCard');
    }
    return j;
}

/**
 * Return what card to play as the *first* card in a trick
 */
function _playLeadingCard(hand: Hand, tricksTaken: {[key: string]: ITrickCard[][]}, trumpSuit: Suit | null, playerName: string): number {
    const hasTakenTrick = tricksTaken[playerName].length > 0;
    if (hasTakenTrick && hand.marriages.length > 0) {
        // play our marriage
        const bestMarriageSuit = _getBestMarriageSuit(hand);
        if (!bestMarriageSuit) {
            throw new Error('best marriage suit cannot be null if hand has marriages');
        }
        // always play the queen
        return hand.findCard({
            value: CardValue.QUEEN,
            suit: bestMarriageSuit,
        });
    } else {
        const hasAce = _hasAce(hand);
        if (hasAce) {
            // play the ace
            return _findCardValue(hand, CardValue.ACE);
        } else {
            return _playRandomCard(hand, [], trumpSuit);
        }
    }
}

/**
 * Return what card to play as any card other than the first card in a trick
 */
function _playFollowingCard(hand: Hand, currentTrick: ITrickCard[], tricksTaken: {[key: string]: ITrickCard[][]}, trumpSuit: Suit | null, playerName: string): number {
    const leadingSuit = currentTrick[0].card.suit;
    const winningCard = UNSAFE_getWinningCard(currentTrick, trumpSuit).card;

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
        const i =  hand.cards.indexOf(ourCard);
        if (i < 0) {
            throw new Error('AI error in leading suit logic');
        }
        return i;
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
        const ourCard = hand.cardsBySuit[trumpSuit][cbsIndex];
        const i = hand.cards.indexOf(ourCard);
        if (i < 0) {
            throw new Error('AI error in trump suit logic');
        }
        return i;
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
        const i = hand.cards.indexOf(lowestCard);
        if (i < 0) {
            throw new Error('AI error in fall-through suit logic');
        }
        return i;
    }
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
function playCard(hand: Hand, currentTrick: ITrickCard[], tricksTaken: {[key: string]: ITrickCard[][]}, trumpSuit: Suit | null, playerName: string): number {
    if (hand.cards.length === 0) {
        throw new Error("player hand cannot be empty");
    }

    // right now it's not very sophisticated
    // if this is not our trick, sacrifice the lowest-value card in that suit
    if (currentTrick.length === 0) {
        const cardIndex = _playLeadingCard(hand, tricksTaken, trumpSuit, playerName);
        if (cardIndex === -1) {
            throw new Error(`[AI] bug in playLeadingCard for AI ${playerName} - returned -1`);
        }
        return cardIndex;
    } else {
        const cardIndex = _playFollowingCard(hand, currentTrick, tricksTaken, trumpSuit, playerName);
        if (cardIndex === -1) {
            throw new Error(`[AI] bug in playFollowingCard for AI ${playerName} - returned -1`);
        }
        return cardIndex;
    }
}

/**
 * This AI holds the contract
 * Re-evaluate what we want to bid in the face of the newly revealed treasure cards
 * The number returned is *guaranteed* to be >= `currentContract`
 * @param hand Holds 7 cards, so does not include the treasure cards
 * @param treasureCards The revealed treasure cards
 */
function reevalContract(hand: Hand, treasureCards: Card[], currentContract: number, playerNames: string[], playerIndex: number): number {
    const playerName = playerNames[playerIndex];
    if (!hand) {
        throw new Error(`[AI] hand is undefined in reevalContract for player ${playerName}`);
    }

    // TODO for now don't gamble

    const bigHandCards = [...hand.cards, ...treasureCards];
    const bigHand = new Hand(bigHandCards);

    // figure out how the cards are going to be distributed
    const assignments = distributeCards(bigHand, playerNames, playerIndex);

    // now create a hand without the cards in the assignments
    const assignedCards = Object.values(assignments);
    const newCards = [...bigHand.cards];
    for (let i = 0; i < assignedCards.length; i++) {
        const card = assignedCards[i];
        const j = newCards.indexOf(card)
        newCards.splice(j, 1);
    }
    const newHand = new Hand(newCards);

    // how much can we make with that hand?
    const newContract = _evaluateHand(newHand);

    if (newContract > currentContract) {
        return newContract;
    } else {
        return currentContract;
    }
}

/**
 * Totally random card distribution, nice and simple
 */
function distributeCardsRandomly(hand: Hand, playerNames: string[], playerIndex: number) {
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

/**
 * @param hand The hand contains the treasure cards
 * @param playerNames Array of player names
 * @param playerIndex The index of this AI in the array of player names
 * @returns A map from player names to the cards they will hold
 * It is guaranteed that each player name (that is not the AI) will have a not-null card assigned to them
 */
function distributeCards(hand: Hand, playerNames: string[], playerIndex: number): {[key: string]: Card} {
    const playerName = playerNames[playerIndex];
    const otherPlayerNames = playerNames.filter((name: string, i: number) => {
        return i !== playerIndex;
    });

    if (otherPlayerNames.length !== 2) {
        throw new Error('there must be exactly 2 other players');
    }

    // TODO this is a very primitive method
    // since there are not that many possible cards to distribute, we just go over all possible cards that we might give away
    // then evaluate the hand afterwards
    // we can use the insight that we will never give away an ace (when we have fewer than 2 marriages) to speed up the calculation
    // NOTE: there are some rare instances when we may want to give away an ace
    // for example: {Hearts: [A, 10, K, Q], Diamonds: [A, 10, K, Q], Spades: [A, 9]}
    // in this case we would want to give away the Ace of Spades
    // however in 99% of cases we would not want to go down that road

    const bestAssignment = {} as { [key: string]: Card };
    let bestAssignmentValue = -1;

    for (let i = 0; i < hand.cards.length; i++) {
        for (let j = i + 1; j < hand.cards.length; j++) {
            const cardA = hand.cards[i];
            const cardB = hand.cards[j];
            const newCards = [...hand.cards];
            // important: splice j before i since i is greater
            newCards.splice(j, 1);
            newCards.splice(i, 1);
            const newHand = new Hand(newCards);
            const numMarriages = newHand.marriages.length;

            if (numMarriages < 2 && (cardA.value === CardValue.ACE || cardB.value === CardValue.ACE)) {
                continue;
            }

            let v = _evaluateHand(newHand);
            if (v > bestAssignmentValue) {
                bestAssignment[otherPlayerNames[0]] = cardA;
                bestAssignment[otherPlayerNames[1]] = cardB;
                bestAssignmentValue = v;
            }
        }
    }

    console.debug(`[AI] Best assignment gives ${playerName} an estimated ${bestAssignmentValue} points`);

    return bestAssignment;
}

export default {
    getBid,
    playCard: playCard,
    reevalContract,
    distributeCards,
};