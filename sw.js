'use strict';

const CACHE_NAME = 'dogtrainer-1.1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name.startsWith('dogtrainer-') && name !== CACHE_NAME).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if(event.data?.type === 'SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET' || event.request.mode !== 'navigate')return;
  const fresh = fetch(event.request).then(async response => {
    if(response?.ok){
      const cache = await caches.open(CACHE_NAME);
      await cache.put('./index.html', response.clone());
    }
    return response;
  });
  event.waitUntil(fresh.catch(() => undefined));
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match('./index.html') || await cache.match('./');
    return cached || fresh;
  })());
});
