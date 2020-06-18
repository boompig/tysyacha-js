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
    player: string;
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
    for(let bid of bidHistory) {
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