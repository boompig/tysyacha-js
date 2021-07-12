import { WEBSOCKET_SERVER, HTTP_SERVER } from './constants';
import { Bid, GamePhase, ITrickCard, IPastTrick, IDeal } from './game-mechanics';
import { Card, ICard, Suit, Hand } from './cards';

// TODO this is not at all secure
export const ADMIN_API_KEY = "a948904f2f0f479b8f8197694b30184b0d2ed1c1cd2a1ec0fb85d299a192a447";

// async function importWebsocketInNode() {
//     const IS_BROWSER = (typeof window !== "undefined");
//     if(typeof WebSocket === "undefined" && !IS_BROWSER) {
//         console.debug("Loading websocket module outside of browser");
//         var WebSocket = await import("ws");
//     } else {
//         console.log("Using native websocket object");
//         console.log(WebSocket);
//     }
// }

// importWebsocketInNode();


if(typeof fetch === "undefined" && process.env.IS_SERVER !== "1") {
    // eslint-disable-next-line
    var fetch = require("node-fetch");
}

export enum MessageType {
    /**
     * Lounge - initial waiting area
     */

    /**
     * User enters the lounge. Also used for heartbeat messages
     */
    JOIN_LOUNGE = 'join-lounge',

    /**
     * User leaves the lounge
     */
    LEAVE_LOUNGE = 'leave-lounge',
    /**
     * Retrieve a list of users in the lounge
     */
    LOUNGE_USERS = 'lounge-users',

    /**
     * Request game seeds for each user in a game.
     * Determines users' positions - lowest first and then in increasing order.
     * These are also broadcast when a game starts and at other times.
     */
    GAME_SEEDS = 'game-seeds',

    /**
     * Get the game seed for the current user
     */
    GAME_SEED = 'game-seed',

    /**
     * User joins the game
     */
    JOIN_GAME = 'join-game',

    /**
     * Users leaves the game
     */
    LEAVE_GAME = 'leave-game',

    /**
     * Get the current users in the game
     */
    GAME_USERS = 'game-users',

    /**
     * tell the server there was a deal event
     * when receiving this event, means the server has dealt cards and is ready to ask for the cards
     */
    BROADCAST_DEAL = 'game-deal',

    /**
     * Request your cards
     */
    PLAYER_CARDS = 'player-cards',

    /**
     * When new bids are created by other players, they are broadcast using this message type
     */
    BROADCAST_BID = 'broadcast-bid',

    /**
     * When a player fixes on a final contract, the server lets everyone know what that is
     */
    BROADCAST_FINAL_CONTRACT = 'broadcast-final-contract',

    /**
     * Broadcast when the contract player distributes cards.
     * Clients are expected to poll the server to get their new cards
     */
    BROADCAST_DISTRIBUTE_CARDS = 'broadcast-distribute-cards',

    /**
     * Broadcast when a player plays a card on their turn
     * Contains whether the resulting play is a marriage declaration
     * Also contains what card the player played
     */
    BROADCAST_PLAY_CARD = 'broadcast-play-card',
}

/**
 * Expected fields in a message of type BROADCAST_PLAY_CARD
 */
export interface IPlayCardMessage {
    gameId: string;
    round: number;
    msgType: MessageType.BROADCAST_PLAY_CARD;
    player: string;
    card: ICard;
    isMarriage: boolean;
    /**
     * this is a unique string to identify this particular message
     * this helps detect prevent parsing duplicate messages on the client
     */
    id: string;
}

export interface IPlayingPhaseInfo {
    currentTrick: ITrickCard[];
    pastTricks: IPastTrick[];
    /**
     * name of the player whose turn it is
     */
    turn: string;
    marriage: Suit | null;
    /**
     * map from player to declared marriages
     */
    declaredMarriages: {[key: string]: Suit[]};
}

export interface IBidsResponse {
    bidHistory: Bid[];
    nextPhase: GamePhase;
}

export interface ICreateGameResponse {
    gameId: string;
}

export interface IAdminResponse {
    /**
     * Map from gameID to GameInfo
     */
    games: {[key: string]: IGameInfo};
}

export interface IGameInfo {
    creator: string;
    round: number;
    hasStarted: boolean;
    /**
     * Map from player names to their scores in each number
     */
    scores: {[key: string]: number[]};
    /**
     * True iff this game was created to play against the computer/AI
     */
    isComputerOnly: boolean;
}

export interface IRoundInfo {
    phase: GamePhase;
    /**
     * Name of the player who has dealt/will deal the cards
     */
    dealer: string;
    /**
     * Name of the player whose turn it is to bid
     * This has no meaning in rounds after BIDDING
     */
    biddingPlayer: string;
    /**
     * The winning bid during the bidding phase
     * This has no meaning in rounds before REVEAL_TREASURE
     */
    winningBid: Bid | null;
    /**
     * The finalized contract.
     * This has no meaning in rounds before DISTRIBUTE_CARDS
     */
    finalContract: Bid | null;
}

export interface IAdminGameResponse {
    playerNames: string[];
    rounds: number[];
    gameInfo: IGameInfo;
    roundInfo: {[key: number]: IRoundInfo}
    cardsPerRound: {[key: number]: IDeal};
}

export class API {
    socket: WebSocket;

    constructor() {
        this.socket = new WebSocket(WEBSOCKET_SERVER);
    }

    async getJSON(path: string, query?: {[key: string]: any}, userHeaders?: {[key: string]: string}): Promise<Response> {
        const url = new URL(HTTP_SERVER);
        url.pathname = path;
        if(query) {
            for(const [k, v] of Object.entries(query)) {
                url.searchParams.append(k, v);
            }
        }

        const headers = {
            'Content-Type': 'application/json',
        } as {[key: string]: string};
        if(userHeaders) {
            for(const [key, val] of Object.entries(userHeaders)) {
                headers[key] = val;
            }
        }

        return fetch(url.toString(), {
            headers,
            method: 'GET',
            mode: 'cors',
        });
    }

    async postJSON(path: string, data?: any, userHeaders?: {[key: string]: string}): Promise<Response> {
        if(!data) {
            data = {};
        }
        const url = new URL(HTTP_SERVER);
        url.pathname = path;

        const headers = {
            'Content-Type': 'application/json',
        } as {[key: string]: string};
        if(userHeaders) {
            for(const [key, val] of Object.entries(userHeaders)) {
                headers[key] = val;
            }
        }

        return fetch(url.toString(), {
            body: JSON.stringify(data),
            headers,
            method: 'POST',
            mode: 'cors',
        });
    }

    async getGameUsers(gameId: string): Promise<string[]> {
        const r = await this.getJSON(`/game/${gameId}/users`);
        if (r.ok) {
            const j = await r.json();
            return j;
        } else {
            console.error(r);
            throw new Error(await r.text());
        }
    }

    async getPlayerCards(gameId: string, round: number, name: string): Promise<any> {
        const r = await this.getJSON(`/game/${gameId}/round/${round}/cards`, {
            username: name
        });
        if(r.ok) {
            const j = await r.json();
            return j;
        } else {
            console.error(r);
            throw new Error(await r.text());
        }
    }

    async postDealCards(gameId: string, round: number, username: string): Promise<Response> {
        const r = await this.postJSON(`/game/${gameId}/round/${round}/deal`, {
            username: username
        });
        return r;
    }

    async joinGame(gameId: string, username: string): Promise<Response> {
        const r = await this.postJSON(`game/${gameId}/join`, {
            username: username
        });
        return r;
    }

    async getGameRoundInfo(gameId: string, round: number): Promise<any> {
        const r = await this.getJSON(`/game/${gameId}/round/${round}`);
        if(r.ok) {
            const j = await r.json();
            return j;
        } else {
            console.error(`failed to get info for game ${gameId} round ${round}`);
        }
    }

    /**
     * Get the entire bidding history
     */
    async getBids(gameId: string, round: number): Promise<IBidsResponse> {
        const r = await this.getJSON(`/game/${gameId}/round/${round}/bids`);
        if(r.ok) {
            const j = await r.json();
            return j;
        } else {
            throw new Error(`failed to get bids for game ${gameId} round ${round}`);
        }
    }

    async postBid(gameId: string, round: number, username: string, points: number): Promise<Response> {
        const r = await this.postJSON(`/game/${gameId}/round/${round}/bid`, {
            username: username,
            points: points,
        });
        return r;
    }

    async getTreasure(gameId: string, round: number): Promise<Card[]> {
        const r = await this.getJSON(`/game/${gameId}/round/${round}/treasure`);
        if(r.ok) {
            const j = await r.json();
            // make sure the return value is actually a card object
            return j.map((item: any) => {
                return new Card(item.value, item.suit);
            })
        } else {
            throw new Error(`failed to get treasure for game ${gameId}`);
        }
    }

    async postFinalContract(gameId: string, round: number, username: string, points: number): Promise<Response> {
        const r = await this.postJSON(`/game/${gameId}/round/${round}/final-contract`, {
            username: username,
            points: points,
        });
        return r;
    }

    async postDistributeCards(gameId: string, round: number, username: string,
        distributedCards: {[key: string]: Card}, keptCards: Card[]): Promise<Response> {
        const r = await this.postJSON(`/game/${gameId}/round/${round}/distribute-cards`, {
            username,
            distributedCards,
            keptCards,
        });
        return r;
    }

    async postPlayCard(gameId: string, round: number, username: string,
        card: Card, isMarriage: boolean): Promise<Response> {
        const r = await this.postJSON(`/game/${gameId}/round/${round}/play-card`, {
            username,
            card,
            isMarriage,
        });
        if(r.ok) {
            return r;
        } else {
            const t = await r.text();
            throw new Error(`failed to play card: ${t}`)
        }
    }

    async getPlayingPhaseInfo(gameId: string, round: number): Promise<IPlayingPhaseInfo> {
        const r = await this.getJSON(`/game/${gameId}/round/${round}/playing-phase-info`);
        if (r.ok) {
            const j = (await r.json()) as IPlayingPhaseInfo;
            if (!j) {
                throw new Error('no playing phase info loaded');
            }
            j.currentTrick = j.currentTrick.map((tc: ITrickCard) => {
                return {
                    player: tc.player,
                    card: new Card(tc.card.value, tc.card.suit),
                };
            });
            return j;
        } else {
            throw new Error(`failed to get playing phase info for game ${gameId}`);
        }
    }

    async joinLounge(username: string, isHeartbeat: boolean): Promise<Response> {
        const r = await this.postJSON('/lounge/join', {
            username,
            isHeartbeat,
        });
        return r;
    }

    async createGame(username: string, options?: any): Promise<ICreateGameResponse> {
        const data : any = {
            username,
        };
        if (options) {
            for (const [k, v] of Object.entries(options)) {
                data[k] = v;
            }
        }
        const r = await this.postJSON('/game/new', data);
        const j = await r.json();
        return j as ICreateGameResponse;
    }

    async getGameInfo(username: string, gameId: string): Promise<IGameInfo> {
        const r = await this.getJSON(`/game/${gameId}`, {
            username,
        });
        if (r.ok) {
            const j = await r.json();
            return j as IGameInfo;
        } else {
            console.error(r);
            throw new Error(await r.text());
        }
    }

    async postEndRound(gameId: string, round: number, username: string): Promise<Response> {
        const r = await this.postJSON(`/game/${gameId}/round/${round}/end-round`, {
            username,
        });
        return r;
    }

    /** ******** Admin APIs *********** */

    async adminGetGames(): Promise<IAdminResponse> {
        const r = await this.getJSON('/admin', {}, {
            Authorization: `Bearer ${ADMIN_API_KEY}`,
        });
        if (r.ok) {
            const j = await r.json();
            return j as IAdminResponse;
        } else {
            console.error(r);
            throw new Error(await r.text());
        }
    }

    async adminGetGameInfo(gameId: string): Promise<IAdminGameResponse> {
        const r = await this.getJSON(`/admin/game/${gameId}`, {}, {
            Authorization: `Bearer ${ADMIN_API_KEY}`,
        });
        if (r.ok) {
            const j = (await r.json()) as IAdminGameResponse;

            // for the cards, recreate card objects
            const rounds = Object.keys(j.cardsPerRound).map((n) => {return Number.parseInt(n, 10)});
            rounds.forEach((round: number) => {
                // player cards
                const playerCards = {} as {[key: string]: Hand};
                Object.keys(j.cardsPerRound[round].playerCards).forEach((name: string) => {
                    const cards = j.cardsPerRound[round].playerCards[name].cards.map((card: ICard) => {
                        return new Card(card.value, card.suit);
                    });
                    playerCards[name] = new Hand(cards);
                });

                // treasure cards
                const treasureCards = j.cardsPerRound[round].treasure.map((card: ICard) => {
                    return new Card(card.value, card.suit);
                });
                j.cardsPerRound[round].treasure = treasureCards;
                j.cardsPerRound[round].playerCards = playerCards;
            });

            return j;
        } else {
            console.error(r);
            throw new Error(await r.text());
        }
    }

    /** ************* WebSocket stuff ************* */

    /**
     * Send a websocket message
     */
    async sendMessage(msgType: MessageType, data: any): Promise<void> {
        const msg: any = {};
        Object.assign(msg, data);
        msg.msgType = msgType;
        await this.socket.send(JSON.stringify(msg));
    }

    addMessageListener(msgTypes: MessageType[], callback: (data: any) => void): void {
        this.socket.addEventListener('message', (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if(msgTypes.includes(data.msgType)) {
                callback(data);
            }
        });
    }
}

export default API;