// ── HERO COMPOSITION ──
// Referencia de comportamiento: contenido al llegar y apertura lateral al comenzar el scroll.
// Se mantiene como una implementación propia y se desactiva si el usuario reduce movimiento.
const retailHero = document.querySelector('.home-hero');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (retailHero && !reducedMotion.matches) {
  let heroFrame = null;
  const updateHeroComposition = () => {
    heroFrame = null;
    const desktop = window.innerWidth > 700;
    const travel = Math.max(retailHero.offsetHeight * .72, 1);
    const progress = Math.min(Math.max(window.scrollY / travel, 0), 1);
    const initialBreath = desktop ? Math.min(48, window.innerWidth * .03) : 0;
    retailHero.style.setProperty('--hero-breath', `${Math.round(initialBreath * (1 - progress))}px`);
  };
  const requestHeroComposition = () => {
    if (heroFrame === null) heroFrame = requestAnimationFrame(updateHeroComposition);
  };
  updateHeroComposition();
  window.addEventListener('scroll', requestHeroComposition, { passive: true });
  window.addEventListener('resize', requestHeroComposition, { passive: true });
}

// ── SCROLL REVEAL ──
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: .05 });
document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => obs.observe(el));

// ── SMOOTH SCROLL (same-page anchors only) ──
function elegantScrollTo(target, duration) {
  const start = window.scrollY;
  const headerHeight = document.getElementById('main-nav')?.offsetHeight || 0;
  const end = Math.max(0, target.getBoundingClientRect().top + start - headerHeight);
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
const mobileNavigation = window.matchMedia('(max-width: 700px)');
let previousOverflow = '';
function closeMenu() {
  if (!burger || !overlay?.open) return;
  overlay.close();
}
function restoreMenuState() {
  burger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = previousOverflow;
}
if (burger && overlay) {
  burger.addEventListener('click', () => {
    if (!mobileNavigation.matches) return;
    previousOverflow = document.body.style.overflow;
    overlay.showModal();
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  });
  overlay.addEventListener('close', restoreMenuState);
  mobileNavigation.addEventListener('change', event => {
    if (!event.matches && overlay.open) {
      closeMenu();
      document.querySelector('#main-nav .brand')?.focus();
    }
  });
}

// El mismo destino se identifica igual en ambas navegaciones.
const currentPath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
document.querySelectorAll('#main-nav a, #nav-overlay a').forEach(link => {
  const destination = new URL(link.href);
  if (destination.origin === window.location.origin && destination.pathname === currentPath) {
    link.setAttribute('aria-current', 'page');
  }
});

// ── HEADER SCROLL STATE ──
const mainNav = document.getElementById('main-nav');
if (mainNav) {
  const updateHeaderState = () => mainNav.classList.toggle('scrolled', window.scrollY > 60);
  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });
  window.addEventListener('pageshow', updateHeaderState);
}

// La suscripción se envía directamente a Brevo mediante el formulario HTML.
