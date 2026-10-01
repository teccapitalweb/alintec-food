/* Encuesta flotante del landing · perfila visitantes nuevos y los conecta
   con su curso de prueba gratuita. Anónima: no pide correo salvo que el
   propio visitante decida dejarlo en el paso final de "lead caliente".

   Árbol real (no es un formulario lineal tipo Google Forms): cada perfil
   (p1) sigue su propio camino de preguntas en obtenerPasos() — un
   "Estudiante" nunca ve las preguntas de "Dueño de negocio" y viceversa.
   La pregunta "tamano" solo aparece para perfiles de empresa.

   Personaje: la carita SVG de #af-enc-face es un placeholder funcional
   (cambia de gesto con af_setExpr). Se puede sustituir por el diseño
   definitivo sin tocar el resto de este archivo — solo hay que mantener
   el id del contenedor y la función af_setExpr(nombre). */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBi2H0tyb1DEBi-KFpTV4a7CrFt6riuvPA",
  authDomain: "club-alintec.firebaseapp.com",
  projectId: "club-alintec",
  storageBucket: "club-alintec.firebasestorage.app",
  messagingSenderId: "559261559287",
  appId: "1:559261559287:web:8d1434cfbd3127521de6f2"
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const ESTADO_KEY = 'af_encuesta_estado'; // 'completada' | 'omitida'
const SID_KEY = 'af_encuesta_sid';

function getSessionId() {
  try {
    let sid = localStorage.getItem(SID_KEY);
    if (!sid) {
      sid = (crypto.randomUUID ? crypto.randomUUID() : 'sid-' + Date.now() + '-' + Math.random().toString(16).slice(2));
      localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch (e) { return 'sid-' + Date.now(); }
}

function yaRespondioOCerro() {
  try { return !!localStorage.getItem(ESTADO_KEY); } catch (e) { return false; }
}

function marcarEstado(valor) {
  try { localStorage.setItem(ESTADO_KEY, valor); } catch (e) {}
}

const PERFILES = ['Dueño de negocio', 'Área de calidad', 'Estudiante', 'Consultor'];
const PERFILES_EMPRESA = ['Dueño de negocio', 'Área de calidad'];

// Primer nivel de pregunta de reto, distinto por perfil.
const RETOS = {
  'Dueño de negocio': { q: '¿Tu reto hoy?', opts: ['Calidad', 'Costos', 'Certificación'] },
  'Área de calidad': { q: '¿Qué buscas?', opts: ['Capacitación', 'Normas', 'Auditorías'] },
  'Estudiante': { q: '¿Tu meta es?', opts: ['Certificado', 'Empleo', 'Saber más'] },
  'Consultor': { q: '¿Tu enfoque?', opts: ['Herramientas', 'Actualizarte', 'Clientes'] }
};

// Segundo nivel: profundiza según la respuesta del reto. 12 preguntas
// distintas en total (4 perfiles x 3 respuestas) — esto es lo que hace
// que sea un árbol real y no el mismo formulario para todos.
const PROFUNDIZACION = {
  'Dueño de negocio': {
    'Calidad': { q: '¿Qué parte de calidad?', opts: ['Proveedores', 'Proceso', 'Producto final'] },
    'Costos': { q: '¿Dónde se va el dinero?', opts: ['Mermas', 'Capacitación', 'Certificaciones'] },
    'Certificación': { q: '¿Qué certificación buscas?', opts: ['HACCP', 'ISO 22000', 'Distintivo H'] }
  },
  'Área de calidad': {
    'Capacitación': { q: '¿Para quién?', opts: ['Para mí', 'Mi equipo', 'Ambos'] },
    'Normas': { q: '¿Cuál norma?', opts: ['NOM-051', 'HACCP', 'ISO 22000'] },
    'Auditorías': { q: '¿Qué tipo?', opts: ['Interna', 'De cliente', 'Certificadora'] }
  },
  'Estudiante': {
    'Certificado': { q: '¿Para qué lo necesitas?', opts: ['Trabajo actual', 'Buscar empleo', 'Titulación'] },
    'Empleo': { q: '¿En qué área buscas?', opts: ['Calidad', 'Producción', 'Normativa'] },
    'Saber más': { q: '¿Tu nivel es?', opts: ['Principiante', 'Intermedio', 'Avanzado'] }
  },
  'Consultor': {
    'Herramientas': { q: '¿Qué tipo?', opts: ['Plantillas', 'Checklists', 'Software'] },
    'Actualizarte': { q: '¿En qué tema?', opts: ['Normativa nueva', 'Tendencias', 'Casos reales'] },
    'Clientes': { q: '¿Qué les ofreces?', opts: ['Capacitación', 'Auditoría', 'Certificación'] }
  }
};

// Mismos 4 pilares de cursos que ya se muestran en la sección "Experiencia"
// del landing — así la respuesta se puede usar directo para recomendar
// más cursos de ese tema, no solo el de prueba gratuita.
const TEMAS_INTERES = ['Formulación de producto', 'Calidad y microbiología', 'Normativa (NOM, COFEPRIS)', 'Inocuidad en planta'];

const respuestas = {};
let paso = 0;

// Construye la lista de pasos EN VIVO según lo que ya se respondió, por
// eso los pasos que dependen de una respuesta anterior (reto, profundización,
// tamaño de empresa) solo existen una vez que esa respuesta ya se dio.
function obtenerPasos() {
  const pasos = [];
  pasos.push({ clave: 'origen', q: '¿Cómo nos conociste?', opts: ['Redes sociales', 'Recomendación', 'Buscador', 'Otro'], expr: 'neutral' });
  pasos.push({ clave: 'p1', q: '¿Tú eres...?', opts: PERFILES, expr: 'neutral' });
  if (respuestas.p1) pasos.push({ clave: 'p2', ...RETOS[respuestas.p1], expr: 'thinking' });
  if (respuestas.p1 && respuestas.p2) pasos.push({ clave: 'p2b', ...PROFUNDIZACION[respuestas.p1][respuestas.p2], expr: 'thinking' });
  if (PERFILES_EMPRESA.includes(respuestas.p1)) pasos.push({ clave: 'tamano', q: '¿Cuántas personas trabajan contigo?', opts: ['Solo yo', '2 a 10', '11 a 50', 'Más de 50'], expr: 'neutral' });
  pasos.push({ clave: 'interes', q: '¿Qué tema te interesa más?', opts: TEMAS_INTERES, expr: 'thinking' });
  pasos.push({ clave: 'experiencia', q: '¿Ya tomaste cursos online?', opts: ['Sí, me gusta', 'Prefiero presencial', 'Es mi primera vez'], expr: 'neutral' });
  pasos.push({ clave: 'urgencia', q: '¿Qué tan urgente?', opts: ['Ya', 'Pronto', 'Solo viendo'], expr: 'surprised' });
  pasos.push({ clave: 'freno', q: '¿Qué te detiene hoy?', opts: ['Precio', 'Tiempo', 'No estoy seguro', 'Nada, listo'], expr: 'thinking' });
  pasos.push({ clave: 'cursoGratis', q: '¿Ver curso gratis?', opts: ['Sí', 'Después'], expr: 'happy' });
  return pasos;
}

function esLeadCaliente() {
  return respuestas.urgencia === 'Ya' && respuestas.cursoGratis === 'Sí';
}

function construirUI() {
  const wrap = document.createElement('div');
  wrap.id = 'af-enc-wrap';
  wrap.innerHTML = `
    <div id="af-enc-card">
      <button id="af-enc-close" aria-label="Cerrar">&times;</button>
      <div class="af-enc-head">
        <svg id="af-enc-face" width="40" height="40" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="#FFF3E0"/>
          <circle id="af-enc-blush1" cx="16" cy="36" r="4" fill="#F7941D" opacity="0"/>
          <circle id="af-enc-blush2" cx="48" cy="36" r="4" fill="#F7941D" opacity="0"/>
          <circle cx="22" cy="28" r="4" fill="#58B71B"/>
          <circle cx="42" cy="28" r="4" fill="#58B71B"/>
          <ellipse id="af-enc-mouthO" cx="32" cy="40" rx="4" ry="5" fill="#58B71B" style="display:none"/>
          <path id="af-enc-mouth" d="M22 38 Q32 40 42 38" stroke="#58B71B" stroke-width="3" fill="none" stroke-linecap="round"/>
        </svg>
        <p class="af-enc-q" id="af-enc-q"></p>
      </div>
      <div id="af-enc-body"></div>
      <div class="af-enc-dots" id="af-enc-dots"></div>
    </div>
  `;
  document.body.appendChild(wrap);
  wrap.querySelector('#af-enc-close').addEventListener('click', cerrarEncuesta);
  return wrap;
}

function af_setExpr(nombre) {
  const curva = { neutral: 2, thinking: -3, happy: 8, excited: 10 }[nombre];
  const mouth = document.getElementById('af-enc-mouth');
  const mouthO = document.getElementById('af-enc-mouthO');
  if (!mouth || !mouthO) return;
  if (nombre === 'surprised') { mouth.style.display = 'none'; mouthO.style.display = 'block'; }
  else { mouthO.style.display = 'none'; mouth.style.display = 'block'; mouth.setAttribute('d', `M22 38 Q32 ${38 + curva} 42 38`); }
  const on = (nombre === 'happy' || nombre === 'excited') ? 1 : 0;
  const b1 = document.getElementById('af-enc-blush1'), b2 = document.getElementById('af-enc-blush2');
  if (b1) b1.setAttribute('opacity', on);
  if (b2) b2.setAttribute('opacity', on);
}

function pintarDots(total, activo) {
  const el = document.getElementById('af-enc-dots');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const d = document.createElement('div');
    d.className = 'af-enc-dot' + (i <= activo ? ' is-active' : '');
    el.appendChild(d);
  }
}

function renderPaso() {
  const pasos = obtenerPasos();
  const def = pasos[paso];
  if (!def) { renderContactoOFin(); return; }
  document.getElementById('af-enc-q').textContent = def.q;
  af_setExpr(def.expr);
  const body = document.getElementById('af-enc-body');
  body.innerHTML = '';
  def.opts.forEach(opt => {
    const b = document.createElement('button');
    b.className = 'af-enc-opt';
    b.textContent = opt;
    b.addEventListener('click', () => elegir(def.clave, opt));
    body.appendChild(b);
  });
  pintarDots(pasos.length, paso);
}

function elegir(clave, opt) {
  respuestas[clave] = opt;
  af_setExpr('happy');
  setTimeout(() => { paso++; renderPaso(); }, 350);
}

function renderContactoOFin() {
  const body = document.getElementById('af-enc-body');
  const dots = document.getElementById('af-enc-dots');
  if (dots) dots.style.display = 'none';
  if (esLeadCaliente()) {
    document.getElementById('af-enc-q').textContent = 'Déjanos tu correo o WhatsApp y te avisamos';
    af_setExpr('excited');
    body.innerHTML = `
      <input class="af-enc-input" id="af-enc-contacto" type="text" placeholder="correo o WhatsApp">
      <button class="af-enc-opt" id="af-enc-contacto-ok" style="text-align:center;font-weight:600;">Avísenme →</button>
      <button class="af-enc-opt" id="af-enc-contacto-skip" style="text-align:center;color:#999;">Omitir</button>
    `;
    document.getElementById('af-enc-contacto-ok').addEventListener('click', () => {
      const v = document.getElementById('af-enc-contacto').value.trim();
      finalizarEncuesta(v || null);
    });
    document.getElementById('af-enc-contacto-skip').addEventListener('click', () => finalizarEncuesta(null));
    return;
  }
  finalizarEncuesta(null);
}

async function finalizarEncuesta(contacto) {
  af_setExpr('excited');
  document.getElementById('af-enc-q').textContent = '¡Listo! Buscando tu curso ideal';
  document.getElementById('af-enc-body').innerHTML = `<a class="af-enc-opt" style="text-align:center;font-weight:600;display:block;" href="vip-auth.html">Ver mi curso gratis →</a>`;
  marcarEstado('completada');
  try {
    const doc = { sessionId: getSessionId(), respuestas, completada: true, creado: serverTimestamp() };
    if (contacto) doc.contacto = contacto;
    await addDoc(collection(db, 'encuestasProspectos'), doc);
  } catch (e) { console.warn('[encuesta] no se pudo guardar:', e.message); }
}

async function cerrarEncuesta() {
  const wrap = document.getElementById('af-enc-wrap');
  if (wrap) wrap.remove();
  marcarEstado('omitida');
  if (Object.keys(respuestas).length > 0) {
    try {
      await addDoc(collection(db, 'encuestasProspectos'), {
        sessionId: getSessionId(), respuestas, completada: false, creado: serverTimestamp()
      });
    } catch (e) { console.warn('[encuesta] no se pudo guardar parcial:', e.message); }
  }
}

function abrirEncuesta() {
  if (yaRespondioOCerro() || document.getElementById('af-enc-wrap')) return;
  construirUI();
  paso = 0;
  renderPaso();
}

// El aviso de cookies (assets/js/cookie-consent.js) se monta con un z-index
// altísimo y cubre la misma franja inferior — si todavía no se decide,
// esperamos a que el visitante lo cierre para no tapar sus botones.
function iniciar() {
  const cookiesPendientes = window.alintecCookies && !window.alintecCookies.get() && document.getElementById('alintec-cookies');
  if (cookiesPendientes) document.addEventListener('alintec-cookies', abrirEncuesta, { once: true });
  else abrirEncuesta();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') iniciar();
else document.addEventListener('DOMContentLoaded', iniciar);
