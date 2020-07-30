import React, { PureComponent } from "react";
import { CardValue, Suit, valueToString } from "../cards";

interface ICardViewProps {
    suit: Suit;
    value: CardValue;

    /**
     * Additional class names to add to this card
     */
    classNames?: string[];

    /**
     * If an on-click handler is specified, the card-active class is added
     */
    onClick?: (e: React.SyntheticEvent) => any;
}

interface IState {}

export class CardView extends PureComponent<ICardViewProps, IState> {

    getSuitColor(suit: Suit): string {
        switch(suit) {
            case Suit.CLUBS:
            case Suit.SPADES:
                return "black";
            case Suit.DIAMONDS:
            case Suit.HEARTS:
                return "red";
        }
    }

    render(): JSX.Element {
        const suitColor = this.getSuitColor(this.props.suit);
        const classes = ["playing-card", "card-" + suitColor];
        if(this.props.onClick) {
            classes.push("card-active");
        }
        if(this.props.classNames) {
            classes.push(...this.props.classNames);
        }
        return (<div className={ classes.join(" ") }
            onClick={(e) => {return this.props.onClick ? this.props.onClick(e) : null} }>
            <div className="card-top-right-corner">
                <span className="value">{ valueToString(this.props.value) }</span>
                <span className="suit">{ this.props.suit }</span>
            </div>
            <div className="card-body">
            </div>
            <div className="card-bottom-left-corner">
                <span className="value">{ valueToString(this.props.value) }</span>
                <span className="suit">{ this.props.suit }</span>
            </div>
        </div>);
    }
}
