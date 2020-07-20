import React from "react";
import { IGameInfo, IPlayingPhaseInfo, IRoundInfo } from "../api";
import { BiddingHistoryView } from "../bidding-view";
import { Card } from "../cards";
import { Bid, GamePhase, gamePhaseToString, getWinningBid, groupTricksByPlayer, IDeal } from "../game-mechanics";
import { RoundScoringView } from "../local-components/round-scoring-view";
import { PlayerView } from "../player-view";
import { CurrentTrickView } from "../playing-view";
import ScoreView from "../score-view";
import { ApiView } from './api-view';
import { GameInfoView } from "./game-view";
import { PastTricksView } from "./past-tricks-view";
import { AdminTreasureView } from "./admin-treasure-view";

interface IProps {
    roundInfo: IRoundInfo;
    round: number;
    playingPhaseInfo: IPlayingPhaseInfo | null;
}
interface IState {
    isCollapsed: boolean;
}

class RoundInfoView extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            isCollapsed: false,
        };
        this.toggleCollapse = this.toggleCollapse.bind(this);
    }

    toggleCollapse(e: React.SyntheticEvent) {
        e.preventDefault();
        this.setState({
            isCollapsed: !this.state.isCollapsed,
        });
    }

    render() {
        return (<div className="round-info-container">
            <h2>
                <a href="#round-info-collapse" role="button"
                    onClick={(e) => this.toggleCollapse(e)}>
                    <span>Round { this.props.round } Info</span>
                    { this.state.isCollapsed ? <span>&nbsp; (collapsed)</span> : null }
                </a>
            </h2>

            { this.state.isCollapsed ? null :
                <div id="round-info-collapse">
                    <div>Phase - { gamePhaseToString(this.props.roundInfo.phase) }</div>
                    <div>Dealer - { this.props.roundInfo.dealer }</div>
                    { this.props.roundInfo.phase === GamePhase.BIDDING ?
                        <div>Current Bidder - { this.props.roundInfo.biddingPlayer }</div>: null}
                    { this.props.roundInfo.phase === GamePhase.REVEAL_TREASURE && this.props.roundInfo.winningBid ?
                        <div>Winning Bid - {this.props.roundInfo.winningBid.points} ({this.props.roundInfo.winningBid.player})</div> :
                        null}
                    { this.props.roundInfo.phase >= GamePhase.DISTRIBUTE_CARDS && this.props.roundInfo.finalContract ?
                        <div>Final Contract - {this.props.roundInfo.finalContract.points} ({this.props.roundInfo.finalContract.player})</div>:
                        null}
                    { this.props.roundInfo.phase === GamePhase.PLAYING && this.props.playingPhaseInfo ?
                        <div>Current Turn - { this.props.playingPhaseInfo.turn }</div>
                        : null}
                    { this.props.roundInfo.phase === GamePhase.PLAYING && this.props.playingPhaseInfo ?
                        <div>Current Trump - { this.props.playingPhaseInfo.marriage ? this.props.playingPhaseInfo.marriage : "none" }</div>
                        : null}
                </div> }
        </div>);
    }
}

interface IRoundViewProps {
    gameId: string;
    playerNames: string[];
    /**
     * This has the current round for the game
     */
    gameInfo: IGameInfo;

    /**
     * The currently selected round
     */
    round: number;
    roundInfo: IRoundInfo;
    cards: IDeal | null;
    bidHistory: Bid[];
    playingPhaseInfo: IPlayingPhaseInfo | null;
}

interface IRoundViewState {
}

export class RoundView extends React.PureComponent<IRoundViewProps, IRoundViewState> {
    constructor(props: IRoundViewProps) {
        super(props);

        this.state = {
        };

        this.isActivePlayer = this.isActivePlayer.bind(this);
    }

    isActivePlayer(name: string): boolean {
        switch (this.props.roundInfo.phase) {
            case GamePhase.NOT_DEALT:
                return false;
            case GamePhase.BIDDING:
                return name === this.props.roundInfo.biddingPlayer;
            case GamePhase.REVEAL_TREASURE:
                const winningBid = getWinningBid(this.props.bidHistory);
                if (!winningBid) {
                    throw new Error("bid history must always have a winner in the REVEAL_TREASURE phase");
                }
                return winningBid.player === name;
            case GamePhase.DISTRIBUTE_CARDS:
                if (!this.props.roundInfo.finalContract) {
                    throw new Error("final contract must always be set in DISTRIBUTE_CARDS phase");
                }
                return this.props.roundInfo.finalContract.player === name;
            case GamePhase.PLAYING:
                if (!this.props.playingPhaseInfo) {
                    // TODO
                    // throw new Error("playing phase info must be available in the playing phase");
                    return false;
                }
                return this.props.playingPhaseInfo.turn === name;
            default:
                // TODO
                return false;
        }
    }

    render() {
        let contractPlayerIndex = -1;
        if(this.props.roundInfo && this.props.roundInfo.finalContract) {
            contractPlayerIndex = this.props.playerNames.indexOf(this.props.roundInfo.finalContract.player);
        }

        let players = null;
        if (this.props.roundInfo && this.props.roundInfo.phase > GamePhase.NOT_DEALT && this.props.cards && this.props.cards.playerCards) {
            players = this.props.playerNames.map((name: string, i: number) => {
                if(!this.props.cards) {
                    // this should never happen
                    throw new Error('cards not set');
                }
                const playerClass = this.isActivePlayer(name) ? "active-player" : "";

                return (<div key={`player-${i}-container`}>
                    <h5 className={ "player-name " + playerClass }>{name}</h5>
                    <PlayerView key={`player-${i}`}
                        index={i}
                        cards={this.props.cards.playerCards[name]}
                        phase={this.props.roundInfo.phase} />
                </div>);
            });
        }

        let roundScoringView = null;
        if (this.props.roundInfo.phase === GamePhase.SCORING && this.props.roundInfo.finalContract && this.props.playingPhaseInfo && this.props.playingPhaseInfo) {
            const tricksPerPlayer = groupTricksByPlayer(this.props.playerNames, this.props.playingPhaseInfo.pastTricks);
            roundScoringView = <RoundScoringView
                    contract={this.props.roundInfo.finalContract}
                    contractPlayerIndex={contractPlayerIndex}
                    playerNames={this.props.playerNames}
                    tricksTaken={tricksPerPlayer}
                    declaredMarriages={this.props.playingPhaseInfo.declaredMarriages} />;
        }

        const isActiveRound = this.props.round === this.props.gameInfo.round;

        return (<div>
            <h1 className="title">Game { this.props.gameId } - Round { this.props.round }</h1>

            {/* <AdminPlayerView
                playerNames={this.props.playerNames}
                isCollapsed={true} /> */}
            {/* send the game's round */}
            <ScoreView
                round={this.props.gameInfo.round}
                scores={this.props.gameInfo.scores}
                playerNames={this.props.playerNames}
                isCollapsed={this.props.roundInfo.phase !== GamePhase.SCORING && this.props.roundInfo.phase !== GamePhase.NOT_DEALT} />
            <GameInfoView
                gameInfo={this.props.gameInfo}
                isCollapsed={true} />

            <RoundInfoView
                roundInfo={this.props.roundInfo}
                round={this.props.round}
                playingPhaseInfo={this.props.playingPhaseInfo}/>

            { this.props.roundInfo.phase > GamePhase.NOT_DEALT ?
                <BiddingHistoryView
                    isCollapsed={this.props.roundInfo.phase === GamePhase.PLAYING}
                    bids={this.props.bidHistory} /> : null }

            {this.props.playingPhaseInfo && this.props.roundInfo.phase >= GamePhase.PLAYING && this.props.roundInfo.phase < GamePhase.SCORING ?
                <PastTricksView
                    pastTricks={this.props.playingPhaseInfo.pastTricks} /> :
                null }

            { this.props.playingPhaseInfo && this.props.roundInfo.phase >= GamePhase.PLAYING && this.props.roundInfo.phase < GamePhase.SCORING ?
                <CurrentTrickView
                    currentTrick={this.props.playingPhaseInfo.currentTrick} /> :
                null }

            { this.props.roundInfo.phase > GamePhase.NOT_DEALT && this.props.roundInfo.phase <= GamePhase.DISTRIBUTE_CARDS && this.props.cards ?
                <AdminTreasureView
                    treasureCards={this.props.cards.treasure}
                    roundInfo={this.props.roundInfo} />
                : null}

            { this.props.roundInfo.phase  > GamePhase.NOT_DEALT && this.props.roundInfo.phase < GamePhase.SCORING ?
                <div className="admin-player-cards-container">
                    <h3>Player Cards</h3>

                    {players}
                </div> : null}

            { roundScoringView }

            { isActiveRound ?
                <ApiView roundInfo={this.props.roundInfo}
                    gameInfo={this.props.gameInfo}
                    playingPhaseInfo={this.props.playingPhaseInfo}
                    gameId={this.props.gameId}
                    playerNames={this.props.playerNames}
                    playerCards={this.props.cards ? this.props.cards.playerCards : null}
                    treasure={this.props.cards ? this.props.cards.treasure : null}></ApiView>:
                null }
        </div>);
    }
}