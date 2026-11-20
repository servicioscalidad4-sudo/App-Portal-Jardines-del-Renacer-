/* Guardia de sesión: cada app lo carga en <head>. Sin sesión válida o sin acceso -> vuelve al portal. */
(function () {
  var sc = document.currentScript, app = sc.dataset.app, home = new URL('index.html', new URL('.', sc.src)).href, ses = null;
  try { ses = JSON.parse(localStorage.getItem('jr_portal_session')); } catch (e) {}
  var rol = ses && ses.exp > Date.now() && ses.user && ses.user.accesos && ses.user.accesos[app];
  if (!rol) { (window.top || window).location.replace(home); throw new Error('Sin acceso'); }
  window.PORTAL = {
    user: ses.user, rol: rol,
    logout: function () { localStorage.removeItem('jr_portal_session'); (window.top || window).location.replace(home); }
  };
  document.documentElement.dataset.rol = rol;
  if (app === 'cafeteria') { // inicio de sesión automático en la app de Cafetería
    var u = ses.user;
    localStorage.setItem('jr_cafeteria_token', 'portal-' + ses.token);
    localStorage.setItem('jr_cafeteria_user', JSON.stringify({
      id: u.id, usuario: u.usuario, nombre_completo: u.nombre, correo: u.correo, rol: rol,
      regional_id: 1, sede_id: 1, sede_nombre: u.sede || '', cargo: ''
    }));
  }
})();
