// Floating WhatsApp shortcut (shown on small screens by CSS):
// appears once the hero is scrolled past, hides while the contact section
// (which already has every contact option) or the footer is on screen.
export function initFab() {
  const fab = document.querySelector('.fab-whatsapp');
  if (!fab || !('IntersectionObserver' in window)) { fab?.classList.add('is-visible'); return; }
  const state = { hero: true, contact: false };
  const update = () => fab.classList.toggle('is-visible', !state.hero && !state.contact);
  const watch = (sel, key) => {
    const el = document.querySelector(sel);
    if (!el) return;
    new IntersectionObserver(([entry]) => { state[key] = entry.isIntersecting; update(); }, { threshold: 0 }).observe(el);
  };
  watch('.hero, .gallery__head', 'hero');
  watch('#contact, .site-footer', 'contact');
  update();
}
