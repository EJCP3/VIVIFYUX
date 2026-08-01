import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';
import { gsap } from 'gsap';

export const globalState = {
  lenis: null as Lenis | null,
  lenisTick: null as ((time: number) => void) | null,
  rowsTick: null as (() => void) | null,
  onResize: null as (() => void) | null,
  abort: new AbortController(),
  wordTimer: null as number | null,
  filterTitleTl: null as gsap.core.Timeline | null,
  heroLoopTl: null as gsap.core.Timeline | null,
  marquesinaTl: null as gsap.core.Timeline | null,
  /** los ScrollTrigger que escalonan la entrada de las tarjetas de la grilla */
  tilesBatch: [] as ScrollTrigger[],
  pendingScrollY: null as number | null,
  pendingCarousel: null as (number | null)[] | null,
};

export function teardown() {
  ScrollTrigger.getAll().forEach((t) => t.kill());
  if (typeof Observer !== 'undefined' && Observer.getAll) {
    Observer.getAll().forEach((o) => o.kill());
  }
  if (globalState.lenisTick) gsap.ticker.remove(globalState.lenisTick);
  if (globalState.rowsTick) gsap.ticker.remove(globalState.rowsTick);
  if (globalState.onResize) window.removeEventListener('resize', globalState.onResize);
  if (globalState.wordTimer) window.clearInterval(globalState.wordTimer);
  globalState.filterTitleTl?.kill();
  globalState.heroLoopTl?.kill();
  globalState.lenis?.destroy();
  globalState.abort.abort();

  gsap.set('.scrolling-text .rail h4', { clearProps: 'transform,x,xPercent,y,yPercent' });
  gsap.set('.island', { clearProps: 'width' });
  gsap.set('.island-logo', { clearProps: 'opacity' });
  gsap.set('.bar-mid', { clearProps: 'opacity' });
  gsap.set('.menu-panel', { clearProps: 'all' });
  gsap.set('.menu-link', { clearProps: 'all' });
  gsap.set('.menu-overlay', { pointerEvents: 'none' });

  const btn = document.getElementById('menuToggle');
  if (btn) btn.setAttribute('aria-expanded', 'false');

  const barTop = document.querySelector('.bar-top');
  if (barTop) {
    barTop.setAttribute('x1', '2'); barTop.setAttribute('y1', '5');
    barTop.setAttribute('x2', '14'); barTop.setAttribute('y2', '5');
  }
  const barBot = document.querySelector('.bar-bot');
  if (barBot) {
    barBot.setAttribute('x1', '2'); barBot.setAttribute('y1', '11');
    barBot.setAttribute('x2', '14'); barBot.setAttribute('y2', '11');
  }

  // ScrollTrigger.getAll() de arriba ya los mató; queda vaciar la lista para
  // no guardar referencias muertas
  globalState.tilesBatch = [];
  globalState.filterTitleTl = null;
  globalState.heroLoopTl = null;
  globalState.wordTimer = null;
  globalState.lenis = null;
  globalState.lenisTick = null;
  globalState.rowsTick = null;
  globalState.onResize = null;
  globalState.abort = new AbortController();
}
