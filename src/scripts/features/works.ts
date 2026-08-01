import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';
import { globalState } from '../state';
import { esMovil, reduced } from '../utils/dom';

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
  if (!rows || !row0) return;

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

    const heroH = hero
      ? hero.offsetHeight + (parseFloat(getComputedStyle(hero).marginBottom) || 0)
      : 0;
    const gapChico = movil ? 16 : 32;
    const topInicial = gapChico;
    const sobra = Math.max(0, vh - (rowH + gapY) * scaleFrom - heroH - gapChico);
    if (hero) hero.style.marginTop = `${sobra.toFixed(1)}px`;
    shiftFrom = topInicial - vh / 2 + (contentH * scaleFrom) / 2;

    const medioFinal = rowH + gapY / 2;
    shiftTo = scaleTo * (contentH / 2 - medioFinal);

    if (!works!.classList.contains('is-filtered')) {
      works!.style.height = `${Math.round(vh * (movil ? 3 : 4))}px`;
    }
    apply();
  }

  const ease = gsap.parseEase('power2.inOut');

  function apply() {
    if (window._vtRestoring) return;
    if (works!.classList.contains('is-filtered')) return;
    const e = ease(progress);
    const s = scaleFrom + (scaleTo - scaleFrom) * e;
    const shift = shiftFrom + (shiftTo - shiftFrom) * e;
    scaleNow = s;
    scaler!.style.transform = `translate(-50%, calc(-50% + ${shift.toFixed(2)}px)) scale(${s.toFixed(4)})`;
  }

  measure();

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
