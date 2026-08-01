import { globalState } from '../state';

export function setupFooterReveal() {
  const reveal = document.querySelector<HTMLElement>('.footer-reveal');
  const main = document.querySelector<HTMLElement>('main');
  if (!reveal || !main) return;

  const sync = () => {
    main.style.marginBottom = `${reveal.offsetHeight}px`;
  };

  sync();
  window.addEventListener('resize', sync, { signal: globalState.abort.signal });

  document.fonts.ready.then(sync);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(sync);
    ro.observe(reveal);
    globalState.abort.signal.addEventListener('abort', () => ro.disconnect());
  }
}
