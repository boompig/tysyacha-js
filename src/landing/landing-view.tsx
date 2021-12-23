import React, {FC} from "react";
import "./landing-view.css";
import { randInt } from "../utils";

interface IProps {};

const GAME_ID_LENGTH = 6;

/**
 * The game ID is a string containing numbers 0-9 and letters a-z
 * It will be of length GAME_ID_LENGTH
 * This provides a nice balance between entropy (possible values) and length
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

const MAX_GAME_ID = 1e9;

/**
 * Land on this page when you go to the index
 */
const LandingView : FC <IProps> = (props: IProps) => {
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


    return (<div className="wrapper">
        <div className="hero">
            <h1 className="title-text">1000!</h1>
        </div>
        <main>
            <h1>Welcome to the Tysyacha Web App</h1>

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