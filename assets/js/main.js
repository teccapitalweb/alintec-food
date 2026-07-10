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

// ══════ CAROUSEL ══════
let carouselPos = 0;
const cardW = 314; // card width + gap
const cTrack = document.getElementById('carouselTrack');

function moveCarousel(dir) {
  const wrapper = cTrack.parentElement;
  const maxScroll = cTrack.scrollWidth - wrapper.offsetWidth;
  carouselPos += dir * cardW * 2;
  if (carouselPos < 0) carouselPos = 0;
  if (carouselPos > maxScroll) carouselPos = maxScroll;
  cTrack.style.transform = 'translateX(-' + carouselPos + 'px)';
}

// Drag support (mouse)
let isDrag = false, startX = 0, dragStart = 0;

cTrack.addEventListener('mousedown', function (e) {
  isDrag = true; startX = e.pageX; dragStart = carouselPos;
  cTrack.style.transition = 'none';
});
cTrack.addEventListener('mousemove', function (e) {
  if (!isDrag) return;
  const maxS = cTrack.scrollWidth - cTrack.parentElement.offsetWidth;
  carouselPos = Math.max(0, Math.min(dragStart - (e.pageX - startX), maxS));
  cTrack.style.transform = 'translateX(-' + carouselPos + 'px)';
});
document.addEventListener('mouseup', function () {
  isDrag = false;
  cTrack.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)';
});

// Drag support (touch)
cTrack.addEventListener('touchstart', function (e) {
  isDrag = true; startX = e.touches[0].pageX; dragStart = carouselPos;
  cTrack.style.transition = 'none';
});
cTrack.addEventListener('touchmove', function (e) {
  if (!isDrag) return;
  const maxS = cTrack.scrollWidth - cTrack.parentElement.offsetWidth;
  carouselPos = Math.max(0, Math.min(dragStart - (e.touches[0].pageX - startX), maxS));
  cTrack.style.transform = 'translateX(-' + carouselPos + 'px)';
});
cTrack.addEventListener('touchend', function () {
  isDrag = false;
  cTrack.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)';
});

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
