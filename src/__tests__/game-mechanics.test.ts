/**
 * Test various game mechanics
 */

import { Card, CardValue, Hand, Suit } from '../cards';
import { ITrickCard, getWinningCard, countTrickPoints, countAllTrickPoints, Bid, getWinningBid, isBiddingComplete, updateScores, doesPlayedCardDeclareMarriage } from '../game-mechanics';


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

describe('doesPlayedCardDeclareMarriage', () => {
    test('can declare marriage under normal conditions', () => {
        const currentTrick = [] as ITrickCard[];
        const hand = new Hand([
            new Card(CardValue.KING, Suit.DIAMONDS),
            new Card(CardValue.QUEEN, Suit.DIAMONDS),
        ]);
        expect(doesPlayedCardDeclareMarriage(hand, 0, currentTrick, 1)).toBe(true);
    });


    test('cannot declare marriage on second card in trick', () => {
        const currentTrick = [
            {
                player: 'a',
                card: {
                    value: CardValue.ACE,
                    suit: Suit.SPADES,
                }
            }
        ] as ITrickCard[];
        const hand = new Hand([
            new Card(CardValue.KING, Suit.DIAMONDS),
            new Card(CardValue.QUEEN, Suit.DIAMONDS),
        ]);
        expect(doesPlayedCardDeclareMarriage(hand, 0, currentTrick, 1)).toBe(false);
    });

    test('cannot declare marriage on first turn', () => {
        const currentTrick = [] as ITrickCard[];
        const hand = new Hand([
            new Card(CardValue.KING, Suit.DIAMONDS),
            new Card(CardValue.QUEEN, Suit.DIAMONDS),
        ]);
        expect(doesPlayedCardDeclareMarriage(hand, 0, currentTrick, 0)).toBe(false);
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

describe('updateScores', () => {
    test('basic update', () => {
        const scoreHistory = {
            'a': [0, 100],
            'b': [0, 150],
            'c': [0, 200],
        };
        const newRoundScores = {
            'a': 10,
            'b': 20,
            'c': 30,
        };
        const newScores = updateScores(scoreHistory, newRoundScores)
        expect(newScores['a']).toBe(110);
        expect(newScores['b']).toBe(170);
        expect(newScores['c']).toBe(230);
    });

    test('player should fall off the barrel after 3 turns', () => {
        const scoreHistory = {
            'a': [0, 100, 880, 880, 880],
            'b': [0, 150, 200, 210, 250],
            'c': [0, 200, 210, 210, 220],
        };
        const newRoundScores = {
            'a': 10,
            'b': 20,
            'c': 30,
        };
        const newScores = updateScores(scoreHistory, newRoundScores)
        expect(newScores['a']).toBe(760);
        expect(newScores['b']).toBe(270);
        expect(newScores['c']).toBe(250);
    });

    test('player should win with 1000 points (rounded down) from both on and off the barrel', () => {
        const scoreHistory = {
            // not on the barrel
            'a': [0, 800],
            // on the barrel
            'b': [0, 880],
            'c': [0, 200],
        };
        const newRoundScores = {
            'a': 210,
            'b': 130,
            'c': 30,
        };
        const newScores = updateScores(scoreHistory, newRoundScores)
        expect(newScores['a']).toBe(1000);
        expect(newScores['b']).toBe(1000);
        expect(newScores['c']).toBe(230);
    });

    test('player can win on their last turn on the barrel', () => {
        const scoreHistory = {
            // on the barrel for 2 turns
            'a': [0, 880, 880, 880],
            'b': [0, 100, 200, 200],
            'c': [0, 150, 180, 200],
        };
        const newRoundScores = {
            'a': 120,
            'b': 20,
            'c': 30,
        };
        const newScores = updateScores(scoreHistory, newRoundScores)
        expect(newScores['a']).toBe(1000);
        expect(newScores['b']).toBe(220);
        expect(newScores['c']).toBe(230);
    });

    test('players can get on and stay on the barrel', () => {
        const scoreHistory = {
            'a': [0, 880],
            'b': [0, 850],
            'c': [0, 300],
        };
        const newRoundScores = {
            'a': 50,
            'b': 50,
            'c': 20,
        };
        const newScores = updateScores(scoreHistory, newRoundScores)
        expect(newScores['a']).toBe(880);
        expect(newScores['b']).toBe(880);
        expect(newScores['c']).toBe(320);
    });

    test('when a player falls off barrel due to a failed contract they receive the right penalty', () => {
        const scoreHistory = {
            // on the barrel for 2 turns (not including this one)
            'a': [0, 880, 880, 880],
            // on the barrel for 1 turn (not including this one)
            'b': [0, 200, 880, 880],
            // on the barrel for 2 turns (not including this one)
            'c': [0, 880, 880, 880],
        };
        const newRoundScores = {
            // minor penalty
            'a': -50,
            // minor penalty
            'b': -50,
            // major penalty
            'c': -140,
        };
        const newScores = updateScores(scoreHistory, newRoundScores)
        // should receive -120
        expect(newScores['a']).toBe(760);
        // should receive -50
        expect(newScores['b']).toBe(830);
        // should receive -140
        expect(newScores['c']).toBe(740);
    });
});

export {};