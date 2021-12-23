import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import Lounge from "./lounge/lounge";

console.log(window.location.pathname);

if(window.location.pathname === "/") {
	window.location.href = "/lounge";
} else if(window.location.pathname === "/lounge") {
	ReactDOM.render(
		<React.StrictMode>
			<Lounge />
		</React.StrictMode>,
		document.getElementById('root')
	);
} else {
	ReactDOM.render(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
		document.getElementById('root')
	);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
