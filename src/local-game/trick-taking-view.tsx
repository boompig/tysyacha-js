import React, { FC, useState } from "react";
import { Hand, Suit, CardValue } from "../cards";
import { PlayerView } from "../local-components/player-view";
import { GamePhase, ITrickCard, getWinningCard } from "../game-mechanics";
import { CardView } from "../local-components/card-view";
import AI from "./ai";
import { TableView } from "./table-view";

interface IProps {
    // properties of the game
    playerNames: string[];
    localPlayerIndex: number;
    dealerIndex: number;

    // properties of the round
    contractPlayerIndex: number;
    contractPoints: number;
    playerHands: {[key: string]: Hand};
    currentTrick: ITrickCard[];
    activePlayerIndex: number;
    trumpSuit: Suit | null;
    /**
     * Number of tricks that have already been taken in total by all players
     */
    numPastTricks: number;

    /**
     * Map from player name to a list of tricks taken
     */
    tricksTaken: {[key: string]: ITrickCard[][]};

    /**
     * Callback for when a card is played
     */
    onPlayCard(playerIndex: number, cardIndex: number): void;
    /**
      * Once a trick is complete, it is shown to the player
      * This button dismisses the trick
      */
    onDimissTrick(): void;
};

const TrickTakingView: FC<IProps> = (props: IProps) => {
    let [isInstructionsShown, setInstructionsShown] = useState(true);
    let [selectedCard, selectCard] = useState(-1);

    /**
     * Select a card by clicking on it
     */
    function handleSelectCard(playerIndex: number, cardIndex: number) {
        if (cardIndex === selectedCard) {
            selectCard(-1);
        } else {
            selectCard(cardIndex);
        }
    }

    /**
     * Play the currently selected card by the currently active player
     */
    function handlePlayCard() {
        if (selectedCard === -1) {
            throw new Error('no selected card');
        }

        props.onPlayCard(props.activePlayerIndex, selectedCard);

        // de-select this card
        selectCard(-1);
    }

    function handleAITurn() {
        const playerName = props.playerNames[props.activePlayerIndex];
        const hand = props.playerHands[playerName];
        const cardIndex = AI.getCard(hand, props.currentTrick, props.tricksTaken, props.trumpSuit, playerName);
        if (cardIndex < 0 || cardIndex >= hand.cards.length) {
            throw new Error(`AI ${playerName} returned cardIndex ${cardIndex} which is invalid`);
        }
        props.onPlayCard(props.activePlayerIndex, cardIndex);
    }

    const localPlayerName = props.playerNames[props.localPlayerIndex];

    let instructions = null;
    if (props.localPlayerIndex === props.contractPlayerIndex) {
        instructions = (<p className="instructions">
            You are now fulfilling the contract for { props.contractPoints } points.
            Since this is your contract, you get to go first.
            Remember, you can't declare a marriage on the first turn.
        </p>);

    }

    const currentTrickCards = props.currentTrick.map((card: ITrickCard, i: number) => {
        return <CardView key={`card-${i}`} suit={card.card.suit} value={card.card.value} />
    });

    let turnInstructions = null;
    if (props.localPlayerIndex === props.activePlayerIndex && props.currentTrick.length < 3) {
        turnInstructions = 'It is your turn. Play a card.';
    } else if (props.currentTrick.length < 3) {
        turnInstructions = `It is ${props.playerNames[props.activePlayerIndex]}'s turn.`;
    } else if (props.currentTrick.length === 3) {
        const w = getWinningCard(props.currentTrick, props.trumpSuit);
        turnInstructions = `${w.player} has won the trick.`;
    }
    if (props.trumpSuit) {
        turnInstructions += ` The current trump is ${props.trumpSuit}.`;
    } else {
        turnInstructions += ` There is currently no trump suit.`;
    }

    // these are the instructions when a card is selected
    let bottomInstructions = null;
    if (selectedCard !== -1) {
        const card = props.playerHands[localPlayerName].cards[selectedCard];
        if ((card.value === CardValue.KING || card.value === CardValue.QUEEN) && props.currentTrick.length === 0) {
            // check if there is possibly a marriage
            const hand = props.playerHands[localPlayerName];
            if(hand.marriages.includes(card.suit)) {
                if (props.numPastTricks > 0) {
                    bottomInstructions = <div className="alert alert-info">
                        Playing this card will automatically declare the { card.suit } marriage
                    </div>;
                } else {
                    bottomInstructions = <div className="alert alert-warning">
                        <strong>Warning!&nbsp;</strong>You must first take a trick before declaring the { card.suit } marriage
                    </div>;
                }
            }
        }
    }

    return (<div className="trick-taking-view">

        <TableView
            playerNames={props.playerNames}
            localPlayerIndex={props.localPlayerIndex}
            activePlayerIndex={props.activePlayerIndex} />

        { isInstructionsShown ? instructions : null }

        <div className="current-trick-wrapper">
            { props.currentTrick.length > 0 ? <h2>Current Trick</h2> : null }
            <div className="current-trick-container">
                { currentTrickCards }
            </div>
        </div>

        <div className="player-hand-container">
            <div className="turn-container">
                <h5>{ turnInstructions }</h5>
            </div>
            <PlayerView
                name={localPlayerName}
                playerIndex={props.localPlayerIndex}
                hand={props.playerHands[localPlayerName]}
                phase={GamePhase.PLAYING}
                isDealer={props.dealerIndex === props.localPlayerIndex}
                isContractPlayer={props.contractPlayerIndex === props.localPlayerIndex}
                isActivePlayer={props.activePlayerIndex === props.localPlayerIndex}
                showCards={true}
                numTricksTaken={props.tricksTaken[localPlayerName].length}
                tricksTaken={props.tricksTaken[localPlayerName]}
                selectedCards={selectedCard === -1 ? [] : [selectedCard]}
                onCardSelect={handleSelectCard} />

            { bottomInstructions }

            <form>
                {props.activePlayerIndex === props.localPlayerIndex && props.currentTrick.length < 3 ?
                    <button type="button" className="btn btn-success btn-lg play-card-btn"
                        disabled={selectedCard === -1}
                        onClick={handlePlayCard}>Play Card</button>:
                    null}
                { props.activePlayerIndex !== props.localPlayerIndex && props.currentTrick.length < 3 ?
                    <button type="button" className="btn btn-info btn-lg"
                        onClick={handleAITurn}>AI Turn</button>:
                    null}
                { props.currentTrick.length === 3 ?
                    <button type="button" className="btn btn-success btn-lg"
                        onClick={props.onDimissTrick}>OK</button>:
                    null}
            </form>
        </div>
    </div>);
};

export {
    TrickTakingView,
};