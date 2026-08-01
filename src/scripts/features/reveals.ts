import { gsap } from 'gsap';
import { reduced } from '../utils/dom';

export function setupReveals() {
  if (reduced()) return;

  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    const kids = el.hasAttribute('data-reveal-children')
      ? Array.from(el.children)
      : [el];

    gsap.from(kids, {
      yPercent: 40,
      opacity: 0,
      duration: 0.38,
      ease: 'power3.out',
      stagger: 0.04,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}
