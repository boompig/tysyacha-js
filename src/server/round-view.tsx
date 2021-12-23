import React from "react";
import {AdminPlayerView, GameInfoView} from "./game-view";
import {IGameInfo, IRoundInfo, IPlayingPhaseInfo} from "../api";
import { gamePhaseToString, IDeal, GamePhase, Bid, getWinningBid } from "../game-mechanics";
import { Card } from "../cards";
import { PlayerView } from "../player-view";
import { BiddingHistoryView } from "../bidding-view";
import { CurrentTrickView } from "../playing-view";
import {PastTricksView} from "./past-tricks-view";

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
                    { this.props.roundInfo.phase >= GamePhase.DISTRIBUTE_CARDS && this.props.roundInfo.finalContract ?
                        <div>Final contract - {this.props.roundInfo.finalContract.points} ({this.props.roundInfo.finalContract.player})</div>:
                        null}
                    { this.props.roundInfo.phase === GamePhase.PLAYING && this.props.playingPhaseInfo ?
                        <div>Current turn - { this.props.playingPhaseInfo.turn }</div>
                        : null}
                    { this.props.roundInfo.phase === GamePhase.PLAYING && this.props.playingPhaseInfo ?
                        <div>Current trump - { this.props.playingPhaseInfo.marriage ? this.props.playingPhaseInfo.marriage : "none" }</div>
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
        const treasureCards = this.props.cards.treasure.map((card: Card, i: number) => {
            return <span key={`treasure-${i}`}>
                { card.toString() }
            </span>
        });

        const players = this.props.playerNames.map((name: string, i: number) => {
            const playerClass = this.isActivePlayer(name) ? "active-player" : "";

            return (<div key={`player-${i}-container`}>
                <h5 className={ "player-name " + playerClass }>{name}</h5>
                <PlayerView key={`player-${i}`}
                    index={i}
                    cards={this.props.cards.playerCards[name]}
                    phase={this.props.roundInfo.phase} />
            </div>);
        });

        return (<div>
            <h1 className="title">Game { this.props.gameId } - Round { this.props.round }</h1>

            <AdminPlayerView
                playerNames={this.props.playerNames}
                isCollapsed={true} />
            <GameInfoView
                gameInfo={this.props.gameInfo}
                isCollapsed={true} />

            <RoundInfoView
                roundInfo={this.props.roundInfo}
                round={this.props.round}
                playingPhaseInfo={this.props.playingPhaseInfo}/>

            <BiddingHistoryView
                bids={this.props.bidHistory} />

            {this.props.playingPhaseInfo ?
                <PastTricksView
                    pastTricks={this.props.playingPhaseInfo?.pastTricks} /> :
                null }

            { this.props.playingPhaseInfo ?
                <CurrentTrickView
                    currentTrick={this.props.playingPhaseInfo.currentTrick} /> :
                null }

            { this.props.roundInfo.phase <= GamePhase.DISTRIBUTE_CARDS ?
                <div className="admin-treasure-container">
                    <h3>Treasure</h3>
                    { treasureCards }
                </div> : null }

            <div className="admin-player-cards-container">
                <h3>Player Cards</h3>

                {players}
            </div>
        </div>);
    }
}