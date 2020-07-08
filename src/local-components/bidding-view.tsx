import React from "react";
import { Hand } from "../cards";
import { Bid } from "../game-mechanics";
import { scoreHand } from "../ai";
import {PlayerView} from "./player-view";

interface IBiddingViewProps {
    playerNames: string[];

    dealerIndex: number;

    playerHands: {[key: string]: Hand}
    onNextPhase(winningBid: Bid | null): any;
}

interface IBiddingViewState {
    biddingPlayerIndex: number
}

/**
 * Local representation of bidding view
 * For now, this assigns a *fake* bid to the pla
 */
export class BiddingView extends React.PureComponent<IBiddingViewProps, IBiddingViewState> {
    constructor(props: IBiddingViewProps) {
        super(props);
        this.state = {
            biddingPlayerIndex: (this.props.dealerIndex + 1) % 3,
        };
        this.onClick = this.onClick.bind(this);
    }

    /**
     * TODO this is a temporary measure to assign a bid to the strongest hand
     */
    onClick() {
        let bestScore = 0;
        let contractPlayer = null as string | null;
        for(let [name, hand] of Object.entries(this.props.playerHands)) {
            let score = scoreHand(hand);
            let numMarriages = hand.marriages.length;
            console.log(`Player ${name} has hand score of ${score} (${numMarriages} marriages)`);
            if(score > bestScore) {
                contractPlayer = name;
                bestScore = score;
            }
        }

        if(!contractPlayer) {
            throw new Error("unable to find a contract player");
        }

        return this.props.onNextPhase(({
            player: contractPlayer,
            points: 100
        }));
    }

    render() {
        const playerViews = this.props.playerNames.map((name: string, i: number) => {
            return <PlayerView key={`player-${i}`}
                name={name}
                playerIndex={i} 
                hand={this.props.playerHands[name]}
                tricksTaken={[]}
                numTricksTaken={0}
                isDealer={i === this.props.dealerIndex}
                isContractPlayer={false}
                isActivePlayer={i === this.state.biddingPlayerIndex} />
        });

        return <div>
            {playerViews}
            <button type="button" className="btn btn-primary btn-lg"
                onClick={(e) => this.onClick()}>Assign Bids</button>
        </div>;
    }
}