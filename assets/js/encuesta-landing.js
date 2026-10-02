/* Encuesta flotante del landing · perfila visitantes nuevos y los conecta
   con su curso de prueba gratuita. Anónima: no pide correo salvo que el
   propio visitante decida dejarlo en el paso final de "lead caliente".

   Árbol real (no es un formulario lineal tipo Google Forms): cada perfil
   (p1) sigue su propio camino de preguntas en obtenerPasos() — un
   "Estudiante" nunca ve las preguntas de "Dueño de negocio" y viceversa.
   La pregunta "tamano" solo aparece para perfiles de empresa.

   Personaje: #af-enc-face usa ilustraciones PNG y la nota inferior cambia
   de emoción y mensaje tanto por la pregunta como por la respuesta elegida. */

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
      <p class="af-enc-q" id="af-enc-q"></p>
      <div id="af-enc-body"></div>
      <div class="af-enc-dots" id="af-enc-dots"></div>
    </div>
    <div id="af-enc-companion" class="af-enc-companion">
      <div id="af-enc-face" class="af-enc-face" aria-hidden="true"></div>
      <div id="af-enc-note" class="af-enc-note" role="status" aria-live="polite">
        <strong id="af-enc-note-title"></strong>
        <span id="af-enc-note-copy"></span>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  wrap.querySelector('#af-enc-close').addEventListener('click', cerrarEncuesta);
  return wrap;
}

// Imágenes reales del personaje (diseñadas en ChatGPT). Son de cuerpo
// completo con fondo oscuro, así que el recuadro del personaje usa una
// máscara radial en CSS para que ese fondo se desvanezca en vez de verse
// como un rectángulo negro — no hay que recortar los archivos originales.
const IMAGENES_EXPR = {
  neutral: 'assets/img/encuesta/especialista-encuesta-bienvenida-v3.png',
  thinking: 'assets/img/encuesta/especialista-encuesta-pensando-v3.png',
  confused: 'assets/img/encuesta/especialista-encuesta-confundida-v3.png',
  concerned: 'assets/img/encuesta/especialista-encuesta-preocupada-v3.png',
  surprised: 'assets/img/encuesta/especialista-encuesta-sorprendida-v3.png',
  happy: 'assets/img/encuesta/especialista-encuesta-feliz-v3.png',
  excited: 'assets/img/encuesta/especialista-encuesta-feliz-v3.png'
};

const MENSAJES_EXPR = {
  neutral: { titulo: 'Estoy aquí para ayudarte.', texto: 'Elige la opción que mejor te represente. No hay respuestas incorrectas.' },
  thinking: { titulo: 'Pensemos juntos.', texto: 'Esta respuesta me ayudará a entender mejor lo que necesitas.' },
  confused: { titulo: 'No pasa nada si aún dudas.', texto: 'Elige la opción más cercana; podremos afinarla después.' },
  concerned: { titulo: 'Entiendo esa dificultad.', texto: 'Buscaremos una alternativa práctica para ayudarte a avanzar.' },
  surprised: { titulo: '¡Esto es importante!', texto: 'Tu respuesta cambia la prioridad de la recomendación.' },
  happy: { titulo: '¡Excelente elección!', texto: 'Ya puedo personalizar mejor tu experiencia.' },
  excited: { titulo: '¡Estamos listos!', texto: 'Tengo una recomendación preparada para ti.' }
};

const REACCIONES_RESPUESTA = {
  origen: {
    'Redes sociales': { expr: 'happy', titulo: '¡Qué gusto encontrarte!', texto: 'Seguiremos compartiendo contenido útil también por aquí.' },
    'Recomendación': { expr: 'happy', titulo: '¡Gracias por la confianza!', texto: 'Nos alegra que alguien te haya recomendado Alintec Food.' },
    'Buscador': { expr: 'thinking', titulo: 'Llegaste al lugar indicado.', texto: 'Te ayudaré a encontrar una ruta acorde con lo que buscabas.' },
    'Otro': { expr: 'neutral', titulo: 'Gracias por contármelo.', texto: 'Continuemos para conocer mejor lo que necesitas.' }
  },
  experiencia: {
    'Sí, me gusta': { expr: 'happy', titulo: '¡Perfecto!', texto: 'Podremos llevarte directamente a contenidos más especializados.' },
    'Prefiero presencial': { expr: 'concerned', titulo: 'Entiendo tu preferencia.', texto: 'Te mostraremos una experiencia digital clara, práctica y acompañada.' },
    'Es mi primera vez': { expr: 'surprised', titulo: '¡Bienvenido a esta experiencia!', texto: 'Te guiaremos paso a paso para que comenzar sea sencillo.' }
  },
  urgencia: {
    'Ya': { expr: 'surprised', titulo: 'Vamos a priorizarlo.', texto: 'Buscaré una opción que puedas comenzar cuanto antes.' },
    'Pronto': { expr: 'thinking', titulo: 'Podemos planearlo bien.', texto: 'Te recomendaré una ruta que puedas organizar a tu ritmo.' },
    'Solo viendo': { expr: 'neutral', titulo: 'Explora con calma.', texto: 'Te mostraré opciones útiles sin presionarte a decidir ahora.' }
  },
  freno: {
    'Precio': { expr: 'concerned', titulo: 'El presupuesto importa.', texto: 'Tomaré en cuenta opciones de alto valor y acceso flexible.' },
    'Tiempo': { expr: 'concerned', titulo: 'Sé que el tiempo es limitado.', texto: 'Buscaremos contenidos breves que puedas avanzar a tu ritmo.' },
    'No estoy seguro': { expr: 'confused', titulo: 'Es normal tener dudas.', texto: 'Con tus respuestas podré darte una recomendación más clara.' },
    'Nada, listo': { expr: 'happy', titulo: '¡Entonces avancemos!', texto: 'Ya casi tengo lista una ruta adecuada para ti.' }
  },
  cursoGratis: {
    'Sí': { expr: 'excited', titulo: '¡Excelente!', texto: 'Prepararé tu acceso para que conozcas la experiencia.' },
    'Después': { expr: 'neutral', titulo: 'Sin problema.', texto: 'Conservaremos tu recomendación para cuando quieras continuar.' }
  }
};

function obtenerReaccionRespuesta(clave, opt) {
  const especifica = REACCIONES_RESPUESTA[clave] && REACCIONES_RESPUESTA[clave][opt];
  if (especifica) return especifica;
  if (clave === 'p1') return { expr: 'happy', titulo: 'Perfecto, ya te ubico.', texto: `Adaptaré las siguientes preguntas a tu perfil: ${opt}.` };
  if (clave === 'tamano') {
    const expr = opt === 'Más de 50' ? 'surprised' : 'thinking';
    return { expr, titulo: 'Gracias, esto cambia la escala.', texto: `Consideraré un equipo de ${opt.toLowerCase()} en la recomendación.` };
  }
  if (clave === 'interes') return { expr: 'happy', titulo: 'Tema seleccionado.', texto: `${opt} tendrá prioridad en tu ruta personalizada.` };
  if (clave === 'p2' || clave === 'p2b') return { expr: 'thinking', titulo: 'Ya entiendo mejor tu reto.', texto: `Tomaré en cuenta “${opt}” para afinar la siguiente pregunta.` };
  return { expr: 'happy', titulo: 'Respuesta guardada.', texto: 'Continuemos para completar tu recomendación.' };
}

function af_setExpr(nombre, mensaje) {
  const cara = document.getElementById('af-enc-face');
  if (!cara) return;
  const src = IMAGENES_EXPR[nombre] || IMAGENES_EXPR.neutral;
  cara.style.backgroundImage = `url('${src}')`;
  const contenido = mensaje || MENSAJES_EXPR[nombre] || MENSAJES_EXPR.neutral;
  const titulo = document.getElementById('af-enc-note-title');
  const copia = document.getElementById('af-enc-note-copy');
  if (titulo) titulo.textContent = contenido.titulo;
  if (copia) copia.textContent = contenido.texto;
}

function af_animarReaccion() {
  const companion = document.getElementById('af-enc-companion');
  if (!companion) return;
  companion.classList.remove('is-reacting');
  void companion.offsetWidth;
  companion.classList.add('is-reacting');
  window.setTimeout(() => companion.classList.remove('is-reacting'), 450);
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
  const body = document.getElementById('af-enc-body');
  if (body) body.querySelectorAll('button').forEach(btn => { btn.disabled = true; });
  const reaccion = obtenerReaccionRespuesta(clave, opt);
  af_setExpr(reaccion.expr, reaccion);
  af_animarReaccion();
  const espera = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 300 : 760;
  setTimeout(() => { paso++; renderPaso(); }, espera);
}

function renderContactoOFin() {
  const body = document.getElementById('af-enc-body');
  const dots = document.getElementById('af-enc-dots');
  if (dots) dots.style.display = 'none';
  if (esLeadCaliente()) {
    document.getElementById('af-enc-q').textContent = 'Déjanos tu correo o WhatsApp y te avisamos';
    af_setExpr('excited', { titulo: 'Casi terminamos.', texto: 'Déjanos un medio de contacto solo si quieres recibir el aviso.' });
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
  af_setExpr('excited', { titulo: '¡Todo listo!', texto: 'Ya puedo mostrarte una opción basada en tus respuestas.' });
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
