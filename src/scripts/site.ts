import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';
import 'lenis/dist/lenis.css';

import { teardown } from './state';
import { setupSounds } from './features/sounds';
import { setupScroll, setupProgress } from './features/scroll';
import { setupWorks } from './features/works';
import { setupSlotText } from './features/hero-text';
import { setupTransitionNames } from './features/transitions';
import { setupReveals } from './features/reveals';
import { setupFilterIsland } from './features/filter';
import { setupProjectView } from './features/project-view';
import { setupFooterReveal, setupVolverArriba } from './features/footer';
import { setupMotionToggle } from './features/motion';
import { setupHoverPreview } from './features/hover-preview';

gsap.registerPlugin(ScrollTrigger, Observer);

// Inicializar sonidos al cargar el script (como estaba en el original)
setupSounds();

export function initSite() {
  teardown();
  setupScroll();
  setupTransitionNames();
  // works primero: fija el alto de la caja del título, del que depende el
  // tamaño que el slot le calcula a cada frase
  setupWorks();
  setupSlotText();
  setupProgress();
  setupReveals();
  setupProjectView();
  setupFooterReveal();
  setupVolverArriba();
  setupFilterIsland();
  setupHoverPreview();
  // el interruptor de animaciones remonta todo: se pasa initSite a sí misma
  setupMotionToggle(initSite);
  ScrollTrigger.refresh();
}
