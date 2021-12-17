import React from "react";
import { Card, Hand } from "../cards";
import { CardView } from "./card-view";
import { PlayerView } from "./player-view";
import { GamePhase } from "../game-mechanics";

interface RevealTreasureViewProps {
    playerNames: string[];
    playerHands: {[key: string]: Hand};
    dealerIndex: number;
    contractPlayerIndex: number;

    treasure: Card[];
    selectedTreasureCards: {[key: string]: Card};
    onSelect: (cardIndex: number) => any;
    onDistribute: (selectedCards: {[key: string]: Card}) => any;
}

interface RevealTreasureViewState {}

export class RevealTreasureView extends React.PureComponent<RevealTreasureViewProps, RevealTreasureViewState> {
    render(): JSX.Element {
        const playerHands = this.props.playerNames.map((name: string, i: number) => {
            return <PlayerView key={`player-${i}`}
                name={name}
                playerIndex={i}
                hand={this.props.playerHands[name]}
                phase={GamePhase.REVEAL_TREASURE}
                isDealer={i === this.props.dealerIndex}
                isContractPlayer={i === this.props.contractPlayerIndex}
                isActivePlayer={i === this.props.contractPlayerIndex}
                tricksTaken={[]}
                numTricksTaken={0}
                // TODO
                showCards={false} />
        });

        const treasureCards = this.props.treasure.map((card: Card, i: number) => {
            const isSelected = Object.values(this.props.selectedTreasureCards).includes(card);
            let targetPlayer = null;
            if(isSelected) {
                // find the corresponding player name
                for(const [name, otherCard] of Object.entries(this.props.selectedTreasureCards)) {
                    if(card === otherCard) {
                        targetPlayer = name;
                    }
                }
            }
            return (<div key={`treasure-card-container-${i}`}>
                <CardView key={`treasure-card-${i}`}
                    suit={card.suit}
                    value={card.value}
                    classNames={isSelected ? ["card-selected"] : []}
                    onClick={(e) => {return this.props.onSelect(i)}} />
                { targetPlayer ?
                    <div className="target-player">sending to {targetPlayer}</div>
                    : null}
            </div>);
        });
        return (<div className="table container">
            <div className="dealt-table">
                <h3>Treasure</h3>
                <div className="treasure-container">{treasureCards}</div>
                { Object.keys(this.props.selectedTreasureCards).length === 2 ?
                    <button type="button" className="btn btn-primary btn-lg"
                        onClick={(e) => {return this.props.onDistribute(this.props.selectedTreasureCards)}}
                    >Distribute Cards</button> : null }
                <div className="player-hands">
                    <h3>Players</h3>
                    {playerHands}
                </div>
            </div>
        </div>);
    }
}