import React from "react";
import { Card, Hand } from "../cards";
import { PlayerView } from "../local-components/player-view";
import { GamePhase } from "../game-mechanics";

interface RevealTreasureViewProps {
    playerNames: string[];
    playerHands: {[key: string]: Hand};
    dealerIndex: number;
    contractPlayerIndex: number;

    treasure: Card[];
}

interface RevealTreasureViewState {}

export class RevealTreasureView extends React.PureComponent<RevealTreasureViewProps, RevealTreasureViewState> {
    render() {
        const name = this.props.playerNames[this.props.contractPlayerIndex];
        const i = this.props.contractPlayerIndex;
        const allCards = this.props.playerHands[name].cards.slice();
        allCards.push(...this.props.treasure);
        const bigHand = new Hand(allCards);
        const playerHands = (
            <PlayerView key={`player-${i}`}
                    name={name}
                    playerIndex={this.props.contractPlayerIndex}
                    hand={bigHand}
                    phase={GamePhase.REVEAL_TREASURE}
                    isDealer={i === this.props.dealerIndex}
                    isContractPlayer={true}
                    isActivePlayer={true}
                    tricksTaken={[]}
                    numTricksTaken={0} />
        );

        return (<div className="table container">
            <div className="dealt-table">
                <div className="player-hands">
                    <h3>Large Hand</h3>
                    {playerHands}
                </div>
            </div>
        </div>);
    }
}