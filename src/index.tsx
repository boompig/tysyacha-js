import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import Lounge from "./lounge/lounge";
import { LocalGameView } from "./local-game/local-game-view";
import {ServerView} from "./server/server-view";

console.debug(`path: ${window.location.pathname}`);

switch (window.location.pathname) {
    case '/':
        window.location.href = '/local-ai-game';
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
        ReactDOM.render(
            <React.StrictMode>
                <LocalGameView />
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
serviceWorker.register();