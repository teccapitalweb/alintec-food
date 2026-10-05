/* Alintec Food · service worker mínimo.
   Solo permite que el navegador ofrezca instalar la app. NO guarda cursos, videos ni sesiones:
   todo se sigue pidiendo directo al servidor, así que nunca muestra contenido viejo ni privado guardado. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* sin caché: el navegador atiende la petición normalmente */ });
