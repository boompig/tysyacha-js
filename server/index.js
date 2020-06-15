const WebSocket = require('ws');
const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();
const uuid = require("uuid")

const PORT = process.env['PORT'] || 8081;

const wss = new WebSocket.Server({
    port: PORT
});

/**
 * @returns {string[]}
 */
async function getUsers() {
    const keys = await client.keys('user:*');
    return keys.filter((key) => {
        return key;
    }).map((key) => {
        return key.replace('user:', '');
    });
}

/**
 * @param {string} username
 */
async function registerUser(username) {
    if(username) {
        const now = new Date();
        await client.setex(`user:${username}`, 60 * 5, now.toString());
    }
}

/**
 * @param {WebSocket} ws
 */
async function sendUsers(ws) {
    const users = await getUsers();

    const msg = {
        users: users,
        msgType: 'users',
    };
    console.log('sending data:');
    console.log(msg);

    ws.send(JSON.stringify(msg));
}

async function createGame() {
    // split the at the first -
    const gameId = uuid.v4().split('-')[0];
    return gameId;
}

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
}

/**
 * When the socket is open, send the users currently in the lounge
 */
wss.on('connection', async(ws) => {
    console.log('Got new connection (connection)');

    ws.on('message', async (msgString) => {
        const msg = JSON.parse(msgString);
        console.log('Got new message:');
        console.log(msg);

        switch(msg.msgType) {
            case 'users':
                // request users
                sendUsers(ws);
                break;
            case 'create-game':
                const gameId = await createGame();
                ws.send(JSON.stringify({
                    'msgType': 'create-game',
                    gameId: gameId,
                }));
                break;
            case 'register':
                // register a username
                registerUser(msg.username);
                // broadcast new users to all connected folks
                const users = await getUsers();
                wss.broadcast(JSON.stringify({
                    users: users,
                    msgType: 'users',
                }));
                break;
            default:
                console.error(`Unknown msgType: ${msg.msgType}`);
                break;
        }

    });
});
