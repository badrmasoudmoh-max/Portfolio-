// Contact enhancements: copy-email button with toast, form submit state.
// The email is a real mailto: link, so everything works without JS.
export function initContact() {
  const toast = document.getElementById('toast');
  let timer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('is-visible'), 2500);
  };

  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        showToast('Copied. Now use it.');
      } catch {
        window.location.href = `mailto:${btn.dataset.copy}`;
      }
    });
  });

  const form = document.querySelector('.contact-form');
  form?.addEventListener('submit', () => {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.setAttribute('aria-busy', 'true');
    btn.firstChild.textContent = 'Sending… ';
  });
}
