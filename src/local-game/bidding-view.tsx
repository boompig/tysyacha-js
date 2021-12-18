import React, { FC, useState } from "react";
import { Hand } from "../cards";
import { Bid, GamePhase } from "../game-mechanics";
import { scoreHand } from "../ai";
import {PlayerView} from "../local-components/player-view";

interface IBiddingViewProps {
    /**
     * Index into playerNames
     * This is the player who is currently looking at this view
     */
    localPlayerIndex: number;

    playerNames: string[];

    /**
     * Index into playerNames
     * This is the player who dealt
     */
    dealerIndex: number;

    playerHands: {[key: string]: Hand}
    onNextPhase(winningBid: Bid | null): any;
}

interface IBiddingViewState {
    /**
     * Index into playerNames
     * This is the player whose turn it is to bid
     */
    biddingPlayerIndex: number
}

/**
 * Local representation of bidding view
 * For now, this assigns a *fake* bid to the pla
 */
export const BiddingView : FC<IBiddingViewProps> = (props: IBiddingViewProps) => {
    let [biddingPlayerIndex, setBiddingPlayerIndex] = useState((props.dealerIndex + 1) % 3);

    /**
     * TODO this is a temporary measure to assign a bid to the strongest hand
     */
    function onClick(): Promise<void> {
        let bestScore = 0;
        let contractPlayer = null as string | null;
        for(const [name, hand] of Object.entries(props.playerHands)) {
            const score = scoreHand(hand);
            const numMarriages = hand.marriages.length;
            console.log(`Player ${name} has hand score of ${score} (${numMarriages} marriages)`);
            if(score > bestScore) {
                contractPlayer = name;
                bestScore = score;
            }
        }

        if(!contractPlayer) {
            throw new Error("unable to find a contract player");
        }

        return props.onNextPhase(({
            player: contractPlayer,
            points: 100
        }));
    }

    const name = props.playerNames[props.localPlayerIndex];
    const hand = props.playerHands[name];
    const playerView =
        (<div>
            <PlayerView
                name={name}
                playerIndex={props.localPlayerIndex}
                hand={hand}
                phase={GamePhase.BIDDING}
                isDealer={props.localPlayerIndex === props.dealerIndex}
                tricksTaken={[]}
                numTricksTaken={0}
                isContractPlayer={false}
                isActivePlayer={props.localPlayerIndex === biddingPlayerIndex}
                showCards={true} />
            <div>{ hand.getPoints() } points in hand</div>
            <div>Marriages: { hand.marriages.length > 0 ? hand.marriages.join(" ") : "none" }</div>
        </div>);

    const playerOrder = props.playerNames.map((name: string, i: number) => {
        const classes = ['player-name'];
        if (i === props.localPlayerIndex) {
            classes.push('local-player');
        }
        if (i === biddingPlayerIndex) {
            classes.push('active-player');
        }
        return <div className={ classes.join(' ')} key={ `player-${i}` }>
            <span>{name}</span>
            {props.localPlayerIndex === i ?
            <span>*</span> :
            null }
        </div>
    });

    return <div className='bidding-view'>
        <div className="player-order">
            {playerOrder}
        </div>
        <h2>Your Hand</h2>
        {playerView}

        { biddingPlayerIndex === props.localPlayerIndex ? 
            <div className='bidding-choices'>
                <select></select>
            </div>:

            <button type="button" className="btn btn-primary btn-lg"
                onClick={(e) => {return onClick()}}>AI Bid</button>
        }
    </div>;
}