export enum GamePhase {
    NOT_DEALT = 0,
    BIDDING = 1,
    REVEAL_TREASURE = 2,
    DISTRIBUTE_CARDS = 3,
    PLAYING = 4,
}

/**
 * A bid of 0 -> pass
 */
export type Bid = {
    points: number;
    player: number;
}