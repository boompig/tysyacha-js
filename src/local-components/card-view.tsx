import React, { FC } from "react";
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

    /**
     * Whether to show the back of the card instead of the front
     * False by default
     */
    showBack?: boolean;

    /**
     * If true, this card has been selected
     */
    isSelected?: boolean;
}

export const CardView : FC<ICardViewProps> = (props: ICardViewProps) => {

    function getSuitColor(suit: Suit): string {
        switch(suit) {
            case Suit.CLUBS:
            case Suit.SPADES:
                return "black";
            case Suit.DIAMONDS:
            case Suit.HEARTS:
                return "red";
        }
    }

    const suitColor = getSuitColor(props.suit);
    const classes = ["playing-card", "card-" + suitColor];
    if(props.onClick) {
        classes.push("card-active");
    }
    if(props.classNames) {
        classes.push(...props.classNames);
    }
    if (props.isSelected) {
        classes.push("card-selected");
    }
    if(props.showBack) {
        classes.push("card-back");
    }

    if (props.showBack) {
        // return an empty div so user cannot highlight to see the suit/value
        return <div className={ classes.join(" ")}></div>
    }

    return (<div className={ classes.join(" ") }
        onClick={(e) => {return props.onClick ? props.onClick(e) : null} }>
        <div className="card-top-right-corner">
            <span className="value">{ valueToString(props.value) }</span>
            <span className="suit">{ props.suit }</span>
        </div>
        <div className="card-body">
        </div>
        <div className="card-bottom-left-corner">
            <span className="value">{ valueToString(props.value) }</span>
            <span className="suit">{ props.suit }</span>
        </div>
    </div>);
}
