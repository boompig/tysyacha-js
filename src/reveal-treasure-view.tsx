import React, {useState, ChangeEvent} from 'react';
import { Bid, GamePhase } from './game-mechanics';
import { API } from './api';
import { Card, Hand } from './cards';
import { PlayerView } from './player-view';

interface IProps {
    gameId: string;
    // name of the current player
    name: string;
    playerIndex: number;

    api: API;

    winningBid: Bid;
    treasure: Card[];
    hand: Hand;

    onSetFinalContract(points: number): any;
}


export function RevealTreasureView(props: IProps) {
    const [bidPoints, setBidPoints] = useState(props.winningBid.points);

    function handleBidChange(e: ChangeEvent<HTMLInputElement>) {
        setBidPoints(Number.parseInt(e.target.value));
    }

    function handleBidSubmit(e: React.FormEvent) {
        e.preventDefault();
        props.onSetFinalContract(bidPoints);
    }

    const cards = props.treasure.map((card: Card, i: number) => {
        return <span key={`treasure-${i}`}>
            {card.toString()}
        </span>;
    });

    let winningBid = props.winningBid.player === props.name ?
        <div>
            <h3>Current Bid</h3>
            <div>Your winning bid was {props.winningBid.points}</div>
        </div> : <div>Waiting for {props.winningBid.player} to finalize contract...</div>;

    let finalContractForm = null;
    if (props.winningBid.player === props.name) {
        finalContractForm = <div>
            <h3>Final Contract</h3>
            <form className='bidding-form' onSubmit={(e) => handleBidSubmit(e)}>
                <label htmlFor='bid'>Bid</label>
                <input type='number' min={props.winningBid.points} max={400} name='bid'
                    placeholder='enter your final contract here'
                    className='form-control'
                    onChange={(e) => handleBidChange(e) }
                    value={bidPoints} />
                <button type='submit' className='btn btn-primary'
                    disabled={(bidPoints < props.winningBid.points)}>Submit</button>
            </form>
        </div>;
    }


    return (<div className='reveal-treasure-view'>
        {winningBid}

        <h3>Treasure</h3>
        <div>
            { cards }
        </div>
        <h3>Your Cards</h3>
        <PlayerView
            index={props.playerIndex}
            cards={props.hand}
            phase={GamePhase.REVEAL_TREASURE} />

        {finalContractForm}
    </div>);
}

export default RevealTreasureView;