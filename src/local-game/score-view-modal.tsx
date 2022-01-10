/**
 * This view shows the *overall* scores of the players
 */

import React, { useState, FC } from 'react';

interface IScoreViewProps {
    // map from user to score
    scores: {[key: string]: number[]};

    // order in which users should be displayed
    playerNames: string[];

    /**
     * The current round
     */
    round: number;

    /**
     * The currently selected round
     */
    selectedRound?: number;

    /**
     * Handler for when modal is dismissed
     */
    onDismiss(): void;
}

/**
 * Shows the scores for all players across all rounds of the game
 */
const ScoreView : FC<IScoreViewProps> = (props: IScoreViewProps) => {
    const headerRow = props.playerNames.map((name: string) => {
        return <th key={`header-row-${name}`}>{ name }</th>;
    });
    const rounds: number[] = [];
    for(let round = 0; round < props.round; round++) {
        rounds.push(round);
    }

    const scoreRows = rounds.map((round: number) => {
        const scoreRow = props.playerNames.map((name: string) => {
            return <td key={`score-row-${name}-round-${round}`}>{ props.scores[name][round] || 0 }</td>;
        });
        const classes : string[] = [];
        if (props.selectedRound === round) {
            classes.push('table-warning');
        }
        return (<tr key={`score-row-${round}`} className={classes.join(' ')}>
            {scoreRow}
        </tr>);
    });

    const style = {
        display: 'block',
    };

    return (<div className="score-view-modal modal fade show" id="score-view-modal" aria-modal="true"
        tabIndex={-1} style={style}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title">Player Scores</h5>
                    <button type="button" className="close" data-dismiss="modal"
                        aria-label="Close" onClick={ (e) => props.onDismiss() }>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="modal-body">
                    <table className="table table-striped table-sm" id="scoring-table">
                        <thead>
                            <tr>
                                {headerRow}
                            </tr>
                        </thead>
                        <tbody>
                            {scoreRows}
                        </tbody>
                    </table>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" data-dismiss="modal"
                        onClick={ (e) => props.onDismiss() }>Close</button>
                </div>
            </div>
        </div>

        {/* <h2>
            <span>Player Scores</span>
        </h2>
            */}
    </div>)
};

export {
    ScoreView,
};
export default ScoreView;