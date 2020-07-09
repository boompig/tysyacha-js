import React from "react";
import { IGameInfo } from "../api";

interface IPlayerProps {
    playerNames: string[];
}

export class AdminPlayerView extends React.PureComponent<IPlayerProps, {}> {
    render() {
        const players = this.props.playerNames.map((player: string, i: number) => {
            return <li key={`player=${i}`}>{ player }</li>
        });
        return (<div className="admin-player-container">
            <h2>Players</h2>

            {this.props.playerNames.length > 0 ?
                <ol>
                    {players}
                </ol> :
                <div>no players registered</div>}

        </div>);
    }
}

interface IGameInfoProps {
    gameInfo: IGameInfo;
}

export class GameInfoView extends React.PureComponent<IGameInfoProps, {}> {
    render() {
        return (<div className="admin-game-info-container">
            <h2>Game Info</h2>

            <div>Round - {this.props.gameInfo.round} </div>
            <div>Creator - {this.props.gameInfo.creator} </div>
            <div>Has Started? - {this.props.gameInfo.hasStarted ? 'true' : 'false'} </div>
        </div>);
    }
}

interface IProps {
    gameId: string;
    playerNames: string[];
    gameInfo: IGameInfo;
    rounds: number[];
    onSelectRound: (round: number) => any;
}

interface IState {}

export class GameView extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.handleSelectRound = this.handleSelectRound.bind(this);
    }

    handleSelectRound(e: React.SyntheticEvent, round: number) {
        e.preventDefault();
        this.props.onSelectRound(round);
    }


    render() {
        const rounds = this.props.rounds.map((round: number) => {
            return <li key={`round-${round}`}>
                <a href={`/game/${this.props.gameId}/round/${round}`}
                    onClick={(e) => this.handleSelectRound(e, round)}>Round {round}</a>
            </li>;
        });

        return (<div>
            <h1 className="title">Game { this.props.gameId }</h1>

            <AdminPlayerView
                playerNames={this.props.playerNames} />

            <GameInfoView
                gameInfo={this.props.gameInfo} />

            <div className="admin-rounds-container">
                { this.props.rounds.length > 0 ?
                    <div>
                        <h2>Rounds</h2>
                        <ol>
                            { rounds }
                        </ol>
                    </div>:
                    <div>no rounds</div> }
            </div>
        </div>);
    }
}