/* Contador anónimo de visitas · Alintec Food
   - Sin cookies y sin guardar la IP: el servidor solo cuenta visitas y visitantes del día.
   - Una visita por página cada 30 minutos (recargar no infla el número).
   - No cuenta pruebas locales (solo alitecfood.com) ni a quien activó "No rastrear".
   - En el panel solo se envía cuando hay una sesión iniciada; así el administrador
     ve qué miembros entraron. Las personas sin sesión se cuentan en la página de acceso.
   Uso:  <script src="assets/js/visitas.js" data-pagina="landing" defer></script>
         (páginas: landing, acceso, panel; el panel detecta solo el modo demo)
*/
(function () {
  'use strict';
  var host = location.hostname;
  if (host !== 'alitecfood.com' && host !== 'www.alitecfood.com') return;
  try {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  } catch (e) { /* sin acceso: se sigue */ }

  var URL_API = 'https://alintec-webhook-production.up.railway.app/api/v2/visita';
  var VENTANA_MS = 30 * 60 * 1000;
  var etiqueta = document.currentScript && document.currentScript.getAttribute('data-pagina');
  var params = new URLSearchParams(location.search);
  var pagina = etiqueta === 'panel' && params.get('modo') === 'demo' ? 'demo' : etiqueta;
  if (['landing', 'acceso', 'panel', 'demo'].indexOf(pagina) === -1) return;

  function yaContada() {
    try {
      var antes = Number(sessionStorage.getItem('alintec_vis_' + pagina) || 0);
      return antes && Date.now() - antes < VENTANA_MS;
    } catch (e) { return false; }
  }
  function marcar() {
    try { sessionStorage.setItem('alintec_vis_' + pagina, String(Date.now())); } catch (e) { /* modo privado */ }
  }

  function enviar(token) {
    if (yaContada()) return;
    marcar();
    var cabeceras = { 'Content-Type': 'application/json' };
    if (token) cabeceras.Authorization = 'Bearer ' + token;
    var cuerpo = { pagina: pagina, ref: document.referrer || '', utm: params.get('utm_source') || '' };
    try {
      fetch(URL_API, { method: 'POST', headers: cabeceras, body: JSON.stringify(cuerpo), keepalive: true }).catch(function () {});
    } catch (e) { /* las métricas nunca deben estorbar */ }
  }

  if (pagina === 'panel') {
    // Espera a que Firebase confirme la sesión (hasta ~12 s) para identificar al miembro
    var intentos = 0;
    var espera = setInterval(function () {
      var usuario = window.__currentUser;
      intentos += 1;
      if (usuario && typeof usuario.getIdToken === 'function') {
        clearInterval(espera);
        usuario.getIdToken().then(enviar, function () { enviar(null); });
      } else if (intentos > 24) {
        clearInterval(espera);
      }
    }, 500);
  } else {
    enviar(null);
  }
})();
