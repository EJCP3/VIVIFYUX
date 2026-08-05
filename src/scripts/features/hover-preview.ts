import { gsap } from 'gsap';
import { globalState } from '../state';
import { reduced } from '../utils/dom';

/** el mini-video que sigue al cursor, en dos lugares:
 *
 *  - la ficha: un solo clip compartido por sus disparadores (imagen y, si
 *    los hay, título/CTA) —viven sueltos en el documento, no dentro de la
 *    tarjeta que dispara.
 *  - cada tarjeta de la grilla filtrada: trae su propio clip adentro
 *    (`tile.querySelector`), porque cada una es una librería distinta.
 *
 *  Mismo patrón en los dos: gsap.quickTo para la posición, autoAlpha para
 *  el fundido, un listener de mousemove en document que solo vive mientras
 *  hay hover. `activos` cuenta cuántos disparadores del mismo grupo están
 *  hovereados a la vez, para que moverse de uno a otro sin soltar el mouse
 *  no cierre y reabra el fundido. */
export function setupHoverPreview() {
  if (reduced()) return;

  // grupo ficha: el video vive fuera de sus disparadores
  const fichaVideo = document.querySelector<HTMLVideoElement>('.project > [data-hover-video]');
  const fichaTriggers = document.querySelectorAll<HTMLElement>('.project [data-hover-trigger]');
  if (fichaVideo && fichaTriggers.length) {
    crearHoverFlotante(fichaVideo, Array.from(fichaTriggers));
  }

  // grupo grilla: cada tarjeta trae el suyo
  document.querySelectorAll<HTMLElement>('.tile[data-hover-trigger]').forEach((tile) => {
    const video = tile.querySelector<HTMLVideoElement>('[data-hover-video]');
    if (video) crearHoverFlotante(video, [tile]);
  });
}

/** un video + los disparadores que lo muestran. Independiente por grupo: dos
 *  llamadas a esta función no comparten `activos` ni el listener de
 *  mousemove, así que hovereando dos tarjetas a la vez (imposible con un
 *  mouse, pero por las dudas) no se pisan. */
function crearHoverFlotante(video: HTMLVideoElement, triggers: HTMLElement[]) {
  gsap.set(video, { xPercent: -50, yPercent: -50 });

  const setX = gsap.quickTo(video, 'x', { duration: 0.4, ease: 'power3' });
  const setY = gsap.quickTo(video, 'y', { duration: 0.4, ease: 'power3' });

  const fade = gsap.to(video, {
    autoAlpha: 1,
    duration: 0.18,
    ease: 'none',
    paused: true,
    onReverseComplete: () => {
      document.removeEventListener('mousemove', seguir);
      video.pause();
    },
  });

  let primerMovimiento = true;
  let activos = 0;

  function seguir(e: MouseEvent) {
    if (primerMovimiento) {
      // arranca ya en el punto del cursor: sin esto, el primer frame viaja
      // en tween desde donde quedó la vez anterior (o desde 0,0)
      setX(e.clientX, e.clientX);
      setY(e.clientY, e.clientY);
      primerMovimiento = false;
    } else {
      setX(e.clientX);
      setY(e.clientY);
    }
  }

  const ocultarYa = () => {
    if (activos === 0 && fade.progress() === 0) return;
    activos = 0;
    // pause(0), no reverse(): esto tiene que ser instantáneo —un click no
    // espera los 180ms del fundido— y sin matar el tween, que se reusa en
    // el próximo hover
    fade.pause(0);
    document.removeEventListener('mousemove', seguir);
    video.pause();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener(
      'mouseenter',
      (e) => {
        activos++;
        if (activos > 1) return; // ya estaba mostrado por otro disparador solapado

        primerMovimiento = true;
        if (!video.src && video.dataset.src) video.src = video.dataset.src;
        video.currentTime = 0;
        void video.play().catch(() => {});

        document.addEventListener('mousemove', seguir, { signal: globalState.abort.signal });
        seguir(e as MouseEvent);
        fade.play();
      },
      { signal: globalState.abort.signal },
    );

    trigger.addEventListener(
      'mouseleave',
      () => {
        activos = Math.max(0, activos - 1);
        if (activos === 0) fade.reverse();
      },
      { signal: globalState.abort.signal },
    );
  });

  // captura, no burbuja: se entera antes que el propio link de que hubo click
  // y le gana de mano a la navegación que sigue —sin esto, un click sobre la
  // tarjeta mientras el preview seguía visible lo dejaba pisando la foto que
  // toma Astro para la transición de salida
  document.addEventListener('click', ocultarYa, { capture: true, signal: globalState.abort.signal });
}
