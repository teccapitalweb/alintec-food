/* Guía virtual de cursos de la página principal.
   No es inteligencia artificial: conversa con botones y una búsqueda sencilla dentro del
   catálogo real (/api/cursos/demo). Cuando la persona toca "Ver →" en un curso se guarda
   cuál fue y se le lleva a crear su cuenta (o iniciar sesión); ya dentro del panel, ese
   curso se le propone como su prueba gratuita (ver vip-panel.html). */
(function () {
  'use strict';
  if (window.__afChatbot) return;
  window.__afChatbot = true;

  const API = 'https://alintec-webhook-production.up.railway.app';
  const PRECIOS_URL = 'https://firestore.googleapis.com/v1/projects/club-alintec/databases/(default)/documents/config/club?key=AIzaSyBi2H0tyb1DEBi-KFpTV4a7CrFt6riuvPA';
  const WA_NUM = '5212381863934';
  const AUTH_URL = 'vip-auth.html';
  const PREF_KEY = 'af_curso_pref';
  const VISTO_KEY = 'af_cb_visto';
  const CAT_KEY = 'af_cb_catalogo_v1';
  const LOTE = 3; // cursos que se muestran de a poco

  // ── utilidades ────────────────────────────────────────────
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  const esperar = ms => new Promise(r => setTimeout(r, ms));

  function el(tag, cls, texto) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // Portadas: mismas fotos de alimentos que usa el panel, elegidas por tema del título.
  const U = id => 'https://images.unsplash.com/photo-' + id + '?w=240&auto=format&fit=crop&q=70';
  const POOLS = {
    proceso: ['1556909114-f6e7ad7d3136', '1466637574441-749b8f19452f', '1512621776951-a57141f2eefd'].map(U),
    lab: ['1532187863486-abf9dbad1b69', '1579154204601-01588f351e67', '1582719471384-894fbb16e074'].map(U),
    norma: ['1498837167922-ddd27525d352', '1542838132-92c53300491e', '1488459716781-31db52582fe9'].map(U),
    general: ['1512621776951-a57141f2eefd', '1466637574441-749b8f19452f', '1498837167922-ddd27525d352', '1556909114-f6e7ad7d3136', '1542838132-92c53300491e'].map(U)
  };
  const TEMAS = [
    ['proceso', ['tecnolog', 'proceso', 'conserva', 'empaque', 'envase', 'recubrimient', 'extract', 'formulac', 'electroquim']],
    ['lab', ['microbio', 'bacteri', 'listeria', 'salmonel', 'coliform', 'levadura', 'moho', 'laboratorio', 'analisis']],
    ['norma', ['inocuidad', 'haccp', 'bpm', 'buenas practic', 'higien', 'sanit', 'contamina', 'patogen', 'distintivo h', 'nom-051', 'nom ', 'etiquetad', 'normativ', 'cofepris']]
  ];
  function portada(c) {
    const t = norm(c.titulo + ' ' + c.area);
    let pool = POOLS.general;
    for (const [tema, claves] of TEMAS) {
      if (claves.some(k => t.includes(k))) { pool = POOLS[tema]; break; }
    }
    let h = 0;
    for (let i = 0; i < c.id.length; i++) h = (h * 31 + c.id.charCodeAt(i)) >>> 0;
    return pool[h % pool.length];
  }

  // ── catálogo ──────────────────────────────────────────────
  let catalogo = null;
  let cargando = null;

  function cargarCatalogo() {
    if (catalogo) return Promise.resolve(catalogo);
    if (cargando) return cargando;
    try {
      const guardado = JSON.parse(ss.get(CAT_KEY) || 'null');
      if (guardado && Array.isArray(guardado.d) && Date.now() - guardado.t < 10 * 60 * 1000) {
        catalogo = guardado.d;
        return Promise.resolve(catalogo);
      }
    } catch (e) {}
    cargando = fetch(API + '/api/cursos/demo')
      .then(r => { if (!r.ok) throw new Error('catalogo'); return r.json(); })
      .then(j => {
        const lista = (Array.isArray(j.cursos) ? j.cursos : [])
          .filter(c => c && c.id && c.titulo && Array.isArray(c.sesiones) && c.sesiones.length)
          .map(c => ({
            id: String(c.id),
            titulo: String(c.titulo),
            area: String(c.area || 'General'),
            emoji: String(c.emoji || '📚'),
            desc: String(c.descripcion || ''),
            clases: c.sesiones.length,
            pronto: c.marcarProximamente === true
          }));
        if (!lista.length) throw new Error('vacio');
        catalogo = lista;
        ss.set(CAT_KEY, JSON.stringify({ t: Date.now(), d: lista }));
        return lista;
      })
      .catch(e => { cargando = null; throw e; });
    return cargando;
  }

  const disponibles = () => catalogo.filter(c => !c.pronto);
  // La encuesta de la página usa el mismo catálogo y las mismas portadas para recomendar cursos.
  window.AFCatalogo = { cargar: cargarCatalogo, portada };
  function areas() {
    const cuenta = new Map();
    disponibles().forEach(c => cuenta.set(c.area, (cuenta.get(c.area) || 0) + 1));
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')).map(e => e[0]);
  }

  // Precio vigente (mismo documento que usa el cobro). Si no se puede leer, no se inventa.
  let precios;
  function cargarPrecios() {
    if (precios !== undefined) return Promise.resolve(precios);
    return fetch(PRECIOS_URL)
      .then(r => r.json())
      .then(j => {
        const f = (j && j.fields) || {};
        const n = k => { const v = f[k]; return v ? Number(v.integerValue || v.doubleValue) : NaN; };
        const mes = n('precioMes');
        const ano = n('precioAno');
        precios = (mes > 0 && ano > 0) ? { mes, ano } : null;
        return precios;
      })
      .catch(() => { precios = null; return null; });
  }
  const dinero = n => '$' + Number(n).toLocaleString('es-MX');

  // ── interfaz ──────────────────────────────────────────────
  let envoltura, burbuja, tip, dot, panel, cuerpo, campo;
  let sesion = 0; // sube con "Empezar de nuevo" para cancelar conversaciones a medias
  let iniciado = false;

  function construir() {
    const pila = document.querySelector('.social-float-stack') || (() => {
      const d = el('div');
      d.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:999;display:flex;flex-direction:column;align-items:flex-end;gap:10px';
      document.body.appendChild(d);
      return d;
    })();

    envoltura = el('div', 'af-cb-wrap');
    burbuja = el('button', 'af-cb-bubble');
    burbuja.type = 'button';
    burbuja.setAttribute('aria-label', 'Abrir tu guía virtual de cursos');
    burbuja.setAttribute('aria-expanded', 'false');
    burbuja.append(el('span', 'af-cb-base'), el('span', 'af-cb-pj'));
    dot = el('span', 'af-cb-dot');
    dot.hidden = !!ls.get(VISTO_KEY);
    burbuja.appendChild(dot);

    // Notita flotando sobre el personaje (siempre visible mientras la guía está minimizada)
    tip = el('div', 'af-cb-tip', 'Tu asistente virtual');
    tip.setAttribute('aria-hidden', 'true');
    envoltura.append(burbuja, tip);
    burbuja.addEventListener('click', abrir);
    pila.insertBefore(envoltura, pila.firstChild);

    panel = el('div', 'af-cb-panel');
    panel.id = 'af-cb-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Tu guía virtual de cursos');

    const hd = el('div', 'af-cb-hd');
    const tt = el('div', 'af-cb-tt');
    tt.append(el('small', null, 'Alintec Food'), el('b', null, 'Tu guía'), el('span', null, 'Guía virtual de cursos'));
    const reiniciar = el('button', 'af-cb-ic', '↻');
    reiniciar.type = 'button';
    reiniciar.title = 'Empezar de nuevo';
    reiniciar.setAttribute('aria-label', 'Empezar de nuevo');
    reiniciar.addEventListener('click', empezarDeNuevo);
    const cerrarBtn = el('button', 'af-cb-ic', '—');
    cerrarBtn.type = 'button';
    cerrarBtn.title = 'Minimizar';
    cerrarBtn.setAttribute('aria-label', 'Minimizar la guía');
    cerrarBtn.addEventListener('click', cerrar);
    hd.append(el('div', 'af-cb-av'), tt, reiniciar, cerrarBtn);

    const nota = el('div', 'af-cb-note', 'Respuestas guiadas con el catálogo de cursos. No hay una persona conectada; puedes contactar al equipo.');

    cuerpo = el('div', 'af-cb-bd');

    const pie = el('div', 'af-cb-ft');
    const form = el('form', 'af-cb-inp');
    campo = el('input');
    campo.type = 'text';
    campo.maxLength = 80;
    campo.placeholder = '¿Qué te gustaría aprender?';
    campo.setAttribute('aria-label', 'Escribe lo que quieres aprender');
    campo.autocomplete = 'off';
    const enviar = el('button', null, '↑');
    enviar.type = 'submit';
    enviar.setAttribute('aria-label', 'Buscar');
    form.append(campo, enviar);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const q = campo.value.trim();
      if (!q) return;
      campo.value = '';
      escribio(q);
    });
    const enlaces = el('div', 'af-cb-lk');
    const bAsesor = el('button', null, 'Hablar con un asesor');
    bAsesor.type = 'button';
    bAsesor.addEventListener('click', () => { yo('Hablar con un asesor'); asesor(); });
    const bNuevo = el('button', null, 'Empezar de nuevo');
    bNuevo.type = 'button';
    bNuevo.addEventListener('click', empezarDeNuevo);
    enlaces.append(bAsesor, bNuevo);
    pie.append(form, enlaces);

    panel.append(hd, nota, cuerpo, pie);
    document.body.appendChild(panel);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !panel.hidden) cerrar();
    });
  }

  function abrir() {
    panel.hidden = false;
    envoltura.hidden = true;
    burbuja.setAttribute('aria-expanded', 'true');
    dot.hidden = true;
    ls.set(VISTO_KEY, '1');
    if (!iniciado) { iniciado = true; inicio(); }
    if (window.matchMedia('(min-width: 561px)').matches) campo.focus();
    abajo();
  }

  function cerrar() {
    panel.hidden = true;
    envoltura.hidden = false;
    burbuja.setAttribute('aria-expanded', 'false');
    burbuja.focus({ preventScroll: true });
  }

  function empezarDeNuevo() {
    sesion++;
    cuerpo.textContent = '';
    inicio();
  }

  function abajo() {
    requestAnimationFrame(() => { cuerpo.scrollTop = cuerpo.scrollHeight; });
  }

  // ── mensajes ──────────────────────────────────────────────
  function yo(texto) {
    cuerpo.appendChild(el('div', 'af-cb-me', texto));
    abajo();
  }

  // Un globo del guía. `partes` puede ser texto o nodos; se muestra tras un instante de "escribiendo…".
  async function di(...partes) {
    const tk = sesion;
    const espera = el('div', 'af-cb-wait');
    espera.append(el('i'), el('i'), el('i'));
    cuerpo.appendChild(espera);
    abajo();
    await esperar(380);
    espera.remove();
    if (tk !== sesion) return false;
    const globo = el('div', 'af-cb-bot');
    partes.forEach(p => {
      if (typeof p === 'string') globo.appendChild(el('p', null, p));
      else globo.appendChild(p);
    });
    cuerpo.appendChild(globo);
    abajo();
    return true;
  }

  function negritas(texto) {
    const p = el('p');
    texto.split(/(\*\*[^*]+\*\*)/).forEach(t => {
      if (/^\*\*[^*]+\*\*$/.test(t)) p.appendChild(el('b', null, t.slice(2, -2)));
      else if (t) p.appendChild(document.createTextNode(t));
    });
    return p;
  }

  // Botones de respuesta rápida. Al tocar uno, el grupo queda "usado".
  function opciones(lista) {
    const grupo = el('div', 'af-cb-chips');
    lista.forEach(o => {
      if (o.wa || o.href) {
        const a = el('a', 'af-cb-chip' + (o.wa ? ' is-wa' : ''), o.t);
        a.href = o.wa ? enlaceWhatsApp() : o.href;
        a.target = '_blank';
        a.rel = 'noopener';
        grupo.appendChild(a);
        return;
      }
      const b = el('button', 'af-cb-chip' + (o.main ? ' is-main' : ''), o.t);
      b.type = 'button';
      b.addEventListener('click', () => {
        grupo.classList.add('is-used');
        yo(o.dice || o.t);
        o.fn();
      });
      grupo.appendChild(b);
    });
    cuerpo.appendChild(grupo);
    abajo();
  }

  function enlaceWhatsApp() {
    return 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent('Hola, vengo del sitio de Alintec Food y quisiera información de los cursos.');
  }

  function filaCurso(c) {
    const b = el('button', 'af-cb-cur' + (c.pronto ? ' is-soon' : ''));
    b.type = 'button';
    const th = el('span', 'af-cb-th', c.emoji);
    const img = el('img');
    img.alt = '';
    img.loading = 'lazy';
    img.src = portada(c);
    img.addEventListener('error', () => img.remove());
    th.appendChild(img);
    const ct = el('span', 'af-cb-ct');
    ct.append(el('b', null, c.titulo), el('small', null, c.area));
    b.append(th, ct, el('span', 'af-cb-go' + (c.pronto ? ' is-soon' : ''), c.pronto ? 'Próximamente' : 'Ver →'));
    if (c.pronto) b.disabled = true;
    else b.addEventListener('click', () => elegirCurso(c));
    return b;
  }

  // Muestra cursos de a LOTE; "Ver más cursos" trae el siguiente grupo.
  function mostrarCursos(lista, siguientes) {
    let pos = 0;
    const tk = sesion;
    const siguiente = () => {
      if (tk !== sesion) return;
      lista.slice(pos, pos + LOTE).forEach(c => cuerpo.appendChild(filaCurso(c)));
      pos += LOTE;
      abajo();
      const menu = [];
      if (pos < lista.length) menu.push({ t: 'Ver más cursos', fn: () => { siguiente(); } });
      siguientes.forEach(s => menu.push(s));
      opciones(menu);
    };
    siguiente();
  }

  // ── acciones ──────────────────────────────────────────────
  // Nota del asistente: no se redirige hasta que la persona acepta.
  async function notaAsistente(...partes) {
    const tk = sesion;
    const espera = el('div', 'af-cb-wait');
    espera.append(el('i'), el('i'), el('i'));
    cuerpo.appendChild(espera);
    abajo();
    await esperar(380);
    espera.remove();
    if (tk !== sesion) return false;
    const nota = el('div', 'af-cb-nota');
    nota.appendChild(el('span', 'af-cb-nota-av'));
    const txt = el('div', 'af-cb-nota-tx');
    txt.appendChild(el('small', null, 'Nota de tu asistente'));
    partes.forEach(p => txt.appendChild(typeof p === 'string' ? el('p', null, p) : p));
    nota.appendChild(txt);
    cuerpo.appendChild(nota);
    abajo();
    return true;
  }

  async function elegirCurso(c) {
    yo(c.titulo);
    const ok = await notaAsistente(
      negritas('Elegiste **' + c.titulo + '**.'),
      'Si aceptas, te llevo a crear tu cuenta gratis y ahí confirmas este curso como tu prueba gratuita. Si ya tienes cuenta, solo inicia sesión.'
    );
    if (!ok) return;
    opciones([
      { t: 'Aceptar', main: true, dice: 'Aceptar', fn: () => aceptarCurso(c) },
      { t: 'Rechazar', dice: 'Rechazar', fn: () => rechazarCurso(c) }
    ]);
  }

  function aceptarCurso(c) {
    ls.set(PREF_KEY, JSON.stringify({ id: c.id, titulo: c.titulo, t: Date.now() }));
    di('¡Perfecto! Te llevo a crear tu cuenta…').then(ok => {
      if (!ok) return;
      setTimeout(() => { window.location.href = AUTH_URL + '?curso=' + encodeURIComponent(c.id); }, 700);
    });
  }

  async function rechazarCurso() {
    const ok = await di('Sin problema, no te llevo a ningún lado. ¿Quieres ver otro curso?');
    if (ok) opciones([{ t: 'Elegir por área', fn: buscarCurso }, { t: 'Menú principal', fn: menuDeNuevo() }]);
  }

  const MENU = () => [
    { t: 'Buscar un curso', fn: buscarCurso },
    { t: 'Aprender un concepto', fn: conceptos },
    { t: 'Conocer la membresía', fn: membresia },
    { t: 'Ver próximos cursos', fn: proximos },
    { t: 'Resolver una duda', fn: dudas },
    { t: 'Hablar con un asesor', fn: asesor }
  ];

  async function inicio() {
    cuerpo.appendChild(el('div', 'af-cb-lbl', 'Tu guía · asistente virtual'));
    const ok = await di('¡Hola! Soy tu guía virtual. ¿Quieres empezar con clases gratis de un curso que de verdad te interese?', 'Te ayudo a encontrarlo en un minuto. ¿Qué te gustaría hacer?');
    if (ok) opciones(MENU());
    cargarCatalogo().catch(() => {}); // lo deja listo mientras la persona lee
  }

  function menuDeNuevo(texto) {
    return async () => {
      const ok = await di(texto || '¿Qué más te gustaría hacer?');
      if (ok) opciones(MENU());
    };
  }

  async function conCatalogo(fn) {
    const tk = sesion;
    try {
      await cargarCatalogo();
    } catch (e) {
      const ok = await di('Ahora mismo no pude cargar el catálogo de cursos. Revisa tu conexión e inténtalo otra vez, o escríbele al equipo.');
      if (ok) opciones([{ t: 'Intentar de nuevo', fn: () => conCatalogo(fn) }, { t: 'Escribir por WhatsApp', wa: true }]);
      return;
    }
    if (tk === sesion) fn();
  }

  function buscarCurso() {
    conCatalogo(async () => {
      const ok = await di('¡Genial! ¿De qué área te interesa aprender?', 'También puedes escribir una palabra abajo, por ejemplo «HACCP» o «etiquetado».');
      if (!ok) return;
      opciones(areas().map(a => ({ t: a, fn: () => porArea(a) })));
    });
  }

  function porArea(area) {
    const lista = disponibles().filter(c => c.area === area);
    di('Estos cursos de ' + area + ' te pueden interesar:').then(ok => {
      if (!ok) return;
      mostrarCursos(lista, [
        { t: 'Otra área', fn: buscarCurso },
        { t: 'Empezar de nuevo', fn: empezarDeNuevo }
      ]);
    });
  }

  async function proximos() {
    conCatalogo(async () => {
      const lista = catalogo.filter(c => c.pronto);
      if (!lista.length) {
        const ok = await di('Por ahora no hay cursos anunciados como próximos. Mientras tanto, puedes ver los que ya están disponibles.');
        if (ok) opciones([{ t: 'Buscar un curso', fn: buscarCurso }, { t: 'Hablar con un asesor', fn: asesor }]);
        return;
      }
      const ok = await di('Estos cursos llegan muy pronto:');
      if (!ok) return;
      lista.forEach(c => cuerpo.appendChild(filaCurso(c)));
      abajo();
      opciones([{ t: 'Buscar un curso', fn: buscarCurso }, { t: 'Menú principal', fn: menuDeNuevo() }]);
    });
  }

  async function membresia() {
    const p = await cargarPrecios();
    const ok = await di(
      negritas('**La membresía incluye:**'),
      'Biblioteca completa de cursos: inocuidad, microbiología, normativa y tecnología de alimentos.',
      'Material descargable y certificados con folio verificable. Las clases en vivo con especialistas llegarán próximamente.',
      'Asesoría personalizada y canal VIP, sin permanencia.',
      p ? negritas('Cuesta **' + dinero(p.mes) + ' al mes** o **' + dinero(p.ano) + ' al año**.') : 'Al crear tu cuenta ves el precio vigente.'
    );
    if (ok) opciones([{ t: 'Buscar un curso', fn: buscarCurso }, { t: 'Otra duda', fn: dudas }, { t: 'Hablar con un asesor', fn: asesor }, { t: 'Menú principal', fn: menuDeNuevo() }]);
  }

  // ── Dudas frecuentes, por tema ──
  // Cada respuesta repite lo que ya dicen el sitio, los términos y condiciones y el panel: nada inventado.
  function duda(texto, extra) {
    return async () => {
      const ok = await di(...(Array.isArray(texto) ? texto : [texto]).map(negritas));
      if (ok) opciones((extra || []).concat([{ t: 'Buscar un curso', fn: buscarCurso }, { t: 'Otra duda', fn: dudas }, { t: 'Hablar con un asesor', fn: asesor }]));
    };
  }

  async function precio() {
    const p = await cargarPrecios();
    const ok = await di(p ? negritas('Cuesta **' + dinero(p.mes) + ' al mes** o **' + dinero(p.ano) + ' al año**. Cancelas cuando quieras.') : 'Al crear tu cuenta ves el precio vigente.');
    if (ok) opciones([{ t: '¿Mensual o anual?', fn: planes }, { t: 'Otra duda', fn: dudas }, { t: 'Hablar con un asesor', fn: asesor }]);
  }

  async function planes() {
    const p = await cargarPrecios();
    let texto;
    if (!p) texto = 'Hay plan mensual y plan anual. Al crear tu cuenta ves los precios vigentes de cada uno.';
    else {
      const ahorro = p.mes * 12 - p.ano;
      texto = '**Mensual:** ' + dinero(p.mes) + ' al mes. **Anual:** ' + dinero(p.ano) + ' al año (' + dinero(Math.round(p.ano / 12)) + ' al mes)'
        + (ahorro > 0 ? ', con lo que ahorras ' + dinero(ahorro) + ' frente a pagar cada mes.' : '.');
    }
    const ok = await di(negritas(texto));
    if (ok) opciones([{ t: 'Otra duda', fn: dudas }, { t: 'Hablar con un asesor', fn: asesor }]);
  }

  const T = {
    prueba: duda('Al crear tu cuenta gratis eliges **un curso** como tu prueba gratuita y ves sus clases sin costo. La elección no se puede cambiar, así que escoge el que más te interese.'),
    pago: duda('El pago es con **tarjeta** de crédito o débito, en un pago seguro procesado por Stripe. Si necesitas otra forma de pago, escríbele al equipo.'),
    cancelar: duda('Sí. La membresía es sin permanencia: cancelas cuando quieras.'),
    reembolso: duda(['Una vez que se te da acceso al contenido, la compra se considera final, salvo que se indique otra cosa al momento de comprar.', 'Si tienes una situación especial, escríbele al equipo.']),
    desbloqueo: duda('Los cursos de la membresía se **desbloquean poco a poco, uno cada 8 días**, para que aproveches cada uno a fondo. Tu recorrido empieza cuando terminas tu curso de prueba. En tu panel ves cuántos días faltan para cada curso.'),
    formato: duda('Los cursos son **en línea**, con clases en video y material descargable. Las clases en vivo con especialistas llegarán **próximamente**.'),
    material: duda('Sí. Cada curso trae material descargable (PDFs, presentaciones y otros archivos) para aplicarlo en tu trabajo.'),
    celular: duda('Sí. Puedes entrar desde el navegador de tu celular, tablet o computadora con tu misma cuenta. También puedes instalar Alintec Food como app desde tu panel.'),
    retos: duda('En **Retos** respondes juegos y preguntas para ganar puntos y subir de nivel. Al subir de nivel ganas premios, como abrir un curso antes de tiempo. Es parte de la membresía.'),
    herramientas: duda('Tu panel incluye **herramientas pro** para el trabajo en planta o laboratorio: calculadora NOM-051, planificador HACCP, auditoría BPM, vida de anaquel y microbiología UFC.'),
    certificado: duda('Sí. Al terminar un curso obtienes un certificado digital con folio oficial que cualquiera puede verificar en línea.'),
    certOficial: duda('El certificado acredita que participaste y aprobaste el curso según los criterios de Alintec Food. **No es un título profesional ni una certificación oficial ante una autoridad del gobierno**, salvo que un curso indique expresamente lo contrario.'),
    certVerificar: duda('Cada certificado trae un **folio**. Con ese folio puedes comprobar que es auténtico en nuestra página de verificación.', [{ t: 'Verificar un certificado', href: 'verificar.html' }]),
    certNombre: duda('Sale el nombre que confirmas al entrar a tu panel. Puedes cambiarlo cuando quieras en **Mi perfil → Nombre completo**; escríbelo completo y bien escrito.'),
    crear: duda('Creas tu cuenta con tu **correo y una contraseña**, o con tu cuenta de Google. Si usas correo, te llega un mensaje para confirmarlo y listo.'),
    contrasena: duda('En la pantalla de iniciar sesión toca **«¿Olvidaste tu contraseña?»** y te llega un correo para crear una nueva.'),
    compartir: duda('No. La cuenta y el contenido son personales: no se pueden compartir las credenciales de acceso ni el contenido de los cursos.'),
    app: duda('Entra a tu panel y toca **«Instalar app»** en el menú, debajo de «Cerrar sesión». Te mostramos los pasos según tu teléfono.'),
    donde: duda('Estamos en **Tehuacán, Puebla, México**. Los cursos son en línea, así que puedes tomarlos desde cualquier lugar.')
  };

  const TEMAS_DUDAS = [
    { t: 'Membresía y pagos', preguntas: [
      { t: '¿Cuánto cuesta?', fn: precio },
      { t: '¿Qué incluye la membresía?', fn: () => membresia() },
      { t: '¿Mensual o anual?', fn: planes },
      { t: '¿Cómo puedo pagar?', fn: T.pago },
      { t: '¿Puedo cancelar?', fn: T.cancelar },
      { t: '¿Hay reembolsos?', fn: T.reembolso }
    ] },
    { t: 'Cursos y clases', preguntas: [
      { t: '¿Cómo funciona la prueba gratuita?', fn: T.prueba },
      { t: '¿Cómo se desbloquean los cursos?', fn: T.desbloqueo },
      { t: '¿Son en vivo o grabados?', fn: T.formato },
      { t: '¿Hay material descargable?', fn: T.material },
      { t: '¿Los veo en el celular?', fn: T.celular },
      { t: '¿Qué son los retos?', fn: T.retos },
      { t: '¿Qué herramientas incluye?', fn: T.herramientas }
    ] },
    { t: 'Certificados', preguntas: [
      { t: '¿Dan certificado?', fn: T.certificado },
      { t: '¿Es un título oficial?', fn: T.certOficial },
      { t: '¿Cómo verifico un certificado?', fn: T.certVerificar },
      { t: '¿Qué nombre aparece?', fn: T.certNombre }
    ] },
    { t: 'Mi cuenta', preguntas: [
      { t: '¿Cómo creo mi cuenta?', fn: T.crear },
      { t: 'Olvidé mi contraseña', fn: T.contrasena },
      { t: '¿Puedo compartir mi cuenta?', fn: T.compartir },
      { t: '¿Cómo instalo la app?', fn: T.app }
    ] },
    { t: 'Ubicación y contacto', preguntas: [
      { t: '¿Dónde están?', fn: T.donde },
      { t: 'Hablar con un asesor', fn: () => asesor() }
    ] }
  ];
  const DUDAS = TEMAS_DUDAS.reduce((todas, tema) => todas.concat(tema.preguntas), []); // DUDAS[0] = prueba gratuita

  async function dudas() {
    const ok = await di('Claro. ¿Sobre qué tema es tu duda?');
    if (ok) opciones(TEMAS_DUDAS.map(tema => ({ t: tema.t, fn: () => tema_(tema) })));
  }

  async function tema_(tema) {
    const ok = await di(negritas('Estas son las dudas más frecuentes de **' + tema.t.toLowerCase() + '**:'));
    if (ok) opciones(tema.preguntas.concat([{ t: 'Otro tema', fn: dudas }]));
  }

  async function asesor() {
    const ok = await di('Con gusto. Una persona del equipo te atiende por WhatsApp; toca el botón y se abre la conversación.');
    if (ok) opciones([{ t: 'Abrir WhatsApp', wa: true }, { t: 'Menú principal', fn: menuDeNuevo() }]);
  }

  // ── texto libre: intenciones sencillas y búsqueda en el catálogo ──
  const PARASITAS = new Set(['de', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'en', 'para', 'que', 'por', 'con', 'del', 'al', 'quiero', 'aprender', 'curso', 'cursos', 'sobre', 'busco', 'necesito', 'tienen', 'hay', 'como', 'mas', 'algo']);

  // Intenciones por palabras clave (en orden: la primera que coincide gana).
  const INTENCIONES = [
    [/(reembols|devoluc)/, () => T.reembolso()],
    [/(cancel|dar de baja)/, () => T.cancelar()],
    [/(como pag|formas? de pago|metodos? de pago|tarjeta|stripe|oxxo|paypal|transferencia)/, () => T.pago()],
    [/(mensual|anual)/, () => planes()],
    [/(precio|cuesta|costo|mensualidad|cuanto (cuesta|cobran|es|se paga))/, () => precio()],
    [/(asesor|persona|humano|whatsapp|llamar|contacto|hablar)/, () => asesor()],
    [/\b(donde|ubicacion|direccion|tehuacan|puebla)\b/, () => T.donde()],
    [/certificad.*(oficial|titulo|valido)|(oficial|titulo).*certificad/, () => T.certOficial()],
    [/certificad.*(verific|folio|autentic)|(verific|folio|autentic).*certificad|\bfolio\b/, () => T.certVerificar()],
    [/(nombre).*(certificad)|(certificad).*(nombre)/, () => T.certNombre()],
    [/(certificad|constancia|diploma)/, () => T.certificado()],
    [/(contrasena|olvide mi|recuperar mi cuenta)/, () => T.contrasena()],
    [/\bcompart/, () => T.compartir()],
    [/\b(instalar|app|aplicacion)\b/, () => T.app()],
    [/\b(celular|movil|telefono|tablet|dispositivo)\b/, () => T.celular()],
    [/\b(en vivo|webinar|grabad[oa]s?)\b/, () => T.formato()],
    [/\b(retos?|logros?|xp|premios?)\b/, () => T.retos()],
    [/\b(herramientas?|calculadora)\b/, () => T.herramientas()],
    [/(desbloque|cada 8|ocho dias|cuando se abren)/, () => T.desbloqueo()],
    [/(material|pdf|descarg)/, () => T.material()],
    [/(registr|crear (mi )?cuenta|inscrib)/, () => T.crear()],
    [/(membres|suscrip|incluye)/, () => membresia()],
    [/(gratis|gratuit|prueba)/, () => T.prueba()]
  ];

  // ── Charla básica: saludos, "¿quién eres?", gracias, despedidas… ──
  const SOCIAL = {
    identidad: /(quien eres|quien es usted|que eres|como te llamas|cual es tu nombre|eres (un |una )?(robot|bot|humano|humana|persona|ia|inteligencia artificial|real|chatgpt)|con quien hablo|hablo con (un|una))/,
    saludo: /(^|\b)(hola|holi|holis|buenas|buenos dias|buen dia|buenas tardes|buenas noches|hey|saludos)\b|^(que tal|que onda)\W*$/,
    estado: /(como estas|como esta usted|como te va|como andas|que tal estas|que tal tu)/,
    gracias: /(gracias|te agradezco|muy amable)/,
    adios: /(adios|hasta luego|hasta pronto|nos vemos|\bbye\b|\bchao\b|\bchau\b|me voy|que descanses)/,
    ayuda: /(\bayuda\b|ayudame|auxilio|que puedes hacer|que sabes hacer|que haces|para que sirves|como funcionas|\bmenu\b|\bopciones\b)/,
    ok: /^(ok|okey|okay|vale|listo|perfecto|entendido|claro|sale|de acuerdo|esta bien|muy bien)\W*$/
  };

  function saludoSegunHora(n) {
    if (/(buenos dias|buen dia)/.test(n)) return '¡Buenos días!';
    if (/buenas tardes/.test(n)) return '¡Buenas tardes!';
    if (/buenas noches/.test(n)) return '¡Buenas noches!';
    const h = new Date().getHours();
    return h < 12 ? '¡Hola, buenos días!' : (h < 19 ? '¡Hola, buenas tardes!' : '¡Hola, buenas noches!');
  }

  function charlaSocial(n) {
    if (n.length > 90) return null;
    const f = {};
    Object.keys(SOCIAL).forEach(k => { f[k] = SOCIAL[k].test(n); });
    if (!Object.values(f).some(Boolean)) return null;
    return async () => {
      const partes = [];
      if (f.saludo) partes.push(saludoSegunHora(n));
      if (f.estado) partes.push('Muy bien, gracias por preguntar. Soy una guía virtual y siempre estoy lista para ayudarte.');
      if (f.identidad) partes.push('Soy **tu guía virtual** de Alintec Food. No soy una persona ni una inteligencia artificial: respondo con información preparada por el equipo y con el catálogo de cursos. Si prefieres hablar con una persona, te paso con el equipo por WhatsApp.');
      if (f.gracias) partes.push('¡Con gusto! Me alegra poder ayudarte.');
      if (f.adios) partes.push('¡Hasta pronto! Aquí estaré cuando me necesites. Mucho éxito en tus estudios.');
      if (f.ayuda) partes.push('Puedo ayudarte a **buscar un curso**, explicarte **conceptos** de calidad y seguridad alimentaria (como HACCP, BPM o la NOM-051), resolver dudas sobre la **membresía**, los pagos o los certificados, y pasarte con el equipo por WhatsApp.');
      if (f.ok && !partes.length) partes.push('¡Perfecto!');
      if (!f.adios) partes.push('¿En qué te puedo ayudar?');
      const ok = await di(...partes.map(negritas));
      if (ok) opciones(f.adios ? [{ t: 'Menú principal', fn: menuDeNuevo() }] : MENU());
    };
  }

  // ── Conceptos de ciencia, calidad y seguridad alimentaria (glosario en chatbot-glosario.js) ──
  const PALABRAS_VACIAS = new Set(['que', 'es', 'son', 'para', 'como', 'cual', 'cuales', 'por', 'una', 'unos', 'unas', 'los', 'las', 'del', 'con', 'sin', 'mas', 'muy', 'hay', 'sus', 'este', 'esta', 'esto', 'eso', 'ese', 'tipos', 'significa', 'sirve', 'existen', 'puedo', 'debe', 'cuando', 'donde', 'quien', 'explicame', 'dime', 'hablame', 'sobre', 'acerca']);
  const contenido = txt => norm(txt).split(/[^a-z0-9]+/).filter(t => t.length >= 3 && !PALABRAS_VACIAS.has(t));
  const escapar = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sinPuntuacion = t => ' ' + String(t).replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  const contieneFrase = (n, frase) => sinPuntuacion(n).includes(sinPuntuacion(frase));

  function glosarioCoincide(n) {
    const G = window.AF_GLOSARIO;
    if (!Array.isArray(G)) return null;
    const tokens = new Set(contenido(n));
    let mejor = null;
    let mejorPuntos = 0;
    G.forEach(e => {
      let p = 0;
      e.claves.forEach(c => { const cn = norm(c); if (contieneFrase(n, cn)) p = Math.max(p, 3 + cn.length / 40); });
      // Preguntas parecidas a los ejemplos: comparten casi todas sus palabras de contenido
      e.ejemplos.forEach(x => {
        const ex = contenido(x);
        if (ex.length < 2) return;
        const compartidas = ex.filter(t => tokens.has(t)).length;
        if (compartidas >= 2 && compartidas / ex.length >= 0.75) p = Math.max(p, 2.5 + compartidas / ex.length / 2);
      });
      if (p > mejorPuntos) { mejor = e; mejorPuntos = p; }
    });
    return mejorPuntos >= 3 ? mejor : null;
  }

  // Cursos de la plataforma relacionados con un concepto (por palabras que aparecen en título, área o descripción)
  function cursosRelacionados(terminos) {
    const lista = [];
    disponibles().forEach((c, i) => {
      const tit = norm(c.titulo), area = norm(c.area), desc = norm(c.desc);
      let puntos = 0;
      terminos.forEach(t => {
        const tn = norm(t);
        if (tit.includes(tn)) puntos += 3;
        else if (area.includes(tn)) puntos += 2;
        else if (desc.includes(tn)) puntos += 1;
      });
      if (puntos >= 3) lista.push({ c, puntos, i });
    });
    return lista.sort((a, b) => b.puntos - a.puntos || a.i - b.i).slice(0, 6).map(r => r.c);
  }

  async function responderGlosario(e) {
    // Si el tema se verificó contra un documento oficial, se muestra cuál; si no, se avisa que es información general.
    const aviso = el('p', 'af-cb-aviso', e.fuente ? 'Fuente: ' + e.fuente + '. Información general y orientativa.' : 'Es información general y orientativa.');
    const ok = await di(...e.respuesta.map(negritas), aviso);
    if (!ok) return;
    const siguientes = [{ t: 'Otro concepto', fn: conceptos }, { t: 'Hablar con un asesor', fn: asesor }];
    let lista = [];
    try { await cargarCatalogo(); lista = cursosRelacionados(e.cursos || []); } catch (x) { /* sin catálogo: solo se ofrece seguir */ }
    if (!lista.length) { opciones(siguientes); return; }
    const ok2 = await di('Estos cursos de la plataforma tratan este tema:');
    if (ok2) mostrarCursos(lista, siguientes);
  }

  async function conceptos(todos) {
    const G = window.AF_GLOSARIO || [];
    const lista = todos === true ? G.filter(e => !e.destacado) : G.filter(e => e.destacado);
    const ok = await di(todos === true
      ? 'Más conceptos que puedo explicarte:'
      : '¿Qué concepto quieres conocer? También puedes **escribir tu pregunta** en la barra de abajo, por ejemplo «¿qué es la contaminación cruzada?».'.replace(/\*\*/g, ''));
    if (!ok) return;
    const botones = lista.map(e => ({ t: e.tema, dice: e.tema, fn: () => responderGlosario(e) }));
    if (todos !== true && G.some(e => !e.destacado)) botones.push({ t: 'Más conceptos…', fn: () => conceptos(true) });
    opciones(botones);
  }

  async function preguntaLibre() {
    const ok = await di('Claro. Escribe tu pregunta en la barra de abajo y te ayudo.');
    if (ok) opciones(MENU());
  }

  function escribio(q) {
    yo(q);
    const n = norm(q);
    // 1) "¿Quién eres?" / "¿eres un robot?" antes que nada (si no, "persona" lo confundiría con pedir un asesor)
    if (SOCIAL.identidad.test(n)) return charlaSocial(n)();
    // 2) Conceptos de ciencia, calidad y seguridad alimentaria. No aplica si la persona pide un curso, ni si
    //    escribió algo largo que parece el título de un curso (no una pregunta): eso va a la búsqueda de cursos.
    const quiereCurso = /\b(curso|cursos|clase|clases|capacitacion|capacitarme|capacitar|diplomado|taller|aprender|estudiar|inscribirme)\b/.test(n);
    const esPregunta = /\?|^(que|como|cual|cuales|por que|para que|cuando|donde|quien|cuanto|cuantos|es|son|se|puedo|hay|existe|explicame|dime|hablame|cuentame|quiero saber|necesito saber|me puedes|puedes|podrias)\b/.test(n);
    const pareceTitulo = n.split(/\s+/).length >= 9 && !esPregunta;
    if (!quiereCurso && !pareceTitulo) {
      const g = glosarioCoincide(n);
      if (g) return responderGlosario(g);
    }
    // 3) Dudas de la membresía, pagos, certificados, cuenta…
    const hit = INTENCIONES.find(([patron]) => patron.test(n));
    if (hit) return hit[1]();
    // 4) Saludos, gracias, despedidas…
    const social = charlaSocial(n);
    if (social) return social();
    // 5) Búsqueda en el catálogo de cursos
    conCatalogo(() => buscarTexto(q, n));
  }

  // Palabras de la gente → palabras que sí aparecen en los títulos (raíces de 5 letras).
  const SINONIMOS = {
    bacte: ['microb', 'patog'], hongo: ['microb'], moho: ['microb'], carne: ['carni', 'carnic'], embut: ['carnic'],
    semaf: ['etiqu'], sello: ['etiqu'], cerve: ['bebid', 'alcoh'], vino: ['bebid', 'alcoh'], licor: ['bebid', 'alcoh'],
    envas: ['empaq', 'envas'], plaga: ['pesti'], audit: ['haccp', 'gesti'], limpi: ['higie', 'sanit'],
    higie: ['inocu'], salud: ['nutri', 'inocu'], norma: ['norma', 'regul']
  };

  async function buscarTexto(q, n) {
    const base = n.split(/[^a-z0-9]+/).filter(t => t.length >= 3 && !PARASITAS.has(t))
      .map(t => (t.length > 5 ? t.slice(0, 5) : t));
    const palabras = [...new Set(base.concat(...base.map(p => SINONIMOS[p] || [])))];
    const resultados = [];
    if (palabras.length) {
      disponibles().forEach((c, i) => {
        const tit = norm(c.titulo);
        const area = norm(c.area);
        const desc = norm(c.desc);
        let puntos = 0;
        palabras.forEach(p => {
          if (tit.includes(p)) puntos += 3;
          else if (area.includes(p)) puntos += 2;
          else if (desc.includes(p)) puntos += 1;
        });
        if (puntos) resultados.push({ c, puntos, i });
      });
      resultados.sort((a, b) => b.puntos - a.puntos || a.i - b.i);
    }
    if (!resultados.length) {
      const ok = await di('No encontré cursos con «' + q + '». Prueba con otra palabra o elige un área:');
      if (ok) opciones(areas().map(a => ({ t: a, fn: () => porArea(a) })).concat([{ t: 'Hablar con un asesor', fn: asesor }]));
      return;
    }
    const ok = await di(resultados.length === 1 ? 'Encontré 1 curso para «' + q + '»:' : 'Encontré ' + resultados.length + ' cursos para «' + q + '»:');
    if (!ok) return;
    mostrarCursos(resultados.map(r => r.c), [
      { t: 'Elegir por área', fn: buscarCurso },
      { t: 'Empezar de nuevo', fn: empezarDeNuevo }
    ]);
  }

  // ── arranque ──────────────────────────────────────────────
  function iniciar() {
    construir();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
