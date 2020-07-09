import React from "react";
import { API, IGameInfo, IRoundInfo } from "../api";
import { NoneSelectedView } from "./none-selected-view";
import { GameView } from "./game-view";
import { RoundView } from "./round-view";

interface IProps {}

interface IState {
    /**
     * Selected game
     */
    gameId: string | null;
    /**
     * Selected round
     */
    round: number;

    /**
     * Fetched from server
     */
    games: string[];

    api: API;

    /**
     * Fetched from the server
     */
    playerNames: string[];

    /**
     * Fetched from the server
     */
    rounds: number[];

    gameInfo: IGameInfo | null;

    errorMsg: string | null;

    /**
     * Fetched from the server
     */
    roundInfo: {[key: number]: IRoundInfo};
}

export class ServerView extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            // none selected
            gameId: null,

            // none selected
            round: -1,

            games: [],

            api: new API(),

            playerNames: [],
            rounds: [],
            gameInfo: null,
            roundInfo: {},

            errorMsg: null,
        }
        this.onSelectGame = this.onSelectGame.bind(this);
        this.onSelectRound = this.onSelectRound.bind(this);
    }

    async onSelectGame(gameId: string) {
        const r = await this.state.api.adminGetGameInfo(gameId);

        this.setState({
            gameId,
            playerNames: r.playerNames,
            rounds: r.rounds,
            gameInfo: r.gameInfo,
            roundInfo: r.roundInfo,
        });
    }

    async onSelectRound(round: number) {
        this.setState({
            round: round,
        });
    }

    componentDidMount() {
        this.state.api.adminGetGames().then((r) => {
            this.setState({
                games: r.games,
            });
        }).catch((err) => {
            console.error(err);
            this.setState({
                errorMsg: err,
            });
        });
    }

    render() {
        let view = null as null | JSX.Element;
        if (this.state.gameId) {
            if (this.state.round === -1) {
                if (!this.state.gameInfo) {
                    throw new Error("game info not set");
                }
                view = <GameView
                    gameId={this.state.gameId}
                    playerNames={this.state.playerNames}
                    gameInfo={this.state.gameInfo}
                    rounds={this.state.rounds}
                    onSelectRound={this.onSelectRound} />;
            } else {
                if (!this.state.gameInfo) {
                    throw new Error("game info not set");
                }
                view = <RoundView
                    gameId={this.state.gameId}
                    playerNames={this.state.playerNames}
                    gameInfo={this.state.gameInfo}
                    round={this.state.round}
                    roundInfo={this.state.roundInfo[this.state.round]} />;
            }
        }  else {
            view = <NoneSelectedView
                games={this.state.games}
                onSelectGame={this.onSelectGame} />
        }

        return <main className="container">
            {view}
        </main>
    }
}