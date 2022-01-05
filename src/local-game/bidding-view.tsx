import React, { FC, useState, useEffect } from "react";
import { Hand } from "../cards";
import { Bid, GamePhase, getWinningBid, isBiddingComplete, MIN_BID_POINTS } from "../game-mechanics";
import AI from "./ai";
import {PlayerView} from "../local-components/player-view";
import { BidHistoryView } from "./bid-history-view";
import { TableView } from "./table-view";

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

/**
 * Local representation of bidding view
 * For now, this assigns a *fake* bid to the pla
 */
export const BiddingView : FC<IBiddingViewProps> = (props: IBiddingViewProps) => {
    /**
     * Index into playerNames
     */
    const startingBidPlayer = (props.dealerIndex + 1) % 3;
    /**
     * Index into playerNames
     */
    let [biddingPlayerIndex, setBiddingPlayerIndex] = useState(startingBidPlayer);
    /**
     * List of bids by all players starting with the startingBidPlayer
     */
    let [bidHistory, setBidHistory] = useState([] as Bid[]);
    /**
     * Points entered into the points form
     */
    let [points, setPoints] = useState(0);
    /**
     * Error message to display in the points form
     */
    let [pointsErrorMsg, setPointsErrorMsg] = useState("");
    /**
     * This is a derived state (from bidHistory) that is helpful in tracking whether bidding is over
     * It is also helpful in determining who can submit a bid
     * The numbers are indexes into playerNames
     */
    let [passedPlayers, setPassedPlayers] = useState([] as number[]);

    /**
     * When a new bid is added to the bid history, we need to compute whether the bidding is over
     */
    useEffect(() => {
        const isBiddingOver = isBiddingComplete(bidHistory);
        if (isBiddingOver) {
            let winningBid = getWinningBid(bidHistory);
            props.onNextPhase(winningBid);
            // reset everything
            setPassedPlayers([]);
            setPointsErrorMsg("");
            setPoints(0);
            setBidHistory([]);
        }
    });

    /**
     * This is an internal helper function
     */
    function addBid(newBid: Bid, playerIndex: number) {
        setBidHistory([...bidHistory, newBid]);
        setBiddingPlayerIndex((biddingPlayerIndex + 1) % 3);
        if (newBid.points === 0 && !passedPlayers.includes(playerIndex)) {
            setPassedPlayers([...passedPlayers, playerIndex]);
        }
    }

    function handleGetAIBid() {
        if (biddingPlayerIndex === props.localPlayerIndex) {
            throw new Error('method can only be called for AI players');
        }
        const playerName = props.playerNames[biddingPlayerIndex];
        let newBid : Bid | null = null;
        if (passedPlayers.includes(biddingPlayerIndex)) {
            // this AI has already passed
            newBid = {
                points: 0,
                player: playerName,
            };
        } else {
            newBid = AI.getBid(bidHistory, props.playerHands[playerName], playerName);
        }
        addBid(newBid, biddingPlayerIndex);
    }

    /**
     * Human player submits a passing bid
     */
    function handlePass() {
        const playerName = props.playerNames[biddingPlayerIndex];
        addBid({
            points: 0,
            player: playerName,
        }, props.localPlayerIndex);
    }

    /**
     * Human player changes the points in the input element
     */
    function handleChangePoints(e: React.SyntheticEvent<HTMLInputElement>) {
        const points = Number.parseInt((e.target as any).value);

        if (points < 0) {
            setPointsErrorMsg("points cannot be negative");
            return;
        } else if (points === 0) {
            setPointsErrorMsg("cannot bid 0");
        } else if (points % 5 != 0) {
            setPointsErrorMsg("points can only be moved in increments of 5");
            return;
        } else if (points < MIN_BID_POINTS) {
            setPointsErrorMsg("this bid is beneath the points minimum");
            return;
        } else {
            setPointsErrorMsg("");
            setPoints(points);
        }
    }

    /**
     * Human player submits a non-pass bid
     */
    function handleSubmitBid() {
        if (passedPlayers.includes(props.localPlayerIndex)) {
            setPointsErrorMsg("you cannot submit a bid - you have already passed");
        }
        const winningBid = getWinningBid(bidHistory);
        if (winningBid && winningBid.points >= points) {
            setPointsErrorMsg("your bid is lower than the current highest bid");
            return;
        } else {
            const playerName = props.playerNames[biddingPlayerIndex];
            addBid({
                points: points,
                player: playerName,
            }, props.localPlayerIndex);
        }
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

    return <div className="bidding-view">
        <TableView
            playerNames={props.playerNames}
            localPlayerIndex={props.localPlayerIndex}
            activePlayerIndex={biddingPlayerIndex} />

        <div className="round-info">
            <p>
                It is { props.playerNames[biddingPlayerIndex]}'s turn to bid.
            </p>
        </div>

        <div className="player-action-container">
            { biddingPlayerIndex === props.localPlayerIndex ?
                <form className="bidding-form">
                    <label>Points</label>
                    <input type="number" name="points" min={0} max={400} step={5}
                        className="form-control"
                        onChange={handleChangePoints} />
                    { pointsErrorMsg ? <p className="error-msg">{ pointsErrorMsg }</p> : null }
                    <div className="btn-group">
                        <button type="button" className="btn btn-lg btn-success"
                            onClick={handleSubmitBid}
                            disabled={points === 0 || pointsErrorMsg !== "" || passedPlayers.includes(props.localPlayerIndex) }>Submit Bid</button>
                        <button type="button" className="btn btn-lg btn-danger"
                            onClick={handlePass}>Pass</button>
                    </div>
                </form>:

                <button type="button" className="btn btn-primary btn-lg"
                    onClick={handleGetAIBid}>AI Bid</button>
            }
        </div>

        <BidHistoryView
            playerNames={props.playerNames}
            startingBidPlayer={startingBidPlayer}
            bidHistory={bidHistory} />

        <div className="player-hand-container">
            <h2>Your Hand</h2>
            {playerView}
        </div>
    </div>;
}