/* Avatares ilustrados de Alintec Food
   Personas del mundo de los alimentos (laboratorio, inocuidad, calidad, planta, cocina) y las tres mascotas.
   Uso:  AlintecAvatares.html('lacto', 64)  →  HTML del avatar (SVG o imagen)
         AlintecAvatares.montar(document)   →  rellena los  <span data-avatar="id">
   La lista de ids válidos también vive en el servidor (index.js → AVATARES_VALIDOS). */
(function () {
  'use strict';

  var PERSONAS = {
    tecnica:    { nombre: 'Técnica de laboratorio', rol: 'Microbiología', fondo: '#D6F0E3', piel: '#F0C3A0', pelo: '#5B3A28', estilo: 'largo', ropa: 'bata', acento: '#2E9E6B' },
    tecnico:    { nombre: 'Técnico de laboratorio', rol: 'Análisis y calidad', fondo: '#DCE9FA', piel: '#C68B61', pelo: '#2A1A11', estilo: 'corto', ropa: 'bata', acento: '#3B7DD8', gafas: true },
    inspectora: { nombre: 'Inspectora de inocuidad', rol: 'BPM y HACCP', fondo: '#FCE6D3', piel: '#E7B189', pelo: '#1F1A17', estilo: 'chongo', ropa: 'cofia', acento: '#4FA3D9', mascarilla: true },
    inspector:  { nombre: 'Inspector de calidad', rol: 'Auditorías en planta', fondo: '#E3EFD0', piel: '#8B583A', pelo: '#141010', estilo: 'corto', ropa: 'chaleco', acento: '#F28C28', gorra: true },
    chef:       { nombre: 'Chef de planta', rol: 'Desarrollo de producto', fondo: '#FDEFC6', piel: '#EFC19A', pelo: '#3A291D', estilo: 'corto', ropa: 'chef', acento: '#E5533C' },
    ingeniera:  { nombre: 'Ingeniera de procesos', rol: 'Producción', fondo: '#FFE8B5', piel: '#D8A077', pelo: '#7B3A17', estilo: 'largo', ropa: 'casco', acento: '#2F6FB5' },
    nutriologa: { nombre: 'Nutrióloga', rol: 'Formulación y nutrición', fondo: '#E6F5D8', piel: '#F3CDAE', pelo: '#C9862B', estilo: 'rizado', ropa: 'verde', acento: '#3E9B4F' },
    auditor:    { nombre: 'Auditor', rol: 'Certificaciones', fondo: '#E7E3F6', piel: '#B27A53', pelo: '#B9B9B9', estilo: 'corto', ropa: 'saco', acento: '#C0392B', gafas: true },
    operario:   { nombre: 'Operario de línea', rol: 'Manufactura', fondo: '#DDF1F4', piel: '#DDA57C', pelo: '#3B2A20', estilo: 'corto', ropa: 'cofia', acento: '#4FA3D9', mascarilla: true, cofia: '#BFE6B8', borde: '#94C98C' }
  };
  var MASCOTAS = {
    guardi:   { nombre: 'Guardi', rol: 'La bacteria guardiana', fondo: '#D5ECF6', img: 'assets/img/mascotas/bacteria-guardiana.webp' },
    lacto:    { nombre: 'Lacto', rol: 'El bacilo investigador', fondo: '#DDF2D2', img: 'assets/img/mascotas/lacto-investigador.webp' },
    levadura: { nombre: 'Levi', rol: 'La levadura de la fermentación', fondo: '#FCE9C4', img: 'assets/img/mascotas/levadura-fermentacion.webp' }
  };
  var ORDEN = ['tecnica', 'tecnico', 'inspectora', 'inspector', 'chef', 'ingeniera', 'nutriologa', 'auditor', 'operario', 'guardi', 'lacto', 'levadura'];

  function cabello(p) {
    var c = p.pelo, atras = '', frente = '';
    if (p.estilo === 'largo') {
      atras = '<path d="M29 46C26 24 37 14 50 14s24 10 21 32l3 26H26z" fill="' + c + '"/>';
      frente = '<path d="M31 41C32 27 41 21 50 21s18 6 19 20c-5-8-11-11-19-11s-14 3-19 11z" fill="' + c + '"/>';
    } else if (p.estilo === 'chongo') {
      atras = '<circle cx="50" cy="13" r="7.5" fill="' + c + '"/>';
      frente = '<path d="M31 42C31 26 40 19 50 19s19 7 19 23c-5-9-11-12-19-12s-14 3-19 12z" fill="' + c + '"/>';
    } else if (p.estilo === 'rizado') {
      atras = '<g fill="' + c + '"><circle cx="34" cy="30" r="9"/><circle cx="43" cy="21" r="9"/><circle cx="57" cy="21" r="9"/><circle cx="66" cy="30" r="9"/><circle cx="30" cy="42" r="7"/><circle cx="70" cy="42" r="7"/></g>';
      frente = '<path d="M33 38C35 28 42 25 50 25s15 3 17 13c-4-5-9-7-17-7s-13 2-17 7z" fill="' + c + '"/>';
    } else {
      frente = '<path d="M31 42C30 25 40 17 50 17s20 8 19 25c-3-8-9-13-19-13s-16 5-19 13z" fill="' + c + '"/>';
    }
    return { atras: atras, frente: frente };
  }

  function ropa(p) {
    var hombros = 'M11 100C11 79 27 68 50 68s39 11 39 32z';
    switch (p.ropa) {
      case 'bata':
        return '<path d="' + hombros + '" fill="#FFFFFF"/><path d="M40 68l10 17 10-17z" fill="' + p.acento + '"/><path d="M50 85L35 69M50 85l15-16" stroke="#C9D3D9" stroke-width="1.6" fill="none" stroke-linecap="round"/><rect x="63" y="82" width="11" height="10" rx="2" fill="none" stroke="#C9D3D9" stroke-width="1.4"/><rect x="66" y="79" width="1.6" height="8" rx=".8" fill="' + p.acento + '"/>';
      case 'cofia':
        return '<path d="' + hombros + '" fill="#EAF3F9"/><path d="M41 68l9 12 9-12z" fill="' + p.acento + '"/><path d="M50 80V100" stroke="#B9CBD8" stroke-width="1.4"/>';
      case 'chaleco':
        return '<path d="' + hombros + '" fill="#2F5D45"/><path d="M24 76l10 24H20zM76 76L66 100h14z" fill="' + p.acento + '"/><path d="M38 68l12 14 12-14 9 6-6 26H35l-6-26z" fill="' + p.acento + '"/><path d="M33 90h34M31 82h38" stroke="#F4F1D0" stroke-width="2.2" opacity=".85"/>';
      case 'chef':
        return '<path d="' + hombros + '" fill="#FFFFFF"/><path d="M50 70V100" stroke="#D5DBDF" stroke-width="1.6"/><circle cx="44" cy="82" r="1.7" fill="#9AA7AE"/><circle cx="44" cy="91" r="1.7" fill="#9AA7AE"/><circle cx="56" cy="82" r="1.7" fill="#9AA7AE"/><circle cx="56" cy="91" r="1.7" fill="#9AA7AE"/><path d="M42 68l8 7 8-7" fill="none" stroke="' + p.acento + '" stroke-width="3" stroke-linecap="round"/>';
      case 'casco':
        return '<path d="' + hombros + '" fill="' + p.acento + '"/><path d="M41 68l9 11 9-11z" fill="#F4F6F8"/><path d="M22 84h56M22 92h56" stroke="#F2C230" stroke-width="3" opacity=".9"/>';
      case 'saco':
        return '<path d="' + hombros + '" fill="#2B3A55"/><path d="M40 68l10 20 10-20z" fill="#FFFFFF"/><path d="M50 74l-3 5 3 13 3-13z" fill="' + p.acento + '"/><path d="M40 68l-6 32M60 68l6 32" stroke="#1C283D" stroke-width="2"/>';
      default: // verde
        return '<path d="' + hombros + '" fill="' + p.acento + '"/><path d="M40 68c3 8 7 11 10 11s7-3 10-11" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>';
    }
  }

  function gorro(p) {
    if (p.ropa === 'cofia') { var cf = p.cofia || '#B6E0F7', bd = p.borde || '#8CC4E4'; return '<path d="M30 40C30 21 39 14 50 14s20 7 20 26c-6-8-13-11-20-11s-14 3-20 11z" fill="' + cf + '" stroke="' + bd + '" stroke-width="1.2"/><path d="M30 40q-2 5 0 9M70 40q2 5 0 9" stroke="' + bd + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>'; }
    if (p.ropa === 'chef') return '<g fill="#FFFFFF" stroke="#DCE2E6" stroke-width="1.2"><circle cx="38" cy="18" r="9"/><circle cx="50" cy="12" r="10.5"/><circle cx="62" cy="18" r="9"/><rect x="36" y="20" width="28" height="12" rx="3"/></g>';
    if (p.ropa === 'casco') return '<path d="M28 34C28 13 72 13 72 34z" fill="#F2C230" stroke="#D9A514" stroke-width="1.4"/><rect x="23" y="32" width="54" height="5" rx="2.5" fill="#F2C230" stroke="#D9A514" stroke-width="1.2"/><path d="M50 15v17" stroke="#D9A514" stroke-width="2.2"/>';
    if (p.gorra) return '<path d="M30 33C30 15 70 15 70 33z" fill="#2F5D45"/><path d="M28 33h38q10 0 12 5-10 1-28-1z" fill="#244936"/><circle cx="50" cy="21" r="2" fill="#F4F1D0"/>';
    return '';
  }

  function cara(p) {
    var s = '';
    s += '<ellipse cx="43" cy="45" rx="2" ry="2.4" fill="#26201C"/><ellipse cx="57" cy="45" rx="2" ry="2.4" fill="#26201C"/>';
    s += '<path d="M39 40q4-2.400 7-.6M54 39.400q3-1.800 7 .6" stroke="#26201C" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".75"/>';
    s += '<path d="M50 47q-1.400 4.500 .8 5.300" stroke="#000" stroke-opacity=".18" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    if (p.mascarilla) {
      s += '<path d="M35.500 50Q50 53.500 64.500 50L63 61Q50 69 37 61z" fill="#EAF3F9" stroke="#BCD0DE" stroke-width="1.2"/><path d="M39 55q11 3 22 0M39 59q11 3 22 0" stroke="#C9D9E4" stroke-width="1" fill="none"/>';
    } else {
      s += '<path d="M44 55.500q6 5 12 0" stroke="#9A3B3B" stroke-width="2" fill="none" stroke-linecap="round"/>';
      s += '<circle cx="37.500" cy="51" r="3" fill="#E9776B" opacity=".18"/><circle cx="62.500" cy="51" r="3" fill="#E9776B" opacity=".18"/>';
    }
    if (p.gafas) s += '<g fill="none" stroke="#2C2C2C" stroke-width="1.7"><circle cx="43" cy="45" r="5.600"/><circle cx="57" cy="45" r="5.600"/><path d="M48.600 45h2.800M37.400 44l-3-1.200M62.600 44l3-1.200"/></g>';
    return s;
  }

  function persona(p, tam) {
    var h = cabello(p), conGorro = !!(p.ropa === 'cofia' || p.ropa === 'chef' || p.ropa === 'casco' || p.gorra);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + tam + '" height="' + tam + '" role="img" aria-label="' + p.nombre + '">'
      + '<rect width="100" height="100" fill="' + p.fondo + '"/>'
      + '<circle cx="82" cy="18" r="16" fill="#FFFFFF" opacity=".28"/>'
      + (conGorro && p.ropa !== 'cofia' ? '' : h.atras)
      + ropa(p)
      + '<rect x="43" y="56" width="14" height="16" rx="5" fill="' + p.piel + '"/><rect x="43" y="56" width="14" height="16" rx="5" fill="#000" opacity=".1"/>'
      + '<circle cx="32.500" cy="46" r="3.300" fill="' + p.piel + '"/><circle cx="67.500" cy="46" r="3.300" fill="' + p.piel + '"/>'
      + '<ellipse cx="50" cy="44" rx="17.500" ry="20" fill="' + p.piel + '"/>'
      + (conGorro && p.ropa !== 'cofia' ? '' : (p.ropa === 'cofia' ? '' : h.frente))
      + gorro(p)
      + cara(p)
      + '</svg>';
    return svg;
  }

  function html(id, tam) {
    tam = tam || 64;
    if (MASCOTAS[id]) {
      var m = MASCOTAS[id];
      return '<span class="avatar-ilus" style="width:' + tam + 'px;height:' + tam + 'px;background:' + m.fondo + '"><img src="' + m.img + '" alt="' + m.nombre + '" width="' + tam + '" height="' + tam + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;object-position:50% 14%;transform:scale(1.28)"></span>';
    }
    if (PERSONAS[id]) return '<span class="avatar-ilus" style="width:' + tam + 'px;height:' + tam + 'px">' + persona(PERSONAS[id], tam) + '</span>';
    return '';
  }
  function info(id) {
    var o = PERSONAS[id] || MASCOTAS[id];
    return o ? { id: id, nombre: o.nombre, rol: o.rol } : null;
  }
  function valido(id) { return ORDEN.indexOf(id) !== -1; }
  function montar(raiz) {
    (raiz || document).querySelectorAll('[data-avatar]').forEach(function (el) {
      var id = el.getAttribute('data-avatar');
      if (!valido(id)) return;
      el.innerHTML = html(id, Number(el.getAttribute('data-tam')) || 56);
      el.classList.add('tiene-avatar');
    });
  }

  var css = '.avatar-ilus{display:inline-block;overflow:hidden;border-radius:50%;vertical-align:middle;flex-shrink:0;line-height:0}.avatar-ilus svg{display:block;width:100%;height:100%}';
  try { var st = document.createElement('style'); st.id = 'avatares-css'; st.textContent = css; document.head.appendChild(st); } catch (e) {}

  window.AlintecAvatares = { lista: ORDEN.slice(), html: html, info: info, valido: valido, montar: montar };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { montar(document); });
  else montar(document);
})();
