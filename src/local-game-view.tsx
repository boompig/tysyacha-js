import React, { PureComponent } from "react";
import { LocalGameRoundView } from "./local-game-round-view";
import ScoreView from "./score-view";
import SelectPlayerNameView from "./select-player-name-view";

/**
 * Generate a random number in the half-open interval [a, b)
 * Both a and b are assumed to be integers
 */
function randInt(a: number, b: number): number {
    return Math.floor(Math.random() * (b - a)) + a;
}

interface ILocalGameProps {}

interface ILocalGameState {
    /**
     * The name of the local (human) player
     */
    playerName: string | null;

    /**
     * The name of every player including the AI
     * These are generated after the human player name has been entered
     */
    playerNames: string[];

    /**
     * Index into playerNames
     * This is the dealer for the current round
     */
    dealerIndex: number;

    /**
     * Map from player names to an array
     * Each entry is the score of that player at the end of that round
     * Obviously at the end of round 0 (start of the game) everyone starts with score 0
     */
    scores: {[key: string]: number[]};

    /**
     * Current round number
     * The first round is *1*, but the game starts at round 0
     */
    round: number;

    /**
     * This is a UI variable
     * When we want to show the scores, set this to true and vv
     */
    isScoresShown: boolean;

    /**
     * This is a cheat-code (and used for debugging)
     * When set to true, all players' cards are shown
     * When set to false, only the human player's cards are shown
     */
    isAllCardsShown: boolean;

    /**
     * This is the index of the local (human) player
     */
    localPlayerIndex: number;
}

/**
 * The AI player names to choose from
 * Users should not modify this array but should instead clone it
 */
const AI_PLAYER_NAMES = ["Alisa", "Elena", "Gallina", "Misha", "Boris"];

/**
 * This is the top-level component for a local game against 2 AI opponents.
 */
export class LocalGameView extends PureComponent<ILocalGameProps, ILocalGameState> {
    constructor(props: ILocalGameProps) {
        super(props);

        this.state = {
            playerName: null,
            playerNames: [],
            dealerIndex: 0,
            scores: {},
            round: 0,
            isScoresShown: false,
            isAllCardsShown: false,
            localPlayerIndex: 0,
        };

        // because everything is terrible
        this.onRoundOver = this.onRoundOver.bind(this);
        this.onPlayerName = this.onPlayerName.bind(this);
        this.onToggleScores = this.onToggleScores.bind(this);
    }

    /**
     * Check if we've previously saved the player's name to localStorage
     */
    componentDidMount() {
        const name = window.localStorage.getItem("playerName")
        if (name) {
            this.onPlayerName(name);
        }
    }

    onRoundOver(scores: {[key: string]: number}, isEarlyExit: boolean): void {
        if(!isEarlyExit) {
            const newScores = Object.assign({}, this.state.scores);
            for(const [name, pts] of Object.entries(scores)) {
                newScores[name][this.state.round] += pts;
            }
            this.setState({
                scores: newScores,
                round: this.state.round + 1,
                dealerIndex: (this.state.dealerIndex + 1) % 3,
            });
        }
    }

    /**
     * Call this to set the human player's name
     */
    onPlayerName(playerName: string) {
        // save the name to localStorage
        window.localStorage.setItem("playerName", playerName);

        let i = AI_PLAYER_NAMES.indexOf(playerName);
        // this is a list of possible AI names to choose from
        // we make a copy because we don't want to modify the constant
        const possibleNames = [...AI_PLAYER_NAMES];
        if (i >= 0) {
            possibleNames.splice(i, 1);
        }

        // this is the actual list of players
        // our local player is always at index 0
        // this doesn't really change the game
        const playerNames = [playerName];

        while (playerNames.length < 3) {
            i = randInt(0, possibleNames.length);
            let [name] = possibleNames.splice(i, 1);
            playerNames.push(name);
        }

        // instantiate the scores
        const scores = {} as {[key: string]: number[]};

        playerNames.forEach((name: string) => {
            scores[name] = [];
            scores[name][0] = 0;
        });

        this.setState({
            playerName: playerName,
            playerNames: playerNames,
            scores: scores,
            // TODO for now the local player is always index 0
            localPlayerIndex: 0,
        });
    }

    onToggleScores() {
        this.setState({
            isScoresShown: !this.state.isScoresShown,
        });
    }

    render(): JSX.Element {
        if (this.state.playerName) {
            return (<main className="container">
                { this.state.isScoresShown ?
                    <div>
                        <ScoreView
                            round={this.state.round}
                            playerNames={this.state.playerNames}
                            scores={this.state.scores} />
                        <button type="button" className="btn btn-info btn-lg"
                            onClick={this.onToggleScores}>Hide Scores</button>
                    </div> :
                    <button type="button" className="btn btn-info btn-lg"
                        onClick={this.onToggleScores}
                        disabled={this.state.round === 0}>Show Scores</button>
                }
                <LocalGameRoundView
                    isAllCardsShown={this.state.isAllCardsShown}
                    playerNames={this.state.playerNames}
                    dealerIndex={this.state.dealerIndex}
                    onRoundOver={this.onRoundOver}
                    localPlayerIndex={this.state.localPlayerIndex} />
            </main>);
        } else {
            return (<main>
                <SelectPlayerNameView
                    onSelectPlayerName={this.onPlayerName}
                ></SelectPlayerNameView>
            </main>);
        }
    }
}