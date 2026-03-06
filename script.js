// ── Navigation scroll effect ──────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// ── Mobile hamburger menu ─────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
  });
});

// ── Fade-in on scroll ─────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.about-text, .about-facts, .fact-card, .timeline-item, ' +
  '.project-card, .social-card, .contact-form, .contact-info'
).forEach(el => {
  el.classList.add('fade-up');
  observer.observe(el);
});

// ── Contact form (uses Formspree — see setup guide) ───────────
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);

  // TODO: Replace with your Formspree endpoint, e.g.:
  // const endpoint = 'https://formspree.io/f/YOUR_FORM_ID';
  const endpoint = '';

  if (!endpoint) {
    status.textContent = 'Contact form not configured yet.';
    return;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      status.textContent = 'Message sent! I will get back to you soon.';
      form.reset();
    } else {
      status.textContent = 'Something went wrong. Please try again.';
    }
  } catch {
    status.textContent = 'Network error. Please try again.';
  }
});
