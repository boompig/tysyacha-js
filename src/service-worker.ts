/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', function() {
  console.log('here I am (install)');
});

self.addEventListener('activate', function() {
  console.log('here I am (activate)');
});

export {};