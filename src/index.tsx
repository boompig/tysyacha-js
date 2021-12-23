import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Lounge from "./lounge/lounge";
import { LocalGameView } from "./local-game/local-game-view";
import { ServerView } from "./server/server-view";
import { LandingView } from "./landing/landing-view";
// import { register } from "./serviceWorkerRegister";

console.debug(`path: ${window.location.pathname}`);

switch (window.location.pathname) {
    case '/':
        document.title = 'Tysyacha';

        ReactDOM.render(
            <React.StrictMode>
                <LandingView />
            </React.StrictMode>,
            document.getElementById('root')
        );
        break;
    case '/lounge':
        ReactDOM.render(
            <React.StrictMode>
                <Lounge />
            </React.StrictMode>,
            document.getElementById('root')
        );
        break;
    case '/local-ai-game':
        // player name and game ID should be set in the GET string
        const url = new URL(window.location.href);
        const gameId = url.searchParams.get('gameId');
        const playerName = url.searchParams.get('playerName');

        if (!gameId || !playerName) {
            window.location.href = '/';
            break;
        }

        document.title = `Tysyacha | Game ${gameId}`;

        ReactDOM.render(
            <React.StrictMode>
                <LocalGameView
                    gameId={gameId}
                    playerName={playerName}/>
            </React.StrictMode>,
            document.getElementById('root')
        );
        break;
    case '/server':
        ReactDOM.render(
            <React.StrictMode>
                <ServerView />
            </React.StrictMode>,
            document.getElementById('root')
        );
        break;
    case '/game':
        ReactDOM.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>,
            document.getElementById('root')
        );
        break;
    default:
        ReactDOM.render(
            <p>Unknown path</p>,
            document.getElementById('root')
        );
        break;
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
// register();