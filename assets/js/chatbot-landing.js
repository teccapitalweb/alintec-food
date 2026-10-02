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
  const TIP_KEY = 'af_cb_tip';
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

    tip = el('div', 'af-cb-tip', '¿Te ayudo a encontrar tu curso?');
    tip.hidden = true;
    const x = el('button', 'af-cb-tip-x', '×');
    x.type = 'button';
    x.setAttribute('aria-label', 'Cerrar aviso');
    x.addEventListener('click', e => { e.stopPropagation(); ocultarTip(true); });
    tip.appendChild(x);
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

  function ocultarTip(recordar) {
    tip.hidden = true;
    if (recordar) ss.set(TIP_KEY, '1');
  }

  function abrir() {
    ocultarTip(true);
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
      if (o.wa) {
        const a = el('a', 'af-cb-chip is-wa', o.t);
        a.href = enlaceWhatsApp();
        a.target = '_blank';
        a.rel = 'noopener';
        grupo.appendChild(a);
        return;
      }
      const b = el('button', 'af-cb-chip', o.t);
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
    ct.append(el('b', null, c.titulo), el('small', null, c.clases + (c.clases === 1 ? ' clase · ' : ' clases · ') + c.area));
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
  function elegirCurso(c) {
    ls.set(PREF_KEY, JSON.stringify({ id: c.id, titulo: c.titulo, t: Date.now() }));
    yo(c.titulo);
    di(negritas('¡Buena elección! Te llevo a crear tu cuenta gratis; ahí confirmas **' + c.titulo + '** como tu prueba gratuita. Si ya tienes cuenta, solo inicia sesión.')).then(ok => {
      if (!ok) return;
      setTimeout(() => { window.location.href = AUTH_URL + '?curso=' + encodeURIComponent(c.id); }, 900);
    });
  }

  const MENU = () => [
    { t: 'Buscar un curso', fn: buscarCurso },
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
      'Clases en vivo con especialistas, material descargable y certificados con folio verificable.',
      'Asesoría personalizada y canal VIP, sin permanencia.',
      p ? negritas('Cuesta **' + dinero(p.mes) + ' al mes** o **' + dinero(p.ano) + ' al año**.') : 'Al crear tu cuenta ves el precio vigente.'
    );
    if (ok) opciones([{ t: 'Buscar un curso', fn: buscarCurso }, { t: 'Hablar con un asesor', fn: asesor }, { t: 'Menú principal', fn: menuDeNuevo() }]);
  }

  const DUDAS = [
    { t: '¿Cómo funciona la prueba gratuita?', fn: duda('Al crear tu cuenta gratis eliges **un curso** como tu prueba gratuita y ves sus clases sin costo. La última clase de cada curso se desbloquea con la membresía. La elección no se puede cambiar, así que escoge el que más te interese.') },
    { t: '¿Cuánto cuesta?', fn: () => membresia() },
    { t: '¿Dan certificado?', fn: duda('Sí. Al terminar un curso obtienes un certificado digital con folio oficial que cualquiera puede verificar en línea.') },
    { t: '¿Cómo tomo las clases?', fn: duda('Entras con tu cuenta y ves las clases en video desde tu panel. Cada curso trae material descargable para aplicarlo en tu trabajo.') },
    { t: '¿Puedo cancelar?', fn: duda('Sí. La membresía es sin permanencia: cancelas cuando quieras.') }
  ];

  function duda(texto) {
    return async () => {
      const ok = await di(negritas(texto));
      if (ok) opciones([{ t: 'Buscar un curso', fn: buscarCurso }, { t: 'Otra duda', fn: dudas }, { t: 'Hablar con un asesor', fn: asesor }]);
    };
  }

  async function dudas() {
    const ok = await di('Claro, ¿cuál es tu duda?');
    if (ok) opciones(DUDAS);
  }

  async function asesor() {
    const ok = await di('Con gusto. Una persona del equipo te atiende por WhatsApp; toca el botón y se abre la conversación.');
    if (ok) opciones([{ t: 'Abrir WhatsApp', wa: true }, { t: 'Menú principal', fn: menuDeNuevo() }]);
  }

  // ── texto libre: intenciones sencillas y búsqueda en el catálogo ──
  const PARASITAS = new Set(['de', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'en', 'para', 'que', 'por', 'con', 'del', 'al', 'quiero', 'aprender', 'curso', 'cursos', 'sobre', 'busco', 'necesito', 'tienen', 'hay', 'como', 'mas', 'algo']);

  function escribio(q) {
    yo(q);
    const n = norm(q);
    if (/^(hola|buenas|hey|buen dia|buenos dias|buenas tardes|buenas noches)\b/.test(n)) return menuDeNuevo('¡Hola! ¿En qué te ayudo?')();
    if (/(precio|cuesta|costo|cuanto|mensualidad|pagar|pago)/.test(n)) return membresia();
    if (/(asesor|persona|humano|whatsapp|llamar|contacto|hablar)/.test(n)) return asesor();
    if (/(certificad|constancia|diploma)/.test(n)) return duda('Sí. Al terminar un curso obtienes un certificado digital con folio oficial que cualquiera puede verificar en línea.')();
    if (/(membres|suscrip)/.test(n)) return membresia();
    if (/(gratis|gratuit|prueba)/.test(n)) return DUDAS[0].fn();
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
    // Aviso breve para quien aún no ha abierto la guía (una vez por visita).
    if (!ls.get(VISTO_KEY) && !ss.get(TIP_KEY)) {
      setTimeout(() => {
        if (!panel.hidden || ss.get(TIP_KEY)) return;
        tip.hidden = false;
        setTimeout(() => ocultarTip(true), 11000);
      }, 7000);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
