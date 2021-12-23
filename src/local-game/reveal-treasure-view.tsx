import React, { FC, useState } from "react";
import { Card, Hand } from "../cards";
import { CardView } from "../local-components/card-view";
import { PlayerView } from "../local-components/player-view";
import { GamePhase } from "../game-mechanics";

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
 */
const RevealTreasureView : FC<IRevealTreasureViewProps> = (props: IRevealTreasureViewProps) => {
    const contractPlayerName = props.playerNames[props.contractPlayerIndex];

    let [points, setPoints] = useState(0);
    let [errorMsg, setErrorMsg] = useState("");

    function handleChangeContract(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (points <= props.contractPoints) {
            setErrorMsg("this is not more than your current contract");
            return;
        } else if (points % 5 != 0) {
            setErrorMsg("contract points must be a multiple of 5");
            return;
        }
        props.onFinalizeContract(points);
        return false;
    }

    function handleKeepCurrentContract() {
        props.onFinalizeContract(props.contractPoints);
    }

    function handleChangePoints(e: React.SyntheticEvent<HTMLInputElement>) {
        const v = Number.parseInt((e.target as HTMLInputElement).value);
        setPoints(v);
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

    const playerView = (<div>
            <PlayerView
                name={humanPlayerName}
                playerIndex={props.localPlayerIndex}
                hand={props.playerHands[contractPlayerName]}
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
            </form>
        </div>
    </div>);
};

export {
    RevealTreasureView,
};