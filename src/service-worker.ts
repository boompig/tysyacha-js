/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', function() {
    console.log('(-.-) here I am (install)');
});

self.addEventListener('activate', function() {
    console.log('(-.-) here I am (activate)');
});

self.addEventListener('message', (e) => {
    console.log(`(-.-) received message in SW: ${e.data}`);
    (e.source as Client).postMessage('Hello back *waves*');
});

export {};