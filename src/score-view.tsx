/**
 * This view shows the *overall* scores of the players
 */

import React, {useState} from 'react';

interface IScoreViewProps {
    // map from user to score
    scores: {[key: string]: number};
    // order in which users should be displayed
    playerNames: string[];
    /**
     * True if should initially be displayed as collapsed
     */
    isCollapsed?: boolean;
}

export function ScoreView(props: IScoreViewProps) {
    const [isCollapsed, setCollapsed] = useState(props.isCollapsed ? true : false);

    function toggleCollapsed(e: React.SyntheticEvent) {
        e.preventDefault();
        setCollapsed(!isCollapsed);
    }

    const headerRow = props.playerNames.map((name: string) => {
        return <th key={`header-row-${name}`}>{ name }</th>;
    });
    const scoreRow = props.playerNames.map((name: string) => {
        return <td key={`score-row-${name}`}>{ props.scores[name] }</td>;
    })

    return (<div className='score-view'>
        <h2>
            <a href="#scoring-table" role="button" data-toggle="collapse" data-target="#scoring-table"
                aria-expanded={!isCollapsed} aria-controls="#scoring-table"
                onClick={(e) => toggleCollapsed(e)}>
                <span>Player Scores</span>
                { isCollapsed ? <span>&nbsp;(collapsed)</span> : null }
            </a>
        </h2>

        { isCollapsed ? null :
            <table className='table table-striped' id="scoring-table">
                <thead>
                    <tr>
                        { headerRow }
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        { scoreRow }
                    </tr>
                </tbody>
        </table> }
    </div>)
}

export default ScoreView;