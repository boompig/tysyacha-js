import {Hand, getMarriageValue} from "./cards";

/**
 * Right now the "AI" is actually a series of very easy utilities that are helpful for testing
 */
export function scoreHand(hand: Hand): number {
    let score = 0;
    for(const marriage of hand.marriages) {
        score += getMarriageValue(marriage);
    }
    // add up the score of the remaining cards
    for(const card of hand.cards) {
        score += card.value;
    }
    return score;
}
