import React, {useState} from 'react';
import { Card, Suit, suitToString, Hand, CardValue } from './cards';
import {GamePhase} from './game-mechanics';

interface IPlayerProps {
    index: number;
    cards: Hand;
    phase: GamePhase;
}

/**
 * Display the player's cards
 * Organize them by suit
 */
export function PlayerView(props: IPlayerProps) {
    let elems = [];
    let pts = props.cards.getPoints();

    // display cards by suit
    for(let [suit, cards] of Object.entries(props.cards.cardsBySuit)) {
        // let cardElems = (cards as Card[]).map((card: Card) => {
        //     return <span key={card.toString()}>{card.valueToString() }</span>;
        // });
        const cardElems = (cards as Card[]).map((card: Card) => {
            return card.valueToString();
        }).join(", ");

        elems.push(<div key={`suit-${suit}-player-${props.index}-cards`}>
            <span className="player-cards-suit">{suitToString(suit as Suit)}</span>
            {cardElems}
        </div>);
    }

    // does the player have a marriage?
    const marriages = props.cards.marriages;
    const potentialMarriages = [];

    for(let [suit, cards] of Object.entries(props.cards.cardsBySuit)) {
        if(marriages.includes(suit as Suit)) {
            continue;
        }
        const l = (cards as Card[]).map((card: Card) => card.valueToString());
        if(l.includes("Q") || l.includes("K")) {
            potentialMarriages.push(suit);
        }
    }

    return (<div className="player">
        {/* <h3>Player {props.index + 1}</h3> */}
        { elems }
        <div>Points: {pts}</div>
        <div className="marriages">
            <span>Marriages: </span>
            { marriages.length > 0 ?
                marriages.join(", ") : "none" }
        </div>
        { props.phase === GamePhase.BIDDING ?
            <div className="potential-marriages">
                <span>Potential Marriages: </span>
                { potentialMarriages.length > 0 ?
                    potentialMarriages.join(", ") : "none" }
            </div> : null}
    </div>);
}