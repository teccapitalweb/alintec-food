#!/usr/bin/env node
'use strict';

// Regenera assets/alintec-bunny-catalog.js consultando la API real de Bunny Stream
// (no la clave de reproducción BUNNY_TOKEN_KEY — esta usa la "API Key" de la librería,
// que se encuentra en el dashboard de Bunny: tu Video Library → pestaña "API").
//
// Uso:
//   BUNNY_LIBRARY_ID=12345 BUNNY_API_KEY=xxxxxxxx node scripts/generar-catalogo-bunny.js

const fs = require('fs');
const path = require('path');

const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const API_KEY = process.env.BUNNY_API_KEY;

if (!LIBRARY_ID || !API_KEY) {
  console.error('Faltan variables de entorno: BUNNY_LIBRARY_ID y BUNNY_API_KEY');
  console.error('Uso: BUNNY_LIBRARY_ID=12345 BUNNY_API_KEY=xxxx node scripts/generar-catalogo-bunny.js');
  process.exit(1);
}

const BASE = `https://video.bunnycdn.com/library/${LIBRARY_ID}`;

async function bunnyGet(ruta) {
  const r = await fetch(BASE + ruta, { headers: { AccessKey: API_KEY, accept: 'application/json' } });
  if (!r.ok) {
    const texto = await r.text().catch(() => '');
    throw new Error(`Bunny respondió ${r.status} en ${ruta}: ${texto.slice(0, 200)}`);
  }
  return r.json();
}

// Extrae el número de clase del nombre del archivo ("CLASE 3 Y 4.mp4" → 3, "Clase 5.mp4" → 5).
function numeroDeClase(tituloOriginal) {
  // Se quita la extensión del archivo antes de buscar números, para no confundir
  // el "4" de ".mp4" (o el "3" de ".mp3") con el número real de la clase.
  const t = String(tituloOriginal || '').replace(/\.[a-z0-9]{2,5}$/i, '');
  const m = t.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

async function listarTodo(ruta, clavePagina = 'items') {
  const items = [];
  let page = 1;
  const perPage = 100;
  for (;;) {
    const data = await bunnyGet(`${ruta}${ruta.includes('?') ? '&' : '?'}page=${page}&itemsPerPage=${perPage}`);
    const lote = data[clavePagina] || [];
    items.push(...lote);
    if (lote.length < perPage) break;
    page++;
  }
  return items;
}

async function main() {
  console.log('Consultando colecciones de la librería', LIBRARY_ID, '…');
  const colecciones = await listarTodo('/collections', 'items');
  console.log(`Encontradas ${colecciones.length} colecciones.`);

  const catalogo = [];
  for (const col of colecciones) {
    console.log(' -', col.name, `(${col.videoCount ?? '?'} videos)`);
    const videos = await listarTodo(`/videos?collection=${col.guid}`, 'items');
    const sesiones = videos
      .filter(v => v.status === 4) // 4 = Finished (listo para reproducir)
      .map(v => ({ numero: numeroDeClase(v.title), titulo: v.title, videoId: v.guid }))
      .sort((a, b) => a.numero - b.numero);
    catalogo.push({ titulo: col.name, collectionId: col.guid, sesiones });
  }

  const salida = `// Catálogo Bunny.net para Alintec Food\n// Generado ${new Date().toISOString().slice(0, 16).replace('T', ' ')}\nwindow.ALINTEC_BUNNY_CATALOG = ${JSON.stringify(catalogo, null, 4)};\n`;
  const destino = path.join(__dirname, '..', 'assets', 'alintec-bunny-catalog.js');
  fs.writeFileSync(destino, salida);
  console.log('\nListo. Catálogo escrito en', destino, `(${catalogo.length} colecciones).`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
