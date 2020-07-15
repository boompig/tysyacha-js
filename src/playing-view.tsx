import React, {useState, useEffect} from 'react';
import API, { MessageType, IPlayCardMessage } from './api';
import { Bid, GamePhase, ITrickCard, isMarriagePlayed, getWinningCard, IPastTrick } from './game-mechanics';
import { PlayerView } from './player-view';
import { Hand, Card, Suit, cardToString } from './cards';

interface ICurrentTrickViewProps {
    currentTrick: ITrickCard[];
}

export function CurrentTrickView(props: ICurrentTrickViewProps) {
    const currentTrickList = props.currentTrick.map((c: ITrickCard, i: number) => {
        return <li key={`trick-card-${i}`}>{ c.card.toString() } - { c.player }</li>
    });

    return <div className="current-trick-container">
        <h3>Current Trick</h3>
        { props.currentTrick.length ?
            <ol>
                {currentTrickList}
            </ol>: <div>no cards in current trick</div>
        }
    </div>;
}

interface IProps {
    name: string;
    playerIndex: number;

    gameId: string;
    round: number;

    finalContract: Bid;
    hand: Hand;
    playerNames: string[];

    api: API;
}

export function PlayingView(props: IProps) {
    const [numTricks, setNumTricks] = useState([] as number[]);
    const [currentTrick, setCurrentTrick] = useState([] as ITrickCard[]);
    const [marriage, setMarriage] = useState(null as Suit | null);
    // player whose turn it is
    const [turn, setTurn] = useState(props.finalContract.player);
    // form state
    const [selectedCard, setSelectedCard] = useState(-1);
    // help us manage server message duplicates
    const [receivedMessages, setReceivedMessages] = useState([] as string[])
    /**
     * The "currentHand" is a view of the hand in light of the trick history
     * This is done to avoid updating the hands at all during this round
     */
    const [currentHand, setCurrentHand] = useState(props.hand);
    const [hasPlayingPhaseInfo, setHasPlayingPhaseInfo] = useState(false);

    async function onPlayCard(e: React.FormEvent) {
        e.preventDefault();

        if(!selectedCard) {
            return;
        }

        // determine if playing a marriage card
        const totalTricks = numTricks.reduce((a: number, b: number) => {
            return a + b;
        }, 0);
        const card = currentHand.cards[selectedCard];
        const isMarriage = isMarriagePlayed(card, currentHand, totalTricks, currentTrick.length === 0);

        // submit the card for consideration to the server
        await props.api.postPlayCard(props.gameId, props.round, props.name,
            card, isMarriage);

        // the playing of the card is processed in the listener
        // here we just remove the card from the player's hand
        const newHandCards = currentHand.cards.slice();
        newHandCards.splice(selectedCard, 1);
        await setCurrentHand(new Hand(newHandCards));
    }

    async function selectCard(e: React.ChangeEvent<HTMLSelectElement>) {
        const i = Number.parseInt(e.target.value);
        await setSelectedCard(i);
    }

    useEffect(() => {
        async function addCardToTrick(msg: IPlayCardMessage) {
            await setReceivedMessages([...receivedMessages, msg.id]);
            if (msg.isMarriage) {
                // update marriage if the last card played caused a marriage
                await setMarriage(msg.card.suit);
            }

            const updatedTrick = [...currentTrick, {
                card: new Card(msg.card.value, msg.card.suit),
                player: msg.player,
            }];

            if (updatedTrick.length === 3) {
                // figure out who won the trick
                const winningTc = getWinningCard(updatedTrick, marriage);
                // reset the current trick
                await setCurrentTrick([]);
                // update the # of tricks they won
                const winnerIndex = props.playerNames.indexOf(winningTc.player);
                const newNumTricks = numTricks.slice();
                newNumTricks[winnerIndex] += 1;
                await setNumTricks(newNumTricks);
                // it is now their turn
                await setTurn(winningTc.player);
            } else {
                await setCurrentTrick(updatedTrick);
                const turnIndex = props.playerNames.indexOf(turn);
                const nextTurnIndex = (turnIndex + 1) % 3;
                await setTurn(props.playerNames[nextTurnIndex]);
            }

        }

        async function getPlayingPhaseInfo() {
            if(!hasPlayingPhaseInfo) {
                // set this early to avoid duplicate requests because of race conditions
                await setHasPlayingPhaseInfo(true);
                const info = await props.api.getPlayingPhaseInfo(props.gameId, props.round);
                await setCurrentTrick(info.currentTrick);
                await setMarriage(info.marriage);
                await setTurn(info.turn);

                // set # tricks
                const numTricksMap: {[key: string]: number} = {};
                info.pastTricks.forEach((trick: IPastTrick) => {
                    numTricksMap[trick.winner] += 1;
                });
                const numTricks: number[] = [];
                props.playerNames.forEach((name: string, i: number) => {
                    numTricks[i] = numTricksMap[name];
                })
                await setNumTricks(numTricks);

                // work out what the current hand is, using past tricks
                // these cards have been played
                const playedCards = info.pastTricks.map((trick: IPastTrick) => {
                    for(let {card, player} of trick.trick) {
                        if (player === props.name) {
                            return cardToString(card);
                        }
                    }
                    throw new Error('card not found');
                });
                const unplayedCards = currentHand.cards.filter((card: Card) => {
                    return !playedCards.includes(card.toString());
                });
                await setCurrentHand(new Hand(unplayedCards));
            }
        }

        props.api.addMessageListener([MessageType.BROADCAST_PLAY_CARD], (msg: IPlayCardMessage) => {
            if (msg.gameId === props.gameId && !receivedMessages.includes(msg.id)) {
                addCardToTrick(msg);
            }
        });

        // to start with, get a bunch of data on the playing phase from the server
        getPlayingPhaseInfo();
    });

    const headerRow = props.playerNames.map((name: string, i: number) => {
        return <th key={`trick-player-${i}`}>{name}</th>;
    });
    const bodyRow = props.playerNames.map((name: string, i: number) => {
        const n = numTricks[i] || 0;
        return <td key={`trick-num-${i}`}>{ n }</td>;
    });
    const cardOptions = props.hand.cards.map((card: Card, i: number) => {
        return <option value={i} key={i}>{ card.toString() }</option>;
    });
    cardOptions.splice(0, 0, <option value={-1} key={-1}>-- select a card to play --</option>);

    return <div className='playing-view'>
        <h3>Final Contract</h3>
        <div>{ props.finalContract.player } is trying to make  { props.finalContract.points } points</div>

        <h3>Tricks</h3>
        <table className='table table-striped table-sm'>
            <thead>
                <tr>{headerRow}</tr>
            </thead>
            <tbody>
                <tr>{ bodyRow }</tr>
            </tbody>
        </table>

        <CurrentTrickView
            currentTrick={currentTrick} />

        <h3>Your Cards</h3>
        <PlayerView
            index={props.playerIndex}
            cards={currentHand}
            phase={GamePhase.PLAYING} />

        <h3>Play Card</h3>
        { turn === props.name ?
            <form onSubmit={(e) => onPlayCard(e)}>
                <label htmlFor='card'>Card</label>
                <select name='card' className='form-control' required={true}
                    onChange={(e) => selectCard(e)}>{ cardOptions }</select>
                <button type='submit' className='btn btn-primary form-control'>Play Card</button>
            </form>:
            <div>Waiting for {turn} to play a card...</div> }
    </div>
}