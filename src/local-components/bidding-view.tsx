import React from "react";
import { Hand } from "../cards";
import { Bid, GamePhase } from "../game-mechanics";
import { scoreHand } from "../ai";
import {PlayerView} from "./player-view";

interface IBiddingViewProps {
    /**
     * Index into playerNames
     */
    localPlayerIndex: number;
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
    onClick(): Promise<void> {
        let bestScore = 0;
        let contractPlayer = null as string | null;
        for(const [name, hand] of Object.entries(this.props.playerHands)) {
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

        return this.props.onNextPhase(({
            player: contractPlayer,
            points: 100
        }));
    }

    render(): JSX.Element {
        const playerViews = this.props.playerNames.map((name: string, i: number) => {
            const hand = this.props.playerHands[name];
            return (<div key={`bid-container-${i}`}>
                <PlayerView key={`player-${i}`}
                    name={name}
                    playerIndex={i}
                    hand={hand}
                    phase={GamePhase.BIDDING}
                    isDealer={i === this.props.dealerIndex}
                    tricksTaken={[]}
                    numTricksTaken={0}
                    isContractPlayer={false}
                    isActivePlayer={i === this.state.biddingPlayerIndex}
                    showCards={i === this.props.localPlayerIndex} />
                <div>{ hand.getPoints() } points in hand</div>
                <div>Marriages: { hand.marriages.length > 0 ? hand.marriages.join(" ") : "none" }</div>
            </div>);
        });

        return <div>
            {playerViews}
            <button type="button" className="btn btn-primary btn-lg"
                onClick={(e) => {return this.onClick()}}>Assign Bids</button>
        </div>;
    }
}