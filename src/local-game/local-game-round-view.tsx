import React, { PureComponent } from "react";
import "../card.css";
import { Card, CardValue, Deck, Hand, Suit } from "../cards";
import { DistributeCardsView } from "./distribute-cards-view";
import { Bid, GamePhase, getWinningCard, ITrickCard } from "../game-mechanics";
import { CardView } from "../local-components/card-view";
import { PlayerView } from "../local-components/player-view";
import { RoundScoringView } from "../local-components/round-scoring-view";
import { BiddingView } from "./bidding-view";
import { RevealTreasureView } from "./reveal-treasure-view";
import { TrickTakingView } from "./trick-taking-view";

interface ITestRoundProps {
    gameId: string;
    roundNum: number;

    /**
     * Can optionally set a random seed to control the results (repro)
     * Do not change this halfway through the round, that will result in undefined behaviour
     */
    randomSeed: number;

    /**
     * True iff we want to show all players' cards, not just the human player's
     */
    isAllCardsShown: boolean;
    /**
     * Which player is the local player (the one who is in control)
     */
    localPlayerIndex: number;
    playerNames: string[];
    dealerIndex: number;
    /**
     * The number of consecutive failed deals
     */
    numFailedDeals: number;
    onRoundOver: (scores: {[key: string]: number}, isEarlyExit: boolean) => any;
    onChangePhase(phase: GamePhase): void;
}

interface ILocalRoundState {
    phase: GamePhase;

    // set after deal phase
    playerHands: {[key: string]: Hand};
    treasure: Card[];

    // set after bidding phase
    /**
     * This is the player who owns the contract
     */
    contractPlayerIndex: number;
    currentContract: Bid | null;

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

interface ISavedRoundState {
    phase: GamePhase;

    // after deal phase (and REVEAL_TREASURE and DISTRIBUTE_CARDS)
    // the playerHands are changed during the playing phase
    playerHands: {[key: string]: Hand};
    treasure: Card[];

    // after bid phase
    currentContract: Bid | null;
    contractPlayerIndex: number;

    // during playing phase
    activePlayerIndex: number;
}

/**
 * This is the game.
 */
export class LocalGameRoundView extends PureComponent<ITestRoundProps, ILocalRoundState> {
    constructor(props: ITestRoundProps) {
        super(props);

        // init tricks taken
        const tricksTaken = Object.fromEntries(this.props.playerNames.map((name: string) => {
            return [name, []];
        }));

        this.state = {
            // general info
            phase: GamePhase.NOT_DEALT,

            // dealing
            playerHands: {},
            treasure: [],

            // bidding
            currentContract: null,
            contractPlayerIndex: 0,

            // treasure distribution
            // nothing here

            // playing / trick-taking
            /**
             * Whose turn it is to play
             */
            activePlayerIndex: (this.props.dealerIndex + 1) % 3,
            currentTrick: [],
            trumpSuit: null,
            tricksTaken: tricksTaken,
            // this is used for logging and accounting
            // obviously can be inferred in other ways
            trickNumber: 0,
            declaredMarriages: {},
        };

        // event handlers
        this.dealCards = this.dealCards.bind(this);
        this.handleCompleteBidding = this.handleCompleteBidding.bind(this);
        this.handleFinalizeContract = this.handleFinalizeContract.bind(this);
        this.handleDistributeCards = this.handleDistributeCards.bind(this);
        this.handlePlayCard = this.handlePlayCard.bind(this);
        this.handleNextRound = this.handleNextRound.bind(this);
        this.handleDismissTrick = this.handleDismissTrick.bind(this);
        this.resetRound = this.resetRound.bind(this);
        // state operations
        this.readSavedState = this.readSavedState.bind(this);
        this.persistState = this.persistState.bind(this);
    }

    componentDidMount() {
        this.readSavedState().then((state: ISavedRoundState | null) => {
            if (!state) {
                this.persistState();
            } else {
                this.setState({
                    phase: state.phase,

                    playerHands: state.playerHands,
                    treasure: state.treasure,

                    currentContract: state.currentContract,
                    contractPlayerIndex: state.contractPlayerIndex,

                    activePlayerIndex: state.activePlayerIndex,
                });
            }
        });
    }

    /**
     * Persist the current state
     */
    persistState() {
        console.debug(`Persisting state for game ${this.props.gameId} and round ${this.props.roundNum}...`)
        let sState = JSON.stringify({
            phase: this.state.phase,
            // after dealing (and card distribution)
            playerHands: this.state.playerHands,
            treasure: this.state.treasure,
            // after bidding
            currentContract: this.state.currentContract,
            contractPlayerIndex: this.state.contractPlayerIndex,
            // after card distribution
            activePlayerIndex: this.state.activePlayerIndex,
        } as ISavedRoundState);
        window.localStorage.setItem(`game:${this.props.gameId}:round:${this.props.roundNum}`, sState);
        console.debug('state has been persisted');
    }

    /**
     * Read prior saved state for this round and return it
     * Return null if we fail to find it
     */
    async readSavedState(): Promise<ISavedRoundState | null> {
        console.debug(`Trying to load saved state from local storage for game ${this.props.gameId} and round ${this.props.roundNum}...`);
        let sState = window.localStorage.getItem(`game:${this.props.gameId}:round:${this.props.roundNum}`);
        if (sState) {
            let state = JSON.parse(sState) as ISavedRoundState;
            // parse the cards into card objects
            const newHands = {} as {[key: string]: Hand};
            Object.entries(state.playerHands).forEach(([player, hand]) => {
                const cards = hand.cards.map((card: Card) => {
                    return new Card(card.value, card.suit);
                });
                newHands[player] = new Hand(cards);
            });
            state.playerHands = newHands;

            const newTreasure = state.treasure.map((card) => {
                return new Card(card.value, card.suit);
            });
            state.treasure = newTreasure;

            console.debug(state);
            return state;
        } else {
            console.debug('not found');
            return null;
        }
    }

    /**
     * Called by the contract holder
     * Finalizes the contract
     * Advances the phase to DISTRIBUTE_CARDS
     */
    handleFinalizeContract(contractPoints: number) {
        console.assert(this.state.phase === GamePhase.REVEAL_TREASURE);
        if (!this.state.currentContract) {
            throw new Error('there must be an existing contract');
        }
        if (contractPoints < this.state.currentContract.points) {
            throw new Error('cannot reduce contract point value');
        }

        const contractPlayerName = this.state.currentContract.player;

        const newContract: Bid = {
            player: contractPlayerName,
            points: contractPoints,
        };

        // move the treasure into the contract player's hand
        const oldCards = this.state.playerHands[contractPlayerName].cards;
        const newCards = [...oldCards, ...this.state.treasure];
        const newPlayerHands = Object.assign({}, this.state.playerHands);
        newPlayerHands[contractPlayerName] = new Hand(newCards);

        this.setState({
            currentContract: newContract,
            phase: GamePhase.DISTRIBUTE_CARDS,
            playerHands: newPlayerHands,
        }, () => {
            this.persistState();
        });
    }

    /**
     * A given player plays the given card (on their turn)
     * NOTE: no sanity checking here
     */
    handlePlayCard(playerIndex: number, cardIndex: number) {
        if (playerIndex !== this.state.activePlayerIndex) {
            throw new Error('can only call this method to play a card by the active player');
        }

        if (this.state.currentTrick.length >= 3) {
            throw new Error('cannot play additional cards after the current trick has 3 or more cards');
        }

        const playerName = this.props.playerNames[playerIndex];
        const card = this.state.playerHands[playerName].cards[cardIndex];
        console.log(`[trick ${this.state.trickNumber}] ${playerName} -> card ${card}`);
        let isMarriage = false;

        // add card to the current trick
        const currentTrick = this.state.currentTrick.slice();
        currentTrick.push({
            card: card,
            player: playerName,
        });

        // a little trick here - if the card played is part of a marriage, the marriage is auto-declared
        // NOTE: use *previous* hand here, not the new hand
        if(currentTrick.length === 1 && (card.value === CardValue.KING || card.value === CardValue.QUEEN) &&
            this.state.tricksTaken[playerName].length > 0) {
            // check to see if they have the other card
            const hand = this.state.playerHands[playerName];
            if(hand.marriages.includes(card.suit)) {
                console.log(`[trick ${this.state.trickNumber}] ${playerName} declared a ${card.suit} marriage`);
                isMarriage = true;
            }
        }

        // remove card from player hand
        const newCards = this.state.playerHands[playerName].cards.slice();
        newCards.splice(newCards.indexOf(card), 1);
        const playerHands = Object.assign({}, this.state.playerHands);
        playerHands[playerName] = new Hand(newCards);

        if (currentTrick.length === 3) {
            const winner = getWinningCard(currentTrick, this.state.trumpSuit);
            const winningPlayerIndex = this.props.playerNames.indexOf(winner.player);
            // update current trick and player hands
            // update who the next player is
            // but *do not* move the current trick into past tricks
            // also *do not* update the phase
            this.setState({
                currentTrick: currentTrick,
                playerHands: playerHands,
                activePlayerIndex: winningPlayerIndex,
            });
        } else {
            const nextPlayer = (this.state.activePlayerIndex + 1) % 3;
            let declaredMarriages = this.state.declaredMarriages;
            if(isMarriage) {
                declaredMarriages = Object.assign({}, this.state.declaredMarriages);
                if(!(playerName in declaredMarriages)) {
                    declaredMarriages[playerName] = [];
                }
                declaredMarriages[playerName].push(card.suit);
            }
            this.setState({
                currentTrick: currentTrick,
                activePlayerIndex: nextPlayer,
                trumpSuit: isMarriage ? card.suit : this.state.trumpSuit,
                declaredMarriages: declaredMarriages,
                playerHands: playerHands,
            });
        }
    }
    /**
     * Once a trick is complete, it is shown to the player
     * This button dismisses the trick
     * This function should be called by the human player
     * Note that the player hands have already been updated
     */
    handleDismissTrick() {
        const winner = getWinningCard(this.state.currentTrick, this.state.trumpSuit);
        const winningPlayerIndex = this.props.playerNames.indexOf(winner.player);
        // wrap up the trick
        const pastTricks = {} as { [key: string]: ITrickCard[][] };
        Object.assign(pastTricks, this.state.tricksTaken);
        const winningPlayerName = this.props.playerNames[winningPlayerIndex];
        pastTricks[winningPlayerName].push(this.state.currentTrick);
        console.log(`[trick ${this.state.trickNumber}] ${winningPlayerName} won the trick. They play the next hand.`);
        let isDone = false;

        if (this.state.playerHands[winner.player].cards.length === 0) {
            // we're done
            isDone = true;
        }

        this.setState({
            currentTrick: [],
            activePlayerIndex: winningPlayerIndex,
            tricksTaken: pastTricks,
            phase: isDone ? GamePhase.SCORING : GamePhase.PLAYING,
            trickNumber: this.state.trickNumber + 1,
        });
    }

    /**
     * Handle the case where a player has dealt unsuccessfully 3 times in a row
     */
    handleBolt() {
        // fill out the scores for each player
        // dealer gets -120
        let scores: { [key: string]: number } = {};
        for (let i = 0; i < this.props.playerNames.length; i++) {
            let playerName = this.props.playerNames[i];
            if (i === this.props.dealerIndex) {
                scores[playerName] = -120;
            } else {
                scores[playerName] = 0;
            }
        }
        this.resetRound();
        this.props.onRoundOver(scores, true);
    }

    dealCards() {
        console.log("Dealing cards...");
        const deck = new Deck(this.props.randomSeed);

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

        this.setState({
            treasure: treasure,
            phase: GamePhase.BIDDING,
            playerHands: playerHands,
        }, () => {
            this.props.onChangePhase(GamePhase.BIDDING);
            console.log("cards have been dealt");
            this.persistState();
        });
    }

    /**
     * Remove the selected cards from the contract player
     * Move them (according to the assignments) to the target players
     * This will advance the phase to PLAYING
     * @param cardDistribution Map from player names to card objects
     */
    handleDistributeCards(cardDistribution: {[key: string]: Card}) {
        console.assert(this.state.phase === GamePhase.DISTRIBUTE_CARDS);
        console.assert(Object.keys(cardDistribution).length === 2);
        console.assert(this.state.treasure.length === 3);

        const contractPlayerName = this.props.playerNames[this.state.contractPlayerIndex];
        // the "big hand" is composed out of the cards in that player's hand and the treasure cards
        // this was previously created in the REVEAL_TREASURE phase
        const playerBigHand = this.state.playerHands[contractPlayerName].cards;

        const newPlayerHands = Object.assign({}, this.state.playerHands);

        for(const [name, card] of Object.entries(cardDistribution)) {
            if (name === contractPlayerName) {
                throw new Error('cannot assign card to yourself');
            }

            const i = playerBigHand.indexOf(card);
            if (i === -1) {
                throw new Error('cannot find the card in the big hand');
            }

            if (name in newPlayerHands) {
                // add the card to the new player
                const cards = newPlayerHands[name].cards.slice();
                cards.push(card);
                newPlayerHands[name] = new Hand(cards);

                // remove the card from the big hand
                playerBigHand.splice(i, 1);
            } else {
                throw new Error(`name ${name} must be in playerHands`);
            }
        }

        // we have now distributed the cards
        // but our original person's hand is not quite right
        // just need to set it to the big hand
        newPlayerHands[contractPlayerName] = new Hand(playerBigHand);

        this.setState({
            playerHands: newPlayerHands,
            phase: GamePhase.PLAYING,
            // the person with the contract goes first
            activePlayerIndex: this.state.contractPlayerIndex,
        }, () => {
            this.persistState();
        });
    }

    resetRound(): void {
        const tricksTaken = Object.fromEntries(this.props.playerNames.map((name: string) => {
            return [name, []];
        }));

        this.setState({
            // general info / phase
            phase: GamePhase.NOT_DEALT,

            // dealing
            treasure: [],
            playerHands: {},

            // bidding
            currentContract: null,
            contractPlayerIndex: -1,

            // treasure distribution

            // playing
            activePlayerIndex: -1,
            currentTrick: [],
            trumpSuit: null,
            tricksTaken: tricksTaken,
            trickNumber: 0,
            declaredMarriages: {},
        }, () => {
            this.persistState();
        });
    }

    handleCompleteBidding(winningBid: Bid | null): void {
        console.log('bidding is complete');
        if(winningBid) {
            const i = this.props.playerNames.indexOf(winningBid.player);
            this.setState({
                currentContract: winningBid,
                contractPlayerIndex: i,
                phase: GamePhase.REVEAL_TREASURE,
            }, () => {
                this.props.onChangePhase(GamePhase.REVEAL_TREASURE);
                this.persistState();
            });
        } else {
            this.props.onRoundOver({}, true);
        }
    }

    handleNextRound(scores: {[key: string]: number}): void {
        this.props.onRoundOver(scores, false);
        this.resetRound();
    }

    render(): JSX.Element {
        const playerHands = this.props.playerNames.map((name: string, i: number) => {
            return <PlayerView key={`player-${i}`}
                name={name}
                playerIndex={i}
                hand={this.state.playerHands[name]}
                phase={this.state.phase}
                isDealer={i === this.props.dealerIndex}
                isContractPlayer={i === this.state.contractPlayerIndex}
                isActivePlayer={i === this.state.activePlayerIndex}
                tricksTaken={this.state.tricksTaken[name]}
                onCardSelect={this.handlePlayCard}
                numTricksTaken={this.state.tricksTaken[name].length}
                showCards={this.props.isAllCardsShown || (i === this.props.localPlayerIndex)} />
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
                    <button type="button" className="btn btn-success btn-lg"
                        onClick={this.dealCards}>Deal</button>
                </div>;
            }
            case GamePhase.BIDDING: {
                return <BiddingView
                    playerNames={this.props.playerNames}
                    dealerIndex={this.props.dealerIndex}
                    playerHands={this.state.playerHands}
                    onNextPhase={this.handleCompleteBidding}
                    localPlayerIndex={this.props.localPlayerIndex} />
            }
            case GamePhase.REVEAL_TREASURE: {
                if (!this.state.currentContract) {
                    throw new Error('Current contract is not set in REVEAL_TREASURE phase');
                }
                return <RevealTreasureView
                    // game props
                    localPlayerIndex={this.props.localPlayerIndex}
                    playerNames={this.props.playerNames}
                    dealerIndex={this.props.dealerIndex}
                    // round props
                    playerHands={this.state.playerHands}
                    contractPlayerIndex={this.state.contractPlayerIndex}
                    contractPoints={this.state.currentContract.points}
                    treasure={this.state.treasure}
                    onFinalizeContract={this.handleFinalizeContract} />;
            }
            case GamePhase.DISTRIBUTE_CARDS: {
                if (!this.state.currentContract) {
                    throw new Error('Current contract is not set in DISTRIBUTE_CARDS phase');
                }

                return <DistributeCardsView
                    // game props
                    localPlayerIndex={this.props.localPlayerIndex}
                    playerNames={this.props.playerNames}
                    dealerIndex={this.props.dealerIndex}
                    // round props
                    playerHands={this.state.playerHands}
                    contractPlayerIndex={this.state.contractPlayerIndex}
                    contractPoints={this.state.currentContract.points}
                    onDistribute={this.handleDistributeCards} />;
            }
            case GamePhase.PLAYING: {
            // playing
                if(!this.state.currentContract) {
                    throw new Error("there must be a contract in this pahse");
                }

                return <TrickTakingView
                    // properties of the game
                    playerNames={this.props.playerNames}
                    localPlayerIndex={this.props.localPlayerIndex}
                    dealerIndex={this.props.dealerIndex}

                    // properties of the round
                    contractPlayerIndex={this.state.contractPlayerIndex}
                    contractPoints={this.state.currentContract.points}
                    playerHands={this.state.playerHands}
                    currentTrick={this.state.currentTrick}
                    activePlayerIndex={this.state.activePlayerIndex}
                    tricksTaken={this.state.tricksTaken}
                    trumpSuit={this.state.trumpSuit}
                    numPastTricks={this.state.trickNumber}

                    // callbacks
                    onPlayCard={this.handlePlayCard}
                    onDimissTrick={this.handleDismissTrick}
                />
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