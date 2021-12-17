import React, { ChangeEvent } from 'react';
import API, { IRoundInfo, IGameInfo, IPlayingPhaseInfo } from '../api';
import { GamePhase, ITrickCard, IPastTrick } from '../game-mechanics';
import { DistributeCardsView } from './distribute-cards-view';
import { Hand, Card, CardValue } from '../cards';
import { CardView } from '../local-components/card-view';
import { PlayerView } from '../local-components/player-view';

interface IProps {
    gameId: string;
    gameInfo: IGameInfo;
    roundInfo: IRoundInfo;
    playingPhaseInfo: IPlayingPhaseInfo | null;
    playerCards: {[key: string]: Hand} | null;
    treasure: Card[] | null;
    playerNames: string[];
}

interface IState {
    api: API;

    /**
     * Multi-functions as bid during bid phase
     * And final contract during REVEAL_TREASURE phase
     */
    bid: number;

    /**
     * Cards selected in the DISTRIBUTE_CARDS phase
     */
    selectedCards: {[key: string] : Card};
}

export class ApiView extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            api: new API(),
            bid: -1,
            selectedCards: {},
        };

        this.onDealClick = this.onDealClick.bind(this);
        this.onBidChange = this.onBidChange.bind(this);
        this.onBidClick = this.onBidClick.bind(this);
        this.onPassClick = this.onPassClick.bind(this);
        this.onFinalizeContractClick = this.onFinalizeContractClick.bind(this);
        this.toggleSelectCard = this.toggleSelectCard.bind(this);
        this.onDistribute = this.onDistribute.bind(this);
        this.onPlayCard = this.onPlayCard.bind(this);
        this.onNextRound = this.onNextRound.bind(this);
    }

    async toggleSelectCard(targetPlayer: string, card: Card) {
        const selectedCards = Object.assign({}, this.state.selectedCards);
        selectedCards[targetPlayer] = card;
        this.setState({
            selectedCards,
        });
    }

    async onDealClick() {
        await this.state.api.postDealCards(
            this.props.gameId,
            this.props.gameInfo.round,
            this.props.roundInfo.dealer,
        );
        // easier to just reload
        window.location.reload();
    }

    onBidChange(e: ChangeEvent<HTMLInputElement>) {
        const bid = Number.parseInt((e.target as HTMLInputElement).value);
        this.setState({
            bid: bid,
        });
    }

    async onPassClick(e: React.SyntheticEvent) {
        e.preventDefault();
        await this.state.api.postBid(
            this.props.gameId,
            this.props.gameInfo.round,
            this.props.roundInfo.biddingPlayer,
            0
        );
        // easier to just reload
        window.location.reload();
    }

    async onBidClick() {
        await this.state.api.postBid(
            this.props.gameId,
            this.props.gameInfo.round,
            this.props.roundInfo.biddingPlayer,
            this.state.bid,
        );
        // easier to just reload
        window.location.reload();
    }

    async onFinalizeContractClick() {
        if(!this.props.roundInfo.winningBid) {
            throw new Error('Cannot finalize contract without having a winning bid');
        }
        await this.state.api.postFinalContract(
            this.props.gameId,
            this.props.gameInfo.round,
            this.props.roundInfo.winningBid.player,
            this.state.bid,
        );
        // easier to just reload
        window.location.reload();
    }

    async onDistribute() {
        if(!this.props.roundInfo.finalContract) {
            throw new Error('Cannot distribute cards without having a final contract');
        }

        if(!this.props.playerCards || !this.props.treasure) {
            throw new Error('player cards or treasure not set');
        }

        // given selected cards, figure out what's kept and what's given away
        if(Object.keys(this.state.selectedCards).length !== 2) {
            throw new Error('Must select 2 players and 1 card per player');
        }

        const keptCards : Card[] = [];
        const givingAwayCards = Object.values(this.state.selectedCards);
        this.props.playerCards[this.props.roundInfo.finalContract.player].cards.forEach((card: Card) => {
            if (!givingAwayCards.includes(card)) {
                keptCards.push(card);
            }
        });
        this.props.treasure.forEach((card: Card) => {
            if (!givingAwayCards.includes(card)) {
                keptCards.push(card);
            }
        });

        if(keptCards.length !== 8) {
            throw new Error('kept cards must be 8 cards in length');
        }

        await this.state.api.postDistributeCards(
            this.props.gameId,
            this.props.gameInfo.round,
            this.props.roundInfo.finalContract.player,
            this.state.selectedCards,
            keptCards,
        );
        // easier to just reload
        window.location.reload();
    }

    async onPlayCard(playerIndex: number, cardIndex: number) {
        if(!this.props.playerCards) {
            throw new Error('player cards not set');
        }

        const player = this.props.playerNames[playerIndex];
        const hand = this.props.playerCards[player];
        const card = hand.cards[cardIndex];

        // is this a marriage
        let isMarriage = false;
        if (hand.marriages.includes(card.suit) && (card.value === CardValue.KING || card.value === CardValue.QUEEN)) {
            isMarriage = true;
        }

        await this.state.api.postPlayCard(
            this.props.gameId,
            this.props.gameInfo.round,
            player,
            card,
            isMarriage,
        );
        // easier to just reload
        window.location.reload();
    }

    async onNextRound() {
        await this.state.api.postEndRound(
            this.props.gameId,
            this.props.gameInfo.round,
            this.props.gameInfo.creator
        );

        // easier to just load the game page again
        window.location.href = `/server?game=${this.props.gameId}`;
    }

    render() {
        let playerView = null;
        if (this.props.roundInfo.phase === GamePhase.PLAYING && this.props.playingPhaseInfo && this.props.roundInfo.finalContract && this.props.playerCards) {
            let player = this.props.playingPhaseInfo.turn;
            let numTricksTaken = 0;
            let tricksTaken: ITrickCard[][] = [];
            this.props.playingPhaseInfo.pastTricks.map((trick: IPastTrick) => {
                if(trick.winner === player) {
                    numTricksTaken += 1;
                    tricksTaken.push(trick.trick);
                }
            });

            playerView = <PlayerView
                name={this.props.playingPhaseInfo.turn}
                playerIndex={this.props.playerNames.indexOf(player)}
                hand={this.props.playerCards[player]}
                phase={this.props.roundInfo.phase}
                isDealer={this.props.roundInfo.dealer === player}
                isContractPlayer={this.props.roundInfo.finalContract.player === player}
                isActivePlayer={true}
                numTricksTaken={numTricksTaken}
                tricksTaken={tricksTaken}
                onCardSelect={this.onPlayCard}
                // TODO
                showCards={false} />;
        }

        return (<div className="btn-container">
            { this.props.roundInfo.phase === GamePhase.NOT_DEALT ?
                <button className="btn btn-success"
                    disabled={this.props.roundInfo.phase !== GamePhase.NOT_DEALT}
                    onClick={this.onDealClick}>Deal - {this.props.roundInfo.dealer }</button>
                : null }

            { this.props.roundInfo.phase === GamePhase.BIDDING ?
                <form className="bidding-form">
                    <h3>Bidding</h3>
                    <label htmlFor="bid">Bid for {this.props.roundInfo.biddingPlayer } </label>
                    <input type="number" name="bid" className="form-control"
                        placeholder="enter bid"
                        min={100}
                        max={500}
                        disabled={ this.props.roundInfo.phase !== GamePhase.BIDDING }
                        onChange={(e) => this.onBidChange(e) } />
                    <button className="btn btn-info form-control" type="button"
                        onClick={(e) => this.onPassClick(e)}>Send Pass - { this.props.roundInfo.biddingPlayer }</button>
                    <button className="btn btn-success form-control" type="button"
                        onClick={this.onBidClick}>Send Bid - { this.props.roundInfo.biddingPlayer }</button>
                </form> : null }

            { this.props.roundInfo.phase === GamePhase.REVEAL_TREASURE && this.props.roundInfo.winningBid ?
                <form className="final-contract-form">
                    <h3>Final Contract</h3>
                    <label htmlFor="bid">Final Contract for {this.props.roundInfo.winningBid.player } </label>
                    <input type="number" name="bid" className="form-control"
                        placeholder="enter final contract"
                        min={this.props.roundInfo.winningBid.points}
                        max={500}
                        onChange={(e) => this.onBidChange(e) } />
                    <button className="btn btn-success form-control" type="button"
                        onClick={this.onFinalizeContractClick}>Finalize Contract - {this.props.roundInfo.winningBid.player}</button>
                </form>
                : null}

            {this.props.roundInfo.phase === GamePhase.DISTRIBUTE_CARDS && this.props.roundInfo.finalContract && this.props.playerCards && this.props.treasure ?
                <DistributeCardsView
                    contractPlayerCards={this.props.playerCards[this.props.roundInfo.finalContract.player]}
                    treasureCards={this.props.treasure}
                    selectedCards={this.state.selectedCards}
                    playerNames={this.props.playerNames}
                    contractPlayer={this.props.roundInfo.finalContract.player}
                    onSelect={this.toggleSelectCard}
                    onDistribute={this.onDistribute} />
                : null}

            { playerView }

            {this.props.roundInfo.phase === GamePhase.SCORING ?
                <form className="next-round-form">
                    <button type="button" className="btn btn-primary"
                        onClick={(e) => this.onNextRound()}>Next Round</button>
                </form> : null}
        </div>);
    }
}