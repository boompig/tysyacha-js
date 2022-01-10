import React, { PureComponent } from "react";
import { LocalGameRoundView } from "./local-game-round-view";
import { ScoreView } from "./score-view-modal";
import "./local-game.css";
import { GamePhase, getBarrelPlayers } from "../game-mechanics";
import { Navbar } from "./navbar";
import { LoadingView } from "./loading-view";
import { randInt } from "../utils";

/**
 * This function generates the player names given the human player's name
 * Mostly generates AI player names
 */
function getPlayerNames(playerName: string): string[] {
    if (!playerName) {
        throw new Error('player name cannot be empty');
    }

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

    return playerNames;
}

function getInitialScores(playerNames: string[]): {[key: string]: number[]} {
    // instantiate the scores
    const scores = {} as {[key: string]: number[]};

    playerNames.forEach((name: string) => {
        scores[name] = [0];
    });
    return scores;
}

function getInitialBarrelCount(playerNames: string[]): {[key: string]: number} {
    const barrelCounts = {} as {[key: string]: number};
    playerNames.forEach((name: string) => {
        barrelCounts[name] = -1;
    });
    return barrelCounts;
}

interface ILocalGameProps {
    /**
     * Unique ID assigned to this game
     */
    gameId: string;
    /**
     * The name of the local (human) player
     * NOTE: assume that this does not change for the entirety of the game
     * This component may not work properly if you change the name of the player halfway through the game
     */
    playerName: string;
}

/**
 * We also save/load this entire struct directly
 */
interface ILocalGameState {
    /**
     * Whether the game is ready
     * We don't want to render items multiple times
     */
    isGameReady: boolean;

    /**
     * True iff the game is over
     */
    isGameOver: boolean;

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
     * The number of turns, per player, than they have been on the barrel
     * -1 -> the player is not currently on the barrel
     * 2 -> the player has already been on the barrel for 2 full turns
     * 3 -> the player has already been on the barrel for 3 full turns (this should never happen)
     *
     * This is a helpful (duplicate) state that can be derived from scores
     * However we keep the accounting of them separate (make sure they are consistent)
     */
    barrelTurnCount: {[key: string]: number};

    /**
     * The players who won this game.
     * This is a derived property from scores but keep track of this anyway.
     * Not relevant unless the `isGameOver` flag is set
     */
    winningPlayers: string[];

    /**
     * Current round number
     * The first round is *1*
     * However there are scores for round 0 so we can show zeros for all the players
     */
    round: number;

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

    /**
     * The number of times that the current dealer has failed consecutively
     */
    numFailedDeals: number;

    /**
     * This is passed from the child component up here to the parent
     */
    phase: GamePhase;

    /**
     * Control randomness for reproducibility
     */
    randomSeed: number;

    /**
     * True iff we should show the score card
     */
    isScorecardShown: boolean;

    /**
     * True iff the intro dialog is shown
     */
    isIntroDialogShown: boolean;
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

        const playerNames = getPlayerNames(this.props.playerName);
        const scores = getInitialScores(playerNames);
        const barrelTurnCount = getInitialBarrelCount(playerNames);

        // guaranteed to not be -1
        const localPlayerIndex = playerNames.indexOf(props.playerName);

        this.state = {
            isGameReady: false,
            isGameOver: false,
            playerNames: playerNames,
            dealerIndex: 0,
            scores: scores,
            barrelTurnCount: barrelTurnCount,
            winningPlayers: [],
            round: 1,
            isAllCardsShown: false,
            localPlayerIndex: localPlayerIndex,
            numFailedDeals: 0,
            phase: GamePhase.NOT_DEALT,

            // by default show the intro dialog
            isIntroDialogShown: true,
            // by default scorecard is hidden
            isScorecardShown: false,

            // TODO
            randomSeed: 1,
        };

        // because everything is terrible
        this.onRoundOver = this.onRoundOver.bind(this);
        this.saveGameState = this.saveGameState.bind(this);
        this.loadGameState = this.loadGameState.bind(this);
        this.getBoltScores = this.getBoltScores.bind(this);
        this.handleChangePhase = this.handleChangePhase.bind(this);
        this.handleChangeViewScorecard = this.handleChangeViewScorecard.bind(this);
    }

    saveGameState() {
        // write the current game details to local storage
        const sGameDetails = JSON.stringify(this.state);
        window.localStorage.setItem(`game:${this.props.gameId}`, sGameDetails);
        console.debug(`saved game state for game ${this.props.gameId}`);
    }

    /**
     * Return true iff the game state was successfully loaded
     * Return false if no game state was found to load
     */
    loadGameState(): boolean {
        console.debug(`Trying to load saved game state from local storage for game ${this.props.gameId}...`);
        // load game details from browser cache if there are any
        let sGameDetails = window.localStorage.getItem(`game:${this.props.gameId}`);
        if (sGameDetails) {
            console.debug(`found game state for this game in localstorage:`);
            const savedGameState = JSON.parse(sGameDetails) as ILocalGameState;
            console.debug(savedGameState);
            this.setState({
                playerNames: [...savedGameState.playerNames],
                localPlayerIndex: savedGameState.localPlayerIndex,
                dealerIndex: savedGameState.dealerIndex,
                round: savedGameState.round,
                scores: savedGameState.scores,
                numFailedDeals: savedGameState.numFailedDeals,
                isIntroDialogShown: savedGameState.isIntroDialogShown || false,
            });
            this.setState({
                isGameReady: true,
            });
            return true;
        } else {
            this.setState({
                isGameReady: true,
            });
            return false;
        }
    }

    componentDidMount() {
        if (!this.loadGameState()) {
            console.debug(`no previous game state found for game ${this.props.gameId}`);
            this.saveGameState();
        }
    }

    /**
     * Handle the case where a player has dealt unsuccessfully 3 times in a row
     */
    getBoltScores(): {[key: string]: number} {
        // fill out the scores for each player
        // dealer gets -120
        let scores: { [key: string]: number } = {};
        for (let i = 0; i < this.state.playerNames.length; i++) {
            let playerName = this.state.playerNames[i];
            if (i === this.state.dealerIndex) {
                scores[playerName] = -120;
            } else {
                scores[playerName] = 0;
            }
        }
        return scores;
    }

    /**
     * This method is called when the round is over (with scores from the round).
     *
     * @param scores map from player names to the scores they received in that round.
     * These numbers may be negative.
     * NOTE: The scores received here should be reflective of the result of the contract. That computation is up to the *caller*.
     * NOTE: The scores however do not take into account the barrel, or other factors outside the considerations of a single round.
     *
     * @param isEarlyExit Whether something happened to prevent the full game from being played
     */
    onRoundOver(scores: {[key: string]: number}, isEarlyExit: boolean): void {
        if (isEarlyExit && this.state.numFailedDeals < 2) {
            console.log(`round ${this.state.round} ended early`);
            this.setState({
                numFailedDeals: this.state.numFailedDeals + 1,
            }, () => {
                console.log(`number of failed deals is now ${this.state.numFailedDeals}`);
                this.saveGameState();
            });
        } else {
            // current round must be at least 1
            console.assert(this.state.round > 0);

            if (isEarlyExit && this.state.numFailedDeals === 2) {
                console.log('3 failed deals! Bolt!');
                scores = this.getBoltScores();
            } else {
                console.log(scores);
            }

            console.log(`Round ${this.state.round} is over.`);
            const newScores = Object.assign({}, this.state.scores);
            console.log(this.state.scores);

            for(const [name, pts] of Object.entries(scores)) {
                // there should be scores from the previous round
                // but if not, set them to zero
                if (!newScores[name][this.state.round - 1]) {
                    newScores[name][this.state.round - 1] = 0;
                }
                newScores[name][this.state.round] = newScores[name][this.state.round - 1] + pts;
            }

            // now that we've added the scores...
            // possibly round the scores up or down depending on who is on the barrel
            // and calculate game end conditions

            // player names *previously* on the barrel
            const playersOnBarrel = getBarrelPlayers(this.state.scores);
            const newBarrelCounts = Object.assign({}, this.state.barrelTurnCount);
            const winningPlayers = [] as string[];
            let isGameOver = false;

            for (let name of this.state.playerNames) {
                const isOnBarrel = playersOnBarrel.includes(name);

                if (newScores[name][this.state.round - 1] >= 880 && newScores[name][this.state.round - 1] < 1000) {
                    // the player might get on the barrel this turn

                    if (isOnBarrel && newBarrelCounts[name] === 2) {
                        // this player gets -120 points
                        newScores[name][this.state.round - 1] = 760;

                        // and is kicked off the barrel
                        newBarrelCounts[name] = -1;

                        console.debug(`${name} has been on the barrel for a full 3 turns and has failed to meet a contract. They are thrown off.`);
                    } else {
                        if (!isOnBarrel) {
                            console.debug(`${name} is now on the barrel`);
                            console.assert(newBarrelCounts[name] === -1);
                        } else {
                            console.debug(`${name} has now been on the barrel for ${newBarrelCounts[name] + 1} turns`);
                        }

                        newBarrelCounts[name] += 1;
                    }
                } else if (newScores[name][this.state.round - 1] >= 1000) {
                    // this player has won
                    winningPlayers.push(name);
                    isGameOver = true;
                } else if (isOnBarrel) {
                    // this player has fallen off the barrel
                    newBarrelCounts[name] = -1;
                    console.debug(`${name} has fallen off the barrel due to a contract`);
                }
            }

            this.setState({
                scores: newScores,
                round: this.state.round + 1,
                dealerIndex: (this.state.dealerIndex + 1) % 3,
                numFailedDeals: 0,
            }, () => {
                this.saveGameState();
            });
        }
    }

    handleChangePhase(newPhase: GamePhase) {
        this.setState({
            phase: newPhase,
        });
    }

    handleDismissIntroDialog() {
        this.setState({
            isIntroDialogShown: false,
        }, () => {
            this.saveGameState();
        });
    }

    handleChangeViewScorecard(isVisible: boolean) {
        this.setState({
            isScorecardShown: isVisible,
        });
    }

    handleChangeHash(newHash: string) {
        const url = new URL(window.location.href);
        url.hash = newHash;
        console.debug(`[local game view] Hash is now ${newHash}`);
        window.location.href = url.toString();
        window.location.reload();
    }

    render(): JSX.Element {
        let mainView = null;

        if (this.state.isGameReady) {
            mainView = <LocalGameRoundView
                randomSeed={this.state.randomSeed}
                gameId={this.props.gameId}
                roundNum={this.state.round}
                isAllCardsShown={this.state.isAllCardsShown}
                playerNames={this.state.playerNames}
                dealerIndex={this.state.dealerIndex}
                onRoundOver={this.onRoundOver}
                numFailedDeals={this.state.numFailedDeals}
                localPlayerIndex={this.state.localPlayerIndex}
                onChangePhase={this.handleChangePhase} />;
        } else {
            mainView = <LoadingView />
        }

        return (<div className="wrapper">
            <header>
                <Navbar gameId={this.props.gameId}
                    hash={window.location.hash}
                    setNavHash={this.handleChangeHash} />
            </header>
            <main className="container">
                <div className="main-control-panel">
                    <button type="button" className="btn btn-info btn-lg"
                        data-toggle="modal"
                        data-target="#score-view-modal"
                        onClick={ (e) => this.handleChangeViewScorecard(!this.state.isScorecardShown) }>
                        { this.state.isScorecardShown ? 'Hide Scorecard' : 'View Scorecard' }
                    </button>
                </div>
                { this.state.isScorecardShown ?
                    <div>
                        <ScoreView currentRound={this.state.round}
                            playerNames={this.state.playerNames}
                            scores={this.state.scores}
                            onDismiss={() => this.handleChangeViewScorecard(false)} />
                        <div className="modal-backdrop fade show"
                            onClick={() => this.handleChangeViewScorecard(false)}></div>
                    </div> :
                    null}
                { mainView }
            </main>
        </div>);
    }
}