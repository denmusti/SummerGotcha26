/* Summer Gotcha 2026 — service worker voor web-push meldingen.
   Enkel nodig voor notificaties; geen offline caching. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { tekst: event.data ? event.data.text() : '' };
  }

  const titel = data.titel || 'Summer Gotcha 2026';
  const opties = {
    body: data.tekst || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || '/mijn-doelwit' },
  };

  event.waitUntil(self.registration.showNotification(titel, opties));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const doelUrl = (event.notification.data && event.notification.data.url) || '/mijn-doelwit';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientLijst) => {
      for (const client of clientLijst) {
        if (client.url.includes(doelUrl) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(doelUrl);
      return undefined;
    })
  );
});
