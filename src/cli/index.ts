import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import reader from "readline-sync";
import { API, MessageType } from "../api";

const api = new API();

const lounge = {
    users: [],
    games: [],
    nickname: '',
};

const game = {
    gameId: null as string | null,
    playerNames: [],
    gameSeeds: {},
};

function getNickname(): string {
    const nickname = reader.question("enter nickname: ");
    return nickname;
}

async function createGame() {
    game.gameId = (await api.createGame(lounge.nickname)).gameId;
    console.log(`Created game with ID ${game.gameId}`);
}

function askCreateGame() {
    let answer = '';
    do {
        answer = reader.question('do you want to create a game (y/n)? ')
    } while (answer !== 'y' && answer !== 'n');
    if (answer === 'y') {
        createGame();
    }
}

async function joinLounge(nickname: string) {
    const r = await api.joinLounge(nickname, false);
    const j = await r.json();
    lounge.games = j.games;
    console.log('Joined lounge.');
    if(lounge.games.length > 0) {
        console.log('Existing games:');
        lounge.games.forEach((gameId: string, i: number) => {
            console.log(`${i + 1}. ${gameId}`);
        });
    } else {
        console.log('no existing games yet');
    }
    // once we join lounge, ask if they want to create a game
    askCreateGame();
}

function printLoungeUsers() {
    console.log("Current users in lounge:");
    lounge.users.forEach((nickname: string, i: number) => {
        console.log(`${i + 1}. ${nickname}`);
    });
}

function onMessage(msgType: MessageType, data: any) {
    switch(msgType) {
        case MessageType.LOUNGE_USERS:
            // a user joined the lounge
            lounge.users = data.users;
            printLoungeUsers();
            break;
        default:
            console.log(`got unknown message type: ${msgType}`);
            console.log(`[new ws msg] ${msgType} ${JSON.stringify(data)}`)
            // TODO
            break;
    }
}

function main() {
    // display banner
    clear();
    console.log(
        chalk.blue(
            figlet.textSync("Tysyacha Client\nCommand Line Version", {horizontalLayout: "full"})
        )
    );

    api.socket.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        onMessage(data.msgType, data);
    };

    api.socket.onopen = (ev: Event) => {
        console.log("opened socket to the server");
        const nickname = getNickname();
        lounge.nickname = nickname;
        console.log(`joining lounge with nickname ${nickname}...`);
        joinLounge(nickname);
    };


    // wait for connections from the server...
}

main();
