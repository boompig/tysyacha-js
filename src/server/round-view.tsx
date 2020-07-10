import React from "react";
import {AdminPlayerView, GameInfoView} from "./game-view";
import {IGameInfo, IRoundInfo} from "../api";
import { gamePhaseToString, IDeal, GamePhase, Bid } from "../game-mechanics";
import { Card } from "../cards";
import { PlayerView } from "../player-view";
import { BiddingHistoryView } from "../bidding-view";

interface IRoundViewProps {
    gameId: string;
    playerNames: string[];
    gameInfo: IGameInfo;

    round: number;
    roundInfo: IRoundInfo;
    cards: IDeal;
    bidHistory: Bid[];
}

interface IState {
    isRoundInfoCollapsed: boolean;
}

export class RoundView extends React.PureComponent<IRoundViewProps, IState> {
    constructor(props: IRoundViewProps) {
        super(props);

        this.state = {
            isRoundInfoCollapsed: false,
        };

        this.isActivePlayer = this.isActivePlayer.bind(this);
        this.toggleCollapseRoundInfo = this.toggleCollapseRoundInfo.bind(this);
    }

    isActivePlayer(name: string): boolean {
        switch (this.props.roundInfo.phase) {
            case GamePhase.NOT_DEALT:
                return false;
            case GamePhase.BIDDING:
                return name === this.props.roundInfo.biddingPlayer;
            default:
                // TODO
                return false;
        }
    }

    toggleCollapseRoundInfo(e: React.SyntheticEvent) {
        e.preventDefault();
        this.setState({
            isRoundInfoCollapsed: !this.state.isRoundInfoCollapsed,
        });
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

            <div className="round-info-container">
                <h2>
                    <a href="#round-info-collapse" role="button"
                        onClick={(e) => this.toggleCollapseRoundInfo(e)}>
                        <span>Round { this.props.round } Info</span>
                        { this.state.isRoundInfoCollapsed ? <span>&nbsp; (collapsed)</span> : null }
                    </a>
                </h2>

                { this.state.isRoundInfoCollapsed ? null :
                    <div id="round-info-collapse">
                        <div>Phase - { gamePhaseToString(this.props.roundInfo.phase) }</div>
                        <div>Dealer - { this.props.roundInfo.dealer }</div>
                        { this.props.roundInfo.phase === GamePhase.BIDDING ?
                            <div>Current Bidder - { this.props.roundInfo.biddingPlayer }</div>: null}
                    </div> }
            </div>

            <BiddingHistoryView
                bids={this.props.bidHistory} />

            <div className="admin-treasure-container">
                <h3>Treasure</h3>
                { treasureCards }
            </div>

            <div className="admin-player-cards-container">
                <h3>Player Cards</h3>

                {players}
            </div>
        </div>);
    }
}