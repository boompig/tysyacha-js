import React from "react";
import {AdminPlayerView, GameInfoView} from "./game-view";
import {IGameInfo, IRoundInfo} from "../api";
import {gamePhaseToString} from "../game-mechanics";

interface IRoundViewProps {
    gameId: string;
    playerNames: string[];
    gameInfo: IGameInfo;

    round: number;
    roundInfo: IRoundInfo;
}

interface IState {}

export class RoundView extends React.PureComponent<IRoundViewProps, IState> {
    render() {
        return (<div>
            <h1 className="title">Game { this.props.gameId } - Round { this.props.round }</h1>

            <AdminPlayerView
                playerNames={this.props.playerNames} />
            <GameInfoView
                gameInfo={this.props.gameInfo} />


            <div className="admin-round-container">
                <h2>Round { this.props.round }</h2>

                <div>Phase - { gamePhaseToString(this.props.roundInfo.phase) }</div>
            </div>
        </div>);
    }
}