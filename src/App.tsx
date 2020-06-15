import React, {useState} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Deck, Card, Hand } from './cards';
import {GameView, ICards} from "./game-view"
import { OddsView } from './odds-view';


function App() {
	const [randomSeed, setRandomSeed] = useState(0);
	const [playerCards, setPlayerCards] = useState({} as ICards);
	const [treasureCards, setTreasureCards] = useState([] as Card[]);
	const [isDealt, setIsDealt] = useState(false);

	/**
	 * Deal the cards starting from the initial player
	 * Use the random seed
	 *
	 * NOTE: this does not respect the rule that the last card dealt cannot be a 9
	 */
	function dealCards() {
		// create the deck using the random seed
		const deck = new Deck(randomSeed);

		// indexes 0-2 are players
		const playerCards : ICards = {};
		const treasureCards : Card[] = [];

		// deal the cards out
		// #players always 3

		// deal cards to players (0-2)
		for(let i = 0; i < 3; i++) {
			const h = []
			// deal 7 cards to each player
			for(let j = 0; j < 7; j++) {
				h.push(deck.pop());
			}
			playerCards[i] = new Hand(h);
		}

		// deal cards to treasure (3)
		for(let i = 0; i < 3; i++) {
			treasureCards.push(deck.pop());
		}

		setPlayerCards(playerCards);
		setTreasureCards(treasureCards);
		setIsDealt(true);
	}

	if(!isDealt) {
		dealCards();
	}

	return (
		<div className="App">
			<main className="container">
				<OddsView />
				{/* <form className="random-seed-form">
					<div className="form-group">
						<label htmlFor="random_seed">Random Seed</label>
						<input className="form-control"
							type="number" min={0} max={10000}
							name="random_seed" id="random_seed"
							defaultValue={randomSeed}
							onChange={(e) => setRandomSeed(Number(e.target.value))} />
					</div>
					<button type="button"
						className="btn btn-primary form-control"
						onClick={() => dealCards()}>Deal</button>
				</form> */}

				{isDealt ?
					<GameView playerCards={playerCards}
						treasureCards={treasureCards} /> : null}
			</main>
		</div>
	);
}

export default App;
