import React, { FC, useState } from "react";
import "./landing-view.css";
import { randInt } from "../utils";

interface IProps {};

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
 * Only these languages are supported
 * If any other language is passed via the query parameter, the page will refuse to render
 */
const SUPPORTED_LANGS = ['en'];

/**
 * Land on this page when you go to the index
 * Language is handled through a URL query parameter
 */
const LandingView : FC <IProps> = (props: IProps) => {
    // read the language from the query parameter
    // by default, default to english
    const url = new URL(window.location.href);
    const urlLang = url.searchParams.get('lang');
    if (urlLang && !SUPPORTED_LANGS.includes(urlLang)) {
        throw new Error(`Language ${urlLang} is not yet supported`);
    }
    let [lang, setLang] = useState(urlLang ? urlLang : 'en');

    function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        // generate a unique random game ID
        const gameId = randomGameId();
        // navigate to the right page
        const url = new URL(`${window.location.protocol}//${window.location.host}`);
        url.pathname = '/local-ai-game';
        url.searchParams.set('gameId', gameId.toString());
        const playerName = (e.target as any).playerName.value;
        url.searchParams.set('playerName', playerName);

        window.location.href = url.toString();
        return false;
    }

    function changeLang(langName: string) {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', langName);
        window.location.href = url.toString();
    }

    return (<div className="wrapper">
        <div className="hero">
            <div className="lang-select-container">
                {/* <div className="lang-select-option" role="button" onClick={ () => changeLang('ru') }>
                    <img className="lang-select-flag" src="/img/Flag_of_Russia.svg.png" height="40px" />
                    <div className="lang-select-name">Russian</div>
                </div> */}
                <div className="lang-select-option" role="button" onClick={ () => changeLang('en') }>
                    <img className="lang-select-flag" src="/img/Flag_of_UK.svg.png" height="40px" />
                    <div className="lang-select-name">English</div>
                </div>
            </div>
            <h1 className="title-text">1000!</h1>
        </div>
        <main>
            <h1>Welcome to the Tysyacha Web App
                { // 'Приветствую вас в Игру "Тысячя"'
                }
            </h1>

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
    </div>);
};

export {
    LandingView,
};