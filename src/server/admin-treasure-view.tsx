import React from 'react';
import {Card} from '../cards';
import { GamePhase } from '../game-mechanics';
import { IRoundInfo } from '../api';

interface IProps {
    treasureCards: Card[];
    roundInfo: IRoundInfo;
    /**
     * True to collapse initially
     */
    isCollapsed?: boolean;
}
interface IState {
    isCollapsed: boolean;
}

export class AdminTreasureView extends React.PureComponent<IProps, IState> {
    render() {
        const treasureCards = this.props.treasureCards.map((card: Card, i: number) => {
            return <span key={`treasure-${i}`}>
                { card.toString() }
            </span>
        });

        return (<div className="admin-treasure-container">
            <h3>
                <span>Treasure</span>
                {this.props.roundInfo.phase === GamePhase.BIDDING ?
                    <span>&nbsp;(hidden from players)</span> :
                    <span>&nbsp;(revealed to players)</span>}
            </h3>
            {treasureCards}
        </div>);
    }
}