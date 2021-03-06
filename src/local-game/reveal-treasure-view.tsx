import React, { FC, useState } from "react";
import { Card, Hand } from "../cards";
import { CardView } from "../local-components/card-view";
import { PlayerView } from "../local-components/player-view";
import { GamePhase } from "../game-mechanics";
import AI from "./ai";

interface IRevealTreasureViewProps {
    playerNames: string[];
    /**
     * Index of the local (human) player
     */
    localPlayerIndex: number;

    playerHands: {[key: string]: Hand};
    dealerIndex: number;
    contractPoints: number;
    contractPlayerIndex: number;

    treasure: Card[];
    onFinalizeContract: (contractPoints: number) => any;
}

/**
 * The treasure has just been revealed!
 * The contract player may now increase their contract
 *
 * We show the treasure to everyone
 * But be careful to only show the human player's cards to them
 */
const RevealTreasureView : FC<IRevealTreasureViewProps> = (props: IRevealTreasureViewProps) => {
    const contractPlayerName = props.playerNames[props.contractPlayerIndex];

    /**
     * New contract points
     */
    let [points, setPoints] = useState(0);
    let [errorMsg, setErrorMsg] = useState("");
    /**
     * We only use this variable if the AI holds the contract
     * True iff the AI has thought about their action (filled `points` variable)
     */
    let [haveAITurn, setAITurn] = useState(false);

    function handleChangeContract(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (points <= props.contractPoints) {
            setErrorMsg("this is not more than your current contract");
            return;
        } else if (points % 5 !== 0) {
            setErrorMsg("contract points must be a multiple of 5");
            return;
        }
        props.onFinalizeContract(points);
        return false;
    }

    function handleKeepCurrentContract() {
        props.onFinalizeContract(props.contractPoints);
    }

    /**
     * Change the contract points
     */
    function handleChangePoints(e: React.SyntheticEvent<HTMLInputElement>) {
        const v = Number.parseInt((e.target as HTMLInputElement).value);
        setPoints(v);
    }

    /**
     * Let the AI think
     */
    function handleAITurn() {
        const name = props.playerNames[props.contractPlayerIndex];
        const newPoints = AI.reevalContract(
            props.playerHands[name],
            props.treasure,
            props.contractPoints,
            props.playerNames,
            props.contractPlayerIndex
        );
        if (newPoints < props.contractPoints) {
            throw new Error('AI returned a lower contract than the one it started with');
        }
        setPoints(newPoints);
        setAITurn(true);
    }

    /**
     * Once the AI has decided on a contract amount, submit that amount back to caller
     */
    function handleSubmitAIPoints() {
        if (!haveAITurn) {
            throw new Error('AI must think first');
        }
        props.onFinalizeContract(points);
    }


    const treasureCards = props.treasure.map((card: Card, i: number) => {
        let targetPlayer = null;
        return (<div key={`treasure-card-container-${i}`}>
            <CardView key={`treasure-card-${i}`}
                suit={card.suit}
                value={card.value} />
            { targetPlayer ?
                <div className="target-player">sending to {targetPlayer}</div>
                : null}
        </div>);
    });

    const humanPlayerName = props.playerNames[props.localPlayerIndex];

    // show the *human player*'s cards, not that of the contract player
    const playerView = (<div>
            <PlayerView
                name={humanPlayerName}
                playerIndex={props.localPlayerIndex}
                hand={props.playerHands[humanPlayerName]}
                phase={GamePhase.BIDDING}
                isDealer={props.localPlayerIndex === props.dealerIndex}
                tricksTaken={[]}
                numTricksTaken={0}
                isContractPlayer={props.localPlayerIndex === props.contractPlayerIndex}
                isActivePlayer={props.localPlayerIndex === props.contractPlayerIndex}
                showCards={true} />
        </div>);

    let instructions = null;

    if (props.localPlayerIndex === props.contractPlayerIndex) {
        instructions = (<p>Congratulations! You won the contract for { props.contractPoints } points.
            I hope you like the treasure.
            You may now increase your contract if you wish.</p>);
    } else {
        instructions = (<p>
            Unfortunately you did not win the bidding.&nbsp;
            { contractPlayerName } won the bidding instead and currently holds a contract for { props.contractPoints} points.
            In any case, each player sees the previously hidden treasure cards.&nbsp;
            { contractPlayerName } may now choose to increase the contract or keep it the same.
        </p>);
    }

    return (<div className="container reveal-treasure-view">
        <div className="dealt-table">
            <div>
                <h3>Treasure</h3>
                <div className="treasure-container">{treasureCards}</div>
            </div>
            <div className="player-hand-container">
                <h2>Your Hand</h2>
                {playerView}
            </div>

            {instructions}

            { props.localPlayerIndex === props.contractPlayerIndex ?
                <form onSubmit={handleChangeContract}>
                    <input type="number" className="form-control" name="points"
                        min={props.contractPoints} max={400} step={5}
                        placeholder="please enter your new contract points"
                        onChange={handleChangePoints} />
                    { errorMsg ? <div className="error-msg">{ errorMsg }</div> : null }
                    <div className="btn-group">
                        <button type="submit" className="btn btn-success btn-lg"
                            disabled={points < props.contractPoints}>Increase Contract</button>
                        <button type="submit" className="btn btn-danger btn-lg"
                            onClick={handleKeepCurrentContract}>Keep Current Contract</button>
                    </div>
                </form>:
                <div>
                    { haveAITurn ? null :
                        <button type="button" className="btn btn-info btn-lg"
                            onClick={handleAITurn}>Evaluate AI Turn</button>
                    }

                    { haveAITurn ?
                        <div>{
                            points === props.contractPoints ?
                            `${contractPlayerName} has decided to keep the contract unchanged.` :
                            `${contractPlayerName} has decided to increase the contract to ${points} points.`
                        }
                        </div> : null
                    }

                    { haveAITurn ?
                        <button type="button" className="btn btn-success btn-lg"
                            onClick={handleSubmitAIPoints}>Continue</button> :
                        null
                    }
                </div>
            }
        </div>
    </div>);
};

export {
    RevealTreasureView,
};