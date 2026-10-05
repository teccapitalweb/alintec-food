/* Encuesta del landing · perfila visitantes nuevos y los conecta
   con su prueba gratuita. Anónima: el WhatsApp es opcional y va al final, como
   opción secundaria ("que un asesor me escriba"). Al terminar muestra un resultado
   (fortaleza, beneficios y cursos recomendados) que lleva a crear la cuenta.

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

// EDICION identifica la "vuelta" de la encuesta. Para que TODOS vuelvan a verla (por ejemplo después de borrar
// los datos de prueba) basta con subir este número: el estado guardado en cada navegador deja de aplicar.
const EDICION = 2;
const ESTADO_KEY = 'af_encuesta_estado_e' + EDICION; // 'completada' (la sección ya no vuelve a mostrarse)
const PROG_KEY = 'af_encuesta_prog_e' + EDICION; // { respuestas, paso, parcialN } para retomar donde se quedó
const SID_KEY = 'af_encuesta_sid';
// Fecha de la última actualización del texto de aviso-de-privacidad.html: queda guardada junto con
// el WhatsApp como constancia de qué versión aceptó la persona.
const AVISO_VERSION = 'aviso-2026-10-02';

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
  sec.setAttribute('aria-label', 'Cuéntanos de ti');
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
  if (!def) { renderResultado(); return; }
  resTk++; // cancela cualquier pantalla de resultado que estuviera cargando
  document.getElementById('af-enc-step').textContent = 'Cuéntanos de ti';
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
  guardarProgreso({ guardado: false }); // si cambió una respuesta, el resultado se vuelve a guardar
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

// Países para el WhatsApp. "pref" es el código telefónico. Para "Otro país" la persona escribe el
// número completo con su código.
const PAISES = [
  { cod: 'MX', nombre: 'México', pref: '52' },
  { cod: 'CO', nombre: 'Colombia', pref: '57' },
  { cod: 'AR', nombre: 'Argentina', pref: '54' },
  { cod: 'CL', nombre: 'Chile', pref: '56' },
  { cod: 'PE', nombre: 'Perú', pref: '51' },
  { cod: 'EC', nombre: 'Ecuador', pref: '593' },
  { cod: 'GT', nombre: 'Guatemala', pref: '502' },
  { cod: 'CR', nombre: 'Costa Rica', pref: '506' },
  { cod: 'PA', nombre: 'Panamá', pref: '507' },
  { cod: 'DO', nombre: 'Rep. Dominicana', pref: '1' },
  { cod: 'US', nombre: 'Estados Unidos', pref: '1' },
  { cod: 'ES', nombre: 'España', pref: '34' },
  { cod: 'OT', nombre: 'Otro país', pref: '' }
];

// País que se preselecciona según el idioma del navegador (es-CO → Colombia). Solo se usa si el
// idioma es español: un navegador en inglés no indica de dónde es la persona. Si no se sabe, México.
function paisPorDefecto() {
  try {
    const idioma = navigator.language || '';
    const region = new Intl.Locale(idioma).region;
    if (/^es/i.test(idioma) && region && PAISES.some(p => p.cod === region)) return region;
  } catch (e) {}
  return 'MX';
}

// Números que casi seguro son inventados: todos iguales, patrones repetidos (1212121212) o
// secuencias (1234567890). No puede comprobar que el número exista (eso solo se logra mandando
// un código), pero descarta lo obvio.
function esNumeroFalso(d) {
  if (d.length < 6) return true;
  for (let p = 1; p <= 5; p++) {
    if (d.length % p === 0 && d === d.slice(0, p).repeat(d.length / p)) return true;
  }
  const dif = [...d].slice(1).map((c, i) => (Number(c) - Number(d[i]) + 10) % 10);
  return dif.every(x => x === 1) || dif.every(x => x === 9);
}

// Devuelve el número listo para guardar (código de país + número, solo dígitos) o null si no es válido.
function normalizarWhatsapp(codPais, crudo) {
  let d = String(crudo).replace(/\D/g, '');
  const pais = PAISES.find(p => p.cod === codPais) || PAISES[0];
  if (pais.cod === 'MX') {
    // México: 10 dígitos; acepta que escriban +52 o 521. La lada no puede empezar en 0 ni en 1.
    if (d.length === 13 && d.startsWith('521')) d = d.slice(3);
    else if (d.length === 12 && d.startsWith('52')) d = d.slice(2);
    if (d.length !== 10 || !/^[2-9]/.test(d) || esNumeroFalso(d)) return null;
    return '52' + d;
  }
  if (pais.cod === 'OT') {
    // Otro país: número completo con su código, de 8 a 15 dígitos (estándar internacional).
    if (d.length < 8 || d.length > 15 || d.startsWith('0') || esNumeroFalso(d)) return null;
    return d;
  }
  // Resto: si escribieron también el código del país, se quita; el número nacional tiene 7 a 11 dígitos.
  if (d.startsWith(pais.pref) && d.length >= pais.pref.length + 8) d = d.slice(pais.pref.length);
  if (d.length < 7 || d.length > 11 || d.startsWith('0') || esNumeroFalso(d)) return null;
  return pais.pref + d;
}

// ── Resultado final ─────────────────────────────────────────────────────────
// Al terminar las preguntas se muestra una pantalla de resultado: la fortaleza de la persona (sale de
// lo que respondió; el test no mide conocimientos, por eso solo se habla de su perfil, nunca de su nivel), los
// beneficios de empezar y 3 cursos recomendados con las mismas tarjetas de la guía virtual.
// Al elegir un curso se guarda como preferencia (la misma que usa la guía virtual: 'af_curso_pref') y
// se le lleva a crear su cuenta; ya en el panel, ese curso se le propone como prueba gratuita. Si ya
// tiene cuenta, inicia sesión: el panel le muestra el curso en su estado normal (la prueba es una sola).
// El WhatsApp pasó a ser una opción secundaria ("que un asesor me escriba").
const PREF_CURSO_KEY = 'af_curso_pref'; // misma clave que lee vip-panel.html
const AUTH_URL = 'vip-auth.html';

const FORT_PERFIL = {
  'Dueño de negocio': 'visión de negocio',
  'Área de calidad': 'enfoque en la calidad',
  'Estudiante': 'ganas de crecer',
  'Consultor': 'mirada de consultor'
};
const EXP_TXT = {
  'Sí, me gusta': 'Ya sabes aprender en línea, así que avanzarás rápido.',
  'Prefiero presencial': 'Valoras el acompañamiento cercano: empieza con un curso y avanza a tu ritmo.',
  'Es mi primera vez': 'Es tu primera vez en línea y ya diste el primer paso; todo se hace paso a paso.'
};
const TEMA_FRASE = {
  'Formulación de producto': 'la formulación de producto',
  'Calidad y microbiología': 'la calidad y la microbiología',
  'Normativa (NOM, COFEPRIS)': 'la normativa (NOM, COFEPRIS)',
  'Inocuidad en planta': 'la inocuidad en planta'
};
const TEMA_CORTO = {
  'Formulación de producto': 'formulación de producto',
  'Calidad y microbiología': 'calidad y microbiología',
  'Normativa (NOM, COFEPRIS)': 'normativa',
  'Inocuidad en planta': 'inocuidad en planta'
};
const TEMA_CLAVES = {
  'Formulación de producto': /formul|tecnolog|nutric|funcional|conserva|suplement|extrac|recubrim/,
  'Calidad y microbiología': /microbio|calidad|laborator/,
  'Normativa (NOM, COFEPRIS)': /normativ|etiquet|nom|cofepris|distintivo|haccp|bpm|buenas prac/,
  'Inocuidad en planta': /inocuidad|haccp|bpm|buenas prac|higien|sanit/
};
const METAS_NORMA = { 'haccp': 'HACCP', 'iso 22000': 'ISO 22000', 'nom-051': 'NOM-051', 'distintivo h': 'Distintivo H' };
const BENEFICIOS = ['Prueba gratuita del curso que elijas', 'Sin tarjeta de crédito', 'Aprende en línea y a tu ritmo'];

let resTk = 0; // sube cada vez que cambia la pantalla: cancela esperas de una pantalla anterior
let contactoGuardado = false;

const esperar = ms => new Promise(r => setTimeout(r, ms));
const normaTxt = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function nodo(tag, cls, texto) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (texto != null) n.textContent = texto;
  return n;
}

// Catálogo real de cursos (lo carga la guía virtual de la página). Si no está disponible, el resultado
// se muestra igual, solo sin la lista de cursos.
async function cargarRecomendaciones() {
  // La guía virtual se carga después de la encuesta: si se retoma el resultado al recargar, se espera un poco.
  for (let i = 0; i < 30 && !window.AFCatalogo; i++) await esperar(100);
  const guia = window.AFCatalogo;
  if (!guia) return null;
  try {
    const catalogo = await guia.cargar();
    const lista = catalogo.filter(c => !c.pronto && c.clases >= 2);
    return lista.length ? { lista, portada: guia.portada } : null;
  } catch (e) { return null; }
}

// Elige hasta 3 cursos: primero los que coinciden con su meta (HACCP, NOM-051…) y con el tema que dijo
// que le interesa; el resto del catálogo solo completa si hacen falta.
function recomendar(lista) {
  const re = TEMA_CLAVES[respuestas.interes];
  const metas = [respuestas.p2b, respuestas.p2].filter(Boolean).map(normaTxt).filter(v => METAS_NORMA[v]);
  return lista
    .map((c, i) => {
      const t = normaTxt(c.titulo + ' ' + c.area);
      let pts = 0, razon = null;
      metas.forEach(m => { if (t.includes(m)) { pts += 5; razon = razon || METAS_NORMA[m]; } });
      if (re && re.test(t)) { pts += 3; razon = razon || TEMA_CORTO[respuestas.interes]; }
      if (re && re.test(normaTxt(c.area))) pts += 2; // el área del curso coincide: va por delante de una coincidencia solo en el título
      return { c, pts, razon, i };
    })
    .sort((a, b) => b.pts - a.pts || a.i - b.i)
    .slice(0, 3);
}

async function renderResultado() {
  const body = document.getElementById('af-enc-body');
  if (!body) return;
  const tk = ++resTk;
  actualizarAtras();
  document.getElementById('af-enc-step').textContent = 'Un momento';
  document.getElementById('af-enc-q').textContent = 'Preparando tu resultado…';
  af_setExpr('thinking', { titulo: 'Analizando tus respuestas.', texto: 'Estoy armando tu resultado y los cursos que más te pueden servir.' });
  body.innerHTML = '';
  const espera = nodo('div', 'af-enc-res af-enc-wait');
  espera.setAttribute('aria-hidden', 'true');
  espera.append(nodo('i'), nodo('i'), nodo('i'));
  body.appendChild(espera);
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [rec] = await Promise.all([cargarRecomendaciones(), esperar(reducido ? 250 : 1500)]);
  if (tk !== resTk || !document.getElementById('af-enc-card')) return;
  guardarRespuesta(null, { marcar: false }); // las respuestas ya están completas: se guardan sin esperar
  pintarResultado(rec);
}

function pintarResultado(rec, aviso) {
  const body = document.getElementById('af-enc-body');
  if (!body) return;
  resTk++;
  const recomendados = rec ? recomendar(rec.lista) : [];
  const fortaleza = FORT_PERFIL[respuestas.p1] || 'ganas de aprender';
  document.getElementById('af-enc-step').textContent = 'Tu resultado';
  document.getElementById('af-enc-q').textContent = 'Tu fortaleza: ' + fortaleza;
  af_setExpr('excited', { titulo: '¡Tu resultado está listo!', texto: 'Elige un curso y empieza tu prueba gratuita.' });
  actualizarAtras();
  const tema = TEMA_FRASE[respuestas.interes];
  const lead = (EXP_TXT[respuestas.experiencia] || 'Tienes todo para empezar.') +
    (tema ? ' Por lo que nos contaste, ' + tema + ' puede ser tu siguiente paso.' : '');

  const res = nodo('div', 'af-enc-res');
  res.appendChild(nodo('p', 'af-enc-lead', lead));
  const beneficios = nodo('ul', 'af-enc-benef');
  BENEFICIOS.forEach(b => beneficios.appendChild(nodo('li', null, b)));
  res.appendChild(beneficios);
  if (aviso) res.appendChild(nodo('p', 'af-enc-ok', aviso));

  if (recomendados.length) {
    res.appendChild(nodo('p', 'af-enc-h', 'Cursos que te pueden servir'));
    res.appendChild(nodo('p', 'af-enc-hint', 'Selecciona el curso de tu interés y comienza tu prueba gratuita con el curso de tu preferencia.'));
    const lista = nodo('div', 'af-enc-lista');
    recomendados.forEach(({ c, razon }) => lista.appendChild(filaCurso(c, razon, rec.portada, () => confirmarCurso(c, razon, rec, aviso))));
    res.appendChild(lista);
  } else {
    const crear = nodo('a', 'af-enc-opt af-enc-cta', 'Crear mi cuenta gratis →');
    crear.href = AUTH_URL + '?tab=register';
    crear.addEventListener('click', ev => { ev.preventDefault(); irAAuth('register'); });
    res.appendChild(crear);
  }

  const pie = nodo('div', 'af-enc-pie');
  const yaTengo = nodo('button', 'af-enc-link', 'Ya tengo cuenta');
  yaTengo.type = 'button';
  yaTengo.addEventListener('click', () => irAAuth('login'));
  const asesor = nodo('button', 'af-enc-link', 'Prefiero que un asesor me escriba');
  asesor.type = 'button';
  asesor.addEventListener('click', () => renderContacto(rec));
  const seguir = nodo('button', 'af-enc-link', 'Seguir viendo');
  seguir.type = 'button';
  seguir.addEventListener('click', async () => { await guardarRespuesta(null); cerrarSeccion(); });
  pie.append(yaTengo, asesor, seguir);
  res.appendChild(pie);
  body.innerHTML = '';
  body.appendChild(res);
}

// Misma tarjeta que usa la guía virtual (foto, nombre y "Ver →"), con el motivo de la recomendación.
function filaCurso(c, razon, portada, alElegir) {
  const b = nodo('button', 'af-cb-cur');
  b.type = 'button';
  const th = nodo('span', 'af-cb-th', c.emoji);
  const img = nodo('img');
  img.alt = '';
  img.loading = 'lazy';
  img.src = portada(c);
  img.addEventListener('error', () => img.remove());
  th.appendChild(img);
  const ct = nodo('span', 'af-cb-ct');
  ct.append(nodo('b', null, c.titulo), nodo('small', null, razon ? 'Te serviría para reforzar ' + razon : c.area));
  b.append(th, ct, nodo('span', 'af-cb-go', 'Ver →'));
  b.addEventListener('click', alElegir);
  return b;
}

// Confirmación antes de llevar a la persona a otra página (como en la guía virtual).
function confirmarCurso(c, razon, rec, aviso) {
  const body = document.getElementById('af-enc-body');
  if (!body) return;
  resTk++;
  document.getElementById('af-enc-step').textContent = 'Tu prueba gratuita';
  document.getElementById('af-enc-q').textContent = 'Elegiste: ' + c.titulo;
  af_setExpr('happy', { titulo: '¡Buena elección!', texto: 'Te llevo a crear tu cuenta y ahí confirmas tu prueba gratuita.' });
  const res = nodo('div', 'af-enc-res');
  res.appendChild(nodo('p', 'af-enc-lead', 'Te llevo a crear tu cuenta gratis y ahí confirmas este curso como tu prueba gratuita.'));
  res.appendChild(nodo('p', 'af-enc-hint', '¿Ya tienes cuenta? Inicia sesión: verás el curso en tu panel, pero la prueba gratuita se usa una sola vez por persona, así que no se desbloqueará de nuevo.'));
  const crear = nodo('a', 'af-enc-opt af-enc-cta', 'Crear mi cuenta gratis →');
  crear.href = AUTH_URL + '?tab=register&curso=' + encodeURIComponent(c.id);
  crear.addEventListener('click', ev => { ev.preventDefault(); irAAuth('register', c); });
  const ya = nodo('button', 'af-enc-opt af-enc-sec', 'Ya tengo cuenta');
  ya.type = 'button';
  ya.addEventListener('click', () => irAAuth('login', c));
  const otro = nodo('button', 'af-enc-link', '← Elegir otro curso');
  otro.type = 'button';
  otro.addEventListener('click', () => pintarResultado(rec, aviso));
  res.append(crear, ya, otro);
  body.innerHTML = '';
  body.appendChild(res);
}

// Guarda lo respondido y lleva a crear cuenta o iniciar sesión. El curso elegido queda como preferencia
// para que el panel lo proponga como prueba gratuita (solo si la cuenta es nueva y elegible).
async function irAAuth(tab, curso) {
  if (curso) {
    try { localStorage.setItem(PREF_CURSO_KEY, JSON.stringify({ id: curso.id, titulo: curso.titulo, t: Date.now() })); } catch (e) {}
  }
  document.querySelectorAll('#af-enc-body button, #af-enc-body a').forEach(el => { el.style.pointerEvents = 'none'; });
  await guardarRespuesta(null); // se espera el guardado: si no, el cambio de página lo cancelaría
  window.location.href = AUTH_URL + '?tab=' + tab + (curso ? '&curso=' + encodeURIComponent(curso.id) : '');
}

// Pantalla secundaria: dejar el WhatsApp para que un asesor escriba (opcional, con Aviso de privacidad).
function renderContacto(rec) {
  const body = document.getElementById('af-enc-body');
  if (!body) return;
  resTk++;
  actualizarAtras(true);
  document.getElementById('af-enc-step').textContent = 'Un asesor te escribe';
  document.getElementById('af-enc-q').textContent = '¿A qué WhatsApp te escribimos?';
  af_setExpr('excited', { titulo: 'Con gusto te ayudamos.', texto: 'Déjanos tu WhatsApp y un asesor te escribe con opciones para ti. Es opcional.' });
  body.innerHTML = `
    <div class="af-enc-telrow">
      <select class="af-enc-pais" id="af-enc-pais" aria-label="País de tu WhatsApp">
        ${PAISES.map(p => `<option value="${p.cod}">${p.nombre}${p.pref ? ' +' + p.pref : ''}</option>`).join('')}
      </select>
      <input class="af-enc-input" id="af-enc-contacto" type="tel" inputmode="tel" autocomplete="tel">
    </div>
    <p class="af-enc-error" id="af-enc-error" role="alert" hidden></p>
    <label class="af-enc-consent" id="af-enc-consent">
      <input type="checkbox" id="af-enc-acepto">
      <span>Acepto el <a href="aviso-de-privacidad.html" target="_blank" rel="noopener">Aviso de privacidad</a> y que un asesor me escriba por WhatsApp con información de cursos.</span>
    </label>
    <button type="button" class="af-enc-opt af-enc-cta" id="af-enc-enviar">Guardar mi WhatsApp</button>
    <button type="button" class="af-enc-opt af-enc-sec" id="af-enc-volver">Volver a mis cursos</button>
  `;
  const input = document.getElementById('af-enc-contacto');
  const error = document.getElementById('af-enc-error');
  const acepto = document.getElementById('af-enc-acepto');
  const consent = document.getElementById('af-enc-consent');
  const enviar = document.getElementById('af-enc-enviar');
  const volver = document.getElementById('af-enc-volver');
  const pais = document.getElementById('af-enc-pais');
  const AYUDA_NUMERO = {
    MX: 'Escribe tu WhatsApp de México con 10 dígitos y lada (por ejemplo 55 1234 5678).',
    OT: 'Escríbelo completo con el código de tu país (por ejemplo +49 151 2345 6789).',
    otro: 'Escríbelo completo, sin el código del país.'
  };
  const PLACEHOLDER = { MX: '10 dígitos con lada', OT: 'Con código de país (+…)' };
  const avisar = (texto, marcarCasilla) => {
    error.textContent = texto;
    error.hidden = false;
    consent.classList.toggle('is-error', !!marcarCasilla);
  };
  const limpiarError = () => { error.hidden = true; consent.classList.remove('is-error'); };
  pais.value = paisPorDefecto();
  // El selector se ajusta al texto del país elegido para que la flecha quede junto a él, no al fondo.
  const ajustarAnchoPais = () => {
    const medidor = document.createElement('span');
    const estilo = getComputedStyle(pais);
    medidor.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:' + estilo.font;
    medidor.textContent = pais.options[pais.selectedIndex].text;
    document.body.appendChild(medidor);
    pais.style.width = Math.ceil(medidor.getBoundingClientRect().width) + 14 + 30 + 4 + 'px';
    medidor.remove();
  };
  const actualizarPais = () => { input.placeholder = PLACEHOLDER[pais.value] || 'Tu número'; ajustarAnchoPais(); };
  actualizarPais();
  pais.addEventListener('change', () => { actualizarPais(); limpiarError(); });
  input.addEventListener('input', limpiarError);
  acepto.addEventListener('change', limpiarError);
  // Aquí el número sí es el objetivo: debe ser válido (WhatsApp de México u otro país) y tener marcada la
  // casilla del Aviso de privacidad; sin eso no se guarda ni se usa.
  const guardar = async () => {
    const crudo = input.value.trim();
    if (!crudo) { avisar('Escribe tu número, o vuelve a tus cursos si prefieres no dejarlo.', false); input.focus(); return; }
    const numero = normalizarWhatsapp(pais.value, crudo);
    if (!numero) {
      avisar(`Ese número no parece válido. ${AYUDA_NUMERO[pais.value] || AYUDA_NUMERO.otro}`, false);
      input.focus();
      return;
    }
    if (!acepto.checked) { avisar('Marca la casilla para que un asesor pueda escribirte.', true); return; }
    enviar.textContent = 'Guardando…';
    enviar.disabled = true;
    volver.disabled = true;
    await guardarRespuesta(numero, { marcar: false });
    contactoGuardado = true;
    pintarResultado(rec, '¡Listo! Un asesor te escribirá por WhatsApp. Mientras, puedes elegir tu curso.');
  };
  enviar.addEventListener('click', guardar);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') guardar(); });
  volver.addEventListener('click', () => pintarResultado(rec));
}

// Guarda la encuesta completa. Espera como máximo 3 s para no dejar colgada a la persona.
// Las respuestas se guardan una sola vez (al mostrar el resultado); el WhatsApp, si lo deja, va en un
// segundo documento con la misma sesión (el panel de admin prefiere el que trae contacto).
async function guardarRespuesta(contacto, { marcar = true } = {}) {
  if (marcar) marcarEstado('completada');
  if (!contacto && leerProgreso().guardado) return;
  guardarProgreso({ guardado: true });
  const doc = { sessionId: getSessionId(), respuestas: { ...respuestas }, completada: true, creado: serverTimestamp() };
  if (contacto) {
    doc.contacto = contacto;
    doc.avisoAceptado = true;
    doc.avisoVersion = AVISO_VERSION;
  }
  const guardado = addDoc(collection(db, 'encuestasProspectos'), doc)
    .catch(e => console.warn('[encuesta] no se pudo guardar:', e.message));
  await Promise.race([guardado, new Promise(r => setTimeout(r, 3000))]);
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
  if (leerEstado() === 'completada' || leerProgreso().guardado) return;
  const n = Object.keys(respuestas).length;
  if (n === 0 || n === (leerProgreso().parcialN || 0)) return;
  guardarProgreso({ parcialN: n });
  addDoc(collection(db, 'encuestasProspectos'), {
    sessionId: getSessionId(), respuestas: { ...respuestas }, completada: false, creado: serverTimestamp()
  }).catch(e => console.warn('[encuesta] no se pudo guardar parcial:', e.message));
}

function iniciar() {
  // Limpia el estado de ediciones anteriores para no dejar basura en el navegador.
  try { Object.keys(localStorage).filter(k => /^af_encuesta_(estado|prog)(_ed+)?$/.test(k) && k !== ESTADO_KEY && k !== PROG_KEY).forEach(k => localStorage.removeItem(k)); } catch (e) {}
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
