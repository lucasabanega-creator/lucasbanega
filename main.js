// ── SCROLL REVEAL ──
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: .05 });
document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => obs.observe(el));

// ── SMOOTH SCROLL (same-page anchors only) ──
function elegantScrollTo(target, duration) {
  const start = window.scrollY;
  const end = target.getBoundingClientRect().top + start;
  const distance = end - start;
  let startTime = null;
  function easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
  }
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start + distance * easeInOutQuart(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const id = this.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) target.scrollIntoView();
      else elegantScrollTo(target, 450);
    }
  });
});

// ── MOBILE MENU ──
const burger = document.getElementById('burger');
const overlay = document.getElementById('nav-overlay');
function closeMenu() {
  burger.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  overlay.addEventListener('transitionend', () => {
    if (!overlay.classList.contains('open')) overlay.style.display = 'none';
  }, { once: true });
}
if (burger) burger.addEventListener('click', () => {
  const isOpen = burger.classList.toggle('open');
  if (isOpen) {
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('open')));
    document.body.style.overflow = 'hidden';
  } else {
    closeMenu();
  }
});

// ── HEADER SCROLL STATE ──
const mainNav = document.getElementById('main-nav');
if (mainNav) window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 60;
  mainNav.classList.toggle('scrolled', scrolled);
}, { passive: true });

// La suscripción se envía directamente a Brevo mediante el formulario HTML.
