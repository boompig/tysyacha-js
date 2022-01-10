/**
 * Test various game mechanics
 */

import { CardValue, Suit } from '../cards';
import { ITrickCard, getWinningCard, countTrickPoints, countAllTrickPoints, Bid, getWinningBid, isBiddingComplete } from '../game-mechanics';


/**
 * Test the bidding logic
 */
describe('getWinningBid', () => {
    test('no bid returned when everyone passes', () => {
        const bids = [
            {
                player: 'a',
                points: 0,
            },
            {
                player: 'b',
                points: 0,
            },
            {
                player: 'c',
                points: 0,
            },
        ] as Bid[];
        expect(getWinningBid(bids)).toBe(null);
    });

    test('winning bid returned when there is only one bid', () => {
        const bids = [
            {
                player: 'a',
                points: 0,
            },
            {
                player: 'b',
                points: 80,
            },
            {
                player: 'c',
                points: 0,
            },
        ] as Bid[];
        expect(getWinningBid(bids)?.points).toBe(80);
        expect(getWinningBid(bids)?.player).toBe('b');
    });

    test('winning bid returned when there are multiple bids', () => {
        const bids = [
            {
                player: 'a',
                points: 0,
            },
            {
                player: 'b',
                points: 80,
            },
            {
                player: 'c',
                points: 85,
            },
            {
                player: 'b',
                points: 90,
            },
            {
                player: 'c',
                points: 95,
            },
            {
                player: 'b',
                points: 120,
            },
            {
                player: 'c',
                points: 150,
            },
            {
                player: 'b',
                points: 0,
            },
        ] as Bid[];
        expect(getWinningBid(bids)?.points).toBe(150);
        expect(getWinningBid(bids)?.player).toBe('c');
    });
});

/**
 * Test the bidding logic
 */
describe('isBiddingComplete', () => {
    test('bidding *not* complete when it has just started', () => {
        expect(isBiddingComplete([])).toBe(false);
    });

    test('bidding *not* complete after only 2 passes', () => {
        const bids = [
            {
                player: 'a',
                points: 0,
            },
            {
                player: 'b',
                points: 0,
            },
        ] as Bid[];
        expect(isBiddingComplete(bids)).toBe(false);
    });

    test('bidding complete after 3 passes', () => {
        const bids = [
            {
                player: 'a',
                points: 0,
            },
            {
                player: 'b',
                points: 0,
            },
            {
                player: 'c',
                points: 0,
            },
        ] as Bid[];
        expect(isBiddingComplete(bids)).toBe(true);
    });

    test('bidding complete after 2 passes and 1 bid', () => {
        const bids = [
            {
                player: 'a',
                points: 0,
            },
            {
                player: 'b',
                points: 70,
            },
            {
                player: 'c',
                points: 0,
            },
        ] as Bid[];
        expect(isBiddingComplete(bids)).toBe(true);
    });

    test('bidding *not* complete after 1 pass and 2 bids', () => {
        const bids = [
            {
                player: 'a',
                points: 0,
            },
            {
                player: 'b',
                points: 80,
            },
            {
                player: 'c',
                points: 85,
            },
        ] as Bid[];
        expect(isBiddingComplete(bids)).toBe(false);
    });

    test('bidding *not* complete until second-last player passes', () => {
        const bids = [
            {
                player: 'a',
                points: 0,
            },
            {
                player: 'b',
                points: 80,
            },
            {
                player: 'c',
                points: 85,
            },
            {
                player: 'b',
                points: 90,
            },
            {
                player: 'c',
                points: 95,
            },
            {
                player: 'b',
                points: 120,
            },
            {
                player: 'c',
                points: 150,
            },
        ] as Bid[];
        expect(isBiddingComplete(bids)).toBe(false);
    });

    test('bidding complete after long back and forth when second-last player passes', () => {
        const bids = [
            {
                player: 'a',
                points: 0,
            },
            {
                player: 'b',
                points: 80,
            },
            {
                player: 'c',
                points: 85,
            },
            {
                player: 'b',
                points: 90,
            },
            {
                player: 'c',
                points: 95,
            },
            {
                player: 'b',
                points: 120,
            },
            {
                player: 'c',
                points: 150,
            },{
                player: 'b',
                points: 0,
            },
        ] as Bid[];
        expect(isBiddingComplete(bids)).toBe(true);
    });
});

/**
 * Test the trick-taking logic
 */
describe('getWinningCard', () => {
    test('highest card wins trick in the same suit if all cards the same suit', () => {
        const trick = [
            {
                player: 'a',
                card: {
                    value: CardValue.KING,
                    suit: Suit.CLUBS,
                },
            },
            {
                player: 'b',
                card: {
                    value: CardValue.ACE,
                    suit: Suit.CLUBS,
                },
            },
            {
                player: 'c',
                card: {
                    value: CardValue.TEN,
                    suit: Suit.CLUBS,
                },
            },
        ] as ITrickCard[];

        const winningCard = getWinningCard(trick, null);
        expect(winningCard.player).toBe('b');
        expect(winningCard.card.value).toBe(CardValue.ACE);
    });

    test('low trump wins trick against high non-trump cards', () => {
        const trick = [
            {
                player: 'a',
                card: {
                    value: CardValue.KING,
                    suit: Suit.CLUBS,
                },
            },
            {
                player: 'b',
                card: {
                    value: CardValue.ACE,
                    suit: Suit.CLUBS,
                },
            },
            {
                player: 'c',
                card: {
                    value: CardValue.NINE,
                    suit: Suit.HEARTS,
                },
            },
        ] as ITrickCard[];

        const winningCard = getWinningCard(trick, Suit.HEARTS);
        expect(winningCard.player).toBe('c');
        expect(winningCard.card.value).toBe(CardValue.NINE);
    });

    test('highest trump wins trick if multiple trumps', () => {
        const trick = [
            {
                player: 'a',
                card: {
                    value: CardValue.KING,
                    suit: Suit.CLUBS,
                },
            },
            {
                player: 'b',
                card: {
                    value: CardValue.QUEEN,
                    suit: Suit.HEARTS,
                },
            },
            {
                player: 'c',
                card: {
                    value: CardValue.NINE,
                    suit: Suit.HEARTS,
                },
            },
        ] as ITrickCard[];

        const winningCard = getWinningCard(trick, Suit.HEARTS);
        expect(winningCard.player).toBe('b');
        expect(winningCard.card.value).toBe(CardValue.QUEEN);
    });

    test('low card wins trick if other cards are not of the same suit and there is no trump', () => {
        const trick = [
            {
                player: 'a',
                card: {
                    value: CardValue.JACK,
                    suit: Suit.SPADES,
                },
            },
            {
                player: 'b',
                card: {
                    value: CardValue.ACE,
                    suit: Suit.CLUBS,
                },
            },
            {
                player: 'c',
                card: {
                    value: CardValue.TEN,
                    suit: Suit.HEARTS,
                },
            },
        ] as ITrickCard[];

        const winningCard = getWinningCard(trick, null);
        expect(winningCard.player).toBe('a');
        expect(winningCard.card.value).toBe(CardValue.JACK);
        expect(winningCard.card.suit).toBe(Suit.SPADES);
    });

    test('low card wins trick if other cards are not of same suit and not trump', () => {
        const trick = [
            {
                player: 'a',
                card: {
                    value: CardValue.JACK,
                    suit: Suit.SPADES,
                },
            },
            {
                player: 'b',
                card: {
                    value: CardValue.ACE,
                    suit: Suit.CLUBS,
                },
            },
            {
                player: 'c',
                card: {
                    value: CardValue.TEN,
                    suit: Suit.HEARTS,
                },
            },
        ] as ITrickCard[];

        const winningCard = getWinningCard(trick, Suit.DIAMONDS);
        expect(winningCard.player).toBe('a');
        expect(winningCard.card.value).toBe(CardValue.JACK);
        expect(winningCard.card.suit).toBe(Suit.SPADES);
    });
});

/**
 * Test the scoring logic - make sure we can count the points in a trick
 */
describe('countTrickPoints', () => {
    test('correctly count the points in the trick - no rounding', () => {
        const trick = [
            {
                player: 'a',
                card: {
                    value: CardValue.QUEEN,
                    suit: Suit.CLUBS,
                },
            },
            {
                player: 'b',
                card: {
                    value: CardValue.ACE,
                    suit: Suit.CLUBS,
                },
            },
            {
                player: 'c',
                card: {
                    value: CardValue.TEN,
                    suit: Suit.CLUBS,
                },
            },
        ] as ITrickCard[];

        const points = countTrickPoints(trick);
        // make sure we are rounding up here
        expect(points).toBe(24);
    });
});

/**
 * Test scoring logic
 */
describe('countAllTrickPoints', () => {
    test('correctly count the points in all my tricks - do rounding here', () => {
        // this trick has 24 points
        const trick1 = [
            {
                player: 'a',
                card: {
                    value: CardValue.QUEEN,
                    suit: Suit.CLUBS,
                },
            },
            {
                player: 'b',
                card: {
                    value: CardValue.ACE,
                    suit: Suit.CLUBS,
                },
            },
            {
                player: 'c',
                card: {
                    value: CardValue.TEN,
                    suit: Suit.CLUBS,
                },
            },
        ] as ITrickCard[];
        // this trick has 2 points
        const trick2 = [
            {
                player: 'a',
                card: {
                    value: CardValue.NINE,
                    suit: Suit.CLUBS,
                },
            },
            {
                player: 'b',
                card: {
                    value: CardValue.JACK,
                    suit: Suit.SPADES,
                },
            },
            {
                player: 'c',
                card: {
                    value: CardValue.NINE,
                    suit: Suit.DIAMONDS,
                },
            },
        ] as ITrickCard[];
        const tricks = [trick1, trick2];
        // should round down here
        expect(countAllTrickPoints(tricks)).toBe(25);
    });

    test('handle no tricks taken', () => {
        expect(countAllTrickPoints([])).toBe(0);
    });
});

export {};