import React, {useState} from "react";
import { Card, Suit, suitToString, Hand, CardValue } from './cards';
import {getBidForHand} from "./bid-estimator";

export type ICards = {[key: number]: Hand};

interface IProps {
    playerCards: ICards;
    treasureCards: Card[];
}

enum GamePhase {
    BIDDING = 1,
    REVEAL_TREASURE = 2,
    DISTRIBUTE_CARDS = 3,
    PLAYING = 4,
}

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
        <h3>Player {props.index + 1}</h3>
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

interface ITreasureProps {
    cards: Card[];
    phase: GamePhase;
}

export function TreasureView(props: ITreasureProps) {
    const cards = props.cards.map((card: Card) => {
        return <span key={`treasure-${card.toString()}`}>
            {card.toString()}
        </span>;
    });
    if(props.phase === GamePhase.DISTRIBUTE_CARDS || props.phase === GamePhase.PLAYING) {
        // don't show anything
        return null;
    }
    return (<div>
        <h3>Treasure</h3>
        <div>
            { props.phase === GamePhase.BIDDING ? "???" : cards }
        </div>
    </div>);
}

/**
 * A bid of 0 -> pass
 */
type Bid = {
    points: number;
    player: number;
}

interface IBidProps {
    bids: Bid[];
}

export function BidView(props: IBidProps) {
    if(props.bids.length === 0) {
        return <div>no bids</div>;
    }
    let bids = props.bids.map((bid: Bid, i: number) => {
        return (<div key={`bid-${i}`}>
            Player {bid.player + 1} bid {bid.points === 0 ? "pass" : bid.points}
        </div>);
    });
    return (<div>
        {bids}
    </div>);
}

export function GameView(props: IProps) {
    const [phase, setPhase] = useState(GamePhase.BIDDING);
    const [currentPlayer, setCurrentPlayer] = useState(0);
    const [isGameOver, setGameOver] = useState(false);

    /**
     * These are only relevant during the bidding phase
     */
    const [bids, setBids] = useState([] as Bid[]);
    const [passedPlayers, setPassedPlayers] = useState([] as number[]);

    /**
     * These are only relevant during the playing phase
     */
    const [trump, setTrump] = useState(null);
    const [currentTrick, setCurrentTrick] = useState([]);
    const [discard, setDiscard] = useState({});
    const [constractPlayer, setContractPlayer] = useState(-1);

    /**
     * Evaluate bid for the current player
     */
    async function evalBidAI() {
        let currentBid;
        let isPass = false;
        if(passedPlayers.includes(currentPlayer)) {
            // must pass
            currentBid = {
                points: 0,
                player: currentPlayer
            };
            isPass = true;
        } else {
            let bidPoints = getBidForHand(props.playerCards[currentPlayer]);

            const highestBidPoints = bids.length === 0 ? 0 : Math.max(...bids.map((bid) => {
                return bid.points;
            }));

            // there exists a previous bid
            if(bidPoints > 0 && highestBidPoints >= bidPoints) {
                bidPoints = 0;
            }

            currentBid = {
                points: bidPoints,
                player: currentPlayer
            };

            isPass = bidPoints === 0;
        }

        setBids([...bids, currentBid]);
        if(isPass) {
            await setPassedPlayers([...passedPlayers, currentPlayer]);
        }

        let nextPlayer = -1;
        for(let i = 0; i < 3; i++) {
            let p = (currentPlayer + i + 1) % 3;
            if(!passedPlayers.includes(p)) {
                nextPlayer = p;
                break;
            }
        }

        if(nextPlayer === -1) {
            console.debug("all players have passed. game over - redeal.");
            setGameOver(true);
        } else if(nextPlayer === currentPlayer) {
            console.debug(`all other players have passed. contract player is ${currentPlayer}`);
            setPhase(GamePhase.REVEAL_TREASURE);
            setContractPlayer(currentPlayer);
        } else {
            console.debug(`next player to bid is ${nextPlayer}`);
            setCurrentPlayer(nextPlayer);
        }
    }

    function playRandomTurn() {
        // do nothing
    }

    // display players
    let players = [];
    for(let i = 0; i < 3; i++) {
        players.push(<PlayerView
            key={`player-${i}`}
            index={i}
            phase={phase}
            cards={props.playerCards[i]} />);
    }

    return (<div>
        <div className="player-container">{ players }</div>
        <TreasureView
            cards={props.treasureCards}
            phase={phase} />
        <h3>{ phase === GamePhase.BIDDING ? "bidding phase": "playing phase" }</h3>
        <BidView bids={bids} />
        <div className="game-controls">
            {phase === GamePhase.BIDDING ?
                <button type="button" className="btn btn-primary"
                    onClick={ () => evalBidAI() }>Evaluate Bid for Player {currentPlayer + 1}</button>
                :
                <button type="button" className="btn btn-primary"
                    onClick={() => playRandomTurn() }>Play Random Turn</button> }
        </div>
    </div>);
}