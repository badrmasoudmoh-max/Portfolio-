// Header: becomes solid after the hero top, hides on scroll down, returns on
// scroll up, so navigation is always one flick away (incl. the mobile menu).
export function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    const menuOpen = document.body.classList.contains('nav-open');
    header.classList.toggle('is-solid', y > 40);
    if (!menuOpen) {
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > 240) header.classList.add('is-hidden');
      else if (goingUp || y <= 240) header.classList.remove('is-hidden');
    }
    lastY = y;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  // Keyboard users tabbing into the header always see it.
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  update();
}
