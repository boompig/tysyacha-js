import React from "react";
import {Bid, computeRoundScores, ITrickCard} from "../game-mechanics";
import {Suit} from "../cards";
import {CardView} from "./card-view";

interface IScoringViewProps {
    contract: Bid;
    // this is perhaps redundant information
    contractPlayerIndex: number;

    playerNames: string[];
    tricksTaken: {[key: string]: ITrickCard[][]};
    declaredMarriages: {[key: string]: Suit[]};

    onFinish: (scores: {[key: string]: number}) => any;
}

interface IScoringViewState {

}

export class RoundScoringView extends React.PureComponent<IScoringViewProps, IScoringViewState> {
    render() {
        // calculate final points
        const finalPoints = computeRoundScores(this.props.playerNames, this.props.tricksTaken, this.props.declaredMarriages);
        // did the contract player succeed
        const contractPlayer = this.props.contract.player;
        const isContractMade = finalPoints[contractPlayer] >= this.props.contract.points;

        // show the tricks
        const playerTricks = this.props.playerNames.map((name: string, playerIndex: number) => {
            const tricksTaken = this.props.tricksTaken[name];
            const tricks = tricksTaken.map((trick: ITrickCard[], trickIndex: number) => {
                const cards = trick.map((tc: ITrickCard, cardIndex: number) => {
                    return <CardView key={`player-${playerIndex}-tricks-taken-${trickIndex}-card-${cardIndex}`}
                        classNames={[`trick-card-${cardIndex}`]}
                        suit={tc.card.suit}
                        value={tc.card.value} />;
                });
                return <div className="trick-taken" key={`player-${playerIndex}-tricks-taken-${trickIndex}`}>
                    {cards}
                </div>
            });
            const numMarriages = name in this.props.declaredMarriages ? this.props.declaredMarriages[name].length : 0;
            const marriages = numMarriages > 0 ? this.props.declaredMarriages[name].join(" ") : "";
            return <div className="player-tricks-taken-container" key={`player-${playerIndex}-tricks-taken-container`}>
                <h4>{name}</h4>
                { tricks.length > 0 ?
                    <div>
                        <div>{tricks.length} tricks taken - {finalPoints[name]} points</div>
                        <div>{numMarriages} marriages declared
                            { numMarriages > 0 ? ": " + marriages : null }</div>
                        <div className="player-tricks-taken">
                            {tricks}
                        </div>
                    </div> :
                    <div>no tricks taken - 0 points</div> }
            </div>;
        });

        return (<div className="table container">
            <div className="game-status">
                <h3>Status</h3>
                <div>{this.props.contract.player} holds contract for {this.props.contract.points} points</div>
                <div>{ isContractMade ? `${contractPlayer} met the contract` :
                    `${contractPlayer} failed to meet the contract` }</div>
            </div>
            <div className="player-tricks">
                <h3>Taken Tricks</h3>
                {playerTricks}
            </div>
            <button type="button" className="btn btn-primary btn-lg"
                onClick={(e) => this.props.onFinish(finalPoints)}>Start Next Round</button>
        </div>);
    }
}