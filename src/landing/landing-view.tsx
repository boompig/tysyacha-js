import React, { FC, useState } from "react";
import "./landing-view.css";
import { randInt } from "../utils";
import { Navbar } from "../local-game/navbar";
import RadioButtonGroup from "../radio-button-group";


/**
 * Game IDs with this many characters will be generated
 * Short game IDs allow easy sharing or copy-pasting
 */
const GAME_ID_LENGTH = 6;

/**
 * The game ID is a string containing numbers 0-9 and lowercase letters a-z
 * It will be of length GAME_ID_LENGTH
 * For a total entropy of 26 ^ GAME_ID_LENGTH
 * For example, with a GAME_ID_LENGTH of 6 we have a possible 308,915,776 games
 * This provides a nice balance between entropy (possible values) and length
 * We wouldn't want any duplicate game IDs (since they are not sequential)
 */
function randomGameId(): string {
    let gameId = "";
    for (let i = 0; i < GAME_ID_LENGTH; i++) {
        const j = randInt(87, 123);
        if (j < 97) {
            gameId += (j - 87).toString();
        } else {
            gameId += String.fromCharCode(j);
        }
    }
    return gameId;
}

/**
 * Find games that are stored against in this browser
 * Do not return any games which have been completed
 * Return a map from game IDs to game details
 */
function findExistingActiveGames(): { [key: string]: any } {
    const pattern = /game:[a-z0-9]+$/;
    const gameIds = Object.keys(window.localStorage).filter((key: string) => {
        return key.match(pattern);
    }).map((key: string) => {
        return key.replace('game:', '');
    });

    console.debug(`Found ${gameIds.length} game IDs`);

    const m = {} as {[key: string]: any};
    gameIds.forEach((gameId: string) => {
        m[gameId] = getGameDetails(gameId);
    });

    let numGameOver = 0;

    for (let gameId of Object.keys(m)) {
        if (m[gameId].isGameOver) {
            delete(m[gameId]);
            numGameOver++;
        }
    }

    console.debug(`${numGameOver} of those are done`);

    return m;
}

/**
 * Guaranteed to return *at least* `localPlayerIndex` and `playerNames`
 * Also guaranteed to have key `isGameOver`
 */
function getGameDetails(gameId: string): any {
    const sGameDetails = window.localStorage.getItem(`game:${gameId}`);
    if (!sGameDetails) {
        throw new Error(`game details for game ${gameId} not found`);
    }
    const gameDetails = JSON.parse(sGameDetails);
    return gameDetails;
}

/**
 * Only these languages are supported
 * If any other language is passed via the query parameter, the page will refuse to render
 */
const SUPPORTED_LANGS = ['en'];

interface IExistingGamesViewProps {
    games: {[key: string]: any};
    joinGame(gameId: string): void;
};

/**
 * Select a currently active game to join (these games are vs the AI)
 */
const ActiveGamesView : FC <IExistingGamesViewProps> = (props: IExistingGamesViewProps) => {
    const arr = Object.entries(props.games).map(([gameId, gameDetails]) => {
        return <li key={gameId}>
            <a href="#" role="button" onClick={() => props.joinGame(gameId) }>{ gameId } ({ gameDetails.round } rounds complete)</a>
        </li>;
    });
    return <div className="existing-games-container">
        <p>Click which game you want to rejoin.</p>
        <ul>
            { arr }
        </ul>
    </div>;
};

interface IVsHumanViewProps {
    onJoinGame(gameId: string): void;
    onNewGame(): void;
};

const VsHumanView: FC<IVsHumanViewProps> = (props: IVsHumanViewProps) => {
    /**
     * Either 'host' or 'join'
     */
    let [gameType, setGameType] = useState('host');

    return <div className="vs-human-view">
        <p>You can either host a new game or join your friends in their existing game.
        </p>

        <button type="button" className="btn btn-primary btn-lg">Host a New Game</button>

        { gameType === 'join' ?
            <p>
                If you're joining your friends, ask them for their game ID.
            </p> :
            null }

        <form>
            <label htmlFor="game_id">Game ID</label>
            <input type="text" name="game_id" className="form-control"
                placeholder="game ID"
                required={true}/>
            <button type="submit" className="btn btn-primary btn-lg">Join Game</button>
        </form>

    </div>;
};

interface ILangSelectorViewProps {
    onChangeLang(lang: string): void;
}

/**
 * TODO not implemeneted
 */
const LangSelectorView = (props: ILangSelectorViewProps) => {
    return <div className="lang-select-container">
        <div className="lang-select-option" role="button" onClick={() => props.onChangeLang('ru')}>
            <img className="lang-select-flag" src="/img/Flag_of_Russia.svg.png" height="40px" alt="Russian flag" />
            <div className="lang-select-name">Russian</div>
        </div>
        <div className="lang-select-option" role="button" onClick={() => props.onChangeLang('en')}>
            <img className="lang-select-flag" src="/img/Flag_of_UK.svg.png" height="40px" alt="UK flag" />
            <div className="lang-select-name">English</div>
        </div>
    </div>
};

interface ILandingViewProps {
    onNewRoute(newHash: string): void;
};

/**
 * Land on this page when you go to the index
 * Language is handled through a URL query parameter
 */
const LandingView : FC <ILandingViewProps> = (props: ILandingViewProps) => {
    // read the language from the query parameter
    // by default, default to english
    const url = new URL(window.location.href);
    const urlLang = url.searchParams.get('lang');
    if (urlLang && !SUPPORTED_LANGS.includes(urlLang)) {
        throw new Error(`Language ${urlLang} is not yet supported`);
    }
    let [lang, setLang] = useState(urlLang ? urlLang : 'en');
    const activeGames = findExistingActiveGames();
    /**
     * Whether to show the *list* of active games
     */
    let [showActiveGames, setShowActiveGames] = useState(false);
    /**
     * Whether to show the *alert* that active games may be joined
     */
    let [showActiveGamesAlert, setShowActiveGamesAlert] = useState(Object.keys(activeGames).length > 0);

    let [playerName, setName] = useState('');
    let [gameType, setGameType] = useState('ai');

    function handleChangeName(e: React.SyntheticEvent<HTMLInputElement>) {
        const name = (e.target as HTMLInputElement).value;
        setName(name);
    }

    /**
     * Callback to create a new game (vs AI)
     * Name is set here
     */
    function handleNewAIGame() {
        // generate a unique random game ID
        const gameId = randomGameId();
        // navigate to the right page
        const url = new URL(window.location.href);
        url.hash = '#local-ai-game';
        url.searchParams.set('gameId', gameId.toString());
        url.searchParams.set('playerName', playerName);
        url.searchParams.set('lang', lang);
        window.location.href = url.toString();
    }

    function handleChangeLang(langName: string) {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', langName);
        window.location.href = url.toString();
    }

    /**
     * Callback for when we want to join an existing game vs AI
     */
    function handleJoinAIGame(gameId: string) {
        const gameDetails = getGameDetails(gameId);
        const url = new URL(window.location.href);
        url.hash = '#local-ai-game';
        url.searchParams.set('gameId', gameId);
        // NOTE: we *must* set the player name to what is recorded in our local DB
        const playerNames = gameDetails.playerNames as string[];
        const localPlayerIndex = gameDetails.localPlayerIndex as number;
        const playerName = playerNames[localPlayerIndex];
        url.searchParams.set('playerName', playerName);

        // set the language
        url.searchParams.set('lang', lang);

        window.location.href = url.toString();
    }

    function handleJoinHumanGame(gameId: string) {
        const url = new URL(window.location.href);
        url.hash = '#human-game';
        url.searchParams.set('gameId', gameId);
        url.searchParams.set('playerName', playerName);
        url.searchParams.set('lang', lang);
        window.location.href = url.toString();
    }

    /**
     * Callback to create (host) a new game vs humans
     */
    function handleNewHumanGame() {
         // generate a unique random game ID
        const gameId = randomGameId();
        // navigate to the right page
        const url = new URL(window.location.href);
        url.hash = '#human-game';
        url.searchParams.set('gameId', gameId.toString());
        url.searchParams.set('playerName', playerName);
        url.searchParams.set('lang', lang);
        window.location.href = url.toString();
    }

    let existingGamesAlert = null;
    if (showActiveGamesAlert) {
        existingGamesAlert = (<div className="join-existing-games-container alert alert-warning alert-dismissible fade show" role="alert">
            <button type="button" className="close" data-dismiss="alert" aria-label="Close" onClick={() => setShowActiveGamesAlert(false)}>
                <span aria-hidden="true">&times;</span>
            </button>

            <p>You have { Object.keys(activeGames).length } games in progress. Would you like to join one?</p>
            <button type="button" className="btn btn-warning btn-lg" onClick={ () => setShowActiveGames(true) }>Continue Active Games</button>
        </div>);
    }

    let mainView = (<div>
        <p className="instructions">
            You can play the Russian card game Tysyacha here against other humans or sophisticated AI opponents.
            Enter your name below to begin.
        </p>
        <form className="player-name-form">
            <label htmlFor="name">Your Name</label>
            <input type="text" className="form-control"
                name="playerName"
                placeholder="enter your name to continue"
                required={true}
                onChange={handleChangeName}
            />

            <RadioButtonGroup
                radioName="game_type"
                containerId="game-type-btn-container"
                humanLabels={['vs AI', 'vs Human']}
                labels={['ai', 'human']}
                disabledLabels={['human']}
                checkedLabel={gameType}
                onChange={setGameType} />

            { gameType === 'ai' ?
                <button type="button" className="btn btn-lg btn-primary form-control"
                    onClick={() => handleNewAIGame()}>Play Game vs AI</button> :
                null }
        </form>

        {gameType === 'human' ?
            <VsHumanView
                onJoinGame={handleJoinHumanGame}
                onNewGame={handleNewHumanGame} /> :
            null}
    </div>);

    return (<div className="wrapper landing-view">
        <Navbar
            setNavHash={props.onNewRoute} />
        <div className="hero">
            <h1 className="title-text">1000!</h1>
        </div>
        <main>
            <h1>Welcome to the Tysyacha Web App</h1>

            { showActiveGames ? null : existingGamesAlert }
            { showActiveGames ?
                <ActiveGamesView games={ activeGames }
                    joinGame={handleJoinAIGame} /> : null
            }

            { mainView }
        </main>

        <footer>
            Created by Daniel Kats in 2021
        </footer>
    </div>);
};

export {
    LandingView,
};