import React, {useState, useEffect} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import {GameView} from './game-view'
import {GameLobby} from './lobby';
import {readNameCookie} from './name-cookie';
import {API, MessageType, IGameInfo} from './api';


const api = new API();

function readGameId(): string | null {
    const u = new URL(window.location.href);
    return u.searchParams.get('gameid') || null;
}

/**
 * This component is the parent component of the game view
 * Shows all things related to the game
 */
function App(): JSX.Element {
    /**
	 * True iff there are 3 players who have joined this game
     * OR if this is a computer-only game
	 */
    const [hasStarted, setHasStarted] = useState(false);
    const [gameId, setGameId] = useState(null as string | null);

    /**
	 * Lounge variables
	 */
    const [name, setName] = useState('' as string);
    const [waitingUsers, setWaitingUsers] = useState([] as string[]);

    function onDisconnect() {
        api.sendMessage(MessageType.LEAVE_GAME, {
            username: name,
            gameId: gameId,
        })
    }

    useEffect(() => {
        function onGameUsers(j: any) {
            console.log(`Received message of type ${j.msgType} for game ${j.gameId}`);
            console.log(j);
            if(j.gameId === gameId) {
                // remove myself
                const waitingUsers = j.users.filter((user: string) => {
                    return user !== name;
                });
                console.log("got waiting users from server:");
                console.log(waitingUsers);
                setWaitingUsers(waitingUsers);

                // so there are 3 including yourself
                if(waitingUsers.length === 2) {
                    setHasStarted(true);
                }
            }
        }

        async function joinGame (gameId: string, username: string) {
            console.debug(`joining game ${gameId}...`);
            const r = await api.joinGame(gameId, username);
            if (r.ok) {
                const j = await r.json();
                console.debug('Game details:');
                console.debug(j);
            } else {
                console.error('Failed to join game')
            }
        }

        // read the gameId
        const gameId = readGameId()
        if(gameId) {
            setGameId(gameId);
        } else {
            window.location.href = '/lounge';
            return;
        }

        // read the name
        const name = readNameCookie();
        if(name) {
            setName(name);
        } else {
            // name not set. go back to where it can be set
            window.location.href = '/lounge';
            return;
        }

        console.debug(`getting game info for game ${gameId}...`);
        api.getGameInfo(name, gameId)
            .then((gameInfo: IGameInfo) => {
                console.debug('game info:');
                console.debug(gameInfo);
            });

        api.socket.onopen = (e: Event) => {
            console.debug('Connected to API websocket');
            api.addMessageListener([MessageType.GAME_USERS], onGameUsers);
            joinGame(gameId, name);
        };
    }, []);

    if(hasStarted) {
        if(!gameId || !name) {
            // gameId and name must be set at this point
            window.location.href = '/lounge';
        }
        return (
            <div className='App'>
                <header>
                    <div className='game-id'>Game ID: { gameId }</div>
                </header>
                <main className='container'>
                    <GameView
                        api={api}
                        gameId={gameId as string}
                        name={name as string} />
                </main>
            </div>
        );
    } else {
        return (<main className='container'>
            <GameLobby
                name={name}
                gameId={gameId}
                waitingUsers={waitingUsers} />
        </main>);
    }
}

export default App;
