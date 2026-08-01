import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';
import { globalState } from '../state';
import { reduced } from '../utils/dom';

export function setupScroll() {
  // el valor lo deja `restoreCatalog()` al volver de una ficha
  const restoreY = globalState.pendingScrollY;
  globalState.pendingScrollY = null;

  if (reduced()) {
    if (restoreY !== null) window.scrollTo(0, restoreY);
    return;
  }

  globalState.lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });

  // el scroll se fija otra vez ya con Lenis montado: si no, la inercia
  // arranca desde donde el navegador dejó la página y se ve el salto
  if (restoreY !== null) {
    window.scrollTo(0, restoreY);
    globalState.lenis.scrollTo(restoreY, { immediate: true });
  }

  globalState.lenis.on('scroll', ScrollTrigger.update);

  globalState.lenisTick = (time: number) => globalState.lenis?.raf(time * 1000);
  gsap.ticker.add(globalState.lenisTick);
  gsap.ticker.lagSmoothing(0);
}

export function setupProgress() {
  const barra = document.querySelector<HTMLElement>('.progress span');
  const pista = document.querySelector<HTMLElement>('.scroll-cue');
  if (!barra && !pista) return;

  const pintar = () => {
    const alto = document.documentElement.scrollHeight - window.innerHeight;
    const avance = alto > 0 ? Math.min(1, window.scrollY / alto) : 0;
    if (barra) barra.style.transform = `scaleX(${avance.toFixed(4)})`;
    // la pista dura lo que dura el primer 12% del scroll
    if (pista) {
      pista.style.opacity = `${Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.5))}`;
    }
  };

  window.addEventListener('scroll', pintar, { passive: true, signal: globalState.abort.signal });
  pintar();
}
