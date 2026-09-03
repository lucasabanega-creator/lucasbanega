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
    if (target) { e.preventDefault(); elegantScrollTo(target, 1800); }
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

// ── NEWSLETTER MODAL (Brevo) ──
const newsletterOverlay = document.getElementById('newsletter-overlay');
const footerEmailForm = document.getElementById('footer-email-form');
const footerEmailInput = document.getElementById('footer-email-input');
const brevoEmailInput = document.getElementById('EMAIL');
const newsletterClose = document.getElementById('newsletter-close');

function openNewsletter(email) {
  if (email && brevoEmailInput) brevoEmailInput.value = email;
  const sibFormContainer = document.getElementById('sib-form-container');
  const successMessage = document.getElementById('success-message');
  if (sibFormContainer) sibFormContainer.style.display = '';
  if (successMessage) successMessage.classList.remove('show');
  newsletterOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const nombreInput = document.getElementById('NOMBRE');
    if (nombreInput) nombreInput.focus();
  }, 300);
}

function closeNewsletter() {
  newsletterOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

if (footerEmailForm) footerEmailForm.addEventListener('submit', function (e) {
  e.preventDefault();
  openNewsletter(footerEmailInput.value.trim());
});

if (newsletterClose) newsletterClose.addEventListener('click', closeNewsletter);
if (newsletterOverlay) newsletterOverlay.addEventListener('click', function (e) {
  if (e.target === newsletterOverlay) closeNewsletter();
});
document.addEventListener('keydown', function (e) {
  if (newsletterOverlay && e.key === 'Escape' && newsletterOverlay.classList.contains('open')) closeNewsletter();
});

const newsletterSuccessClose = document.getElementById('newsletter-success-close');
if (newsletterSuccessClose) newsletterSuccessClose.addEventListener('click', closeNewsletter);

// Submit handled directly: validate, POST to Brevo's endpoint, then show our own thank-you screen.
const sibForm = document.getElementById('sib-form');
const sibFormContainer = document.getElementById('sib-form-container');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');

function setFieldError(input, message) {
  const errorLabel = input.closest('.form__entry').querySelector('.entry__error');
  if (errorLabel) errorLabel.textContent = message || '';
  input.style.borderColor = message ? '#a33' : '';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

if (sibForm) sibForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const nombre = document.getElementById('NOMBRE');
  const apellidos = document.getElementById('APELLIDOS');
  const email = document.getElementById('EMAIL');
  let valid = true;

  [nombre, apellidos].forEach(input => {
    if (!input.value.trim()) {
      setFieldError(input, 'Este campo no puede quedarse vacío.');
      valid = false;
    } else {
      setFieldError(input, '');
    }
  });

  if (!email.value.trim()) {
    setFieldError(email, 'Este campo no puede quedarse vacío.');
    valid = false;
  } else if (!isValidEmail(email.value.trim())) {
    setFieldError(email, 'La información que has proporcionado no es válida.');
    valid = false;
  } else {
    setFieldError(email, '');
  }

  if (!valid) {
    errorMessage.classList.remove('show');
    return;
  }

  const submitBtn = sibForm.querySelector('.sib-form-block__button');
  if (submitBtn) submitBtn.disabled = true;

  fetch(sibForm.action, {
    method: 'POST',
    mode: 'no-cors',
    body: new FormData(sibForm)
  }).then(() => {
    errorMessage.classList.remove('show');
    if (sibFormContainer) sibFormContainer.style.display = 'none';
    successMessage.classList.add('show');
  }).catch(() => {
    errorMessage.classList.add('show');
  }).finally(() => {
    if (submitBtn) submitBtn.disabled = false;
  });
});

