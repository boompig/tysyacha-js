import React, { PureComponent } from "react";
import { Card, getSuits, Hand, Suit } from "../cards";
import { ITrickCard } from "../game-mechanics";
import { CardView } from "./card-view";

interface IPlayerViewProps {
    name: string;
    playerIndex: number;
    hand: Hand;
    tricksTaken: ITrickCard[][];
    numTricksTaken: number;
    isDealer: boolean;
    isBidder: boolean;
    isActivePlayer: boolean;
    onCardSelect: (playerIndex: number, cardIndex: number) => void;
}

/**
 * Display the cards as sorted by suit
 */
export class PlayerView extends PureComponent<IPlayerViewProps, {}> {
    constructor(props: IPlayerViewProps) {
        super(props);
        this.onSelectCard = this.onSelectCard.bind(this)
    }

    onSelectCard(cardIndex: number) {
        if(this.props.isActivePlayer) {
            this.props.onCardSelect(this.props.playerIndex, cardIndex);
        }
    }

    render() {
        const cardViews = [] as JSX.Element[];
        getSuits().forEach((suit: Suit) => {
            this.props.hand.cardsBySuit[suit].forEach((card: Card) => {
                const i = this.props.hand.cards.indexOf(card);
                let onClick = undefined;
                if(this.props.isActivePlayer) {
                    onClick = (e: React.SyntheticEvent) => this.onSelectCard(i);
                }
                const elem = <CardView suit={card.suit}  key={`player-card-${i}`}
                    value={card.value}
                    onClick={onClick} />;
                cardViews.push(elem);
            });
        });

        const addClass = this.props.isActivePlayer ? "active-player" : "";

        return (<div className={ "player " + addClass }>
            <div className="player-name">
                { this.props.name }
                { this.props.isDealer ? " (D)" : "" }
                { this.props.isBidder ? " (B)" : "" }
                <span>&nbsp;({ this.props.numTricksTaken } tricks taken)</span>
            </div>
            <div className="player-hand">
                { cardViews }
            </div>
        </div>);
    }
}
