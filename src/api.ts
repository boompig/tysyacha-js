import {WEBSOCKET_SERVER, HTTP_SERVER} from './constants';
import {Bid} from './game-mechanics';

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
     * Create a game. Request a gameId from server.
     */
    CREATE_GAME = 'create-game',

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
    GAME_DEAL = 'game-deal',

    /**
     * Request your cards
     */
    PLAYER_CARDS = 'player-cards',

    /**
     * When new bids are created by other players, they are broadcast using this message type
     */
    BROADCAST_BID = 'broadcast-bid',
}

export class API {
    socket: WebSocket;

    constructor() {
        this.socket = new WebSocket(WEBSOCKET_SERVER);
    }

    async getJSON(path: string, query?: {[key: string]: any}) {
        const url = new URL(HTTP_SERVER);
        url.pathname = path;
        if(query) {
            for(let [k, v] of Object.entries(query)) {
                url.searchParams.append(k, v);
            }
        }
        return fetch(url.toString(), {
            // credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'GET',
            mode: 'cors',
        });
    }

    async postJSON(path: string, data?: any) {
        if(!data) {
            data = {};
        }
        const url = new URL(HTTP_SERVER);
        url.pathname = path;
        return fetch(url.toString(), {
            body: JSON.stringify(data),
            // credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
            mode: 'cors',
        });
    }

    async getGameUsers(gameId: string): Promise<string[]> {
        const r = await this.getJSON(`/game/${gameId}/users`);
        if(r.ok) {
            const j = await r.json();
            return j;
        } else {
            console.error(r);
            throw new Error(await r.text());
        }
    }

    async getPlayerCards(gameId: string, name: string): Promise<any> {
        const r = await this.getJSON(`/game/${gameId}/cards`, {
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

    async getBids(gameId: string, round: number, playerNames: string[]): Promise<Bid[]> {
        const r = await this.getJSON(`/game/${gameId}/round/${round}/bids`);
        if(r.ok) {
            const j = await r.json();
            return j.map((item: any) => {
                return {
                    player: playerNames.indexOf(item.player),
                    points: item.bid,
                };
            })
        } else {
            throw new Error(`failed to get bids for game ${gameId} round ${round}`);
        }
    }

    async postBid(gameId: string, round: number, username: string, bid: number): Promise<Response> {
        const r = await this.postJSON(`/game/${gameId}/round/${round}/bid`, {
            username: username,
            bid: bid,
        });
        return r;
    }

    async sendMessage(msgType: MessageType, data: any) {
        const msg: any = {};
        Object.assign(msg, data);
        msg.msgType = msgType;
        await this.socket.send(JSON.stringify(msg));
    }

    addMessageListener(msgTypes: MessageType[], callback: (data: any) => void) {
        this.socket.addEventListener('message', (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if(msgTypes.includes(data.msgType)) {
                callback(data);
            }
        });
    }
}

export default API;