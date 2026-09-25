/* Aviso de cookies · Alintec Food
   - Aparece en la primera visita y recuerda la elección (localStorage).
   - "Solo necesarias": el sitio funciona igual (sesión, tema, preferencias).
   - "Aceptar": permite además cookies de medición si algún día se activan.
   - Para leer la decisión desde otro script:  window.alintecCookies.get()
       → null (sin decidir) | { necesarias: true, medicion: true|false, fecha }
   - Para volver a abrirlo desde cualquier enlace:  <a href="#" data-cookie-settings>
*/
(function () {
  'use strict';
  var CLAVE = 'alintec_cookies_v1';

  function leer() {
    try {
      var r = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      return r && typeof r.medicion === 'boolean' ? r : null;
    } catch (e) { return null; }
  }
  function guardar(medicion) {
    var dato = { necesarias: true, medicion: !!medicion, fecha: new Date().toISOString() };
    try { localStorage.setItem(CLAVE, JSON.stringify(dato)); } catch (e) { /* modo privado: solo esta visita */ }
    try { document.dispatchEvent(new CustomEvent('alintec-cookies', { detail: dato })); } catch (e) {}
    return dato;
  }

  window.alintecCookies = { get: leer, abrir: function () { mostrar(true); } };

  var css =
    '#alintec-cookies{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:640px;margin:0 auto;' +
    'background:#141a16;color:#eef4ef;border:1px solid rgba(124,196,127,.35);border-radius:16px;padding:18px 20px;' +
    'box-shadow:0 18px 50px rgba(0,0,0,.35);font:500 13.5px/1.55 Montserrat,Inter,system-ui,sans-serif}' +
    '#alintec-cookies h2{margin:0 0 6px;font:700 15px/1.3 Montserrat,Inter,system-ui,sans-serif;color:#fff}' +
    '#alintec-cookies p{margin:0;color:#cfdcd2}' +
    '#alintec-cookies a{color:#9be07f;font-weight:600;text-decoration:underline}' +
    '#alintec-cookies .ac-btns{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}' +
    '#alintec-cookies button{flex:1 1 150px;min-height:44px;border-radius:12px;cursor:pointer;font:700 13.5px Montserrat,Inter,system-ui,sans-serif;' +
    'padding:10px 16px;border:1.5px solid rgba(155,224,127,.55);background:transparent;color:#d8f5c8}' +
    '#alintec-cookies button.ac-si{background:linear-gradient(135deg,#58B71B,#3E8F18);border-color:transparent;color:#0d1a0a}' +
    '#alintec-cookies button:focus-visible{outline:3px solid #9be07f;outline-offset:2px}' +
    '@media(max-width:480px){#alintec-cookies{left:10px;right:10px;bottom:10px;padding:16px}}';

  function mostrar(forzar) {
    if (!forzar && leer()) return;
    if (document.getElementById('alintec-cookies')) return;
    if (!document.getElementById('alintec-cookies-css')) {
      var st = document.createElement('style');
      st.id = 'alintec-cookies-css';
      st.textContent = css;
      document.head.appendChild(st);
    }
    var box = document.createElement('div');
    box.id = 'alintec-cookies';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Aviso de cookies');
    box.innerHTML =
      '<h2>Tu privacidad importa</h2>' +
      '<p>Usamos cookies necesarias para que el sitio funcione y, con tu permiso, otras para medir el uso y ' +
      'mejorar tu experiencia. Más información en el <a href="aviso-de-privacidad.html">Aviso de privacidad</a>.</p>' +
      '<div class="ac-btns">' +
      '<button type="button" class="ac-no">Solo necesarias</button>' +
      '<button type="button" class="ac-si">Aceptar todas</button>' +
      '</div>';
    function cerrar(medicion) { guardar(medicion); box.remove(); }
    box.querySelector('.ac-no').addEventListener('click', function () { cerrar(false); });
    box.querySelector('.ac-si').addEventListener('click', function () { cerrar(true); });
    document.body.appendChild(box);
  }

  function iniciar() {
    mostrar(false);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-cookie-settings]');
      if (!a) return;
      e.preventDefault();
      mostrar(true);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
