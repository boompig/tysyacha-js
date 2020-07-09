import React, {useState, useEffect, useCallback} from 'react';
import API, { MessageType } from './api';
import {Card, Hand} from './cards';
import {BiddingView} from './bidding-view';
import { GamePhase, Bid } from './game-mechanics';
import { RevealTreasureView } from './reveal-treasure-view';
import DistributeCardsView from './distribute-cards-view';
import { PlayingView } from './playing-view';


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
    // will be set to 3 cards when it's visible
    const [treasure, setTreasure] = useState([] as Card[]);
    const [winningBid, setWinningBid] = useState(null  as Bid | null);
    const [finalContract, setFinalContract] = useState(null as Bid | null);

    const getPlayerCards = useCallback(async function getPlayerCards() {
        const playerHand = await props.api.getPlayerCards(props.gameId, props.round, props.name);
        console.log('Got cards:');
        console.log(playerHand);

        const cards = playerHand.cards.map((playerCard: any) => {
            return new Card(playerCard.value, playerCard.suit);
        });

        const hand = new Hand(cards);
        setHand(hand);
    }, [props.gameId, props.round, props.name, props.api]);

    useEffect(() => {
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
            if(roundInfo.finalContract) {
                setFinalContract(roundInfo.finalContract);
            }
            setHasRoundInfo(true);
        }

        if(!hasRoundInfo) {
            getRoundInfo();
        }

        props.api.addMessageListener([MessageType.BROADCAST_DEAL], (data: any) => {
            // this is a broadcast message so have to filter

            if(data.gameId === props.gameId && !hand) {
                getPlayerCards();
            }
        });
    }, [props.round, props.gameId, hand, props.api, props.name, hasRoundInfo, getPlayerCards]);

    useEffect(() => {
        // do this if the winning bid has not yet been fetched
        async function getWinningBid() {
            const roundInfo = await props.api.getGameRoundInfo(props.gameId, props.round);
            await setWinningBid(roundInfo.winningBid);
        }

        async function getTreasure() {
            const treasure = await props.api.getTreasure(props.gameId, props.round);
            setTreasure(treasure);
        }

        if ((phase === GamePhase.REVEAL_TREASURE || phase === GamePhase.DISTRIBUTE_CARDS) && !winningBid) {
            // get the winning bid from the server
            getWinningBid();
        }
        if ((phase === GamePhase.REVEAL_TREASURE || phase === GamePhase.DISTRIBUTE_CARDS) && (!treasure || treasure.length === 0)) {
            getTreasure();
        }
    }, [props.api, winningBid, phase, props.gameId, props.round, treasure]);

    useEffect(() => {
        props.api.addMessageListener([MessageType.BROADCAST_FINAL_CONTRACT], async (msg) => {
            if (msg.gameId === props.gameId) {
                await setPhase(GamePhase.DISTRIBUTE_CARDS);
                await setFinalContract({
                    points: msg.points,
                    player: msg.player,
                });
            }
        });
    }, [props.api, props.gameId]);

    useEffect(() => {
        props.api.addMessageListener([MessageType.BROADCAST_DISTRIBUTE_CARDS], async (msg) => {
            if (msg.gameId === props.gameId) {
                await setPhase(GamePhase.PLAYING);
                await getPlayerCards();
            }
        });
    }, [props.api, props.gameId, getPlayerCards]);

    async function handleDeal() {
        await props.api.postDealCards(props.gameId, props.round, props.name);
    }

    async function handleSetFinalContract(points: number) {
        await props.api.postFinalContract(props.gameId, props.round, props.name, points);
    }

    async function handleDistributeCards(distributionMap: {[key: string]: Card}, keptCards: Card[]) {
        console.log('submitting cards for distribution:');
        console.log(distributionMap);
        console.log('Keeping cards:');
        console.log(keptCards);
        const r = await props.api.postDistributeCards(props.gameId, props.round, props.name, distributionMap, keptCards);
        const j = await r.json()
        console.log('server response:');
        console.log(j);
    }

    async function handleBiddingComplete(winningBid: Bid | null) {
        // request the treasure first to avoid duplicate requests
        const treasure = await props.api.getTreasure(props.gameId, props.round);
        await setPhase(GamePhase.REVEAL_TREASURE);
        await setWinningBid(winningBid);
        await setTreasure(treasure);
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
            return <div className='round-view'>waiting for hand from server...</div>;
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
                    playerCards={hand}
                    onNextPhase={handleBiddingComplete} />
            </div>
        }
    } else if(phase === GamePhase.REVEAL_TREASURE) {
        if (!winningBid) {
            // get the winning bid
            return <div>Waiting for winning bid from server...</div>;
        } else if (!hand) {
            return <div>Waiting for hand from server...</div>
        } else {
            return <div className='round-view'>
                <RevealTreasureView
                    name={props.name}
                    playerIndex={props.playerIndex}
                    gameId={props.gameId}
                    winningBid={winningBid}
                    api={props.api}
                    treasure={treasure}
                    hand={hand}
                    onSetFinalContract={handleSetFinalContract} />
            </div>
        }
    } else if(phase === GamePhase.DISTRIBUTE_CARDS) {
        if (!finalContract) {
            // get the winning bid
            return <div>Waiting for final contract from server...</div>;
        } else if (!hand) {
            return <div>Waiting for hand from server...</div>
        } else {
            return <div className='round-view'>
                <DistributeCardsView
                    name={props.name}
                    gameId={props.gameId}
                    playerIndex={props.playerIndex}
                    round={props.round}
                    hand={hand}
                    treasure={treasure}
                    finalContract={finalContract}
                    playerNames={props.playerNames}
                    onDistribute={handleDistributeCards} />
            </div>;
        }
    } else if(phase === GamePhase.PLAYING) {
        if (!finalContract) {
            return <div>Waiting for final contract from server...</div>;
        } else if (!hand) {
            return <div>Waiting for hand from server...</div>;
        } else {
            return <div className='round-view'>
                <PlayingView
                    name={props.name}
                    playerIndex={props.playerIndex}
                    gameId={props.gameId}
                    round={props.round}
                    finalContract={finalContract}
                    hand={hand}
                    playerNames={props.playerNames}
                    api={props.api} />
        </div>;
        }
    } else {
        throw new Error(`unknown phase: ${phase}`);
    }
}

export default RoundView;
