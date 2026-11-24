/* Service worker del Portal Jardines del Renacer
   - Hace la app instalable (PC y móvil) y la abre aunque no haya red (carcasa en caché).
   - Muestra notificaciones del sistema (también con la app minimizada/cerrada si llega un push).
   - Al tocar una notificación enfoca/abre el portal y lleva a la sección correcta. */
const VER = 'jr-portal-v1';
const SHELL = ['./', './index.html', './portal-guard.js', './manifest.webmanifest', './logo-jr.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/* Red primero (siempre la versión más nueva); si no hay red, lo guardado. Solo mismo origen:
   las llamadas a Apps Script (otro dominio) pasan directo y nunca se cachean. */
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res && res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(VER).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});

/* Push real (cuando exista un servidor que lo envíe): payload JSON {title, body, tag, url} */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(show(d.title || 'Portal Jardines del Renacer', d));
});

function show(title, o) {
  return self.registration.showNotification(title, {
    body: o.body || '',
    tag: o.tag || undefined,
    renotify: !!o.tag,
    icon: 'icons/icon-192.png',
    badge: 'icons/badge-96.png',
    vibrate: [120, 60, 120],
    data: { url: o.url || '#home' },
    requireInteraction: !!o.sticky
  });
}

/* La página puede pedir la notificación por mensaje (así funciona también en Android, donde new Notification() no existe) */
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'jr-notify') e.waitUntil(show(d.title, d));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const hash = (e.notification.data && e.notification.data.url) || '#home';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const mine = all.find(c => c.url.startsWith(self.registration.scope));
    if (mine) {
      await mine.focus().catch(() => {});
      mine.postMessage({ type: 'jr-open', hash });
      return;
    }
    await self.clients.openWindow(new URL('index.html' + hash, self.registration.scope).href);
  })());
});
