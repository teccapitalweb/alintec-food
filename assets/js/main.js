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

// ══════ MODAL DE DETALLE DE CURSO ══════
(function () {
  const modal = document.getElementById('cursoModal');
  if (!modal) return;
  const WHATSAPP_NUM = '5212381863934'; // +52 1 238 186 3934
  const imgEl = document.getElementById('cursoModalImg');
  const titleEl = document.getElementById('cursoModalTitle');
  const instructorEl = document.getElementById('cursoModalInstructor');
  const descEl = document.getElementById('cursoModalDesc');
  const waEl = document.getElementById('cursoModalWhatsapp');
  let lastFocused = null;

  function openModal(card) {
    const title = card.dataset.title || '';
    imgEl.src = card.dataset.img || '';
    imgEl.alt = card.dataset.alt || title;
    titleEl.textContent = title;
    instructorEl.textContent = card.dataset.instructor || '';
    descEl.textContent = card.dataset.desc || '';
    const msg = encodeURIComponent(`Hola, quiero más información sobre el curso ${title}`);
    waEl.href = `https://wa.me/${WHATSAPP_NUM}?text=${msg}`;
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.curso-modal__close').focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('[data-curso]').forEach(function (card) {
    card.addEventListener('click', function () { openModal(card); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card); }
    });
  });

  modal.querySelectorAll('[data-curso-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();
