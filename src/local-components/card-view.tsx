import React, { PureComponent } from "react";
import { CardValue, Suit, valueToString } from "../cards";

interface ICardViewProps {
    suit: Suit;
    value: CardValue;
    isSelected?: boolean;
    onClick?: (e: React.SyntheticEvent) => any;
}


export class CardView extends PureComponent<ICardViewProps, {}> {

    getSuitColor(suit: Suit) {
        switch(suit) {
            case Suit.CLUBS:
            case Suit.SPADES:
                return "black";
            case Suit.DIAMONDS:
            case Suit.HEARTS:
                return "red";
        }
    }

    render() {
        const suitColor = this.getSuitColor(this.props.suit);
        const classes = ["playing-card", "card-" + suitColor];
        if(this.props.onClick) {
            classes.push("card-active");
        }
        if(this.props.isSelected) {
            classes.push("card-selected");
        }
        return (<div className={ classes.join(" ") }
            onClick={(e) => this.props.onClick ? this.props.onClick(e) : null }>
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
