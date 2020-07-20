import React from "react";
import {AdminPlayerView, GameInfoView} from "./game-view";
import {IGameInfo, IRoundInfo, IPlayingPhaseInfo} from "../api";
import { gamePhaseToString, IDeal, GamePhase, Bid, getWinningBid, groupTricksByPlayer } from "../game-mechanics";
import { Card } from "../cards";
import { PlayerView } from "../player-view";
import { BiddingHistoryView } from "../bidding-view";
import { CurrentTrickView } from "../playing-view";
import {PastTricksView} from "./past-tricks-view";
import { RoundScoringView } from "../local-components/round-scoring-view";
import {ApiView} from './api-view';
import ScoreView from "../score-view";

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
    gameInfo: IGameInfo;

    round: number;
    roundInfo: IRoundInfo;
    cards: IDeal;
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
        let treasureCards = null;
        if (this.props.roundInfo && this.props.roundInfo.phase > GamePhase.NOT_DEALT) {
            treasureCards = this.props.cards.treasure.map((card: Card, i: number) => {
                return <span key={`treasure-${i}`}>
                    { card.toString() }
                </span>
            });
        }

        let contractPlayerIndex = -1;
        if(this.props.roundInfo && this.props.roundInfo.finalContract) {
            contractPlayerIndex = this.props.playerNames.indexOf(this.props.roundInfo.finalContract.player);
        }

        let players = null;
        if (this.props.roundInfo && this.props.roundInfo.phase > GamePhase.NOT_DEALT) {
            players = this.props.playerNames.map((name: string, i: number) => {
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

        return (<div>
            <h1 className="title">Game { this.props.gameId } - Round { this.props.round }</h1>

            {/* <AdminPlayerView
                playerNames={this.props.playerNames}
                isCollapsed={true} /> */}
            <ScoreView
                scores={this.props.gameInfo.scores}
                playerNames={this.props.playerNames}
                isCollapsed={this.props.roundInfo.phase !== GamePhase.SCORING} />
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

            { this.props.roundInfo.phase > GamePhase.NOT_DEALT && this.props.roundInfo.phase <= GamePhase.DISTRIBUTE_CARDS ?
                <div className="admin-treasure-container">
                    <h3>
                        <span>Treasure</span>
                        { this.props.roundInfo.phase === GamePhase.BIDDING ?
                            <span>&nbsp;(hidden from players)</span> :
                            <span>&nbsp;(revealed to players)</span>}
                    </h3>
                    { treasureCards }
                </div> : null }

            { this.props.roundInfo.phase  > GamePhase.NOT_DEALT && this.props.roundInfo.phase < GamePhase.SCORING ?
                <div className="admin-player-cards-container">
                    <h3>Player Cards</h3>

                    {players}
                </div> : null}

            { roundScoringView }

            <ApiView roundInfo={this.props.roundInfo}
                gameInfo={this.props.gameInfo}
                playingPhaseInfo={this.props.playingPhaseInfo}
                gameId={this.props.gameId}
                playerNames={this.props.playerNames}
                playerCards={this.props.cards.playerCards}
                treasure={this.props.cards.treasure}></ApiView>
        </div>);
    }
}