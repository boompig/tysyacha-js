/**
 * This view shows the *overall* scores of the players
 */

import React, {useState} from 'react';

interface IScoreViewProps {
    // map from user to score
    scores: {[key: string]: number[]};
    // order in which users should be displayed
    playerNames: string[];
    /**
     * True if should initially be displayed as collapsed
     */
    isCollapsed?: boolean;

    /**
     * The current round
     */
    round: number;

    /**
     * The currently selected round
     */
    selectedRound?: number;
}

export function ScoreView(props: IScoreViewProps): JSX.Element {
    const [isCollapsed, setCollapsed] = useState(props.isCollapsed ? true : false);

    function toggleCollapsed(e: React.SyntheticEvent) {
        e.preventDefault();
        setCollapsed(!isCollapsed);
    }

    const headerRow = props.playerNames.map((name: string) => {
        return <th key={`header-row-${name}`}>{ name }</th>;
    });
    const rounds: number[] = [];
    for(let round = 0; round < props.round; round++) {
        rounds.push(round);
    }

    const scoreRows = rounds.map((round: number) => {
        const scoreRow = props.playerNames.map((name: string) => {
            return <td key={`score-row-${name}-round-${round}`}>{ props.scores[name][round] }</td>;
        });
        const classes : string[] = [];
        if (props.selectedRound === round) {
            classes.push('table-warning');
        }
        return (<tr key={`score-row-${round}`} className={classes.join(' ')}>
            {scoreRow}
        </tr>);
    });

    return (<div className='score-view'>
        <h2>
            <a href="#scoring-table" role="button" data-toggle="collapse" data-target="#scoring-table"
                aria-expanded={!isCollapsed} aria-controls="#scoring-table"
                onClick={(e) => {return toggleCollapsed(e)}}>
                <span>Player Scores</span>
                { isCollapsed ? <span>&nbsp;(collapsed)</span> : null }
            </a>
        </h2>

        { isCollapsed ? null :
            <table className='table table-striped table-sm' id="scoring-table">
                <thead>
                    <tr>
                        { headerRow }
                    </tr>
                </thead>
                <tbody>
                    { scoreRows }
                </tbody>
            </table> }
    </div>)
}

export default ScoreView;