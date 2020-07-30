import React from 'react';
import {IGameInfo} from '../api';

interface INoneProps {
    /**
     * map of game IDs to IGameInfo
     */
    games: {[key: string]: IGameInfo};

    onSelectGame: (gameId: string) => any;
}

interface INoneState {}

export class NoneSelectedView extends React.PureComponent<INoneProps, INoneState> {
    constructor(props: INoneProps) {
        super(props);

        this.handleSelectGame = this.handleSelectGame.bind(this);
    }

    handleSelectGame(e: React.SyntheticEvent, gameId: string) {
        // e.preventDefault();
        // this.props.onSelectGame(gameId);
    }

    render() {
        const gameLinks = Object.entries(this.props.games).map(([gameId, gameInfo]: [string, IGameInfo]) => {
            const hasStarted = gameInfo.hasStarted;
            return <li key={`game-link-${gameId}`}>
                <a href={`/server?game=${gameId}`}
                    onClick={(e) => this.handleSelectGame(e, gameId)}>
                    <span>{ hasStarted ? gameId : `${gameId} (not started - waiting for players to join)`}</span>
                </a>
            </li>
        });

        return (<div className="games-container">
            <h1 className="title">Tysyacha Server</h1>

            <h2>Games</h2>

            {gameLinks.length > 0 ?
                <ol>
                    {gameLinks}
                </ol> :
                <div>no games</div>}
        </div>);
    }
}
