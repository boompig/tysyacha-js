import React, { FC } from 'react';
import './table-view.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

interface IAIPlayerViewProps {
    name: string;
    index: number;
    isActive: boolean;
    /**
     * Any other classes you want to add to this player
     */
    extraClasses: string[];

    flavorText?: string;
}

/**
 * Show an AI opponent
 */
const AIPlayerView : FC<IAIPlayerViewProps> = (props: IAIPlayerViewProps) => {
    const classNames = ['opponent', 'ai-opponent'];
    if (props.isActive) {
        classNames.push('active-player');
    }
    classNames.push(...props.extraClasses);

    return <div className={ classNames.join(' ') }>
        <div className="player-image"><FontAwesomeIcon icon={faUser} /></div>
        <div className="player-name">{ props.name }&nbsp; (AI)</div>
        {
            props.flavorText ?
            <div className="player-text">{ props.flavorText }</div> :
            null
        }
    </div>;
};

interface ITableViewProps {
    playerNames: string[];
    /**
     * Index into playerNames
     */
    localPlayerIndex: number;

    /**
     * Index into playerNames
     */
    activePlayerIndex: number;

    /**
     * Optional - some text for each player (map from index to the text)
     */
    playerText?: {[key: number]: string};
}

/**
 * Show a version of a card table with the players' positions at it
 * NOTE: This component assumes the two other players are AIs
 */
export const TableView : FC<ITableViewProps> = (props: ITableViewProps) => {
    const leftPlayerIndex = props.localPlayerIndex + 1 % props.playerNames.length;
    const rightPlayerIndex = props.localPlayerIndex + 2 % props.playerNames.length;

    const leftPlayer = <AIPlayerView
        name={props.playerNames[leftPlayerIndex]}
        index={leftPlayerIndex}
        isActive={leftPlayerIndex === props.activePlayerIndex }
        extraClasses={['left-opponent']} />;

    const rightPlayer = <AIPlayerView
        name={props.playerNames[rightPlayerIndex]}
        index={rightPlayerIndex}
        isActive={rightPlayerIndex === props.activePlayerIndex }
        extraClasses={['right-opponent']} />;

    // const playerOrder = props.playerNames.map((name: string, i: number) => {
    //     const classes = ['player-name'];
    //     if (i === props.localPlayerIndex) {
    //         classes.push('local-player');
    //     }
    //     if (i === props.activePlayerIndex) {
    //         classes.push('active-player');
    //     }
    //     return <div className={classes.join(' ')} key={`player-${i}`}>
    //         <span>{name}</span>
    //         {props.localPlayerIndex !== i ?
    //             <span>&nbsp;(AI)</span> :
    //             null
    //         }
    //         {props.localPlayerIndex === i ?
    //             <span>&nbsp;(you)</span> :
    //             null}
    //     </div>
    // });

    return <div className='table-view'>
        { leftPlayer }
        { rightPlayer }
        {/* { playerOrder } */}
    </div>
};
