import React from "react";

interface INoneProps {
    /**
     * game IDs
     */
    games: string[];

    onSelectGame: (gameId: string) => any;
}

interface INoneState {}

export class NoneSelectedView extends React.PureComponent<INoneProps, INoneState> {
    constructor(props: INoneProps) {
        super(props);

        this.handleSelectGame = this.handleSelectGame.bind(this);
    }

    handleSelectGame(e: React.SyntheticEvent, gameId: string) {
        e.preventDefault();
        this.props.onSelectGame(gameId);
    }

    render() {
        const gameLinks = this.props.games.map((gameId) => {
            return <li key={`game-link-${gameId}`}>
                <a href={`/server/${gameId}`}
                    onClick={(e) => this.handleSelectGame(e, gameId)}>{ gameId }</a>
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
