import { globalState } from '../state';
import { reduced } from '../utils/dom';

/** el enlace del pie que vuelve al catálogo.
 *
 *  Un ancla la resuelve el navegador de un salto, y desde el pie eso es toda la
 *  página de golpe. Acá se hace el recorrido con Lenis, que ya lleva la duración
 *  y la curva del scroll del sitio, así que sube con el mismo tacto que tiene
 *  todo lo demás.
 *
 *  Con la luz apagada no se toca nada: el salto seco del navegador es lo que
 *  corresponde, y es además lo que espera quien pidió no ver movimiento. */
export function setupVolverArriba() {
  const enlace = document.querySelector<HTMLAnchorElement>('.site-footer__top');
  if (!enlace) return;

  enlace.addEventListener(
    'click',
    (e) => {
      if (reduced()) return;

      const destino = document.querySelector<HTMLElement>(enlace.getAttribute('href') || '');
      if (!destino) return;

      e.preventDefault();

      // el mismo respiro que deja irACatalogo() al cambiar de filtro
      if (globalState.lenis) globalState.lenis.scrollTo(destino, { offset: -20, duration: 1.4 });
      else {
        const y = Math.max(0, destino.getBoundingClientRect().top + window.scrollY - 20);
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    },
    { signal: globalState.abort.signal },
  );
}

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
