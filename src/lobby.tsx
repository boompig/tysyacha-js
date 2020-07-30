import React from 'react';

interface IGameLobbyProps {
    waitingUsers: string[];
    name: string;
    gameId: string | null;
}

export function GameLobby(props: IGameLobbyProps): JSX.Element {

    const users = [...props.waitingUsers, props.name].map((username: string, i: number) => {
        if(username === props.name) {
            return <li key={`lobby-user-${i}`}>{ username } (you)</li>
        } else {
            return <li key={`lobby-user-${i}`}>{ username }</li>
        }
    });

    return <div className='game-lobby'>
        <h3>Game ID: { props.gameId }</h3>
        <p>Waiting for other players to join...</p>

        <h2>Users</h2>
        <ul className='waiting-users'>
            { users }
        </ul>
    </div>;
}

export default GameLobby;