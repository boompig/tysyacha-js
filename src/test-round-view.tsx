import React, { PureComponent } from "react";
import "./card.css";
import { Card, CardValue, Deck, Hand, Suit } from "./cards";
import { Bid, canPlayCard, GamePhase, getWinningCard, ITrickCard } from "./game-mechanics";
import { CardView } from "./local-components/card-view";
import {PlayerView} from "./local-components/player-view";
import { RoundScoringView } from "./local-components/round-scoring-view";
import { BiddingView } from "./local-components/bidding-view";

interface ITestRoundProps {
    playerNames: string[];
    dealerIndex: number;
    onRoundOver: (scores: {[key: string]: number}, isEarlyExit: boolean) => any;
}

interface ITestRoundState {
    playerHands: {[key: string]: Hand};
    treasure: Card[];
    isBigHand: boolean;

    phase: GamePhase;

    /**
     * This is the player who owns the contract
     */
    contractPlayerIndex: number;
    currentContract: Bid | null;

    selectedTreasureCards: {[key: string]: Card};

    // playing phase
    activePlayerIndex: number;
    currentTrick: ITrickCard[];
    trumpSuit: Suit | null;
    tricksTaken: {[key: string]: ITrickCard[][]};
    trickNumber: number;
    /**
     * This is used for scoring purposes
     */
    declaredMarriages: {[key: string]: Suit[]};
}

/**
 * This is the game.
 */
export class TestRoundView extends PureComponent<ITestRoundProps, ITestRoundState> {
    constructor(props: ITestRoundProps) {
        super(props);

        // init tricks taken
        const tricksTaken = Object.fromEntries(this.props.playerNames.map((name: string) => {
            return [name, []];
        }));

        this.state = {
            playerHands: {},
            treasure: [],
            isBigHand: false,

            currentContract: null,
            contractPlayerIndex: 0,

            phase: GamePhase.NOT_DEALT,

            selectedTreasureCards: {},

            // the current bidder, since we start in the bidding phase
            activePlayerIndex: 0,

            currentTrick: [],
            trumpSuit: null,
            tricksTaken: tricksTaken,
            // this is used for logging and accounting
            // obviously can be inferred in other ways
            trickNumber: 0,
            declaredMarriages: {},
        };

        this.dealCards = this.dealCards.bind(this);
        this.onPlayCard = this.onPlayCard.bind(this);
        this.onSelectTreasureCard = this.onSelectTreasureCard.bind(this);
        this.distributeTreasureCards = this.distributeTreasureCards.bind(this);
        this.handleCompleteBidding = this.handleCompleteBidding.bind(this);
        this.handleNextRound = this.handleNextRound.bind(this);
        this.resetRound = this.resetRound.bind(this);
    }

    /**
     * This is a helper method to get us to a good state
     */
    async autoPlay() {
        if(this.state.phase !== GamePhase.PLAYING) {
            console.error("phase must be PLAYING to autoplay");
            return;
        }
        console.log("Starting autoplay...");
        while(this.state.phase === GamePhase.PLAYING) {
            // find the active player
            const activePlayer = this.props.playerNames[this.state.activePlayerIndex];
            const hand = this.state.playerHands[activePlayer];
            let cardIndex = -1;
            if(this.state.currentTrick.length === 0 && this.state.trickNumber > 0) {
                // try to declare a marriage
                if(hand.marriages.length > 0) {
                    // pick the first marriage
                    const suit = hand.marriages[0];
                    // find the queen and play it
                    for(let i = 0; i < hand.cards.length; i++) {
                        let card = hand.cards[i];
                        if(card.value === CardValue.QUEEN && card.suit === suit) {
                            cardIndex = i;
                            break
                        }
                    }
                }
            } else if(this.state.currentTrick.length === 0 && this.state.trickNumber === 0) {
                // for the first trick, try to play an ace if you have one
                for(let i = 0; i < hand.cards.length; i++) {
                    let card = hand.cards[i];
                    if(card.value === CardValue.ACE) {
                        cardIndex = i;
                        break;
                    }
                }
            }
            if(cardIndex === -1) {
                // find the cards this player can play
                const playableCards = [];
                for(let i = 0; i < hand.cards.length; i++) {
                    if(canPlayCard(hand, this.state.currentTrick, hand.cards[i])) {
                        playableCards.push(i);
                    }
                }
                // just get the first playable card
                cardIndex = playableCards[0];
            }
            await this.onPlayCard(this.state.activePlayerIndex, cardIndex);
        }
        console.log("Autoplay has finished.");
    }

    // TODO this simplifies testing by getting us into the state I want
    componentDidMount() {
        let contractPlayer = null as string | null;

        // this.dealCards().then(() => {
        //     console.log("cards are dealt");
        //     // find the player with the best hand
        //     let bestScore = 0;

        //     for(let [name, hand] of Object.entries(this.state.playerHands)) {
        //         let score = scoreHand(hand);
        //         let numMarriages = hand.marriages.length;
        //         console.log(`Player ${name} has hand score of ${score} (${numMarriages} marriages)`);
        //         if(score > bestScore) {
        //             contractPlayer = name;
        //             bestScore = score;
        //         }
        //     }

        //     if(!contractPlayer) {
        //         throw new Error("unable to find a contract player");
        //     }

        //     return this.setContract(({
        //         player: contractPlayer,
        //         points: 100
        //     }));
        // }).then(() => {
        //     console.log(`Contract is set. Contract player is ${contractPlayer}`);
        //     // the first treasure card goes to the first unassigned player
        //     let i = 0;
        //     const selectedTreasureCards = {} as {[key: string]: Card};
        //     for(let name of this.props.playerNames) {
        //         if(name !== contractPlayer) {
        //             selectedTreasureCards[name] = this.state.treasure[i];
        //             i++;
        //         }
        //     }
        //     return this.setState({
        //         selectedTreasureCards: selectedTreasureCards,
        //     });
        // }).then(() => {
        //     return this.distributeTreasureCards();
        // }).then(() => {
        //     // return this.autoPlay();
        // });
    }

    /**
     * A given player plays the given card (on their turn)
     * NOTE: no sanity checking here
     */
    async onPlayCard(playerIndex: number, cardIndex: number) {
        const name = this.props.playerNames[playerIndex];
        const card = this.state.playerHands[name].cards[cardIndex];
        console.log(`[trick ${this.state.trickNumber}] ${name} -> card ${card}`);
        let isMarriage = false;

        if(playerIndex === this.state.activePlayerIndex) {
            // add card to the current trick
            let currentTrick = this.state.currentTrick.slice();
            currentTrick.push({
                card: card,
                player: name,
            });

            // a little trick here - if the card played is part of a marriage, the marriage is auto-declared
            // NOTE: use *previous* hand here, not the new hand
            if(currentTrick.length === 1 && (card.value === CardValue.KING || card.value === CardValue.QUEEN) &&
                this.state.tricksTaken[name].length > 0) {
                // check to see if they have the other card
                const hand = this.state.playerHands[name];
                if(hand.marriages.includes(card.suit)) {
                    console.log(`[trick ${this.state.trickNumber}] ${name} declared a ${card.suit} marriage`);
                    isMarriage = true;
                }
            }

            // remove card from player hand
            const newCards = this.state.playerHands[name].cards;
            newCards.splice(newCards.indexOf(card), 1);
            const playerHands = Object.assign({}, this.state.playerHands);
            playerHands[name] = new Hand(newCards);

            if(currentTrick.length === 3) {
                const winner = getWinningCard(currentTrick, this.state.trumpSuit);
                const winningPlayerIndex = this.props.playerNames.indexOf(winner.player);
                // wrap up the trick
                const pastTricks = {} as {[key: string]: ITrickCard[][]};
                Object.assign(pastTricks, this.state.tricksTaken);
                const winningPlayerName = this.props.playerNames[winningPlayerIndex];
                pastTricks[winningPlayerName].push(currentTrick);
                console.log(`[trick ${this.state.trickNumber}] ${winningPlayerName} won the trick. They play the next hand.`);
                let isDone = false;

                if(this.state.playerHands[winner.player].cards.length === 0) {
                    // we're done
                    isDone = true;
                }

                await this.setState({
                    currentTrick: [],
                    activePlayerIndex: winningPlayerIndex,
                    tricksTaken: pastTricks,
                    phase: isDone ? GamePhase.SCORING : GamePhase.PLAYING,
                    trickNumber: this.state.trickNumber + 1,
                    playerHands: playerHands,
                });
            } else {
                const nextPlayer = (this.state.activePlayerIndex + 1) % 3;
                let declaredMarriages = this.state.declaredMarriages;
                if(isMarriage) {
                    declaredMarriages = Object.assign({}, this.state.declaredMarriages);
                    if(!(name in declaredMarriages)) {
                        declaredMarriages[name] = [];
                    }
                    declaredMarriages[name].push(card.suit);
                }
                await this.setState({
                    currentTrick: currentTrick,
                    activePlayerIndex: nextPlayer,
                    trumpSuit: isMarriage ? card.suit : this.state.trumpSuit,
                    declaredMarriages: declaredMarriages,
                    playerHands: playerHands,
                });
            }
        }
    }

    async dealCards() {
        console.log("Dealing cards...");
        const deck = new Deck(1);

        // deal out 3 cards for treasure
        const treasure = [];
        for(let i = 0; i < 3; i++) {
            treasure.push(deck.pop());
        }

        // deal out the rest of the cards
        const playerHands = {} as {[key: string]: Hand};
        for(let i = 0; i < 3; i++) {
            const name = this.props.playerNames[i];
            const handCards = [];
            for(let j = 0; j < 7; j++) {
                handCards.push(deck.pop());
            }
            const hand = new Hand(handCards);
            playerHands[name] = hand;
        }

        await this.setState({
            treasure: treasure,
            phase: GamePhase.BIDDING,
            playerHands: playerHands,
        });
        console.log("cards have been dealt");
    }

    onSelectTreasureCard(cardIndex: number) {
        let d = Object.assign({},
            this.state.selectedTreasureCards
        );
        const card = this.state.treasure[cardIndex];
        if(Object.values(d).includes(card)) {
            // find the key corresponding to the card
            let name = null;
            for(let [playerName, otherCard] of Object.entries(d)) {
                if (otherCard === card) {
                    name = playerName;
                    break;
                }
            }
            if(name) {
                delete d[name];
            }
        } else if(Object.keys(d).length < 2) {
            // who is the player who has not yet been assigned?
            let unassignedName = null;
            const selectingPlayerName = this.props.playerNames[this.state.contractPlayerIndex];
            for(let name of this.props.playerNames) {
                if(name !== selectingPlayerName && !(name in d)) {
                    unassignedName = name;
                    break;
                }
            }
            if(unassignedName) {
                console.log(`Assigned ${card.toString()} to ${unassignedName}`);
                d[unassignedName] = card;
            }
        }

        this.setState({
            selectedTreasureCards: d,
        });
    }

    async distributeTreasureCards() {
        const playerHands = Object.assign({}, this.state.playerHands);
        const remainingCards = this.state.treasure.slice();
        const remainingPlayers = this.props.playerNames.slice();

        console.assert(Object.keys(this.state.selectedTreasureCards).length === 2);

        // first, determine what card the remaining player gets and fill that into m
        const m = Object.assign({}, this.state.selectedTreasureCards);

        for(let [name, card] of Object.entries(this.state.selectedTreasureCards)) {
            let i = remainingCards.indexOf(card);
            remainingCards.splice(i, 1);
            let j = remainingPlayers.indexOf(name);
            remainingPlayers.splice(j, 1);
        }

        console.assert(remainingPlayers.length === 1);
        console.assert(remainingCards.length === 1);
        m[remainingPlayers[0]] = remainingCards[0];

        // next distribute the cards among the players
        for(let [name, card] of Object.entries(m)) {
            const cards = playerHands[name].cards.slice();
            cards.push(card);
            const newHand = new Hand(cards);
            playerHands[name] = newHand;
        }

        await this.setState({
            playerHands: playerHands,
            phase: GamePhase.PLAYING,
            isBigHand: true,
            activePlayerIndex: this.state.contractPlayerIndex,
        });
    }

    resetRound() {
        const tricksTaken = Object.fromEntries(this.props.playerNames.map((name: string) => {
            return [name, []];
        }));

        this.setState({
            // general info
            phase: GamePhase.NOT_DEALT,
            // dealing
            treasure: [],
            playerHands: {},

            // bidding
            currentContract: null,
            contractPlayerIndex: -1,

            // treasure distribution
            selectedTreasureCards: {},
            isBigHand: false,

            // playing
            activePlayerIndex: -1,
            currentTrick: [],
            trumpSuit: null,
            tricksTaken: tricksTaken,
            trickNumber: 0,
            declaredMarriages: {},
        });
    }

    handleCompleteBidding(winningBid: Bid | null) {
        if(winningBid) {
            const i = this.props.playerNames.indexOf(winningBid.player);
            this.setState({
                currentContract: winningBid,
                contractPlayerIndex: i,
                phase: GamePhase.REVEAL_TREASURE,
            });
        } else {
            this.props.onRoundOver({}, true);
        }
    }

    handleNextRound(scores: {[key: string]: number}) {
        this.props.onRoundOver(scores, false);
        this.resetRound()
    }

    render() {
        const playerHands = this.props.playerNames.map((name: string, i: number) => {
            return <PlayerView key={`player-${i}`}
                name={name}
                playerIndex={i}
                isDealer={i === this.props.dealerIndex}
                isContractPlayer={i === this.state.contractPlayerIndex}
                isActivePlayer={i === this.state.activePlayerIndex}
                hand={this.state.playerHands[name]}
                tricksTaken={this.state.tricksTaken[name]}
                onCardSelect={this.onPlayCard}
                numTricksTaken={this.state.tricksTaken[name].length} />
        });

        const trick = this.state.currentTrick.map((trickCard: ITrickCard, i: number) => {
            return <CardView key={`trick-card-${i}`}
                suit={trickCard.card.suit}
                value={trickCard.card.value} />
        });

        switch(this.state.phase) {
            case GamePhase.NOT_DEALT: {
                return <div>
                    <div>{ this.props.playerNames[this.props.dealerIndex] } is dealing</div>
                    <button type="button" className="btn btn-primary btn-lg"
                        onClick={this.dealCards}>Deal</button>
                </div>;
            }
            case GamePhase.BIDDING: {
                // TODO assign a bid for testing
                return <BiddingView
                    playerNames={this.props.playerNames}
                    dealerIndex={this.props.dealerIndex}
                    playerHands={this.state.playerHands}
                    onNextPhase={this.handleCompleteBidding} />
            }
            case GamePhase.REVEAL_TREASURE: {
                const treasureCards = this.state.treasure.map((card: Card, i: number) => {
                    const isSelected = Object.values(this.state.selectedTreasureCards).includes(card);
                    let targetPlayer = null;
                    if(isSelected) {
                        // find the corresponding player name
                        for(let [name, otherCard] of Object.entries(this.state.selectedTreasureCards)) {
                            if(card === otherCard) {
                                targetPlayer = name;
                            }
                        }
                    }
                    return (<div key={`treasure-card-container-${i}`}>
                        <CardView key={`treasure-card-${i}`}
                            suit={card.suit}
                            value={card.value}
                            classNames={isSelected ? ["card-selected"] : []}
                            onClick={(e) => this.onSelectTreasureCard(i)}></CardView>
                        { targetPlayer ?
                            <div className="target-player">sending to {targetPlayer}</div>
                            : null}
                    </div>);
                });
                return (<div className="table container">
                    <div className="dealt-table">
                        <h3>Treasure</h3>
                        <div className="treasure-container">{treasureCards}</div>
                        { Object.keys(this.state.selectedTreasureCards).length === 2 ?
                            <button type="button" className="btn btn-primary btn-lg"
                                onClick={(e) => this.distributeTreasureCards()}
                                >Distribute Cards</button> : null }
                        <div className="player-hands">
                            <h3>Players</h3>
                            {playerHands}
                        </div>
                    </div>
                </div>);
            }
            case GamePhase.PLAYING: {
                // playing
                if(!this.state.currentContract) {
                    throw new Error("there must be a contract in this pahse");
                }

                return <div className="table container">
                    <div className="dealt-table">
                        <div className="game-status">
                            <h3>Status</h3>
                            <div>Contract is for {this.state.currentContract.points} points</div>
                            <div>{ this.state.trumpSuit ? `trump is ${this.state.trumpSuit}` : "no trump yet" }</div>
                        </div>
                        <div className="trick">
                            <h3>Trick</h3>
                            {trick.length === 0 ? "no cards in current trick" :
                                <div className="trick-card-container">
                                    {trick}
                            </div>}
                        </div>
                        <div className="player-hands">
                            <h3>Players</h3>
                            {playerHands}
                        </div>
                        <button type="button" className="btn btn-primary btn-lg"
                            onClick={(e) => this.autoPlay()}>Autoplay</button>
                    </div>
                </div>;
            }
            case GamePhase.SCORING: {
                if(!this.state.currentContract) {
                    throw new Error("there must be a contract in this pahse");
                }
                return <RoundScoringView
                    contract={this.state.currentContract}
                    contractPlayerIndex={this.state.contractPlayerIndex}
                    tricksTaken={this.state.tricksTaken}
                    declaredMarriages={this.state.declaredMarriages}
                    playerNames={this.props.playerNames}
                    onFinish={this.handleNextRound} />
            }
            default:
                return <div>no view for phase {this.state.phase}</div>;
        }
    }
}