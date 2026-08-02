import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';
import { globalState } from '../state';
import { esMovil, reduced } from '../utils/dom';
import { ejecutarGlimmTransition } from '../utils/glimm';

const BOOST_MAX = 3.5;

export function setupWorks() {
  const works = document.querySelector<HTMLElement>('.works');
  const stage = document.querySelector<HTMLElement>('.works__stage');
  const scaler = document.querySelector<HTMLElement>('.works__scaler');
  if (!works || !stage || !scaler) return;

  const tracks = Array.from(document.querySelectorAll<HTMLElement>('.row__track'));
  const copies = Number(tracks[0]?.dataset.copies ?? 3);

  const rows = document.querySelector<HTMLElement>('.rows');
  const row0 = rows?.firstElementChild as HTMLElement | undefined;
  // el telón lo levanta measure(); si no hay filas que medir, se levanta acá o
  // el escenario se queda escondido para siempre
  if (!rows || !row0) {
    stage.classList.add('is-ready');
    return;
  }

  const hero = document.querySelector<HTMLElement>('.scrolling-text');

  let scaleFrom = 1;
  let scaleTo = 2.2;
  let shiftFrom = 0;
  let shiftTo = 0;
  let scaleNow = 1;
  let progress = 0;

  function measure() {
    const vh = stage!.clientHeight;

    scaleFrom =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom0')) || 0.45;
    scaleTo =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom1')) || 0.72;

    const rowH = row0!.offsetHeight;
    const gapY = parseFloat(getComputedStyle(rows!).rowGap) || 0;

    const dosFilas = rowH * 2 + gapY;
    const movil = esMovil();
    scaleTo = Math.max(scaleFrom, Math.min(scaleTo, (vh - (movil ? 24 : 32)) / dosFilas));

    const contentH = scaler!.offsetHeight;

    /* el título y la primera fila viajan juntos y se centran en la ventana.
       Los dos viven dentro del sticky, así que el encuadre inicial no cuesta
       scroll: desde el primer píxel que se baja, el zoom ya está corriendo */
    const heroH = hero
      ? hero.offsetHeight + (parseFloat(getComputedStyle(hero).marginBottom) || 0)
      : 0;
    const gapChico = movil ? 16 : 32;

    /* sin motion no hay recorrido que contar: el zoom se queda clavado en su
       primer fotograma, que es el encuadre pensado para que solo asome la
       primera fila —el resto lo traía el scroll— y el sticky corta lo que
       sobra. Así que acá se encuadra de una vez: el título arriba y las dos
       filas enteras debajo, a la escala que haga falta para que entren.
       Un solo encuadre, sin recorrido: scaleFrom y scaleTo valen lo mismo */
    if (reduced()) {
      const disponible = vh - heroH - gapChico * 2;
      const escala = Math.max(0.05, Math.min(scaleTo, disponible / contentH));
      scaleFrom = escala;
      scaleTo = escala;

      if (hero) hero.style.top = `${gapChico.toFixed(1)}px`;
      shiftFrom = gapChico + heroH - vh / 2 + (contentH * escala) / 2;
      shiftTo = shiftFrom;

      if (!works!.classList.contains('is-filtered')) {
        works!.style.height = `${Math.round(vh)}px`;
      }
      apply();
      return;
    }

    const filaH = (rowH + gapY) * scaleFrom;
    /* en una ventana normal el reparto deja al título muy por debajo del
       header y de la isla; el mínimo solo entra en ventanas tan bajas que el
       bloque ya no cabe, y ahí vale más pegarlo arriba que solaparlo */
    const topHero = Math.max(gapChico, (vh - heroH - filaH) / 2);
    if (hero) hero.style.top = `${topHero.toFixed(1)}px`;
    const topInicial = topHero + heroH;
    shiftFrom = topInicial - vh / 2 + (contentH * scaleFrom) / 2;

    const medioFinal = rowH + gapY / 2;
    shiftTo = scaleTo * (contentH / 2 - medioFinal);

    if (!works!.classList.contains('is-filtered')) {
      works!.style.height = `${Math.round(vh * (movil ? 3 : 4))}px`;
    }
    apply();
  }

  const ease = gsap.parseEase('power2.inOut');

  /* el título ya no se va solo con el scroll: vive dentro del sticky y se
     queda quieto. Se aparta a mano mientras las filas crecen a ocupar la
     pantalla, para no quedar encima de ellas */
  function pintarHero(e: number) {
    if (!hero) return;
    const f = 1 - Math.min(1, Math.max(0, e) / 0.3);
    hero.style.opacity = f.toFixed(3);
    hero.style.transform = `translateY(${(-24 * (1 - f)).toFixed(1)}px)`;
    hero.style.pointerEvents = f < 0.05 ? 'none' : '';
  }

  /** el avance que representa la escala puesta ahora mismo en el scaler: al
   *  volver de una ficha el transform llega restaurado del historial y todavía
   *  no pasó ningún onUpdate, así que `progress` aún vale 0 */
  function avanceSegunEscala() {
    const puesta = scaler!.style.transform.match(/scale\(([\d.]+)\)/);
    if (!puesta || scaleTo <= scaleFrom) return 0;
    return gsap.utils.clamp(0, 1, (parseFloat(puesta[1]) - scaleFrom) / (scaleTo - scaleFrom));
  }

  function apply() {
    if (works!.classList.contains('is-filtered')) return;
    if (window._vtRestoring) {
      pintarHero(avanceSegunEscala());
      return;
    }
    const e = ease(progress);
    const s = scaleFrom + (scaleTo - scaleFrom) * e;
    const shift = shiftFrom + (shiftTo - shiftFrom) * e;
    scaleNow = s;
    scaler!.style.transform = `translate(-50%, calc(-50% + ${shift.toFixed(2)}px)) scale(${s.toFixed(4)})`;
    pintarHero(e);
  }

  /** levanta el telón que puso la hoja (el escenario está escondido hasta que
   *  measure() lo encuadra). Lo levanta el barrido de glimm, el mismo que ya
   *  marca los cambios de filtro y de idioma: el carrusel aparece detrás de la
   *  pasada, a mitad del barrido, en vez de aparecer de golpe.
   *
   *  Al volver de una ficha no hay estreno: ahí el carrusel llega restaurado en
   *  el punto donde se dejó y la vuelta tiene que ser invisible.
   *
   *  ejecutarGlimmTransition ya se encarga de los casos sin barrido (motion
   *  reducido, WebGL que no arranca): llama al midpoint en el acto */
  function revelar() {
    const levantar = () => stage!.classList.add('is-ready');

    if (window._vtRestoring) {
      levantar();
      return;
    }

    /* seguro: el barrido corre con el reloj de fotogramas, que no avanza si la
       pestaña arranca en segundo plano, y podría no llegar nunca a su mitad (o
       perderse el contexto de WebGL por el camino). Sin esto el carrusel se
       quedaría escondido para siempre. Los temporizadores sí corren en segundo
       plano, así que el telón sube igual y como mucho se pierde el estreno */
    const seguro = window.setTimeout(levantar, 2500);
    ejecutarGlimmTransition(() => {
      window.clearTimeout(seguro);
      levantar();
    });
  }

  measure();
  revelar();

  globalState.onResize = () => {
    measure();
    if (!reduced()) ScrollTrigger.refresh();
  };
  window.addEventListener('resize', globalState.onResize);

  if (reduced()) {
    works.style.height = `${stage.clientHeight}px`;
    return;
  }

  ScrollTrigger.create({
    trigger: works,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      progress = self.progress;
      if (window._vtRestoring) window._vtRestoring = false;
      apply();
    },
  });

  const savedPositions = globalState.pendingCarousel;
  globalState.pendingCarousel = null;

  const state = tracks.map((track, i) => {
    let initialX = -i * 190;
    if (savedPositions && typeof savedPositions[i] === 'number') {
      initialX = savedPositions[i]!;
    }

    const s = {
      track,
      dir: i % 2 === 0 ? -1 : 1,
      speed: 0.5 + (i % 3) * 0.25,
      x: initialX,
      loop: 0,
      dragVelocity: 0,
      isDragging: false,
    };

    let recorrido = 0;

    Observer.create({
      target: track,
      type: 'pointer,touch',
      lockAxis: true,
      onPress() {
        recorrido = 0;
      },
      onDrag(self) {
        if (self.axis === 'y') return;
        s.isDragging = true;
        recorrido += Math.abs(self.deltaX);
        s.x += self.deltaX / scaleNow;
        s.dragVelocity = self.deltaX / scaleNow;
      },
      onRelease() {
        s.isDragging = false;
        if (recorrido < 8) return;

        const bloquear = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
        };
        track.addEventListener('click', bloquear, { capture: true, once: true });
        window.setTimeout(() => track.removeEventListener('click', bloquear, { capture: true }), 350);
      },
    });

    return s;
  });

  function measureLoops() {
    state.forEach((s) => {
      s.loop = s.track.scrollWidth / copies;
    });
  }
  measureLoops();

  let velocity = 0;
  globalState.lenis?.on('scroll', (e: { velocity: number }) => {
    velocity = e.velocity;
  });

  globalState.rowsTick = () => {
    const rect = works!.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    const boost = gsap.utils.clamp(-BOOST_MAX, BOOST_MAX, velocity * 0.12) / scaleNow;
    velocity *= 0.92;

    for (const s of state) {
      if (!s.loop) continue;

      s.dragVelocity *= 0.92;

      if (!s.isDragging) {
        s.x += (s.dir * s.speed) / scaleNow + s.dir * boost + s.dragVelocity;
      }

      s.x = (((s.x % s.loop) + s.loop) % s.loop) - s.loop;
      s.track.style.transform = `translate3d(${s.x.toFixed(2)}px,0,0)`;
    }
  };
  gsap.ticker.add(globalState.rowsTick);

  window.addEventListener('load', measureLoops, { once: true, signal: globalState.abort.signal });
}

declare global {
  interface Window {
    _vtRestoring?: boolean;
  }
}
