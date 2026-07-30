import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { slotText, type SlotTextController } from 'slot-text';
import 'slot-text/style.css';

gsap.registerPlugin(ScrollTrigger);

/* --- estado que hay que desmontar entre navegaciones --- */
let lenis: Lenis | null = null;
let lenisTick: ((time: number) => void) | null = null;
let rowsTick: (() => void) | null = null;
let onResize: (() => void) | null = null;
let abort: AbortController | null = null;
let slots: SlotTextController[] = [];
let wordTimer: number | null = null;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** alto de la caja del título en em, espejo de `height: calc(var(--wm-fs) * .9)` */
const CAJA_TITULO = 0.9;

function teardown() {
  ScrollTrigger.getAll().forEach((t) => t.kill());
  if (lenisTick) gsap.ticker.remove(lenisTick);
  if (rowsTick) gsap.ticker.remove(rowsTick);
  if (onResize) window.removeEventListener('resize', onResize);
  if (wordTimer) window.clearInterval(wordTimer);
  slots.forEach((s) => s.destroy());
  lenis?.destroy();
  abort?.abort();
  slots = [];
  wordTimer = null;
  lenis = null;
  lenisTick = null;
  rowsTick = null;
  onResize = null;
  abort = new AbortController();
}

/* =========================================================
   1. Scroll suave (Lenis) — la inercia sobre la que se
   apoyan todas las animaciones ligadas al scroll.
   ========================================================= */
function setupScroll() {
  if (reduced()) return;

  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });

  lenis.on('scroll', ScrollTrigger.update);

  lenisTick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(lenisTick);
  gsap.ticker.lagSmoothing(0);
}

/* =========================================================
   2. Capítulo de trabajos: la grilla se aleja mientras
   las filas se desplazan en direcciones alternas.
   Al principio solo se ven el wordmark y la primera fila;
   al final, la grilla entera entra en pantalla.
   ========================================================= */
function setupWorks() {
  const works = document.querySelector<HTMLElement>('.works');
  const stage = document.querySelector<HTMLElement>('.works__stage');
  const scaler = document.querySelector<HTMLElement>('.works__scaler');
  if (!works || !stage || !scaler) return;

  const tracks = Array.from(document.querySelectorAll<HTMLElement>('.row__track'));
  const copies = Number(tracks[0]?.dataset.copies ?? 3);

  const rows = document.querySelector<HTMLElement>('.rows');
  const row0 = rows?.firstElementChild as HTMLElement | undefined;
  if (!rows || !row0) return;

  // estado del zoom, recalculado en cada resize
  let scaleFrom = 1;
  let scaleTo = 2.2;
  let shiftFrom = 0;
  let shiftTo = 0;
  let scaleNow = 1;
  let progress = 0;

  const marco = document.querySelector<HTMLElement>('.wordmark');

  function measure() {
    const vh = stage!.clientHeight;

    // la grilla está maquetada al tamaño final: el zoom va de --zoom0 a --zoom1
    scaleFrom =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom0')) || 0.45;
    scaleTo =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom1')) || 0.72;

    const rowH = row0!.offsetHeight;

    // el título manda mientras entre: en pantallas bajas se recorta lo justo
    // para que la primera fila de tarjetas siga completa arriba del borde
    if (marco) marco.style.removeProperty('--wm-fs');
    const disponible = vh - 106;
    let heroH = rows!.offsetTop; // caja del título
    // el sobrante se mide en pantalla y se traduce a espacio de contenido
    const sobra = (heroH + rowH) * scaleFrom - disponible;
    if (marco && sobra > 0) {
      const alto = marco.clientHeight;
      const recortado = Math.max(alto - sobra / scaleFrom, (vh * 0.14) / scaleFrom);
      marco.style.setProperty('--wm-fs', `${(recortado / CAJA_TITULO).toFixed(1)}px`);
      heroH = rows!.offsetTop;
    }

    const contentH = scaler!.offsetHeight;

    // al principio: la primera fila queda al ras del borde inferior
    const topInicial = Math.max(24, vh - 10 - (heroH + rowH) * scaleFrom);
    shiftFrom = topInicial - vh / 2 + (contentH * scaleFrom) / 2;

    // al final: centra entre las dos primeras filas para que ambas entren;
    // el factor 1.08 añade margen para el nombre + categoría bajo la fila 2
    shiftTo = scaleTo * (contentH / 2 - (heroH + rowH * 1.08));

    // el recorrido del zoom dura ~3 pantallas + la altura del sticky
    works!.style.height = `${Math.round(vh * 4)}px`;
    apply();
  }

  const ease = gsap.parseEase('power2.inOut');

  function apply() {
    const e = ease(progress);
    const s = scaleFrom + (scaleTo - scaleFrom) * e;
    const shift = shiftFrom + (shiftTo - shiftFrom) * e;
    scaleNow = s;
    scaler!.style.transform = `translate(-50%, calc(-50% + ${shift.toFixed(2)}px)) scale(${s.toFixed(4)})`;
  }

  measure();

  onResize = () => {
    measure();
    ScrollTrigger.refresh();
  };
  window.addEventListener('resize', onResize);

  // sin motion: se queda el hero quieto, sin recorrido de zoom
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
      apply();
    },
  });

  /* --- marquesina horizontal, una velocidad por fila --- */
  const state = tracks.map((track, i) => ({
    track,
    dir: i % 2 === 0 ? -1 : 1,
    speed: 0.28 + (i % 3) * 0.16,
    x: -i * 190,
    loop: 0,
  }));

  function measureLoops() {
    state.forEach((s) => {
      s.loop = s.track.scrollWidth / copies;
    });
  }
  measureLoops();

  let velocity = 0;
  lenis?.on('scroll', (e: { velocity: number }) => {
    velocity = e.velocity;
  });

  rowsTick = () => {
    const rect = works!.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    // el desplazamiento se divide por la escala: con el zoom adentro las
    // filas se ven más grandes, pero no más rápidas
    const boost = (velocity * 0.35) / scaleNow;
    velocity *= 0.92;

    for (const s of state) {
      if (!s.loop) continue;
      s.x += (s.dir * s.speed) / scaleNow + s.dir * boost;
      // se envuelve dentro de una copia: el bucle es invisible
      s.x = (((s.x % s.loop) + s.loop) % s.loop) - s.loop;
      s.track.style.transform = `translate3d(${s.x.toFixed(2)}px,0,0)`;
    }
  };
  gsap.ticker.add(rowsTick);

  // las imágenes cambian el ancho del track al cargar
  window.addEventListener('load', measureLoops, { once: true, signal: abort!.signal });
}

/* =========================================================
   2b. Progreso de lectura (efecto de tendencia a la meta) y la
   pista de scroll, que se apaga apenas la página se mueve.
   ========================================================= */
function setupProgress() {
  const barra = document.querySelector<HTMLElement>('.progress span');
  const pista = document.querySelector<HTMLElement>('.scroll-cue');
  if (!barra && !pista) return;

  const pintar = () => {
    const alto = document.documentElement.scrollHeight - window.innerHeight;
    const avance = alto > 0 ? Math.min(1, window.scrollY / alto) : 0;
    if (barra) barra.style.transform = `scaleX(${avance.toFixed(4)})`;
    // la pista dura lo que dura el primer 12% del scroll
    if (pista) pista.style.opacity = `${Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.5))}`;
  };

  window.addEventListener('scroll', pintar, { passive: true, signal: abort!.signal });
  pintar();
}

/* =========================================================
   3. Título del hero con slot-text (textmotion.dev): arranca
   revuelto, rueda hasta la marca y después va rotando entre lo
   que transmiten las librerías —vida, fluidez, ritmo…—.
   ========================================================= */
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const revolver = (texto: string) =>
  texto.replace(/\S/g, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]);

function setupSlotText() {
  if (reduced()) return;

  const titulo = document.querySelector<HTMLElement>('.wordmark__slot');
  const caja = document.querySelector<HTMLElement>('.wordmark__text');
  const marco = document.querySelector<HTMLElement>('.wordmark');
  if (!titulo || !caja || !marco) return;

  const marca = titulo.textContent?.trim() ?? '';
  const lista = titulo.dataset.words?.split('|').filter(Boolean) ?? [marca];

  /* --- cada frase entra al ancho de pantalla: se mide en em con canvas y se
     baja el tamaño lo necesario, sin pasar del techo que fija el CSS --- */
  const pincel = document.createElement('canvas').getContext('2d');
  const anchos = new Map<string, number>();
  let actual = marca;

  function anchoEm(texto: string) {
    const clave = texto.toUpperCase(); // el canvas no aplica text-transform
    let em = anchos.get(clave);
    if (em === undefined) {
      pincel!.font = '400 100px "Bebas Neue"';
      em = pincel!.measureText(clave).width / 100;
      anchos.set(clave, em);
    }
    return em;
  }

  function ajustar(texto: string) {
    actual = texto;
    const techo = marco!.clientHeight / CAJA_TITULO; // el alto de la caja manda
    // el título se lee al inicio del recorrido: el ancho de pantalla hay que
    // llevarlo a espacio de contenido dividiéndolo por el zoom de arranque
    const zoom0 =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom0')) || 0.45;
    const entra = (window.innerWidth * 0.94) / zoom0 / anchoEm(texto);
    caja!.style.fontSize = `${Math.min(techo, entra).toFixed(1)}px`;
  }

  ajustar(marca);
  // hasta que Bebas esté lista el canvas mide con la fuente de respaldo
  document.fonts.ready.then(() => {
    anchos.clear();
    ajustar(actual);
  });

  window.addEventListener('resize', () => window.setTimeout(() => ajustar(actual), 80), {
    signal: abort!.signal,
  });

  // arranca revuelto y rueda hasta la marca: el clásico golpe de slot
  const rodillo = slotText(titulo, revolver(marca));
  slots.push(rodillo);
  requestAnimationFrame(() =>
    rodillo.set(marca, {
      direction: 'up',
      stagger: 70,
      duration: 620,
      bounce: 0.45,
      skipUnchanged: false,
    }),
  );

  if (lista.length > 1) {
    let i = 0;
    wordTimer = window.setInterval(() => {
      // con el hero fuera de pantalla no tiene sentido seguir rodando
      const rect = caja.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      i = (i + 1) % lista.length;
      ajustar(lista[i]);
      // el © es de la marca, no de "fluidez"
      caja.classList.toggle('is-brand', lista[i] === marca);
      // las palabras tienen largos distintos y van centradas: sin
      // skipUnchanged, ruedan todas las letras y no quedan algunas quietas
      rodillo.set(lista[i], {
        direction: 'up',
        stagger: 46,
        duration: 520,
        bounce: 0.45,
        skipUnchanged: false,
      });
    }, 2800);
  }
}

/* =========================================================
   4. Reveals de las secciones de texto.
   ========================================================= */
function setupReveals() {
  if (reduced()) return;

  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    const kids = el.hasAttribute('data-reveal-children')
      ? Array.from(el.children)
      : [el];

    // umbral de Doherty: el contenido termina de entrar antes de los 400 ms
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

/* =========================================================
   4. View transition: la imagen sobre la que se hace click
   es la que se transforma en la ficha. El nombre se asigna
   en el momento del click porque cada librería aparece
   repetida en varias filas de la grilla.
   ========================================================= */
function setupTransitionNames() {
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as Element | null;
      const tile = target?.closest?.<HTMLElement>('[data-vt]');

      document.querySelectorAll<HTMLElement>('[data-vt] img').forEach((img) => {
        img.style.viewTransitionName = '';
      });

      const img = tile?.querySelector<HTMLElement>('img');
      if (tile && img) img.style.viewTransitionName = tile.dataset.vt!;
    },
    { capture: true, signal: abort!.signal },
  );
}

/* =========================================================
   5. Ficha de librería: Escape vuelve al catálogo.
   ========================================================= */
function setupProjectView() {
  if (!document.querySelector('.project')) return;

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape') return;
      const close = document.querySelector<HTMLAnchorElement>('.project__close');
      close?.click();
    },
    { signal: abort!.signal },
  );
}

/* =========================================================
   6. Footer reveal: mide el footer fijo y deja espacio en
   main para que se descubra al final del scroll.
   ========================================================= */
function setupFooterReveal() {
  const reveal = document.querySelector<HTMLElement>('.footer-reveal');
  const main = document.querySelector<HTMLElement>('main');
  if (!reveal || !main) return;

  const sync = () => {
    main.style.marginBottom = `${reveal.offsetHeight}px`;
  };

  sync();
  window.addEventListener('resize', sync, { signal: abort!.signal });
}

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
  ScrollTrigger.refresh();
}
