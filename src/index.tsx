import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Lounge from "./lounge/lounge";
import { LocalGameView } from "./local-game/local-game-view";
import { ServerView } from "./server/server-view";
import { LandingView } from "./landing/landing-view";
import { Navbar } from './local-game/navbar';
import { RulesView } from './local-game/rules-view';
// import { register } from "./serviceWorkerRegister";

function handleNewRoute(newHash: string) {
    if (newHash === '') {
        newHash = '#landing';
    }
    const url = new URL(window.location.href);
    url.hash = newHash;
    // navigate to that URL
    window.location.href = url.toString();
    console.debug(`[index] hash is now ${newHash}`);
    window.location.reload();
}

console.debug(`hash: ${window.location.hash}`);

switch (window.location.hash) {
    case '':
    case '#':
    case '#landing':
        document.title = 'Tysyacha';

        ReactDOM.render(
            <React.StrictMode>
                <LandingView
                    onNewRoute={ handleNewRoute }/>
            </React.StrictMode>,
            document.getElementById('root')
        );
        break;
    case '#lounge':
        ReactDOM.render(
            <React.StrictMode>
                <Lounge />
            </React.StrictMode>,
            document.getElementById('root')
        );
        break;
    case '#rules': {
        const url = new URL(window.location.href);
        const gameId = url.searchParams.get('gameId') || null;

        ReactDOM.render(
            <React.StrictMode>
                <div className="wrapper">
                    <header>
                        <Navbar gameId={gameId}
                            setNavHash={handleNewRoute} />
                    </header>
                    <main className="container">
                        <RulesView />
                    </main>
                </div>
            </React.StrictMode>,
            document.getElementById('root')
        );
        break;
    }
    case '#local-ai-game':
    case '#scorecard':
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
                    playerName={playerName}
                    onNewRoute={handleNewRoute} />
            </React.StrictMode>,
            document.getElementById('root')
        );
        break;
    case '#server':
        ReactDOM.render(
            <React.StrictMode>
                <ServerView />
            </React.StrictMode>,
            document.getElementById('root')
        );
        break;
    case '#game':
        ReactDOM.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>,
            document.getElementById('root')
        );
        break;
    default:
        ReactDOM.render(
            <p>Unknown hash - { window.location.hash }</p>,
            document.getElementById('root')
        );
        break;
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
// register();