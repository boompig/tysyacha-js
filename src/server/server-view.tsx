import React from "react";
import { API, IGameInfo, IRoundInfo, IPlayingPhaseInfo } from "../api";
import { IDeal, Bid } from "../game-mechanics";
import { GameView } from "./game-view";
import { NoneSelectedView } from "./none-selected-view";
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
    games: {[key: string]: IGameInfo};

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
    roundInfo: { [key: number]: IRoundInfo };
    cardsPerRound: { [key: number]: IDeal };

    /**
     * Fetched from the server
     */
    bidHistory: Bid[];
    /**
     * Fetched from the server
     */
    playingPhaseInfo: IPlayingPhaseInfo | null;
}

export class ServerView extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            // none selected
            gameId: null,

            // none selected
            round: -1,

            games: {},

            api: new API(),

            playerNames: [],
            rounds: [],
            gameInfo: null,
            roundInfo: {},
            cardsPerRound: {},
            bidHistory: [],
            playingPhaseInfo: null,

            errorMsg: null,
        }

        this.loadGames = this.loadGames.bind(this);
        this.loadGameInfo = this.loadGameInfo.bind(this);
        this.loadRoundBids = this.loadRoundBids.bind(this);
        this.loadData = this.loadData.bind(this);
        this.onSelectGame = this.onSelectGame.bind(this);
        this.onSelectRound = this.onSelectRound.bind(this);
    }

    async loadGameInfo(gameId: string) {
        console.log(`Getting game info for game ${gameId}...`);
        const r = await this.state.api.adminGetGameInfo(gameId);
        console.log(r);
        this.setState({
            gameId,
            playerNames: r.playerNames,
            rounds: r.rounds,
            gameInfo: r.gameInfo,
            roundInfo: r.roundInfo,
            cardsPerRound: r.cardsPerRound,
        });
    }

    async loadRoundBids(gameId: string, round: number) {
        const r = await this.state.api.getBids(gameId, round);
        console.log("Loaded bid history:");
        console.log(r);
        this.setState({
            bidHistory: r.bidHistory,
        });
    }

    async loadPlayingPhaseInfo(gameId: string, round: number) {
        console.log(`Loading playing phase info for game ${gameId} and round ${round}`);
        const r = await this.state.api.getPlayingPhaseInfo(gameId, round);
        console.log(r);
        this.setState({
            playingPhaseInfo: r,
        });
    }

    async onSelectGame(gameId: string) {
        return this.loadGameInfo(gameId);
    }

    async onSelectRound(round: number) {
        this.setState({
            round: round,
        });
    }

    async loadGames() {
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

    async loadData() {
        console.log("loading all data...");
        this.loadGames();

        // read information from the url
        const url = new URL(window.location.href);
        let gameId = this.state.gameId;
        if (url.searchParams.has('game')) {
            gameId = url.searchParams.get('game');
        }
        if (gameId) {
            this.loadGameInfo(gameId);
        }

        let round = this.state.round;
        if (url.searchParams.has('round')) {
            round = Number.parseInt(url.searchParams.get('round') || '-1', 10);
        }
        if (gameId && round !== -1) {
            this.loadRoundBids(gameId, round);
            this.loadPlayingPhaseInfo(gameId, round);
        }

        this.setState({
            gameId,
            round,
        });
        window.setTimeout(this.loadData, 8000);
    }

    componentDidMount() {
        this.loadData();
    }

    render() {
        let view = null as null | JSX.Element;
        if (this.state.gameId) {
            if(!this.state.gameInfo) {
                view = <div>loading game info...</div>
            } else if (this.state.round === -1) {
                view = <GameView
                    gameId={this.state.gameId}
                    playerNames={this.state.playerNames}
                    gameInfo={this.state.gameInfo}
                    rounds={this.state.rounds}
                    onSelectRound={this.onSelectRound} />;
            } else {
                view = <RoundView
                    gameId={this.state.gameId}
                    playerNames={this.state.playerNames}
                    gameInfo={this.state.gameInfo}
                    round={this.state.round}
                    roundInfo={this.state.roundInfo[this.state.round]}
                    cards={this.state.cardsPerRound[this.state.round]}
                    bidHistory={this.state.bidHistory}
                    playingPhaseInfo={this.state.playingPhaseInfo} />;
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