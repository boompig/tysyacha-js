import React from "react";
import { IGameInfo } from "../api";
import ScoreView from "../score-view";

interface IPlayerProps {
    playerNames: string[];
    /**
     * Whether to initially render the component as collapsed or not
     */
    isCollapsed?: boolean;
}

interface IPlayerState {
    isCollapsed: boolean;
}

export class AdminPlayerView extends React.PureComponent<IPlayerProps, IPlayerState> {
    constructor(props: IPlayerProps) {
        super(props);
        const isCollapsed = typeof props.isCollapsed === "undefined" ? false : props.isCollapsed;
        this.state = {
            isCollapsed: isCollapsed,
        };
        this.toggleCollapse = this.toggleCollapse.bind(this);
    }

    toggleCollapse(e: React.SyntheticEvent) {
        e.preventDefault();
        this.setState({
            isCollapsed: !this.state.isCollapsed,
        });
    }

    render() {
        const players = this.props.playerNames.map((player: string, i: number) => {
            return <li key={`player=${i}`}>{ player }</li>
        });
        return (<div className="admin-player-container">
            <h2>
                <a href="#player-container-collapse" role="button" data-toggle="collapse" data-target="#player-container-collapse"
                    aria-expanded={ !this.state.isCollapsed } aria-controls="player-container-collapse"
                    onClick={(e) => this.toggleCollapse(e)}>
                    <span>Players</span>
                    { this.state.isCollapsed ? <span>&nbsp;(collapsed)</span> : null }
                </a>
            </h2>

            { this.state.isCollapsed ?
                null :
                <div id="player-container-collapse">
                    {this.props.playerNames.length > 0 ?
                        <ol>
                            {players}
                        </ol> :
                        <div>no players registered</div>}
                </div> }
        </div>);
    }
}

interface IGameInfoProps {
    gameInfo: IGameInfo;
    /**
     * Whether to initially render the component as collapsed or not
     */
    isCollapsed?: boolean;
}

interface IGameInfoState {
    isCollapsed: boolean;
}

export class GameInfoView extends React.PureComponent<IGameInfoProps, IGameInfoState> {
    constructor(props: IGameInfoProps) {
        super(props);

        const isCollapsed = typeof props.isCollapsed === "undefined" ? false : props.isCollapsed;
        this.state = {
            isCollapsed: isCollapsed,
        };

        this.toggleCollapse = this.toggleCollapse.bind(this);
    }

    toggleCollapse(e: React.SyntheticEvent) {
        e.preventDefault();
        this.setState({
            isCollapsed: !(this.state.isCollapsed),
        });
    }

    render() {
        return (<div className="admin-game-info-container">
            <div id="game-info-header">
                <h2>
                    <a href="#game-info-collapse" role="button" data-toggle="collapse" data-target="#game-info-collapse"
                        aria-expanded={ this.state.isCollapsed } aria-controls="game-info-collapse"
                        onClick={(e) => this.toggleCollapse(e)}>
                            <span>Game Info</span>
                            { this.state.isCollapsed ? <span>&nbsp;(collapsed)</span> : null }
                    </a>
                </h2>
            </div>

            { this.state.isCollapsed ?
                null :
                <div id="game-info-collapse" aria-labelledby="game-info-header">
                    <div>Round - {this.props.gameInfo.round} </div>
                    <div>Game Creator - {this.props.gameInfo.creator} </div>
                    <div>Has Started? - {this.props.gameInfo.hasStarted ? 'yes' : 'no'} </div>
                </div> }
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
        // e.preventDefault();
        // this.props.onSelectRound(round);
    }

    render() {
        const rounds = this.props.rounds.map((round: number) => {
            const isActive = round === this.props.gameInfo.round;
            const classes = ['game-round'];
            if (isActive) {
                classes.push('active');
            }
            return <li key={`round-${round}`}>
                <a href={`/server?game=${this.props.gameId}&round=${round}`}
                    className={ classes.join(' ') }
                    onClick={(e) => this.handleSelectRound(e, round)}>
                        <span>Round {round}</span>
                        { isActive ? <span>&nbsp;(active)</span> : null }
                </a>
            </li>;
        });

        return (<div>
            <h1 className="title">Game { this.props.gameId }</h1>

            {/* <AdminPlayerView
                playerNames={this.props.playerNames} /> */}

            <ScoreView
                scores={this.props.gameInfo.scores}
                playerNames={this.props.playerNames}
                round={this.props.gameInfo.round} />

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