import React, {useState, useEffect} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './lounge.css'
import {readNameCookie, setNameCookie} from '../name-cookie';
import { MessageType, API, ICreateGameResponse } from '../api';

const api = new API();

interface INameProps {
    onNameSet(name: string): void;
}

function LoungeNameForm(props: INameProps) {
    const [name, setName] = useState(null as string | null);

    useEffect(() => {
        const name = readNameCookie();
        if(name) {
            setName(name);
            props.onNameSet(name);
        }
    }, [props]);

    function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        setName(e.target.value);
    }

    function onNameSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        if(name) {
            setNameCookie(name);
            props.onNameSet(name);
        }
    }

    return (<div>
        <h1>Welcome to the Tysyacha Lounge</h1>

        <p>Please enter your name to continue</p>
        <form className='name-form' onSubmit={(e) => onNameSubmit(e)}>
            <label htmlFor='name'>Name</label>
            <input type='text' className='form-control' placeholder='name' required={true}
                onChange={(e) => handleNameChange(e) }/>
            <button type='submit' className='btn btn-primary form-control'>Continue</button>
        </form>
    </div>);
}

interface ICreateGameProps {
    username: string;
    gameId: string | null;
    onGameCreated: (gameId: string) => any;
}

function CreateGameView(props: ICreateGameProps) {
    useEffect(() => {
        if(!props.gameId) {
            api.createGame(props.username).then((createGameData: ICreateGameResponse) => {
                props.onGameCreated(createGameData.gameId);
            });
        }
    }, [props]);

    if(props.gameId) {
        return <div className='create-game-view'>
            <p>New game created! Share this code with your friends to play with them.</p>

            <form>
                <input type='text' className='form-control'
                    value={props.gameId} readOnly={true} />
                <a className='btn btn-lg btn-primary form-control' href={`/game?gameid=${props.gameId}`}>Go To Game</a>
            </form>
        </div>
    } else {
        return <div className='create-game-view'>
            creating new game...
        </div>;
    }
}

interface IJoinGameViewProps {
    name: string;
}

function JoinGameView(props: IJoinGameViewProps) {
    const [gameId, setGameId] = useState('' as string);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // leave the lounge
        leaveLounge(props.name);

        window.location.href = `/game?gameid=${gameId}`;
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setGameId(e.target.value);
    }

    return <div className='join-game-view'>
        <p>When your friend creates a game they will send you a short code that you can enter below to join their game</p>
        <form onSubmit={(e) => handleSubmit(e)}>
            <label htmlFor='game_id'>Game ID</label>
            <input type='text' className='form-control' required={true}
                placeholder='paste your game ID here'
                onChange={(e) => handleChange(e)}
                name='game_id' />
            <button type='submit' className='btn btn-lg btn-primary form-control'>Join Game</button>
        </form>
    </div>
}

async function joinLounge(username: string, isHeartbeat: boolean) {
    await api.joinLounge(username, isHeartbeat);
}

function leaveLounge(name: string) {
    api.socket.send(JSON.stringify({
        msgType: MessageType.LEAVE_LOUNGE,
        username: name
    }));
}

interface ILoungeState {
    name: string | null;
    loungeUsers: string[];
    showGameCreation: boolean;
    showGameJoin: boolean;
    newGameId: string | null;
}

interface ILoungeProps {}

class Lounge extends React.Component<ILoungeProps, ILoungeState> {
    constructor(props: ILoungeProps) {
        super(props);

        this.state = {
            name: null,
            loungeUsers: [],
            showGameCreation: false,
            showGameJoin: false,
            newGameId: null
        };

        this.handleNameSet = this.handleNameSet.bind(this);
        this.onWebSocketMessage = this.onWebSocketMessage.bind(this);
        this.showCreateGame = this.showCreateGame.bind(this);
        this.handleGameCreated = this.handleGameCreated.bind(this);
    }

    componentDidMount() {
        document.title = 'Tysyacha Lounge';
        api.socket.onmessage = this.onWebSocketMessage;
        api.socket.onopen = (event: Event) => {
            console.log('socket opened');
            // once connected, request users
            if(this.state.name) {
                joinLounge(this.state.name, false);
            }

            // send a heartbeat message every minute
            window.setTimeout(() => {
                if(this.state.name) {
                    joinLounge(this.state.name, true);
                }
            }, 60 * 1000);
        };
    }

    handleGameCreated(gameId: string) {
        this.setState({
            newGameId: gameId,
        });
    }

    onWebSocketMessage(event: MessageEvent) {
        console.log('Received message over websocket:');
        if(event.data) {
            const j = JSON.parse(event.data);
            console.log(j);
            switch(j.msgType) {
                case MessageType.LOUNGE_USERS:
                    this.setState({
                        loungeUsers: j.users
                    });
                    break;
                case MessageType.GAME_USERS:
                    // ignore this message type
                    break;
                default:
                    console.error(`Got unknown msg type: ${j.msgType}`);
                    break;
            }
        }
    }

    showCreateGame(show: boolean) {
        // leave the lounge
        if(this.state.name) {
            leaveLounge(this.state.name);
        }

        this.setState({
            showGameCreation: show
        });
    }

    showJoinGame(show: boolean) {
        this.setState({
            showGameJoin: show
        });
    }

    handleNameSet(newName: string): void {
        this.setState({
            name: newName
        });
    }

    render(): JSX.Element {
        if(this.state.showGameCreation && this.state.name) {
            return (<main className='container'>
                <CreateGameView
                    gameId={this.state.newGameId}
                    username={this.state.name}
                    onGameCreated={this.handleGameCreated} />
            </main>);
        } else if(this.state.showGameJoin && this.state.name) {
            return (<main className='container'>
                <JoinGameView name={this.state.name} />
            </main>);
        } else if(this.state.name) {
            const peopleInLounge = this.state.loungeUsers.filter((user: string) => {
                return user !== this.state.name;
            }).map((user: string, i: number) => {
                return <div key={`lounge-user-${i}`}>{ user }</div>;
            });

            return (<main className='container'>
                <h1>Welcome to the Tysyacha Lounge</h1>
                <div>Username: {this.state.name}</div>

                <div className='btn-container'>
                    <button type='button' className='btn btn-lg btn-primary'
                        onClick={() => this.showCreateGame(true)}>Create Game</button>
                    <button type='button' className='btn btn-lg btn-secondary'
                        onClick={() => this.showJoinGame(true)}>Join Game</button>
                </div>

                <h2>Other People in Lounge</h2>
                { peopleInLounge.length ?
                    peopleInLounge :
                    <div>lounge is currently empty</div>}
            </main>);
        } else {
            return (<main className='container'>
                <LoungeNameForm onNameSet={this.handleNameSet} />
            </main>);
        }
    }


}

export default Lounge;