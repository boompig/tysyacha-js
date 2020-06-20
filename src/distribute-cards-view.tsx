import React, {useState} from 'react';
import { Hand, Card } from './cards';
import { Bid, GamePhase } from './game-mechanics';
import { PlayerView } from './player-view';

interface IProps {
    gameId: string;
    // name of the player
    name: string;
    playerIndex: number;
    round: number;
    hand: Hand;
    treasure: Card[];
    finalContract: Bid;

    playerNames: string[];

    onDistribute(distributeMap: {[key: string]: Card}, keptCards: Card[]): any;
}

export function DistributeCardsView(props: IProps) {
    const [distCard0, setDistCard0] = useState(-1);
    const [distCard1, setDistCard1] = useState(-1);

    if(props.name !== props.finalContract.player) {
        return <div>
            <div>Contract is finalized at { props.finalContract.points }</div>
            <div>waiting for { props.finalContract.player } to distribute cards...</div>
        </div>;
    }

    if (props.treasure.length === 0) {
        return <div>Waiting for treasure cards...</div>;
    }

    // for this view, add the treasure to the current hand
    const cardsCopy = props.hand.cards.slice();
    for (let card of props.treasure) {
        cardsCopy.push(card);
    }
    const bigHand = new Hand(cardsCopy);
    // sort the cards from smallest value to largest value
    // this is *not* a stable sort
    bigHand.cards.sort((card1: Card, card2: Card) => {
        return card1.value - card2.value;
    });

    const cardOptions = [];
    for(let p = 0; p < 2; p++) {
        // filter out those set in the other group
        // map then filter to get the indexing right
        cardOptions[p] = bigHand.cards.map((card: Card, i: number) => {
            return <option value={i} key={i}>{ card.toString() }</option>;
        })
        .filter((item: any, i: number) => {
            if (p === 0 && i === distCard1) {
                return false;
            } else if (p === 1 && i === distCard0) {
                return false;
            }
            return true;
        });
        cardOptions[p].splice(0, 0,
            <option value={-1} key={-1}>-- select one --</option>
        );
    }

    const otherPlayers = props.playerNames.filter((name: string) => {
        return name !== props.name;
    });

    function onDistCardChange(e: React.ChangeEvent<HTMLSelectElement>, distIndex: number) {
        if (distIndex === 0) {
            setDistCard0(Number.parseInt(e.target.value));
        } else {
            setDistCard1(Number.parseInt(e.target.value));
        }
    }

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const distributeMap: {[key: string]: Card} = {};
        distributeMap[otherPlayers[0]] = bigHand.cards[distCard0];
        distributeMap[otherPlayers[1]] = bigHand.cards[distCard1];

        // compute which cards the player has kept
        const keptCards = bigHand.cards.filter((card: Card, i: number) => {
            return i !== distCard0 && i !== distCard1;
        });

        props.onDistribute(distributeMap, keptCards);
    }

    return <div className='distribute-cards-view'>
        <div>Must give away 2 cards</div>
        <h3>Your Hand (includes treasure)</h3>
        <PlayerView
            index={props.playerIndex}
            cards={bigHand}
            phase={GamePhase.DISTRIBUTE_CARDS} />

        <h3>Cards to Give Away</h3>
        <form onSubmit={(e) => onSubmit(e)}>
            <fieldset>
                <label htmlFor='distribute-card-0'>{ otherPlayers[0] }</label>
                <select className='form-control' name='distribute-card-0' value={distCard0}
                    onChange={(e) => onDistCardChange(e, 0)}>
                    { cardOptions[0] }
                </select>
            </fieldset>
            <fieldset>
                <label htmlFor='distribute-card-1'>{ otherPlayers[1] }</label>
                <select className='form-control' name='distribute-card-1' value={distCard1}
                    onChange={(e) => onDistCardChange(e, 1)}>
                    { cardOptions[1] }
                </select>
            </fieldset>
            <button type='submit' className='btn btn-primary form-control'>Submit</button>
        </form>
    </div>;
}

export default DistributeCardsView;
