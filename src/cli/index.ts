import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import reader from "readline-sync";

import { API, MessageType } from "../api";

const api = new API();

function getNickname(): string {
    const nickname = reader.question("enter nickname: ");
    console.log("thanks " + nickname);
    return nickname;
}

async function joinLounge(nickname: string) {
    const r = await api.postJoinLounge(nickname);
    const j = await r.json();
    console.log(`lounge joined successfully: ${JSON.stringify(j)}`);
}

function onMessage(msgType: MessageType, data: any) {
    console.log(`[new ws msg] ${msgType} ${JSON.stringify(data)}`)
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
        console.log(`joining lounge with nickname ${nickname}...`);
        joinLounge(nickname);
    };


    // wait for connections from the server...
}

main();
