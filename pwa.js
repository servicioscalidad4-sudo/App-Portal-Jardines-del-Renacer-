/* PWA + avisos tipo push del Portal Jardines del Renacer
   - Registra el service worker y ofrece "Instalar aplicación" (PC y móvil).
   - jrNotify(): si estás en el portal (aunque sea dentro de otra aplicación) muestra un banner
     emergente; si la ventana está minimizada, en segundo plano o con otra ventana encima, lanza
     una notificación del sistema (con permiso). Al tocarla abre el portal en la sección correcta.
   - Globo/contador en el ícono de la app (Badging API) con los pendientes. */
(function () {
  'use strict';
  var SEC = window.isSecureContext, REG = null, DEFER = null;
  var ua = navigator.userAgent;
  var IOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var STANDALONE = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: window-controls-overlay)').matches || navigator.standalone === true;
  var DK = 'jr_pwa_prompt_off';
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- Service worker ---------- */
  if (SEC && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(function (r) { REG = r; sync(); }).catch(function () {});
    navigator.serviceWorker.addEventListener('message', function (e) {
      var d = e.data || {};
      if (d.type === 'jr-open') route(String(d.hash || '#home').replace(/^#/, ''));
    });
  }

  /* ---------- Instalación ---------- */
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); DEFER = e; sync(); });
  window.addEventListener('appinstalled', function () { DEFER = null; STANDALONE = true; sync(); toast('✅ Aplicación instalada'); });
  window.jrInstall = function () {
    if (DEFER) { DEFER.prompt(); DEFER.userChoice.finally(function () { DEFER = null; sync(); }); return; }
    var pasos = IOS
      ? '<li>Abre el portal en <b>Safari</b>.</li><li>Toca el botón <b>Compartir</b> (cuadro con flecha).</li><li>Elige <b>Agregar a pantalla de inicio</b> y confirma.</li><li>Abre el portal desde ese ícono y activa los avisos.</li>'
      : '<li><b>Chrome / Edge (PC):</b> ícono de instalar ⊕ al final de la barra de direcciones, o menú ⋮ → <i>Instalar Portal Jardines del Renacer</i>.</li><li><b>Android (Chrome):</b> menú ⋮ → <i>Instalar aplicación</i> / <i>Añadir a pantalla de inicio</i>.</li>';
    modal('Instalar el portal', '<ol style="line-height:1.7;padding-left:20px;margin:0">' + pasos + '</ol>');
  };

  /* ---------- Permiso de notificaciones ---------- */
  var perm = function () { return 'Notification' in window ? Notification.permission : 'unsupported'; };
  window.jrEnable = function () {
    if (!SEC) return modal('Avisos no disponibles', 'Las notificaciones solo funcionan en la versión publicada (https), no abriendo el archivo directamente.');
    if (IOS && !STANDALONE) return modal('Activa los avisos en iPhone/iPad', '<p style="margin-top:0">Apple solo permite notificaciones a las apps instaladas. Primero agrega el portal a la pantalla de inicio:</p><ol style="line-height:1.7;padding-left:20px;margin:0"><li>Safari → <b>Compartir</b> → <b>Agregar a pantalla de inicio</b>.</li><li>Abre el portal desde el nuevo ícono.</li><li>Ahí toca <b>🔔 Activar avisos</b>.</li></ol>');
    if (perm() === 'unsupported') return modal('Avisos no disponibles', 'Este navegador no admite notificaciones. Aun así verás los avisos dentro del portal.');
    if (perm() === 'denied') return modal('Avisos bloqueados', 'Bloqueaste las notificaciones de este sitio. Para activarlas: toca el candado 🔒 junto a la dirección → <b>Permisos / Notificaciones → Permitir</b>, y recarga la página.');
    Notification.requestPermission().then(function (p) {
      ls.set(DK, '1'); sync(); hidePrompt();
      if (p === 'granted') { toast('🔔 Avisos activados'); sys({ title: 'Avisos activados', body: 'Te avisaremos de mensajes y solicitudes aunque estés en otra aplicación.', tag: 'jr-test', hash: '#home' }); }
    });
  };

  /* ---------- Aviso emergente dentro del portal ---------- */
  var css = document.createElement('style');
  css.textContent =
    '#jr-pushes{position:fixed;top:12px;right:12px;z-index:40;display:flex;flex-direction:column;gap:10px;width:360px;max-width:calc(100vw - 24px);pointer-events:none}' +
    '.jr-p{pointer-events:auto;display:flex;gap:12px;align-items:flex-start;background:var(--card,#fff);color:var(--ink,#1c2340);border:1px solid var(--line,#dde2ee);border-left:4px solid #4a00ff;border-radius:14px;padding:12px 14px;box-shadow:0 14px 40px #0004;cursor:pointer;animation:jrin .35s cubic-bezier(.2,.9,.3,1.2)}' +
    '.jr-p.out{animation:jrout .25s ease forwards}' +
    '.jr-p img{width:38px;height:38px;border-radius:10px;flex:none}' +
    '.jr-p .t{flex:1;min-width:0}.jr-p b{display:block;font-size:13.5px}.jr-p span{display:block;font-size:13px;color:var(--mut,#6b7392);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}' +
    '.jr-p small{display:block;font-size:11px;color:var(--mut,#6b7392);margin-top:2px}' +
    '.jr-p .x{flex:none;border:0;background:none;color:var(--mut,#6b7392);font-size:18px;line-height:1;cursor:pointer;padding:0 2px}' +
    '@keyframes jrin{from{transform:translateX(30px);opacity:0}to{transform:none;opacity:1}}@keyframes jrout{to{transform:translateX(30px);opacity:0}}' +
    '@media(max-width:760px){#jr-pushes{left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 8px);width:auto;max-width:none}.jr-p{animation-name:jrdown}@keyframes jrdown{from{transform:translateY(-30px);opacity:0}to{transform:none;opacity:1}}}' +
    '@media(prefers-reduced-motion:reduce){.jr-p{animation:none}}' +
    '#jr-ask{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:35;display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center;background:var(--card,#fff);color:var(--ink,#1c2340);border:1px solid var(--line,#dde2ee);border-radius:14px;padding:12px 16px;box-shadow:0 14px 40px #0004;width:560px;max-width:calc(100vw - 24px);font-size:13px}' +
    '#jr-ask p{margin:0;flex:1 1 220px}';
  document.head.appendChild(css);

  function box() {
    var b = $('#jr-pushes');
    if (!b) { b = document.createElement('div'); b.id = 'jr-pushes'; b.setAttribute('aria-live', 'polite'); b.setAttribute('role', 'status'); document.body.appendChild(b); }
    return b;
  }
  function banner(o) {
    var b = box(), old = o.tag && b.querySelector('[data-tag="' + o.tag + '"]');
    if (old) old.remove();
    while (b.children.length >= 3) b.firstChild.remove();
    var el = document.createElement('div');
    el.className = 'jr-p'; if (o.tag) el.dataset.tag = o.tag;
    el.innerHTML = '<img src="logo-jr.png" alt=""><div class="t"><b>' + esc(o.title) + '</b><span>' + esc(o.body) + '</span><small>Portal Jardines del Renacer · ahora</small></div><button class="x" type="button" aria-label="Cerrar">×</button>';
    var kill = function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 260); };
    el.onclick = function (e) { if (e.target.closest('.x')) { kill(); return; } kill(); route(String(o.hash || '#home').replace(/^#/, '')); };
    b.appendChild(el);
    setTimeout(kill, 7000);
  }

  /* ---------- Notificación del sistema ---------- */
  function sys(o) {
    if (perm() !== 'granted' || !SEC) return false;
    var opt = { body: o.body || '', tag: o.tag || undefined, renotify: !!o.tag, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', vibrate: [120, 60, 120], data: { url: o.hash || '#home' } };
    var p = REG ? Promise.resolve(REG) : (navigator.serviceWorker ? navigator.serviceWorker.ready : Promise.reject());
    p.then(function (r) { return r.showNotification(o.title, opt); }).catch(function () {
      try { var n = new Notification(o.title, opt); n.onclick = function () { window.focus(); route(String(o.hash || '#home').replace(/^#/, '')); n.close(); }; } catch (e) {}
    });
    return true;
  }

  /* API pública: dentro del portal -> banner; ventana oculta/sin foco -> sistema (o banner si no hay permiso) */
  window.jrNotify = function (o) {
    o = o || {}; o.title = o.title || 'Portal Jardines del Renacer';
    var activa = !document.hidden && document.hasFocus();
    if (activa) { banner(o); return; }
    if (!sys(o)) banner(o);
  };

  /* ---------- Navegación desde un aviso ---------- */
  function route(h) {
    var p = h.split('~'), v = p[0] || 'home', k = p[1];
    try { window.focus(); } catch (e) {}
    if (typeof go !== 'function' || typeof ses === 'undefined' || !ses) { location.hash = v; return; }
    go(v);
    if (v === 'chat' && k && typeof chSelect === 'function') {
      var n = 0, t = setInterval(function () { var ok = document.getElementById('c-list') && typeof CH !== 'undefined' && CH.ready; if (ok || ++n > 100) { clearInterval(t); if (ok) chSelect(k); } }, 100);
    }
  }
  window.jrRoute = function (h) { var v = String(h || '').split('~')[0]; if (typeof go !== 'function') return; go(v || 'home'); if (h && h.indexOf('~') > 0) route(h); };

  /* ---------- Globo en el ícono de la app ---------- */
  var BG = {};
  window.jrBadgeSet = function (src, n) {
    BG[src] = n || 0;
    var t = 0; for (var k in BG) t += BG[k];
    try { if (t > 0 && navigator.setAppBadge) navigator.setAppBadge(t); else if (navigator.clearAppBadge) navigator.clearAppBadge(); } catch (e) {}
  };
  window.jrBadgeClear = function () { BG = {}; try { navigator.clearAppBadge && navigator.clearAppBadge(); } catch (e) {} };

  /* ---------- Interfaz: opciones del menú y recordatorio ---------- */
  function sync() {
    var i = $('#nav-inst'), n = $('#nav-noti');
    if (i) i.classList.toggle('hide', STANDALONE);
    if (n) {
      var p = perm(), ok = p === 'granted';
      n.classList.toggle('hide', ok && !IOS ? true : false);
      n.innerHTML = p === 'denied' ? '🔕 Avisos bloqueados' : '🔔 Activar avisos';
      if (ok) n.classList.add('hide');
    }
  }
  window.jrSync = sync;

  function hidePrompt() { var a = $('#jr-ask'); if (a) a.remove(); }
  window.jrPrompt = function () {
    sync();
    if (!SEC || perm() !== 'default' || ls.get(DK) || $('#jr-ask')) return;
    if (IOS && !STANDALONE) return; /* en iPhone primero hay que instalarla */
    setTimeout(function () {
      if (perm() !== 'default' || $('#jr-ask')) return;
      var a = document.createElement('div'); a.id = 'jr-ask';
      a.innerHTML = '<p>🔔 <b>Activa los avisos</b> para enterarte de mensajes y solicitudes aunque estés en otra aplicación o con el portal minimizado.</p><button class="btn s" type="button" id="jr-yes">Activar</button><button class="btn o s" type="button" id="jr-no">Ahora no</button>';
      document.body.appendChild(a);
      $('#jr-yes').onclick = window.jrEnable;
      $('#jr-no').onclick = function () { ls.set(DK, '1'); hidePrompt(); };
    }, 2500);
  };

  function modal(titulo, html) {
    var m = $('#modal');
    if (!m) { alert(titulo); return; }
    m.innerHTML = '<div class="mc" style="max-width:420px"><h2 style="margin:0 0 12px">' + esc(titulo) + '</h2><div style="font-size:14px">' + html + '</div><div style="margin-top:16px;text-align:right"><button class="btn" type="button" onclick="document.getElementById(\'modal\').classList.add(\'hide\')">Entendido</button></div></div>';
    m.classList.remove('hide');
  }
  function toast(t) { if (typeof window.toast === 'function') window.toast(t); }

  document.addEventListener('visibilitychange', function () { if (!document.hidden) sync(); });
})();
