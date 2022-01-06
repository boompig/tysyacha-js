/**
 * This view shows the scoring for the given round
 */

import React, { FC } from "react";
import { Bid, computeRoundScores, ITrickCard } from "../game-mechanics";
import { Suit } from "../cards";
import { CardView } from "./card-view";

interface IScoringViewProps {
    contract: Bid;
    // this is perhaps redundant information
    contractPlayerIndex: number;

    playerNames: string[];
    tricksTaken: {[key: string]: ITrickCard[][]};
    declaredMarriages: {[key: string]: Suit[]};

    onFinish?: (scores: {[key: string]: number}) => any;
}

export const RoundScoringView : FC<IScoringViewProps> = (props: IScoringViewProps) => {
    if(!props.declaredMarriages) {
        throw new Error('declared marriages is null');
    }
    // calculate final points
    const scores = computeRoundScores(props.playerNames, props.tricksTaken, props.declaredMarriages, props.contract);
    const finalPoints = scores.final;
    const rawPoints = scores.raw;
    // did the contract player succeed
    const contractPlayer = props.contract.player;
    const isContractMade = finalPoints[contractPlayer] > 0;

    // show the tricks
    const playerTricks = props.playerNames.map((name: string, playerIndex: number) => {
        const tricksTaken = props.tricksTaken[name];
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
        const numMarriages = name in props.declaredMarriages ? props.declaredMarriages[name].length : 0;
        const marriages = numMarriages > 0 ? props.declaredMarriages[name].join(" ") : "";
        return <div className="player-tricks-taken-container" key={`player-${playerIndex}-tricks-taken-container`}>
            <h4>{name}</h4>
            { tricks.length > 0 ?
                <div>
                    <div>{tricks.length} tricks taken - {
                        name === contractPlayer ?
                        // display the raw total for the contract player
                        `${rawPoints[name]} points (contract was ${props.contract.points} points)`:
                        `${finalPoints[name]} points`
                    }</div>
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
            <div>{props.contract.player} holds contract for {props.contract.points} points</div>
            <div>{ isContractMade ? `${contractPlayer} met the contract` :
                `${contractPlayer} failed to meet the contract` }</div>
        </div>
        <div className="player-tricks">
            <h3>Taken Tricks</h3>
            {playerTricks}
        </div>
        { props.onFinish ?
            <button type="button" className="btn btn-primary btn-lg"
                onClick={(e) => {return props.onFinish ? props.onFinish(finalPoints) : null}}>Start Next Round</button> :
            null }
    </div>);
};

export default RoundScoringView;