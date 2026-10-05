/* Pausa la animación del registro cuando no se ve en pantalla (ahorra batería en celulares). */
(function () {
  'use strict';
  var demo = document.querySelector('.reg-demo');
  if (!demo || !('IntersectionObserver' in window)) return;
  demo.classList.add('is-paused');
  new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) { demo.classList.toggle('is-paused', !e.isIntersecting); });
  }, { threshold: 0.15 }).observe(demo);
})();
