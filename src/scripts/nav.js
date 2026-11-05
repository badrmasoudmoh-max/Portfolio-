// Mobile navigation: toggle, Escape to close, focus trap, scroll lock.
// Progressive enhancement: without JS the links are rendered inline (see header.css).
export function initNav() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  const mobile = window.matchMedia('(max-width: 899px)');
  const focusables = () => [toggle, ...nav.querySelectorAll('a[href]')];

  const setOpen = (open, { returnFocus = true } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (open) {
      nav.querySelector('a[href]')?.focus();
    } else if (returnFocus) {
      toggle.focus();
    }
  };

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  nav.addEventListener('click', (e) => {
    if (e.target.closest('a[href]') && isOpen()) setOpen(false, { returnFocus: false });
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'Tab') {
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Leaving the mobile breakpoint with the panel open: reset state.
  mobile.addEventListener('change', (e) => {
    if (!e.matches && isOpen()) setOpen(false, { returnFocus: false });
  });
}
