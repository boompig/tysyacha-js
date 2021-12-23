import React from "react";
import { ITrickCard, IPastTrick } from "../game-mechanics";
import {valueToString} from "../cards";

interface IState {}

interface IProps {
    pastTricks: IPastTrick[];
}

export class PastTricksView extends React.PureComponent<IProps, IState> {
    render() {
        const pastTricks = this.props.pastTricks.map((pastTrick: IPastTrick, i: number) => {
            const pts = pastTrick.trick.map((card: ITrickCard) => {
                return card.card.value;
            }).reduce((a, b) => {
                return a + b;
            }, 0);
            const cards = pastTrick.trick.map((card: ITrickCard, j: number) => {
                return <span key={`trick-${i}-card-${j}`}>
                    { j > 0 ?
                        <span>,&nbsp;</span> : null}
                    <span>{card.card.suit }</span>
                    <span>{valueToString(card.card.value) }</span>
                </span>;
            });
            return (<div className="past-trick" key={`past-trick-${i}`}>
                <div>
                    <span>trick { i + 1 }:&nbsp;</span>
                    <span>winner - {pastTrick.winner }&nbsp;</span>
                    <span>({ pts} points)</span>
                </div>
                <div>
                    { cards }
                </div>
            </div>);
        });

        return (<div>
            <h2>Past Tricks</h2>
            { pastTricks.length ? pastTricks :
                <div>no past tricks</div> }
        </div>);
    }
}