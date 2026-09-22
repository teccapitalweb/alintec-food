/* ═══════════════════════════════════════════
   SynovaLab - Scripts
   ═══════════════════════════════════════════ */

// ══════ MOBILE MENU ══════
function closeMenu() {
  document.getElementById('navLinks').classList.remove('open');
}
document.querySelector('.hamburger').addEventListener('click', function () {
  document.getElementById('navLinks').classList.toggle('open');
});

// ══════ CURSOS · CARRUSEL CONTINUO (marquee, igual que la cinta de logos) ══════
// Duplicamos las tarjetas una vez para que la animación CSS (translateX -50%)
// haga un loop perfecto sin salto. Se pausa al pasar el mouse o al tocar (móvil).
const cTrack = document.getElementById('carouselTrack');
if (cTrack) {
  const original = Array.from(cTrack.children);
  original.forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a, button').forEach(el => el.setAttribute('tabindex', '-1'));
    cTrack.appendChild(clone);
  });
  // Pausa al tocar en móvil (donde no hay :hover) y reanuda al soltar.
  cTrack.addEventListener('touchstart', () => cTrack.classList.add('is-paused'), { passive: true });
  cTrack.addEventListener('touchend', () => cTrack.classList.remove('is-paused'), { passive: true });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cTrack.style.animation = 'none';
  }
}

// ══════ NAVBAR SCROLL EFFECT ══════
window.addEventListener('scroll', function () {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
});

// ══════ ACTIVE NAV LINK ON SCROLL ══════
const sections = document.querySelectorAll('section[id]');
const navAs = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', function () {
  let current = '';
  sections.forEach(function (s) {
    if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute('id');
  });
  navAs.forEach(function (a) {
    a.classList.remove('active');
    if (a.getAttribute('href') === '#' + current) a.classList.add('active');
  });
});

// ══════ REVEAL ON SCROLL ══════
var reveals = document.querySelectorAll('.reveal');
var revealObs = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
reveals.forEach(function (el) { revealObs.observe(el); });

// ══════ CONTACT FORM ══════
document.querySelector('.form-submit').addEventListener('click', function () {
  alert('¡Gracias por tu mensaje! Te contactaremos pronto por WhatsApp o email.');
});

// ══════ CLOSE MENU ON LINK CLICK ══════
document.querySelectorAll('.nav-links a').forEach(function (a) {
  a.addEventListener('click', closeMenu);
});


// ══════ LOGOS MARQUEE ACCESSIBILITY ══════
const logosTrack = document.querySelector('.logos-track');
if (logosTrack && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  logosTrack.style.animation = 'none';
}
