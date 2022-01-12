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
 * NOTE: the hand *must* include the played card (obviously)
 * Otherwise we get nonsense
 * @param hand Hand *before* this card is played (includes this card)
 * @param cardIndex Index into hand.cards
 * @param currentTrick The current trick *excluding* the current card
 * @param numPastTricks The number of tricks that have already been taken (by all players, total)
 */
export function doesPlayedCardDeclareMarriage (hand: Hand, cardIndex: number, currentTrick: ITrickCard[], numPastTricks: number) {
    if (cardIndex < 0 || cardIndex >= hand.cards.length) {
        throw new Error(`cardIndex is invalid - ${cardIndex}`);
    }

    if (currentTrick.length !== 0 || numPastTricks === 0) {
        return false;
    }

    const card = hand.cards[cardIndex];

    // check to see if they have the other card
    if ((card.value === CardValue.KING || card.value === CardValue.QUEEN) && hand.marriages.includes(card.suit)) {
        // console.log(`[trick ${this.state.trickNumber}] ${playerName} declared a ${card.suit} marriage`);
        return true;
    }
    return false;
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
 * Given the history of the scores, return a map from the player names to their current scores
 */
export function getLatestScores(scoreHistory: {[key: string]: number[]}): {[key: string]: number} {
    const scores = {} as {[key: string]: number};
    for (let [playerName, playerScores] of Object.entries(scoreHistory)) {
        scores[playerName] = playerScores[playerScores.length - 1];
    }
    return scores;
}

/**
 * Return the name of any players currently on the barrel
 */
export function getBarrelPlayers(scores: {[key: string]: number}): string[] {
    const barrelPlayers = [] as string[];
    Object.entries(scores).forEach(([playerName, playerScore]) => {
        if (playerScore >= 880 && playerScore < 1000) {
            barrelPlayers.push(playerName);
        }
    });
    return barrelPlayers;
}

/**
 * Return the number of turns that a player has been on the barrel (not including any unscored turns)
 * -1 means the player is not on the barrel
 */
export function getBarrelTurnCounts(scoreHistory: {[key: string]: number[]}): {[key: string]: number} {
    const barrelTurnCounts = {} as {[key: string]: number};

    Object.entries(scoreHistory).forEach(([playerName, playerScores]) => {
        let count = -1;
        // start with most recent turn
        let i = playerScores.length - 1;

        while ((playerScores[i] >= 880 && playerScores[i] < 1000) && i >= 0) {
            // the player was on the barrel on turn i
            count++;
            i--;
        }
        barrelTurnCounts[playerName] = count;
    });
    return barrelTurnCounts;
}

/**
 * Return the number of completed rounds in the score history
 */
export function getRoundsComplete(scoreHistory: {[key: string]: number[]}): number {
    for (let scores of Object.values(scoreHistory)) {
        return scores.length - 1;
    }
    throw new Error('no players in score history');
}

/**
 * Update the player scores given the new scores for the round and other related information
 * The round scores should already take into account the contract, etc.
 *
 * @param scoreHistory - includes history of scores not including this most recent turn. Each entry is cumulative.
 * This method is guaranteed to *not* modify scoreHistory
 *
 * @returns The scores for the latest round we are computing. Up to the caller to insert this correctly into the score history
 */
export function updateScores(scoreHistory: { [key: string]: number[] }, newRoundScores: { [key: string]: number }): { [key: string]: number } {
    const newScores = {} as {[key: string]: number};
    const lastRoundScores = getLatestScores(scoreHistory);
    const barrelTurnCounts = getBarrelTurnCounts(scoreHistory);

    for (let player of Object.keys(newRoundScores)) {
        // tentatively compute the player's new score
        newScores[player] = lastRoundScores[player] + newRoundScores[player];

        if (barrelTurnCounts[player] > 0) {
            if (newScores[player] >= 1000) {
                // round it down to 1000
                newScores[player] = 1000;
                // console.debug(`[updateScores] player ${player} has won after being on the barrel`);
            } else if (barrelTurnCounts[player] === 2 && newScores[player] >= 880) {
                // player was already on the barrel for 2 turns and their new score puts them on the barrel again
                // NOTE: the score is <1000
                console.assert(lastRoundScores[player] === 880);
                newScores[player] = lastRoundScores[player] - 120;
                // console.debug(`[updateScores] player ${player} has been on the barrel for 3 turns and is thrown off`);
            } else if (barrelTurnCounts[player] === 2 && newScores[player] < 880) {
                // player was already on the barrel for 2 turns but their new score throws them off the barrel
                newScores[player] = Math.min(lastRoundScores[player] - 120, newScores[player]);
                // console.debug(`[updateScores] player ${player} is thrown off the barrel after receiving a negative`);
            } else if (newScores[player] >= 880 && newScores[player] < 1000) {
                // player continues to be on the barrel
                newScores[player] = 880;
                // console.debug(`[updateScores] player ${player} is still on the barrel`);
            }

            // in all other cases, our player gets kicked off the barrel
        } else {
            // player was not on the barrel last turn
            // can just add the score in a straightforward manner
            if (newScores[player] >= 1000) {
                // round it down to 1000
                newScores[player] = 1000;
                // console.debug(`[updateScores] player ${player} has won the game`);
            } else if (newScores[player] >= 880 && newScores[player] < 1000) {
                // round it down to 880
                newScores[player] = 880;
                // console.debug(`[updateScores] player ${player} is now on the barrel`);
            }
        }
    }

    return newScores;
}

export function getIsGameOver(scoreHistory: {[key: string]: number[]}): boolean {
    const latestScores = getLatestScores(scoreHistory);
    for (let score of Object.values(latestScores)) {
        if (score >= 1000) {
            return true;
        }
    }
    return false;
}

export type TCards = {[key: string]: Hand};

export interface IDeal {
    playerCards: TCards;
    treasure: Card[];
}
