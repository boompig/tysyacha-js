import React from 'react';

interface IScoreViewProps {
    // map from user to score
    scores: {[key: string]: number};
    // order in which users should be displayed
    playerNames: string[];
}

export function ScoreView(props: IScoreViewProps) {
    const headerRow = props.playerNames.map((name: string) => {
        return <th key={`header-row-${name}`}>{ name }</th>;
    });
    const scoreRow = props.playerNames.map((name: string) => {
        return <td key={`score-row-${name}`}>{ props.scores[name] }</td>;
    })

    return (<div className='score-view'>
        <h2>Scores</h2>
        <table className='table table-striped'>
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
        </table>
    </div>)
}

export default ScoreView;