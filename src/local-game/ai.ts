/**
 * This is a temporary measure until we train a strong AI
 * Just bid some random amount
 */

import {Bid, getWinningBid, MIN_BID_POINTS} from "../game-mechanics";


function getBid(biddingHistory: Bid[], playerName: string): Bid {
    // given the bidding history of other players, return a bet


    const winningBid = getWinningBid(biddingHistory);
    if (winningBid) {
        // randomly we can bid higher or no
        if (Math.random() < .5) {
            // pass
            return {
                player: playerName,
                points: 0,
            };
        } else {
            return {
                player: playerName,
                points: winningBid.points + 5,
            };
        }
    } else {
        // randomly we can bid 60 (minimum) or pass
        if (Math.random() < .5) {
            // pass
            return {
                player: playerName,
                points: 0,
            };
        } else {
            return {
                player: playerName,
                points: MIN_BID_POINTS,
            };
        }
    }
}

export default {
    getBid,
};