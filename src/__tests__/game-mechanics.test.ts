/**
 * Test various game mechanics
 */

import { CardValue, Suit } from '../cards';
import {ITrickCard, getWinningCard} from '../game-mechanics';

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


export {};