import React, { FC, useState } from "react";
import { Card, Hand } from "../cards";
import { PlayerView } from "../local-components/player-view";
import { GamePhase } from "../game-mechanics";
import { TableView } from "./table-view";
import AI from "./ai";


interface IDistributeCardsView {
    // game props

    playerNames: string[];
    /**
     * Index of the local (human) player
     */
    localPlayerIndex: number;
    dealerIndex: number;

    // round props

    /**
     * The player hands have been changed so that the contract player holds the treasure cards
     */
    playerHands: {[key: string]: Hand};
    contractPoints: number;
    contractPlayerIndex: number;

    onDistribute: (selectedCards: {[key: string]: Card}) => any;
}

/**
 * NOTE: only show this when the *human player* is distributing the contract cards
 */
const DistributeCardsViewHuman: FC<IDistributeCardsView> = (props: IDistributeCardsView) => {
    if (props.localPlayerIndex !== props.contractPlayerIndex) {
        throw new Error('Only use this view when the human player is distributing the cards');
    }

    const contractPlayerName = props.playerNames[props.contractPlayerIndex]
    const contractPlayerHand = props.playerHands[contractPlayerName];

    // index into playerNames - who we're giving the selected card to
    let [targetPlayer, setTargetPlayer] = useState(-1);
    // index into contractPlayerHand
    let [selectedCard, selectCard] = useState(-1);
    /**
     * The key is the person's name
     * The value is an index into contractPlayerHand
     */
    let [cardDist, setCardDist] = useState({} as {[key: string]: number});

    /**
     * Callback from child when player clicks on a card
     */
    function handleSelectCard(playerIndex: number, cardIndex: number) {
        console.log(cardIndex);
        selectCard(cardIndex);
    }

    function handleSelectTarget(e: React.SyntheticEvent<HTMLInputElement>) {
        const playerIndex = Number.parseInt((e.target as HTMLInputElement).value);
        setTargetPlayer(playerIndex);
    }

    /**
     * Assign the currently selected card to the currently selected player
     */
    function handleAssignCard() {
        if (props.localPlayerIndex === targetPlayer) {
            throw new Error('cannot assign cards to yourself');
        }

        const newCardDist = {} as {[key: string]: number};
        Object.assign(newCardDist, cardDist);

        const targetPlayerName = props.playerNames[targetPlayer];
        newCardDist[targetPlayerName] = selectedCard;

        // and unassign from the other player
        let otherPlayerName = null as string | null;
        for (let i = 0; i < props.playerNames.length; i++) {
            if (i !== props.localPlayerIndex && i !== targetPlayer) {
                otherPlayerName = props.playerNames[i];
            }
        }
        if (otherPlayerName === null) {
            throw new Error('failed to find other player\'s name');
        }
        if (newCardDist[otherPlayerName] === newCardDist[targetPlayerName]) {
            delete(newCardDist[otherPlayerName]);
        }

        setCardDist(newCardDist);
    }

    /**
     * Finalize the card assignments
     */
    function handleFinalizeAssignments() {
        // massage data into format expected by parent
        const selectedCards = {} as {[key: string]: Card};
        Object.entries(cardDist).forEach(([playerName, cardIndex]) => {
            const card = contractPlayerHand.cards[cardIndex];
            selectedCards[playerName] = card;
        });
        // and send it over
        props.onDistribute(selectedCards);
    }

    const humanPlayerName = props.playerNames[props.localPlayerIndex];

    const playerView = (<div>
            <PlayerView
                name={humanPlayerName}
                playerIndex={props.localPlayerIndex}
                hand={contractPlayerHand}
                phase={GamePhase.BIDDING}
                isDealer={props.localPlayerIndex === props.dealerIndex}
                tricksTaken={[]}
                numTricksTaken={0}
                isContractPlayer={props.localPlayerIndex === props.contractPlayerIndex}
                isActivePlayer={props.localPlayerIndex === props.contractPlayerIndex}
                showCards={true}
                selectedCards={selectedCard === -1 ? [] : [selectedCard]}
                assignedCards={Object.values(cardDist)}
                onCardSelect={handleSelectCard} />
        </div>);

    const topInstructions = (<p>
        You won the contract! You hold a contract for {props.contractPoints} points.
        You must now select one card each to distribute to each of your two opponents.</p>);

    let bottomInstructions = null;
    if (selectedCard === -1) {
        bottomInstructions = (<p>Select a card to give away</p>);
    } else {
        bottomInstructions = (<p>You have selected { contractPlayerHand.cards[selectedCard].toString() }</p>)
    }

    let elems = [] as JSX.Element[];
    props.playerNames.forEach((name: string, index: number) => {
        if (index !== props.localPlayerIndex) {
            const elem = <div className="form-check" key={`check-${index}`}>
                <input className="form-check-input" type="radio" name="targetPlayer" value={index}
                    onChange={handleSelectTarget} />
                <label htmlFor="targetPlayer" className="form-check-label">{ name }</label>
            </div>;
            elems.push(elem);
        }
    });
    const targetPlayers = <div className="target-players">
        <p>Select the target player</p>
        { elems }
    </div>;

    let assignmentTable = null;
    if (Object.keys(cardDist).length > 0) {
        let rows = [] as JSX.Element[];
        props.playerNames.forEach((name: string, index: number) => {
            if (index !== props.localPlayerIndex) {
                const elem = <tr key={`row-${index}`}>
                    <td>{ name }</td>
                    <td>{ name in cardDist ? contractPlayerHand.cards[cardDist[name]].toString() : "unassigned" }</td>
                </tr>;
                rows.push(elem);
            }
        });

        assignmentTable = (<div className="assignment-table-container">
            <h2>Assignments</h2>
            <table className="table table-striped">
                <tbody>{rows}</tbody>
            </table>
            <button type="button" className="btn btn-success btn-lg"
                disabled={Object.keys(cardDist).length !== 2}
                onClick={handleFinalizeAssignments}>Finalize Card Assignments</button>
        </div>);
    }

    return (<div className="container distribute-cards-view">
        <div className="dealt-table">

            { topInstructions }

            <div className="player-hand-container">
                <h2>Your Hand</h2>
                {playerView}
            </div>

            { bottomInstructions }

            { targetPlayers }

            { targetPlayer !== -1 && selectedCard !== -1 ?
                <div>
                    <p>Give the { contractPlayerHand.cards[selectedCard].toString() } to {props.playerNames[targetPlayer]}?</p>
                    <button type="button" className="btn btn-success" onClick={handleAssignCard}>OK</button>
                </div>
            : null}

            { assignmentTable }
        </div>
    </div>);
};

/**
 * Show this view if someone other than the current human player is distributing cards
 */
const DistributeCardsViewOther: FC<IDistributeCardsView> = (props: IDistributeCardsView) => {
    const contractPlayerName = props.playerNames[props.contractPlayerIndex];
    const humanPlayerName = props.playerNames[props.localPlayerIndex];

    /**
     * True iff the AI has thought and selected which cards to distribute to both players
     */
    let [isDistributed, setDistributed] = useState(false);
    /**
     * Map from a player's name to the card they will get
     */
    let [assignment, setAssignment] = useState({} as {[key: string]: Card})

    /**
     * Have the AI think about how it wants to distribute cards
     */
    function handleAIDistribute () {
        const newAssignment = AI.distributeCards(props.playerHands[contractPlayerName], props.playerNames, props.contractPlayerIndex);
        setAssignment(newAssignment);
        setDistributed(true);
    }

    /**
     * The player has viewed the card they received from the AI
     * Kick it back to the caller
     */
    function handleContinue () {
        props.onDistribute(assignment);
    }

    let playerHand = props.playerHands[humanPlayerName];
    if (isDistributed) {
        // create a new array
        const playerCards = [...playerHand.cards];
        const newCard = assignment[humanPlayerName];
        playerCards.push(newCard);
        // finally, change the playerHand object
        playerHand = new Hand(playerCards);
    }

    return (<div className="container distribute-cards-view distribute-cards-view-other">
        <TableView
            playerNames={props.playerNames}
            localPlayerIndex={props.localPlayerIndex}
            activePlayerIndex={props.contractPlayerIndex} />

        <p className="instructions">Now the contract player ({contractPlayerName}) will distribute one card to each of the other players (including you).</p>

        { isDistributed ? null :
            <button type="button" className="btn btn-lg btn-info"
                onClick={handleAIDistribute}>Continue</button>
        }

        {
            isDistributed ?
            <div className="post-distribute-text">
                <p>You have just received the card {assignment[humanPlayerName].toString()} from {contractPlayerName}.</p>
                <button type="button" className="btn btn-success btn-lg"
                    onClick={handleContinue}>Continue</button>
            </div>:
            null
        }

        <div className="player-hand-container">
            <h2>Your Hand</h2>
            <PlayerView
                name={humanPlayerName}
                playerIndex={props.localPlayerIndex}
                // reflects the state of the hand before and after card distribution
                hand={playerHand}
                phase={GamePhase.DISTRIBUTE_CARDS}
                isDealer={props.localPlayerIndex === props.dealerIndex}
                tricksTaken={[]}
                numTricksTaken={0}
                isContractPlayer={false}
                isActivePlayer={false}
                showCards={true} />
        </div>
    </div>);
};

const DistributeCardsView: FC<IDistributeCardsView> = (props: IDistributeCardsView) => {
    if (props.localPlayerIndex === props.contractPlayerIndex) {
        return <DistributeCardsViewHuman
            playerNames={props.playerNames}
            localPlayerIndex={props.localPlayerIndex}
            dealerIndex={props.dealerIndex}
            playerHands={props.playerHands}
            contractPoints={props.contractPoints}
            contractPlayerIndex={props.contractPlayerIndex}
            onDistribute={props.onDistribute} />
    } else {
        return <DistributeCardsViewOther
            playerNames={props.playerNames}
            localPlayerIndex={props.localPlayerIndex}
            dealerIndex={props.dealerIndex}
            playerHands={props.playerHands}
            contractPoints={props.contractPoints}
            contractPlayerIndex={props.contractPlayerIndex}
            onDistribute={props.onDistribute} />
    }
};

export {
    DistributeCardsView,
};