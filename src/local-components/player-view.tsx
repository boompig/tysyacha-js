import React, { PureComponent, FC } from "react";
import { Card, getSuits, Hand, Suit } from "../cards";
import { ITrickCard, GamePhase } from "../game-mechanics";
import { CardView } from "./card-view";

interface IPlayerViewProps {
    /**
     * name and index of this player
     */
    name: string;
    playerIndex: number;

    /**
     * cards for this player
     */
    hand: Hand;

    phase: GamePhase;

    /**
     * true iff this is the dealing player
     */
    isDealer: boolean;

    /**
     * used in playing phase
     */
    tricksTaken: ITrickCard[][];
    numTricksTaken: number;
    isContractPlayer: boolean;

    /**
     * true iff it is this player's turn
     */
    isActivePlayer: boolean;

    /**
     * True iff we should show this player's cards
     */
    showCards: boolean;

    /**
     * What to do if the user clicks a card
     */
    onCardSelect?: (playerIndex: number, cardIndex: number) => void;
}

interface IState {}

/**
 * Display the cards as sorted by suit
 */
export const PlayerView : FC<IPlayerViewProps> = (props: IPlayerViewProps) => {

    function onSelectCard(cardIndex: number): void {
        if(props.isActivePlayer && props.onCardSelect) {
            props.onCardSelect(props.playerIndex, cardIndex);
        }
    }

    const cardViews = [] as JSX.Element[];
    getSuits().forEach((suit: Suit) => {
        props.hand.cardsBySuit[suit].forEach((card: Card) => {
            const i = props.hand.cards.indexOf(card);
            let onClick = undefined;
            if(props.isActivePlayer && props.onCardSelect) {
                onClick = (e: React.SyntheticEvent) => {return onSelectCard(i)};
            }
            const elem = <CardView suit={card.suit}  key={`player-card-${i}`}
                value={card.value}
                showBack={!props.showCards}
                onClick={onClick} />;
            cardViews.push(elem);
        });
    });

    const addClass = props.isActivePlayer ? "active-player" : "";

    return (<div className={ "player " + addClass }>
        <div className="player-name">
            { props.name }
            { props.isDealer ? " (D)" : "" }
            { props.isContractPlayer ? " (C)" : "" }
            { props.phase !== GamePhase.BIDDING && props.phase !== GamePhase.REVEAL_TREASURE ?
                <span>&nbsp;({ props.numTricksTaken } tricks taken)</span> :
                null }
        </div>
        <div className="player-hand">
            { cardViews }
        </div>
    </div>);
}
