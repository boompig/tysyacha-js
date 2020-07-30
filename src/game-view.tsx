import React from "react";
import { API, MessageType } from './api';
import { HEARTBEAT_INTERVAL } from './constants';
import RoundView from "./round-view";
import { ScoreView } from './score-view';

/**
 * A bid of 0 -> pass
 */
type Bid = {
    points: number;
    player: number;
}

interface IBidProps {
    bids: Bid[];
}

export function BidView(props: IBidProps): JSX.Element {
    if(props.bids.length === 0) {
        return <div>no bids</div>;
    }
    const bids = props.bids.map((bid: Bid, i: number) => {
        return (<div key={`bid-${i}`}>
            Player {bid.player + 1} bid {bid.points === 0 ? "pass" : bid.points}
        </div>);
    });
    return (<div>
        {bids}
    </div>);
}

interface IGameViewProps {
    api: API;

    gameId: string;

    /**
     * name of the user
     */
    name: string;
}

interface IGameViewState {
    isGameOver: boolean;
    gameSeeds: any;
    round: number;
    scores: {[key: string]: number[]};
    playerNames: string[];
    dealer: number;
    playerIndex: number;
}

/**
 * This component displays the entire *game*
 * Not a single round of the game. The *game*
 */
export class GameView extends React.Component<IGameViewProps, IGameViewState> {
    constructor(props: IGameViewProps) {
        super(props);
        this.state = {
            isGameOver: false,
            gameSeeds: {},
            /**
             * how many rounds have been played thus far
             */
            round: 0,
            /**
             * Map from name to score
             */
            scores: {},

            /**
             * In the correct order based on gameSeeds
             */
            playerNames: [],
            /**
             * Track the dealer
             */
            dealer: 0,
            playerIndex: -1,
        };

        this.sendHeartbeat = this.sendHeartbeat.bind(this);
        this.startHeartbeatTimer = this.startHeartbeatTimer.bind(this);
        this.getPlayerNames = this.getPlayerNames.bind(this);
    }

    sendHeartbeat(): void {
        this.props.api.sendMessage(MessageType.JOIN_GAME, {
            gameId: this.props.gameId,
            username: this.props.name,
            isHeartbeat: true,
        });
        window.setTimeout(() => {
            this.sendHeartbeat();
        }, HEARTBEAT_INTERVAL);
    }

    startHeartbeatTimer(): void {
        this.sendHeartbeat();
    }

    /**
     * set player names based on seeds
     * lower player goes first
     */
    getPlayerNames(gameSeeds: any): string[] {
        const players = Object.keys(gameSeeds);
        players.sort((user1: string, user2: string) => {
            return this.state.gameSeeds[user1] - this.state.gameSeeds[user2];
        });
        return players;
    }

    componentDidMount(): void {
        this.props.api.addMessageListener([MessageType.GAME_SEEDS], (data: any) => {
            console.log(`Got game seeds from server for game ${data.gameId}:`);
            console.log(data);
            if(data.gameId === this.props.gameId) {
                const seeds: any = {};
                let scores: any = {};
                // make sure that the seeds are in the right format
                for(const [user, seed] of Object.entries(data.seeds)) {
                    if(typeof seed === 'number') {
                        seeds[user] = seed;
                    } else {
                        seeds[user] = Number.parseFloat(seed as string);
                    }
                }
                // get score from server if included in the same message
                if(data.scores) {
                    scores = data.scores;
                } else {
                    // otherwise all scores are zeros
                    for(const user of Object.keys(seeds)) {
                        scores[user] = [0];
                    }
                }
                // get round from server if included in the same message
                let round = 0;
                if(data.round) {
                    round = data.round;
                }
                // get dealer from server if included in the same message
                let dealer = 0;
                if(data.dealer) {
                    dealer = data.dealer;
                }
                const playerNames = this.getPlayerNames(seeds);
                this.setState({
                    gameSeeds: seeds,
                    scores: scores,
                    playerNames: playerNames,
                    dealer: dealer,
                    playerIndex: playerNames.indexOf(this.props.name),
                    round: round,
                });
            }
        });

        if(Object.keys(this.state.gameSeeds).length === 0) {
            // just in case
            this.props.api.sendMessage(MessageType.GAME_SEEDS, {
                gameId: this.props.gameId,
                username: this.props.name,
            });
        }

        // send a regular heartbeat message
        this.startHeartbeatTimer();
    }

    render(): JSX.Element {
        return (<div className='game-view'>
            <ScoreView scores={this.state.scores}
                playerNames={this.state.playerNames}
                round={this.state.round} />
            { this.state.playerNames ?
                <RoundView
                    gameId={this.props.gameId}
                    round={this.state.round}
                    name={this.props.name}
                    playerNames={this.state.playerNames}
                    dealer={this.state.dealer}
                    playerIndex={this.state.playerIndex}
                    api={this.props.api} /> :
                <div>Waiting for player names from server...</div> }
        </div>);
    }
}