import React, {useState, useEffect} from 'react';
import API, { MessageType } from './api';
import {Card, Hand} from './cards';
import {BiddingView} from './bidding-view';
import {GamePhase} from './game-mechanics';


interface IRoundViewProps {
    /**
     * Name of the current player
     */
    name: string;

    gameId: string;

    /**
     * Names of all the players
     */
    playerNames: string[];

    /**
     * Index of dealer in the playerNames array
     */
    dealer: number;

    /**
     * Index of this player
     */
    playerIndex: number;

    api: API;

    round: number;
}

/**
 * Displays the game for a single round
 */
export function RoundView(props: IRoundViewProps) {
    const [phase, setPhase] = useState(GamePhase.NOT_DEALT);
    const [hand, setHand] = useState(null as Hand | null);
    const [hasRoundInfo, setHasRoundInfo] = useState(false);

    useEffect(() => {
        async function getPlayerCards() {
            const playerHand = await props.api.getPlayerCards(props.gameId, props.name);
            console.log('Got cards:');
            console.log(playerHand);

            const cards = playerHand.cards.map((playerCard: any) => {
                return new Card(playerCard.value, playerCard.suit);
            });

            const hand = new Hand(cards);
            setHand(hand);
        }

        async function getRoundInfo() {
            const roundInfo = await props.api.getGameRoundInfo(props.gameId, props.round);
            console.log(`got round info for round ${props.round}`);
            console.log(roundInfo);
            if (roundInfo && roundInfo.phase) {
                setPhase(roundInfo.phase);
                if(roundInfo.phase !== GamePhase.NOT_DEALT) {
                    getPlayerCards();
                }
            }
            setHasRoundInfo(true);
        }

        if(!hasRoundInfo) {
            getRoundInfo();
        }

        props.api.addMessageListener([MessageType.GAME_DEAL], (data: any) => {
            // this is a broadcast message so have to filter

            if(data.gameId === props.gameId && !hand) {
                getPlayerCards();
            }
        });
    }, [props.round, props.gameId, hand, props.api, props.name, hasRoundInfo]);

    async function handleDeal() {
        await props.api.postDealCards(props.gameId, props.round, props.name);
    }

    if(phase === GamePhase.NOT_DEALT) {
        if(props.dealer === props.playerIndex) {
            return (<div className='round-view'>
                <button type='button' className='btn btn-lg btn-primary'
                    onClick={() => handleDeal()}>Deal</button>
            </div>);
        } else {
            return <div className='round-view'>
                <div>Waiting for {props.playerNames[props.dealer]} to deal the cards</div>
            </div>;
        }
    } else if(phase === GamePhase.BIDDING) {
        if(!hand) {
            return <div className='round-view'>waiting for hand...</div>;
        } else {
            return <div className='round-view'>
                <BiddingView
                    name={props.name}
                    gameId={props.gameId}
                    round={props.round}
                    playerNames={props.playerNames}
                    dealer={props.dealer}
                    playerIndex={props.playerIndex}
                    api={props.api}
                    playerCards={hand} />
            </div>
        }
    } else {
        return <div className='round-view'>
            player {props.playerNames[props.dealer]} has dealt
        </div>;
    }
}

export default RoundView;

    // async setGameOver(isGameOver: boolean) {
    //     await this.setState({
    //         isGameOver: isGameOver
    //     });
    // }

    // async setCurrentPlayer(currentPlayer: number) {
    //     await this.setState({
    //         currentPlayer: currentPlayer
    //     });
    // }

    // async setContractPlayer(contractPlayer: number) {
    //     await this.setState({
    //         contractPlayer: contractPlayer
    //     });
    // }

    // state-setting functions similar to useState
    // this.setBids = this.setBids.bind(this);
    // this.setGameOver = this.setGameOver.bind(this);
    // this.setPhase = this.setPhase.bind(this);
    // this.setCurrentPlayer = this.setCurrentPlayer.bind(this);
    // this.setContractPlayer = this.setContractPlayer.bind(this);