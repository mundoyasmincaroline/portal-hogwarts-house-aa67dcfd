// Hogwarts Portal - Service Worker (PWA Enabler)
const CACHE_NAME = 'hogwarts-portal-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through (no caching for now to avoid issues, just enabling PWA)
  event.respondWith(fetch(event.request));
});
