import { Card, Hand, CardValue, Suit, ICard, getMarriageValue } from "./cards";

export enum GamePhase {
    /**
     * The first phase - we wait until a deal is initiated
     */
    NOT_DEALT = 0,
    /**
     * The cards have been dealt and the treasure cards have been allocated
     */
    BIDDING = 1,
    /**
     * The treasure is revealed to all players
     * The player who won the bidding phase may revise their contract up
     */
    REVEAL_TREASURE = 2,
    /**
     * The treasure cards have been moved to the player who holds the contract
     * The contract player must now allocate one card to each opponent
     */
    DISTRIBUTE_CARDS = 3,
    /**
     * The players take tricks
     */
    PLAYING = 4,
    /**
     * All past tricks are shown and scores are calculated
     */
    SCORING = 5,
}

export function gamePhaseToString(phase: GamePhase): string {
    switch (phase) {
        case GamePhase.NOT_DEALT:
            return "NOT_DEALT";
        case GamePhase.BIDDING:
            return "BIDDING";
        case GamePhase.REVEAL_TREASURE:
            return "REVEAL_TREASURE";
        case GamePhase.DISTRIBUTE_CARDS:
            return "DISTRIBUTE_CARDS";
        case GamePhase.PLAYING:
            return "PLAYING";
        case GamePhase.SCORING:
            return "SCORING";
    }
}

export function getGamePhases(): GamePhase[] {
    return [
        GamePhase.NOT_DEALT,
        GamePhase.BIDDING,
        GamePhase.REVEAL_TREASURE,
        GamePhase.DISTRIBUTE_CARDS,
        GamePhase.PLAYING,
        GamePhase.SCORING,
    ];
}

export const MIN_BID_POINTS = 60;

/**
 * A bid of 0 -> pass
 */
export type Bid = {
    points: number;
    player: string;
}

export interface ITrickCard {
    /**
     * Name of the player
     */
    player: string;
    card: ICard;
    /**
     * When specified and true, whether this card represents a declared marriage
     */
    isMarriage?: boolean;
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

/**
 * Return the winning card in this trick. Unlike the safe version, makes no assumptions about whether the trick has 3 cards (but must not be empty).
 * This is useful for an AI to call.
 * @param cards The cards in the trick. May not be an empty array.
 * @param trumpSuit The current trump suit
 * @returns The card in the trick that wins
 */
export function UNSAFE_getWinningCard(cards: ITrickCard[], trumpSuit: null | Suit): ITrickCard {
    if (cards.length === 0) {
        throw new Error('current trick may not be empty');
    }

    let winningP = cards[0].player;
    let bestCard = cards[0].card;

    for (const tc of cards) {
        let isBetter = false;
        if (trumpSuit && tc.card.suit === trumpSuit) {
            // this player played a trump
            if (bestCard.suit === trumpSuit) {
                isBetter = tc.card.value > bestCard.value;
            } else {
                isBetter = true
            }
        } else if (tc.card.suit === cards[0].card.suit) {
            // this player played in the "correct" suit
            if (trumpSuit && bestCard.suit === trumpSuit) {
                // tough luck - someone else played a trump
                isBetter = false;
            } else {
                // highest card wins
                isBetter = tc.card.value > bestCard.value;
            }
        } else {
            // this player played the wrong suit and not a trump
            isBetter = false;
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
 * Return the winning card in this trick. The trick *must* have 3 cards.
 * @param cards The cards in the trick
 * @param trumpSuit The current trump suit
 * @returns The card in the trick that wins
 */
export function getWinningCard(cards: ITrickCard[], trumpSuit: null | Suit): ITrickCard {
    if (cards.length !== 3) {
        throw new Error(`There must only be 3 cards in the current trick, found ${cards.length}`);
    }
    return UNSAFE_getWinningCard(cards, trumpSuit);
}

/**
 * Return true iff the player can play the given card from their hand given the trick
 * Assume the card is part of the hand
 */
export function canPlayCard(hand: Hand, trick: ITrickCard[], card: Card): boolean {
    if(trick.length === 0) {
        // they can play whatever card they want
        return true;
    }
    const leadingSuit = trick[0].card.suit;
    if(card.suit === leadingSuit) {
        // can always play in the same suit as the first card in the trick
        return true;
    }
    // can play any other card so long as the player has no cards in the leading suit
    return hand.cardsBySuit[leadingSuit].length === 0;
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
    for(const bid of bidHistory) {
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

/**
 * Count the # of points in a single trick
 * *DO NOT* round here
 */
export function countTrickPoints(trick: ITrickCard[]): number {
    return trick.map((tc: ITrickCard) => {
        return tc.card.value;
    }).reduce((total: number, cardValue: CardValue) => {
        return total + cardValue;
    }, 0);
}

/**
 * Return true iff the bidding is now concluded
 * This occurs when all players have passed
 */
export function isBiddingComplete(bidHistory: Bid[]): boolean {
    const passedPlayers: string[] = [];
    let hasNonPassBid = false;
    for(let i = 0; i < bidHistory.length; i++) {
        let bid = bidHistory[i];
        if (passedPlayers.includes(bid.player)) {
            continue;
        } else if (bid.points === 0) {
            passedPlayers.push(bid.player);
        } else {
            hasNonPassBid = true;
        }
    }
    return (passedPlayers.length === 3) || (hasNonPassBid && passedPlayers.length === 2);
}

/**
 * Count the # of points in all tricks. Round to nearest 5
 */
export function countAllTrickPoints(tricks: ITrickCard[][]): number {
    const pts  = tricks.map((trick: ITrickCard[]) => {
        return countTrickPoints(trick);
    }).reduce((total: number, trickPoints: number) => {
        return total + trickPoints;
    }, 0);
    if(pts % 5 < 3) {
        // 0, 1, 2
        return pts - (pts % 5);
    } else {
        // 3, 4
        return pts + (5 - (pts % 5));
    }
}

export function groupTricksByPlayer(playerNames: string[], tricksTaken: IPastTrick[]): {[key: string]: ITrickCard[][]} {
    // sort the tricks by player
    const tricksPerPlayer: {[key: string]: ITrickCard[][]} = {};
    playerNames.forEach((name: string) => {
        tricksPerPlayer[name] = [];
    })
    tricksTaken.forEach((trick: IPastTrick) => {
        tricksPerPlayer[trick.winner].push(trick.trick);
    });
    return tricksPerPlayer;
}

interface IScores {
    /**
     * Scores before we factor in the contract
     */
    raw: {[key: string]: number};
    /**
     * Scores after we factor in the contract
     */
    final: {[key: string]: number};
}

/**
 * Compute the scores for each player in the round, taking into account who was the contract player
 * @param playerNames List of all players' names
 * @param tricksTaken A map from player names to the tricks they have taken
 * @param declaredMarriages A map from player names to the marriages they declared
 * @param contract The *final* contract
 */
export function computeRoundScores(
    playerNames: string[],
    tricksTaken: { [key: string]: ITrickCard[][] },
    declaredMarriages: { [key: string]: Suit[] },
    contract: Bid
): IScores {
    const rawPoints = {} as {[key: string]: number};
    const finalPoints = {} as {[key: string]: number};

    // first calculate the raw scores that the players earned that round
    playerNames.forEach((name: string) => {
        let pts = countAllTrickPoints(tricksTaken[name]);
        if(name in declaredMarriages) {
            declaredMarriages[name].forEach((suit: Suit) => {
                pts += getMarriageValue(suit);
            });
        }
        rawPoints[name] = pts;
        finalPoints[name] = 0;
    });

    for (let name of playerNames) {
        if (name === contract.player) {
            // now figure out if the contract player fulfilled their contract
            if (rawPoints[name] >= contract.points) {
                finalPoints[name] = contract.points;
            } else {
                finalPoints[name] = -1 * contract.points;
            }
        } else {
            // all other players just get their raw points
            finalPoints[name] = rawPoints[name];
        }
    }

    return {
        raw: rawPoints,
        final: finalPoints,
    };
}

/**
 * Return the name of any players currently on the barrel
 */
export function getBarrelPlayers(scores: {[key: string]: number[]}): string[] {
    const barrelPlayers = [] as string[];
    Object.entries(scores).forEach(([playerName, scoresArr]) => {
        const l = scoresArr.length;
        if (scoresArr[l - 1] === 880) {
            barrelPlayers.push(playerName);
        }
    });
    return barrelPlayers;
}

export type TCards = {[key: string]: Hand};

export interface IDeal {
    playerCards: TCards;
    treasure: Card[];
}
