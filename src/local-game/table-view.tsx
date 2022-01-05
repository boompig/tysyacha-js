import React, { FC, useState, useEffect } from "react";

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
}

export const TableView : FC<ITableViewProps> = (props: ITableViewProps) => {
    const playerOrder = props.playerNames.map((name: string, i: number) => {
        const classes = ['player-name'];
        if (i === props.localPlayerIndex) {
            classes.push('local-player');
        }
        if (i === props.activePlayerIndex) {
            classes.push('active-player');
        }
        return <div className={classes.join(' ')} key={`player-${i}`}>
            <span>{name}</span>
            {props.localPlayerIndex !== i ?
                <span>&nbsp;(AI)</span> :
                null
            }
            {props.localPlayerIndex === i ?
                <span>&nbsp;(you)</span> :
                null}
        </div>
    });

    return <div className='table-view'>
        { playerOrder }
    </div>
};
