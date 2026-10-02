/* Encuesta del landing · perfila visitantes nuevos y los conecta
   con su prueba gratuita. Anónima: solo pide el WhatsApp, de forma opcional,
   en el último paso.

   Árbol real (no es un formulario lineal tipo Google Forms): cada perfil
   (p1) sigue su propio camino de preguntas en obtenerPasos() — un
   "Estudiante" nunca ve las preguntas de "Dueño de negocio" y viceversa.
   La pregunta "tamano" solo aparece para perfiles de empresa.

   Personaje: #af-enc-face usa recortes WebP sin fondo y la nota junto al personaje cambia
   de emoción y mensaje tanto por la pregunta como por la respuesta elegida.
   Vive como una sección fija debajo del hero (#encuentra), no como tarjeta flotante. */

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

const ESTADO_KEY = 'af_encuesta_estado'; // 'completada' (la sección ya no vuelve a mostrarse)
const PROG_KEY = 'af_encuesta_prog'; // { respuestas, paso, parcialN } para retomar donde se quedó
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

function leerEstado() {
  try { return localStorage.getItem(ESTADO_KEY); } catch (e) { return null; }
}

function marcarEstado(valor) {
  try { localStorage.setItem(ESTADO_KEY, valor); } catch (e) {}
}

function leerProgreso() {
  try { return JSON.parse(localStorage.getItem(PROG_KEY) || 'null') || {}; } catch (e) { return {}; }
}

function guardarProgreso(extra) {
  try { localStorage.setItem(PROG_KEY, JSON.stringify({ ...leerProgreso(), respuestas, paso, ...extra })); } catch (e) {}
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
  // Pregunta de arranque: amplia, aspiracional y fácil de contestar para cualquier perfil.
  pasos.push({
    clave: 'meta', q: '¿Qué quieres lograr este año?',
    opts: ['Crecer en mi carrera', 'Mejorar la calidad de mi empresa', 'Cumplir normas y auditorías', 'Certificarme y destacar'],
    expr: 'neutral',
    mensaje: { titulo: '¡Hola! Te ayudo a empezar.', texto: 'Son preguntas rápidas: toma menos de un minuto.' }
  });
  pasos.push({ clave: 'p1', q: '¿Tú eres...?', opts: PERFILES, expr: 'neutral' });
  pasos.push({ clave: 'origen', q: '¿Cómo nos conociste?', opts: ['Redes sociales', 'Recomendación', 'Buscador', 'Otro'], expr: 'neutral' });
  pasos.push({ clave: 'giro', q: '¿En qué sector trabajas o quieres trabajar?', opts: ['Lácteos y bebidas', 'Cárnicos y pescados', 'Panificación y botanas', 'Frutas y verduras', 'Otro sector'], expr: 'thinking' });
  if (respuestas.p1) pasos.push({ clave: 'p2', ...RETOS[respuestas.p1], expr: 'thinking' });
  if (respuestas.p1 && respuestas.p2) pasos.push({ clave: 'p2b', ...PROFUNDIZACION[respuestas.p1][respuestas.p2], expr: 'thinking' });
  if (PERFILES_EMPRESA.includes(respuestas.p1)) pasos.push({ clave: 'tamano', q: '¿Cuántas personas trabajan contigo?', opts: ['Solo yo', '2 a 10', '11 a 50', 'Más de 50'], expr: 'neutral' });
  pasos.push({ clave: 'interes', q: '¿Qué tema te interesa más?', opts: TEMAS_INTERES, expr: 'thinking' });
  pasos.push({ clave: 'experiencia', q: '¿Ya tomaste cursos online?', opts: ['Sí, me gusta', 'Prefiero presencial', 'Es mi primera vez'], expr: 'neutral' });
  pasos.push({ clave: 'urgencia', q: '¿Cuándo te gustaría empezar a capacitarte?', opts: [URGENTE, 'En el próximo mes', 'Solo estoy explorando'], expr: 'surprised' });
  pasos.push({ clave: 'freno', q: '¿Qué te detiene hoy?', opts: ['Precio', 'Tiempo', 'No estoy seguro', 'Nada, listo'], expr: 'thinking' });
  return pasos;
}

// Respuesta de urgencia que el panel de admin cuenta como "lead caliente".
const URGENTE = 'Lo antes posible';

// La encuesta vive como una sección fija justo debajo del hero (no flotante):
// el personaje a la izquierda, la pregunta y sus opciones a la derecha.
function construirUI() {
  const sec = document.createElement('section');
  sec.id = 'encuentra';
  sec.className = 'af-enc-section';
  sec.setAttribute('aria-label', 'Encuentra tu curso ideal');
  sec.innerHTML = `
    <div id="af-enc-wrap" class="af-enc-inner">
      <div id="af-enc-companion" class="af-enc-companion">
        <div id="af-enc-note" class="af-enc-note" role="status" aria-live="polite">
          <strong id="af-enc-note-title"></strong>
          <span id="af-enc-note-copy"></span>
        </div>
        <div id="af-enc-face" class="af-enc-face" aria-hidden="true"></div>
      </div>
      <div id="af-enc-card">
        <div class="af-enc-top">
          <p class="af-enc-step" id="af-enc-step"></p>
          <button type="button" class="af-enc-atras" id="af-enc-atras" hidden>← Anterior</button>
        </div>
        <p class="af-enc-q" id="af-enc-q"></p>
        <div id="af-enc-body"></div>
      </div>
    </div>
  `;
  const hero = document.getElementById('inicio');
  if (hero) hero.after(sec); else document.body.prepend(sec);
  sec.querySelector('#af-enc-atras').addEventListener('click', atras);
  return sec;
}

// Recortes del personaje (de la cabeza a la cintura, sin fondo, ~40 KB c/u),
// generados a partir de las ilustraciones originales especialista-encuesta-*-v3.png
// (cuerpo completo con fondo negro y halo, 1.4 MB c/u — esas NO se cargan en el sitio).
const IMAGENES_EXPR = {
  neutral: 'assets/img/encuesta/busto-bienvenida.webp',
  thinking: 'assets/img/encuesta/busto-pensando.webp',
  confused: 'assets/img/encuesta/busto-confundida.webp',
  concerned: 'assets/img/encuesta/busto-preocupada.webp',
  surprised: 'assets/img/encuesta/busto-sorprendida.webp',
  happy: 'assets/img/encuesta/busto-feliz.webp',
  excited: 'assets/img/encuesta/busto-feliz.webp'
};

// Se guardan las imágenes y se decodifican de antemano para que el cambio de pose
// del personaje sea instantáneo y no parpadee la primera vez que aparece cada una.
const imagenesPrecargadas = [];
function precargarImagenes() {
  [...new Set(Object.values(IMAGENES_EXPR))].forEach(src => {
    const img = new Image();
    img.src = src;
    if (img.decode) img.decode().catch(() => {});
    imagenesPrecargadas.push(img);
  });
}

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
    'Lo antes posible': { expr: 'surprised', titulo: 'Vamos a priorizarlo.', texto: 'Buscaremos cómo puedas comenzar cuanto antes.' },
    'En el próximo mes': { expr: 'thinking', titulo: 'Podemos planearlo bien.', texto: 'Tendrás tiempo de elegir con calma.' },
    'Solo estoy explorando': { expr: 'neutral', titulo: 'Explora con calma.', texto: 'Sin presión: mira las opciones y decide cuando quieras.' }
  },
  freno: {
    'Precio': { expr: 'concerned', titulo: 'El presupuesto importa.', texto: 'Tomaré en cuenta opciones de alto valor y acceso flexible.' },
    'Tiempo': { expr: 'concerned', titulo: 'Sé que el tiempo es limitado.', texto: 'Buscaremos contenidos breves que puedas avanzar a tu ritmo.' },
    'No estoy seguro': { expr: 'confused', titulo: 'Es normal tener dudas.', texto: 'Con tus respuestas podré darte una recomendación más clara.' },
    'Nada, listo': { expr: 'happy', titulo: '¡Entonces avancemos!', texto: 'Ya casi tengo lista una ruta adecuada para ti.' }
  }
};

function obtenerReaccionRespuesta(clave, opt) {
  const especifica = REACCIONES_RESPUESTA[clave] && REACCIONES_RESPUESTA[clave][opt];
  if (especifica) return especifica;
  if (clave === 'meta') return { expr: 'happy', titulo: '¡Buen objetivo!', texto: 'Vamos a ver cómo ayudarte a lograrlo.' };
  if (clave === 'giro') return { expr: 'thinking', titulo: 'Gracias, ya tengo tu contexto.', texto: opt === 'Otro sector' ? 'Cada sector tiene sus retos; seguimos conociéndote.' : `${opt} es un sector con muchas oportunidades.` };
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

function renderPaso() {
  if (!document.getElementById('af-enc-card')) return; // se cerró la sección mientras esperaba la reacción
  const pasos = obtenerPasos();
  const def = pasos[paso];
  if (!def) { renderContactoOFin(); return; }
  document.getElementById('af-enc-step').textContent = 'Encuentra tu curso ideal';
  document.getElementById('af-enc-q').textContent = def.q;
  af_setExpr(def.expr, def.mensaje);
  actualizarAtras();
  const body = document.getElementById('af-enc-body');
  body.innerHTML = '';
  def.opts.forEach(opt => {
    const b = document.createElement('button');
    b.className = 'af-enc-opt';
    if (respuestas[def.clave] === opt) b.classList.add('is-selected'); // al volver, se ve lo que ya había elegido
    b.textContent = opt;
    b.addEventListener('click', () => elegir(def.clave, opt, b));
    body.appendChild(b);
  });
}

function actualizarAtras(oculto) {
  const btn = document.getElementById('af-enc-atras');
  if (btn) btn.hidden = !!oculto || paso <= 0;
}

let ocupado = false; // evita clics (o "Anterior") mientras corre la transición

// Preguntas cuyo contenido o existencia depende de otra respuesta (ver obtenerPasos).
const DEPENDENCIAS = { p1: ['p2', 'p2b', 'tamano'], p2: ['p2b'] };

// Línea de tiempo al elegir: la opción se marca y el personaje reacciona al instante,
// la pregunta se desvanece y la siguiente aparece con un fundido corto.
function elegir(clave, opt, boton) {
  if (ocupado) return;
  ocupado = true;
  // Si al volver se cambia una respuesta, las que dependían de ella ya no aplican (el camino es otro).
  if (respuestas[clave] !== undefined && respuestas[clave] !== opt) {
    (DEPENDENCIAS[clave] || []).forEach(k => { delete respuestas[k]; });
  }
  respuestas[clave] = opt;
  const body = document.getElementById('af-enc-body');
  if (body) body.querySelectorAll('button').forEach(btn => { btn.disabled = true; });
  if (boton) boton.classList.add('is-selected');
  const reaccion = obtenerReaccionRespuesta(clave, opt);
  af_setExpr(reaccion.expr, reaccion);
  af_animarReaccion();
  cambiarPaso(1, 380, 580);
}

function atras() {
  if (ocupado || paso <= 0) return;
  ocupado = true;
  cambiarPaso(-1, 0, 160);
}

// Mueve el paso (+1 / -1) con el fundido: desvanece a los `iniciaFundido` ms y cambia a los `cambia` ms.
function cambiarPaso(delta, iniciaFundido, cambia) {
  const card = document.getElementById('af-enc-card');
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducido) setTimeout(() => { if (card) card.classList.add('is-swapping'); }, iniciaFundido);
  setTimeout(() => {
    const alturaAnterior = card ? card.offsetHeight : 0;
    paso = Math.max(0, paso + delta);
    guardarProgreso();
    renderPaso();
    ocupado = false;
    if (card) {
      if (!reducido) animarAltura(card, alturaAnterior);
      requestAnimationFrame(() => card.classList.remove('is-swapping'));
    }
  }, reducido ? 200 : cambia);
}

// La tarjeta se ajusta al contenido de cada pregunta (sin espacios en blanco) y lo hace
// con una transición de altura, para que ni la página ni el personaje den un salto.
function animarAltura(card, desde) {
  if (!desde) return;
  card.style.height = 'auto';
  const hasta = card.offsetHeight;
  if (Math.abs(hasta - desde) < 2) { card.style.height = ''; return; }
  card.style.height = desde + 'px';
  void card.offsetHeight;
  card.style.height = hasta + 'px';
  setTimeout(() => { card.style.height = ''; }, 320);
}

// Todos terminan en este paso (opcional), sea cual sea su urgencia: dejar su WhatsApp
// para que un asesor les envíe más información de cursos.
function renderContactoOFin() {
  const body = document.getElementById('af-enc-body');
  actualizarAtras();
  document.getElementById('af-enc-step').textContent = 'Un último detalle · opcional';
  document.getElementById('af-enc-q').textContent = '¿Quieres recibir más información de cursos?';
  af_setExpr('excited', { titulo: 'Casi terminamos.', texto: 'Déjanos tu WhatsApp y un asesor te escribe con opciones para ti. Es opcional.' });
  body.innerHTML = `
    <input class="af-enc-input" id="af-enc-contacto" type="tel" inputmode="tel" placeholder="Tu WhatsApp (con lada, 10 dígitos)" autocomplete="tel">
    <p class="af-enc-error" id="af-enc-error" role="alert" hidden></p>
    <button class="af-enc-opt af-enc-cta" id="af-enc-contacto-ok" type="button">Que me contacten →</button>
    <button class="af-enc-cerrar" id="af-enc-contacto-skip" type="button">No, gracias</button>
  `;
  const input = document.getElementById('af-enc-contacto');
  const error = document.getElementById('af-enc-error');
  const enviar = () => {
    const digitos = input.value.replace(/\D/g, '');
    if (digitos.length < 10) {
      error.textContent = 'Escribe tu WhatsApp con lada (10 dígitos) o elige "No, gracias".';
      error.hidden = false;
      input.focus();
      return;
    }
    finalizarEncuesta(digitos);
  };
  document.getElementById('af-enc-contacto-ok').addEventListener('click', enviar);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') enviar(); });
  input.addEventListener('input', () => { error.hidden = true; });
  document.getElementById('af-enc-contacto-skip').addEventListener('click', () => finalizarEncuesta(null));
}

// Todos ven al final el acceso a su prueba gratuita (no es un curso completo gratis).
function mostrarFinal() {
  actualizarAtras(true);
  const pasoEl = document.getElementById('af-enc-step');
  if (pasoEl) pasoEl.textContent = 'Gracias';
  af_setExpr('excited', { titulo: '¡Gracias por contarme!', texto: 'Con tus respuestas ya sé cómo orientarte.' });
  document.getElementById('af-enc-q').textContent = '¡Listo! Ya tengo lo que necesito';
  document.getElementById('af-enc-body').innerHTML = `<a class="af-enc-opt af-enc-cta" href="vip-auth.html">Ver tu prueba gratuita →</a>
    <button type="button" class="af-enc-cerrar" id="af-enc-cerrar">Ahora no, gracias</button>`;
  document.getElementById('af-enc-cerrar').addEventListener('click', cerrarSeccion);
}

async function finalizarEncuesta(contacto) {
  mostrarFinal();
  marcarEstado('completada');
  try {
    const doc = { sessionId: getSessionId(), respuestas, completada: true, creado: serverTimestamp() };
    if (contacto) doc.contacto = contacto;
    await addDoc(collection(db, 'encuestasProspectos'), doc);
  } catch (e) { console.warn('[encuesta] no se pudo guardar:', e.message); }
}

// Una vez completada, la sección se puede cerrar y no vuelve a aparecer en ese navegador.
function cerrarSeccion() {
  const sec = document.getElementById('encuentra');
  if (sec) sec.remove();
}

// Si el visitante se va a media encuesta se guarda una copia parcial (el panel de
// admin la reemplaza por la completa si luego termina). Mejor esfuerzo: al salir
// de la página el navegador puede cortar la petición.
function guardarParcialSiHaceFalta() {
  if (leerEstado() === 'completada') return;
  const n = Object.keys(respuestas).length;
  if (n === 0 || n === (leerProgreso().parcialN || 0)) return;
  guardarProgreso({ parcialN: n });
  addDoc(collection(db, 'encuestasProspectos'), {
    sessionId: getSessionId(), respuestas: { ...respuestas }, completada: false, creado: serverTimestamp()
  }).catch(e => console.warn('[encuesta] no se pudo guardar parcial:', e.message));
}

function iniciar() {
  if (leerEstado() === 'completada') return; // ya la respondió: la sección no vuelve a aparecer
  precargarImagenes();
  const prog = leerProgreso();
  Object.assign(respuestas, prog.respuestas || {});
  paso = prog.paso || 0;
  construirUI();
  renderPaso();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') guardarParcialSiHaceFalta();
  });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') iniciar();
else document.addEventListener('DOMContentLoaded', iniciar);
