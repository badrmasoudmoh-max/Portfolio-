// ==========================================================================
// Motion layer (GSAP + ScrollTrigger + SplitText)
// Rules:
//  - Content is visible by default. Only the hero type starts hidden, via a
//    CSS rule with a timed fallback (see motion.css), so a JS failure never
//    leaves it invisible.
//  - prefers-reduced-motion: reduce → no motion at all, everything shown.
//  - Small screens get reveals but no parallax/tilt.
//  - Only transform/opacity are animated.
// ==========================================================================
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

// Dev-only handle for automated checks (stripped from production builds).
if (import.meta.env.DEV) window.__gsap = { gsap, ScrollTrigger };

const root = document.documentElement;

export function initMotion() {
  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
      desktop: '(min-width: 900px) and (pointer: fine)',
    },
    (ctx) => {
      const { motion, desktop } = ctx.conditions;

      if (!motion) {
        root.classList.add('motion-done');
        return undefined;
      }

      heroIntro();
      sectionReveals();
      progressBar();
      if (desktop) {
        parallax();
        heroTilt();
        magnetic();
      }
      return () => root.classList.add('motion-done');
    },
  );
}

/* ---------------- Hero intro ---------------- */
function heroIntro() {
  const title = document.querySelector('.hero__title');
  if (!title) return;

  // Character is centred with translateX(-50%) in CSS; hand that to GSAP as
  // xPercent so tilt/parallax offsets compose with it responsively.
  gsap.set('.hero__character', { xPercent: -50, x: 0 });

  document.fonts.ready.then(() => {
    // h1 carries the accessible name; split spans are hidden from AT
    // (aria-label on a plain span is not allowed).
    const split = SplitText.create('.hero__line', { type: 'chars', mask: 'chars', aria: 'hidden' });
    const tl = gsap.timeline({
      defaults: { ease: 'power4.out' },
      onStart: () => root.classList.add('motion-done'),
    });

    // The character (LCP image) is never hidden; shapes and type animate around it.
    tl.set(['.hero__head', '.hero__body', '.hero__layer'], { autoAlpha: 1 })
      .from(split.chars, { yPercent: 110, duration: 0.9, stagger: 0.022 })
      .from('.hero__head .eyebrow', { y: 16, autoAlpha: 0, duration: 0.6 }, 0.1)
      .fromTo('.hero__underline svg path', { strokeDasharray: 420, strokeDashoffset: 420 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, 0.7)
      .from('.hero__circle', { scale: 0.4, autoAlpha: 0, duration: 1.1, ease: 'expo.out' }, 0.15)
      .from('.hero__slab', { rotate: -18, xPercent: -12, autoAlpha: 0, duration: 1.1, ease: 'expo.out' }, 0.2)
      .from('.hero__box', { yPercent: 60, autoAlpha: 0, duration: 0.9 }, 0.3)
      .from(['.hero__sticker', '.hero__swatches', '.hero__asterisk', '.hero__stamp', '.hero__note'], {
        scale: 0.6, rotate: (i) => (i % 2 ? 14 : -14), autoAlpha: 0, duration: 0.7, stagger: 0.07, ease: 'back.out(2)',
      }, 0.7)
      .from(['.hero__body .lead', '.hero__ctas > *', '.scroll-cue', '.hero__side'], {
        y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.08,
      }, 0.6);
  });

  // Idle float on the circle + stamp (subtle, desktop and mobile)
  gsap.to('.hero__circle', { yPercent: -4, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 });
}

/* ---------------- Section reveals ---------------- */
function sectionReveals() {
  // Section titles: words rise out of a mask
  gsap.utils.toArray('main .section .display').forEach((el) => {
    const split = SplitText.create(el, { type: 'words', mask: 'words' });
    gsap.from(split.words, {
      yPercent: 105,
      duration: 0.9,
      stagger: 0.06,
      ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  const groups = [
    '.section .eyebrow',
    '.work__aside', '.work-card', '.work__more',
    '.about__copy > p:not(.eyebrow)', '.objective', '.social-pills li',
    '.skill', '.process__steps li',
    '.job',
    '.cert',
    '.service',
    '.contact__lead', '.contact__links li', '.contact-form',
  ];
  const items = gsap.utils.toArray(groups.join(','));
  gsap.set(items, { y: 36, autoAlpha: 0 });
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => {
      // A long jump (nav link, Home/End) enters many items at once. Show the ones
      // already above the viewport instantly; stagger only what is on screen,
      // with a capped total so nothing waits in a long queue.
      const onScreen = batch.filter((el) => el.getBoundingClientRect().bottom > 0);
      gsap.set(batch.filter((el) => !onScreen.includes(el)), { y: 0, autoAlpha: 1, overwrite: true });
      gsap.to(onScreen, {
        y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out', overwrite: true,
        stagger: { each: 0.07, amount: Math.min(0.5, onScreen.length * 0.07) },
      });
    },
  });

  // Characters pop in from below their sections
  gsap.utils.toArray(['.work__char', '.about__char', '.contact__char']).forEach((el) => {
    gsap.from(el, {
      y: 80, autoAlpha: 0, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });

  // Stickers slap on
  gsap.utils.toArray('.about__sticker').forEach((el) => {
    gsap.from(el, {
      scale: 1.6, rotate: 20, autoAlpha: 0, duration: 0.6, ease: 'back.out(2.5)',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

/* ---------------- Parallax (desktop) ---------------- */
function parallax() {
  const layer = (sel, trigger, yPercent) => {
    const el = document.querySelector(sel);
    if (!el) return;
    gsap.to(el, {
      yPercent,
      ease: 'none',
      scrollTrigger: { trigger, start: 'top top', end: 'bottom top', scrub: true },
    });
  };

  // Hero: layers drift apart as you leave
  layer('.hero__slab', '.hero', 18);
  layer('.hero__circle', '.hero', -14);
  layer('.hero__character', '.hero', 8);
  layer('.hero__sticker', '.hero', -40);
  layer('.hero__swatches', '.hero', -24);
  layer('.hero__head', '.hero', -10);

  const through = (sel, trigger, from, to) => {
    const el = document.querySelector(sel);
    if (!el) return;
    gsap.fromTo(el, { yPercent: from }, {
      yPercent: to,
      ease: 'none',
      scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  };
  through('.about__slab', '.about', 6, -6);
  through('.about__circle', '.about', 30, -30);
  through('.about__char img', '.about', 4, -4);
  through('.work__char img', '.work', 10, -6);
}

/* ---------------- Hero pointer tilt (desktop) ---------------- */
function heroTilt() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const layers = [
    ['.hero__circle', 18],
    ['.hero__slab', -12],
    ['.hero__character', 10],
    ['.hero__sticker', -26],
    ['.hero__swatches', 22],
    ['.hero__stamp', -16],
  ].map(([sel, depth]) => {
    const el = hero.querySelector(sel);
    return el && { x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3' }), depth };
  }).filter(Boolean);

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    layers.forEach((l) => { l.x(nx * l.depth); l.y(ny * l.depth); });
  });
  hero.addEventListener('pointerleave', () => layers.forEach((l) => { l.x(0); l.y(0); }));
}

/* ---------------- Magnetic buttons (desktop) ---------------- */
function magnetic() {
  gsap.utils.toArray('.hero__ctas .btn').forEach((btn) => {
    const x = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
    const y = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.25);
      y((e.clientY - r.top - r.height / 2) * 0.35);
    });
    btn.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

/* ---------------- Scroll progress ---------------- */
function progressBar() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  gsap.fromTo(bar, { scaleX: 0 }, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });
}
