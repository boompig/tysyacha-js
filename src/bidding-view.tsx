import React, {useState, useEffect} from 'react';
import API, { MessageType, IBidsResponse } from './api';
import {PlayerView} from './player-view';
import { Hand } from './cards';
import { GamePhase, Bid, getWinningBid } from './game-mechanics';


interface IProps {
    name: string;

    gameId: string;

    round: number;

    playerNames: string[];

    dealer: number;

    /**
     * The index of the *current* player
     */
    playerIndex: number;

    api: API;

    playerCards: Hand;

    onNextPhase(winningBid: Bid | null): any;
}

/**
 * This view handles the bidding process
 */
export function BiddingView(props: IProps) {
    const [bids, setBids] = useState([] as Bid[]);
    const [biddingPlayer, setBiddingPlayer] = useState(-1);
    const [isSubscribed, setSubscribed] = useState(false);
    const [errorText, setErrorText] = useState(null as string | null);
    const [fetchedBiddingHistory, setFetchedBiddingHistory] = useState(false);
    // derived state
    const [highestBid, setHighestBid] = useState(0);
    /**
     * names of players who have passed
     */
    const [passedPlayers, setPassedPlayers] = useState([] as string[]);

    // form control
    const [bidPoints, setBidPoints] = useState(0);

    useEffect(() => {
        if(biddingPlayer === -1) {
            // to the dealer's left
            setBiddingPlayer((props.dealer + 1) % 3);
        }
    }, [props.dealer, biddingPlayer]);

    useEffect(() => {
        function updateBidHistory(bidHistory: Bid[], lastBidder: string, nextPhase: GamePhase) {
            // calculate next bidding player
            const lastBidderIndex = props.playerNames.indexOf(lastBidder);
            const nextBidderIndex = (lastBidderIndex + 1) % 3;
            setBiddingPlayer(nextBidderIndex);
            // add this bid to the list of bids, if not already present
            if (bids.length !== bidHistory.length) {
                setBids(bidHistory);

                // also update passed players
                const newPassedPlayers = bidHistory.filter((bid: Bid) => {
                    return bid.points === 0;
                }).map((bid: Bid) => {
                    return bid.player;
                });
                setPassedPlayers(newPassedPlayers);
            }
            if(bidHistory.length > 0) {
                let newHighestBid = Math.max(...bidHistory.map((bid: Bid) => {
                    return bid.points;
                }));
                setHighestBid(newHighestBid);
            } else {
                setHighestBid(0);
            }
            if(nextPhase !== GamePhase.BIDDING) {
                console.log(`we're done with bidding phase. next phase is ${nextPhase}`);
                const winningBid = getWinningBid(bids);
                props.onNextPhase(winningBid);
            }
        }

        function onNewBid(data: any) {
            // have to filter because it's a broadcast
            if(data.gameId === props.gameId) {
                return updateBidHistory(data.bidHistory, data.lastBidder, data.nextPhase);
            }
        }

        if(!isSubscribed) {
            props.api.addMessageListener([MessageType.BROADCAST_BID], onNewBid);
            setSubscribed(true);
        }
        if(!fetchedBiddingHistory) {
            props.api.getBids(props.gameId, props.round, props.playerNames).then((response: IBidsResponse) => {
                if(response.bidHistory.length > 0) {
                    const lastBidder = response.bidHistory[response.bidHistory.length - 1].player;
                    updateBidHistory(response.bidHistory, lastBidder, response.nextPhase);
                }
                setFetchedBiddingHistory(true);
            });
        }
    }, [isSubscribed, fetchedBiddingHistory, bids, props]);

    function handleBidSubmit (e: React.SyntheticEvent, isPass: boolean) {
        e.preventDefault();
        let pts = bidPoints;

        if (pts && pts <= highestBid && !isPass) {
            setErrorText(`Your bid must be over ${highestBid}`);
            return;
        } else {
            setErrorText(null);
        }

        if (isPass) {
            // overwrite points saved from form
            pts = 0;
        }
        // add that bid to the bidding history
        setBids([...bids, {
            player: props.name,
            points: pts,
        }]);
        // send the bid to the server
        props.api.postBid(props.gameId, props.round, props.name, pts);
    }

    function handleBidChange (e: React.ChangeEvent<HTMLInputElement>) {
        const pts = e.target.value;
        setBidPoints(Number.parseInt(pts));
    }

    const bidRows = bids.map((bid: Bid, i: number) => {
        return <tr key={`}bid-row-${i}`}>
            <td>{bid.player}</td>
            <td>{bid.points === 0 ? 'pass' : bid.points }</td>
        </tr>
    });

    return (<div className='bidding-view'>
        <h3>Bidding</h3>

        <div>
            <span>Player bidding:&nbsp;</span>
            <span>{ props.playerNames[biddingPlayer] }</span>
            { biddingPlayer === props.playerIndex ? <span>&nbsp;(you)</span> :
                null}
        </div>
        <div>Highest bid: { highestBid }</div>

        {bids.length === 0 ? <span>no bids yet</span> :
            <table className='table table-striped table-sm'>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Bid</th>
                    </tr>
                </thead>
                <tbody>
                    { bidRows }
                </tbody>
            </table>}
        <h3>Your Cards</h3>
        <div className='player-cards-view'>
            <PlayerView
                index={props.playerIndex}
                cards={props.playerCards}
                phase={GamePhase.BIDDING}
            />
        </div>

        { props.playerIndex === biddingPlayer ?
            <div>
                <h4>Your Bid</h4>
                { errorText ? <div className='alert alert-danger' role='alert'>{ errorText}</div> : null }
                <form className='bidding-form' onSubmit={(e) => handleBidSubmit(e, false)}>
                    <label htmlFor='bid'>Bid</label>
                    <input type='number' min={100} max={400} name='bid'
                        placeholder='enter your bid here'
                        className='form-control'
                        onChange={(e) => handleBidChange(e) }/>
                    <button type='button' className='btn btn-danger'
                        onClick={(e) => handleBidSubmit(e, true)}>Pass</button>
                    <button type='button' className='btn btn-primary'
                        onClick={(e) => handleBidSubmit(e, false)}
                        disabled={(bidPoints <= highestBid) || passedPlayers.includes(props.name)}>Submit</button>
                </form>
            </div> : null}
    </div>);
}