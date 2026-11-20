/* Guardia de sesión: cada app lo carga en <head>.
   Sin sesión válida o sin acceso -> vuelve al portal.
   Este archivo va en la RAÍZ del repo (junto al index.html del portal). */
(function () {
  var sc = document.currentScript;
  var app = sc.dataset.app;
  var home = new URL('index.html', new URL('.', sc.src)).href;
  var ses = null;
  try { ses = JSON.parse(localStorage.getItem('jr_portal_session')); } catch (e) {}

  var rol = ses && ses.exp > Date.now() && ses.user && ses.user.accesos && ses.user.accesos[app];
  if (!rol) { (window.top || window).location.replace(home); throw new Error('Sin acceso'); }

  window.PORTAL = {
    user: ses.user,
    rol: rol,
    logout: function () {
      localStorage.removeItem('jr_portal_session');
      localStorage.removeItem('jr_cafeteria_user');
      localStorage.removeItem('jr_cafeteria_token');
      (window.top || window).location.replace(home);
    }
  };
  document.documentElement.dataset.rol = rol;

  /* Inicio de sesión automático en Cafetería: SIEMPRE se sobrescribe con la identidad del portal,
     así nunca queda un usuario viejo guardado. */
  if (app === 'cafeteria') {
    var SEDES = ['Armenia', 'Calarcá', 'Circasia', 'Córdoba', 'Génova', 'La Tebaida', 'Montenegro', 'Pijao', 'Quimbaya', 'Barcelona'];
    var u = ses.user;
    var esAdmin = u.rol === 'admin';
    var rolCaf = esAdmin ? 'ADMINISTRADOR' : String(rol).toUpperCase();
    var sedeNombre = u.sede || (rolCaf === 'SEDE' ? '' : 'Armenia');
    var idx = SEDES.indexOf(sedeNombre);
    localStorage.setItem('jr_cafeteria_token', 'portal-' + ses.token);
    localStorage.setItem('jr_cafeteria_user', JSON.stringify({
      id: u.id,
      usuario: u.usuario,
      nombre_completo: u.nombre,
      correo: u.correo || '',
      rol: rolCaf,
      regional_id: 1,
      sede_id: idx >= 0 ? idx + 1 : 1,
      sede_nombre: sedeNombre,
      cargo: esAdmin ? 'Administrador del portal' : ''
    }));
  }
})();
