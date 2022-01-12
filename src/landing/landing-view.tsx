import React, { FC, useState } from "react";
import "./landing-view.css";
import { randInt } from "../utils";
import { Navbar } from "../local-game/navbar";


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
 * Return their game IDs
 */
function findExistingGames(): string[] {
    const pattern = /game:[a-z0-9]+$/;
    return Object.keys(window.localStorage).filter((key: string) => {
        if (key.match(pattern)) {
            return true;
        }
    }).map((key: string) => {
        return key.replace('game:', '');
    });
}

/**
 * Guaranteed to return *at least* `localPlayerIndex` and `playerNames`
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
    gameIds: string[];
    joinGame(gameId: string): void;
};

const ExistingGamesView : FC <IExistingGamesViewProps> = (props: IExistingGamesViewProps) => {
    const arr = props.gameIds.map((gameId: string) => {
        return <li key={gameId}>
            <a href="#" role="button" onClick={() => props.joinGame(gameId) }>{ gameId }</a>
        </li>;
    });
    return <div className="existing-games-container">
        <p>Click which game you want to rejoin.</p>
        <ul>
            { arr }
        </ul>
    </div>;
};

interface ILandingViewProps {};

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
    const existingGames = findExistingGames();
    let [showExistingGames, setShowExistingGames] = useState(false);

    /**
     * Callback to join a new game (vs AI)
     */
    function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        // generate a unique random game ID
        const gameId = randomGameId();
        // navigate to the right page
        const url = new URL(window.location.href);
        url.hash = '#local-ai-game';
        url.searchParams.set('gameId', gameId.toString());
        const playerName = (e.target as any).playerName.value;
        url.searchParams.set('playerName', playerName);

        // set the language
        url.searchParams.set('lang', lang);

        window.location.href = url.toString();
        return false;
    }

    function changeLang(langName: string) {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', langName);
        window.location.href = url.toString();
    }

    function handleChangeHash(newHash: string) {
        const url = new URL(window.location.href);
        url.hash = newHash;
        // navigate to that URL
        window.location.href = url.toString();
        console.debug(`[landing] hash is now ${newHash}`);
        window.location.reload();
    }

    /**
     * Callback for when we want to join an existing game
     */
    function handleJoinGame(gameId: string) {
        const gameDetails = getGameDetails(gameId);
        const url = new URL(window.location.href);
        url.hash = '#local-ai-game';
        url.searchParams.set('gameId', gameId);
        const playerNames = gameDetails.playerNames as string[];
        const localPlayerIndex = gameDetails.localPlayerIndex as number;
        const playerName = playerNames[localPlayerIndex];
        url.searchParams.set('playerName', playerName);

        // set the language
        url.searchParams.set('lang', lang);

        window.location.href = url.toString();
    }

    let playExistingGamesView = null;
    if (existingGames.length > 0) {
        playExistingGamesView = (<div className="join-existing-games-container">
            <p>You have { existingGames.length } games in progress. Would you like to join one?</p>
            <button type="button" className="btn btn-info btn-lg" onClick={ () => setShowExistingGames(true) }>Continue Existing Games</button>
        </div>);
    }

    return (<div className="wrapper landing-view">
        <Navbar
            hash={window.location.hash}
            setNavHash={handleChangeHash} />
        <div className="hero">
            {/* <div className="lang-select-container"> */}
                {/* <div className="lang-select-option" role="button" onClick={ () => changeLang('ru') }>
                    <img className="lang-select-flag" src="/img/Flag_of_Russia.svg.png" height="40px" alt="Russian flag" />
                    <div className="lang-select-name">Russian</div>
                </div> */}
                {/* <div className="lang-select-option" role="button" onClick={ () => changeLang('en') }>
                    <img className="lang-select-flag" src="/img/Flag_of_UK.svg.png" height="40px" alt="UK flag" />
                    <div className="lang-select-name">English</div>
                </div>
            </div> */}
            <h1 className="title-text">1000!</h1>
        </div>
        <main>
            <h1>Welcome to the Tysyacha Web App
                { // 'Приветствую вас в Игру "Тысячя"'
                }
            </h1>

            { showExistingGames ? null : playExistingGamesView }
            { showExistingGames ?
                <ExistingGamesView gameIds={ existingGames }
                    joinGame={handleJoinGame} /> : null
            }

            <p className="instructions">
                You can play the Russian card game Tysyacha here against sophisticated AI opponents.
                Enter your name below to begin.
            </p>

            <form onSubmit={handleSubmit}>
                <label htmlFor="name">Your Name</label>
                <input type="text" className="form-control"
                    name="playerName"
                    placeholder="enter your name to continue"
                    />
                <button type="submit" className="btn btn-lg btn-primary form-control">Play</button>
            </form>

        </main>

        <footer>
            Created by Daniel Kats in 2021
        </footer>
    </div>);
};

export {
    LandingView,
};