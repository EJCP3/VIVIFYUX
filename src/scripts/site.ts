import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';
import Lenis from 'lenis';
import { bind, play, setVolume } from 'cuelume';
import 'lenis/dist/lenis.css';
import { CATEGORIAS, t, type Categoria } from '../i18n';
import { idiomaActual } from './idioma';

gsap.registerPlugin(ScrollTrigger, Observer);

// cues reales de cuelume: 'chisme' no existía y dejaba mudo un tercio de los botones
const pressSounds = ['tick', 'press', 'droplet'];

// Add random sounds to all interactive elements that don't already have them
document.querySelectorAll('a, button').forEach(el => {
  if (!el.hasAttribute('data-cuelume-press')) {
    el.setAttribute('data-cuelume-press', pressSounds[Math.floor(Math.random() * pressSounds.length)]);
  }
});

bind();                          // wires every data-cuelume-* attribute
setVolume(0.3);                  // keep global volume low
// Expose play function to window for nested intervals if needed
if (typeof window !== 'undefined') {
  (window as any).cuelumePlay = play;
}

/* --- estado que hay que desmontar entre navegaciones --- */
let lenis: Lenis | null = null;
let lenisTick: ((time: number) => void) | null = null;
let rowsTick: (() => void) | null = null;
let onResize: (() => void) | null = null;
let abort: AbortController | null = null;
let wordTimer: number | null = null;
let filterTitleTl: gsap.core.Timeline | null = null;
let marquesinaTl: gsap.core.Timeline | null = null;

/* --- lo que el catálogo deja pendiente de restaurar al volver de una ficha --- */
let pendingScrollY: number | null = null;
let pendingCarousel: (number | null)[] | null = null;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** espejo del breakpoint de teléfonos de global.css */
const esMovil = () => window.matchMedia('(max-width: 700px)').matches;

/** tope del empujón que el scroll le da a las filas, en px de pantalla por
 *  fotograma (~7 veces la velocidad de crucero de la marquesina) */
const BOOST_MAX = 3.5;

function teardown() {
  ScrollTrigger.getAll().forEach((t) => t.kill());
  if (lenisTick) gsap.ticker.remove(lenisTick);
  if (rowsTick) gsap.ticker.remove(rowsTick);
  if (onResize) window.removeEventListener('resize', onResize);
  if (wordTimer) window.clearInterval(wordTimer);
  filterTitleTl?.kill();
  lenis?.destroy();
  abort?.abort();
  filterTitleTl = null;
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
  // el valor lo deja `restoreCatalog()` al volver de una ficha
  const restoreY = pendingScrollY;
  pendingScrollY = null;

  if (reduced()) {
    if (restoreY !== null) window.scrollTo(0, restoreY);
    return;
  }

  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });

  // el scroll se fija otra vez ya con Lenis montado: si no, la inercia
  // arranca desde donde el navegador dejó la página y se ve el salto
  if (restoreY !== null) {
    window.scrollTo(0, restoreY);
    lenis.scrollTo(restoreY, { immediate: true });
  }

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

  // el título vive arriba de .works__stage, en flujo normal: .works__stage
  // arranca desplazado ese alto sin que el JS haga nada
  const hero = document.querySelector<HTMLElement>('.scrolling-text');

  // estado del zoom, recalculado en cada resize
  let scaleFrom = 1;
  let scaleTo = 2.2;
  let shiftFrom = 0;
  let shiftTo = 0;
  let scaleNow = 1;
  let progress = 0;

  function measure() {
    const vh = stage!.clientHeight;

    // la grilla está maquetada al tamaño final: el zoom va de --zoom0 a --zoom1
    scaleFrom =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom0')) || 0.45;
    scaleTo =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom1')) || 0.72;

    const rowH = row0!.offsetHeight;
    const gapY = parseFloat(getComputedStyle(rows!).rowGap) || 0;

    // el zoom final no puede pasar de lo que deje entrar dos filas enteras:
    // si se pasa, las recorta por arriba y por abajo y asoma la siguiente.
    // El título ya no es parte de este cálculo: vive afuera de .works__scaler,
    // a tamaño fijo, y no lo escala el scroll
    const dosFilas = rowH * 2 + gapY;
    const movil = esMovil();
    scaleTo = Math.max(scaleFrom, Math.min(scaleTo, (vh - (movil ? 24 : 32)) / dosFilas));

    const contentH = scaler!.offsetHeight; // == dosFilas: .rows es el único hijo de .works__scaler

    // el hueco entre título y primera fila es fijo y chico —como en la
    // versión publicada, donde ambos vivían pegados dentro del mismo bloque
    // que hace zoom—. Lo que sobra de pantalla ya no se acumula ahí: empuja
    // el título hacia abajo con un margen superior, así el conjunto entero
    // (título + grilla) baja junto en vez de separarse en dos mitades
    const heroH = hero
      ? hero.offsetHeight + (parseFloat(getComputedStyle(hero).marginBottom) || 0)
      : 0;
    const gapChico = movil ? 16 : 32;
    const topInicial = gapChico;
    // el hero enseña UNA sola fila: el encuadre termina justo donde arranca la
    // segunda, que entra recién cuando el zoom del scroll abre el cuadro. Dos
    // filas de golpe eran demasiada información para lo primero que se ve
    const sobra = Math.max(
      0,
      vh - (rowH + gapY) * scaleFrom - heroH - gapChico,
    );
    if (hero) hero.style.marginTop = `${sobra.toFixed(1)}px`;
    shiftFrom = topInicial - vh / 2 + (contentH * scaleFrom) / 2;

    // al final: las dos filas quedan centradas en la pantalla. Su mitad cae
    // en el hueco entre ambas, a rowH + gapY/2 del borde superior del bloque
    const medioFinal = rowH + gapY / 2;
    shiftTo = scaleTo * (contentH / 2 - medioFinal);

    // el recorrido del zoom dura ~3 pantallas + la altura del sticky.
    // En teléfono se acorta: el mismo recorrido con el dedo se hace largo.
    // Con un filtro activo .works vive en alto automático (lo ocupa la
    // grilla estática, no el carrusel): no lo pisamos
    if (!works!.classList.contains('is-filtered')) {
      works!.style.height = `${Math.round(vh * (movil ? 3 : 4))}px`;
    }
    apply();
  }

  const ease = gsap.parseEase('power2.inOut');

  declare global {
    interface Window {
      _vtRestoring?: boolean;
    }
  }

  function apply() {
    if (window._vtRestoring) return;
    // el carrusel está oculto entero mientras hay un filtro activo: seguir
    // escribiendo el transform es inofensivo pero inútil
    if (works!.classList.contains('is-filtered')) return;
    const e = ease(progress);
    const s = scaleFrom + (scaleTo - scaleFrom) * e;
    const shift = shiftFrom + (shiftTo - shiftFrom) * e;
    scaleNow = s;
    scaler!.style.transform = `translate(-50%, calc(-50% + ${shift.toFixed(2)}px)) scale(${s.toFixed(4)})`;
  }

  measure();

  onResize = () => {
    measure();
    if (!reduced()) ScrollTrigger.refresh();
  };
  window.addEventListener('resize', onResize);

  // sin motion: aplicamos layout inicial pero no animamos con scroll
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

  /* --- marquesina horizontal, una velocidad por fila --- */
  const savedPositions = pendingCarousel;
  pendingCarousel = null;

  const state = tracks.map((track, i) => {
    let initialX = -i * 190;
    if (savedPositions && typeof savedPositions[i] === 'number') {
      initialX = savedPositions[i];
    }

    const s = {
      track,
      dir: i % 2 === 0 ? -1 : 1,
      speed: 0.5 + (i % 3) * 0.25,
      x: initialX,
      loop: 0,
      dragVelocity: 0,
      isDragging: false
    };

    // cuánto se movió el dedo en horizontal: sirve para distinguir un arrastre
    // de un toque, porque las tarjetas son enlaces
    let recorrido = 0;

    Observer.create({
      target: track,
      type: "pointer,touch",
      // el eje se fija en el primer movimiento: sin esto, bajar la página con
      // el dedo apoyado en una fila la arrastraba de costado a la vez
      lockAxis: true,
      onPress() {
        recorrido = 0;
      },
      onDrag(self) {
        if (self.axis === 'y') return; // el gesto es scroll de la página
        s.isDragging = true;
        recorrido += Math.abs(self.deltaX);
        s.x += self.deltaX / scaleNow;
        s.dragVelocity = self.deltaX / scaleNow;
      },
      onRelease() {
        s.isDragging = false;
        if (recorrido < 8) return; // fue un toque: que abra la ficha

        // el click llega después del release: se traga uno solo, para que
        // arrastrar la marquesina no termine abriendo una librería
        const bloquear = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
        };
        track.addEventListener('click', bloquear, { capture: true, once: true });
        window.setTimeout(
          () => track.removeEventListener('click', bloquear, { capture: true }),
          350,
        );
      }
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
  lenis?.on('scroll', (e: { velocity: number }) => {
    velocity = e.velocity;
  });

  rowsTick = () => {
    const rect = works!.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    // el empujón del scroll se topea ANTES de dividir por la escala: el tope
    // es lo que se ve en pantalla. Sin él, un golpe de rueda (o la inercia de
    // un deslizamiento en el móvil) disparaba la velocidad de Lenis y las filas
    // salían despedidas
    const boost = gsap.utils.clamp(-BOOST_MAX, BOOST_MAX, velocity * 0.12) / scaleNow;
    velocity *= 0.92;

    for (const s of state) {
      if (!s.loop) continue;
      
      s.dragVelocity *= 0.92; // Inertia decay
      
      if (!s.isDragging) {
        s.x += (s.dir * s.speed) / scaleNow + s.dir * boost + s.dragVelocity;
      } else {
        // When dragging, auto-scroll is paused, onDrag updates s.x directly.
        // We just apply the transform.
      }
      
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
// Eliminado el código complejo de "revolver"

/* los signos que ocupan el sitio de una letra durante el glitch */
const SIGNOS = [
  // asterisco de ocho puntas
  `<svg viewBox="0 0 100 100" fill="#ff8a6b" aria-hidden="true"><rect x="42" y="0" width="16" height="100" rx="8"/><rect x="0" y="42" width="100" height="16" rx="8"/><rect x="42" y="0" width="16" height="100" rx="8" transform="rotate(45 50 50)"/><rect x="42" y="0" width="16" height="100" rx="8" transform="rotate(-45 50 50)"/></svg>`,
  // rayo
  `<svg viewBox="0 0 100 100" fill="none" stroke="#0ae448" stroke-width="8" stroke-linejoin="round" aria-hidden="true"><path d="M60 5 24 55h24l-8 40 36-52H52z"/></svg>`,
  // flor de cuatro pétalos
  `<svg viewBox="0 0 100 100" fill="#ff9a7b" aria-hidden="true"><circle cx="50" cy="26" r="25"/><circle cx="74" cy="50" r="25"/><circle cx="50" cy="74" r="25"/><circle cx="26" cy="50" r="25"/></svg>`,
  // chispa de cuatro puntas
  `<svg viewBox="0 0 100 100" fill="#7b61ff" aria-hidden="true"><path d="M50 2c4 26 20 42 48 48-28 6-44 22-48 48-4-26-20-42-48-48 28-6 44-22 48-48z"/></svg>`,
  // círculo hueco
  `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="34" fill="none" stroke="#7b61ff" stroke-width="18"/></svg>`,
];

/** deja cada palabra del riel en el idioma activo.
 *
 *  No lo hace pintarIdioma() con el data-en/data-es genérico porque ese
 *  escribe textContent, y el h4 guarda además el .flair (las dos figuras que
 *  asoman detrás). Acá se reemplazan solo los spans de letra. */
function sincronizarPalabrasHero() {
  const idioma = idiomaActual();

  document.querySelectorAll<HTMLElement>('.scrolling-text .rail h4').forEach((h4) => {
    const palabra = idioma === 'es' ? h4.dataset.palabraEs : h4.dataset.palabraEn;
    if (!palabra || h4.dataset.text === palabra) return; // ya está en su idioma

    h4.dataset.text = palabra; // el glitch lo lee para sus ::before/::after
    h4.querySelectorAll(':scope > span').forEach((s) => s.remove());
    for (const letra of palabra) {
      const span = document.createElement('span');
      span.textContent = letra;
      h4.appendChild(span);
    }
  });
}

function setupSlotText() {
  // antes de medir nada: el bucle horizontal se calcula con el ancho de cada
  // palabra, y en español son otras
  sincronizarPalabrasHero();

  const scrollingText = gsap.utils.toArray<HTMLElement>('.scrolling-text .rail h4');
  if (scrollingText.length === 0) return;

  const signal = abort!.signal;

  /* --- micro-animación por letra: la palabra responde en cascada, como los
     demos de texto de GSAP. Corta a propósito (bajo 400 ms) y solo cuando el
     usuario toca: el glitch ya pone el ruido de fondo --- */
  function ola(palabra: HTMLElement, subida: number, escala: number, paso: number) {
    const letras = palabra.querySelectorAll<HTMLElement>(':scope > span');
    if (!letras.length) return;

    gsap.fromTo(
      letras,
      { yPercent: 0, scaleY: 1 },
      {
        yPercent: subida,
        scaleY: escala,
        duration: 0.16,
        ease: 'power2.out',
        transformOrigin: '50% 100%',
        stagger: { each: paso, from: 'start' },
        yoyo: true,
        repeat: 1,
        overwrite: true,
      },
    );
  }

  scrollingText.forEach((palabra) => {
    palabra.addEventListener('pointerenter', () => ola(palabra, -10, 1.05, 0.026), { signal });
    palabra.addEventListener('pointerdown', () => ola(palabra, -22, 1.14, 0.02), { signal });
  });

  // Esperar a que la tipografía gigante cargue para evitar que el ancho sea 0
  document.fonts.ready.then(() => {
    const tl = horizontalLoop(scrollingText, {
      repeat: -1,
      paddingRight: parseFloat(getComputedStyle(scrollingText[0]).marginRight) || 0,
      speed: 1.00 // paso tranquilo: a 1.8 las palabras pasaban sin dar tiempo a leerlas
    });

    // el scroll acelera el riel, pero con tope: el 6.25x de antes convertía
    // cualquier golpe de rueda en un borrón ilegible
    const RAFAGA = 2.2;

    Observer.create({
      target: window,
      type: "wheel,touch",
      onChangeY(self) {
        const sentido = self.deltaY < 0 ? -1 : 1; // hacia atrás si se sube

        gsap.timeline({ defaults: { ease: "none" } })
          .to(tl, { timeScale: sentido * RAFAGA, duration: 0.3, overwrite: true })
          .to(tl, { timeScale: sentido, duration: 1 }, "+=0.3"); // vuelve a la velocidad de crucero
      }
    });

    // --- GLITCH EFFECT LOGIC ---
    const glitchClasses = [
      'is-glitching',
      'glitch-var-2',
      'glitch-var-3',
      'glitch-swap',    // una letra se cambia por un signo
      'glitch-scatter', // letras sueltas de otro color
      'glitch-sweep',   // un color recorre la palabra letra a letra
    ];

    const letrasDe = (palabra: HTMLElement) =>
      Array.from(palabra.querySelectorAll<HTMLElement>(':scope > span'));

    /** aplica una variante y devuelve cuánto tiene que durar + cómo deshacerla */
    function aplicarGlitch(palabra: HTMLElement, variante: string) {
      palabra.classList.add(variante);
      const deshacer: (() => void)[] = [() => palabra.classList.remove(variante)];
      let duracion = 200 + Math.random() * 600;

      if (variante === 'glitch-swap') {
        const letras = letrasDe(palabra);
        const objetivo = letras[Math.floor(Math.random() * letras.length)];
        if (objetivo) {
          const signo = document.createElement('span');
          signo.className = 'letra-signo';
          signo.setAttribute('aria-hidden', 'true');
          signo.innerHTML = SIGNOS[Math.floor(Math.random() * SIGNOS.length)];
          objetivo.classList.add('letra-oculta');
          objetivo.appendChild(signo);
          duracion = 1500 + Math.random() * 700;
          deshacer.push(() => {
            // el signo se va con su propia animación y la letra vuelve a la vez
            objetivo.classList.remove('letra-oculta');
            signo.classList.add('saliendo');
            window.setTimeout(() => signo.remove(), 450);
          });
        }
      }

      if (variante === 'glitch-scatter') {
        const sueltas = gsap.utils.shuffle(letrasDe(palabra)).slice(0, 2 + Math.floor(Math.random() * 3));
        sueltas.forEach((letra, i) => {
          const clase = `letra-alt-${1 + (i % 3)}`;
          letra.classList.add(clase);
          deshacer.push(() => letra.classList.remove(clase));
        });
        duracion = 1500 + Math.random() * 600;
      }

      if (variante === 'glitch-sweep') {
        const letras = letrasDe(palabra);
        const paso = 0.085; // lo que tarda el color en saltar de una letra a la siguiente
        const tl = gsap
          .timeline({ defaults: { ease: 'sine.inOut' } })
          .to(letras, { color: '#0ae448', duration: 0.28, stagger: paso })
          .to(letras, { color: '#0a0a0a', duration: 0.28, stagger: paso }, paso * letras.length + 0.25);
        duracion = (paso * letras.length * 2 + 0.8) * 1000;
        deshacer.push(() => {
          tl.kill();
          gsap.set(letras, { clearProps: 'color' });
        });
      }

      return { duracion, deshacer: () => deshacer.forEach((fn) => fn()) };
    }

    /** una palabra glitchea una vez, con una variante al azar */
    function glitchear(palabra: HTMLElement) {
      if (glitchClasses.some((c) => palabra.classList.contains(c))) return;
      if (palabra.querySelector('.letra-signo')) return; // el signo anterior aún se está yendo
      const variante = glitchClasses[Math.floor(Math.random() * glitchClasses.length)];
      const { duracion, deshacer } = aplicarGlitch(palabra, variante);
      window.setTimeout(deshacer, duracion);
    }

    // 1. Initial glitch wave "al aparecer" — mudo: el glitch es constante y
    // sonarlo cansaba. El hero solo suena cuando se hace click en una palabra.
    // Solo las palabras que se ven: recorrer las ~36 del riel encadenaba más de
    // cinco segundos de glitch cada vez que se entraba al catálogo
    const enPantalla = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.right > 0 && r.left < window.innerWidth;
    };

    scrollingText.filter(enPantalla).forEach((el, index) => {
      setTimeout(() => glitchear(el), index * 150); // cascading delay
    });

    // 2. Random glitches while scrolling.
    // El temporizador se guarda en wordTimer: sin eso, cada vuelta al catálogo
    // dejaba vivo el intervalo anterior y los glitches se acumulaban
    const container = document.querySelector('.scrolling-text');

    wordTimer = window.setInterval(() => {
      // no en cada vuelta: así el ritmo es irregular y no se vuelve un tic
      if (Math.random() > 0.45) return;

      // Early return if the hero container itself is out of viewport
      if (container) {
        const containerRect = container.getBoundingClientRect();
        if (containerRect.bottom < 0 || containerRect.top > window.innerHeight) {
          return; // User has scrolled past the hero, do nothing
        }
      }

      // Find all elements currently visible on screen
      const visibleEls = scrollingText.filter(enPantalla);

      if (visibleEls.length === 0) return; // Safety check

      // una sola palabra por vez: dos a la vez leían como fallo de la página
      glitchear(visibleEls[Math.floor(Math.random() * visibleEls.length)]);
    }, 1600);
  });
}

/*
 * Helper function from GSAP for seamless horizontal looping.
 */
function horizontalLoop(items: any[], config: any) {
  items = gsap.utils.toArray(items);
  config = config || {};
  let tl = gsap.timeline({
      repeat: config.repeat,
      paused: config.paused,
      defaults: { ease: "none" },
      onReverseComplete: () => { tl.totalTime(tl.rawTime() + tl.duration() * 100); }
    }),
    length = items.length,
    startX = items[0].offsetLeft,
    times: number[] = [],
    widths: number[] = [],
    xPercents: number[] = [],
    curIndex = 0,
    pixelsPerSecond = (config.speed || 1) * 100,
    snap = config.snap === false ? (v: number) => v : gsap.utils.snap(config.snap || 1),
    totalWidth: number, curX: number, distanceToStart: number, distanceToLoop: number, item: any, i: number;

  gsap.set(items, {
    xPercent: (i, el) => {
      let w = widths[i] = parseFloat(gsap.getProperty(el, "width", "px") as string);
      xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px") as string) / w * 100 + (gsap.getProperty(el, "xPercent") as number));
      return xPercents[i];
    }
  });
  gsap.set(items, { x: 0 });

  totalWidth = items[length - 1].offsetLeft + xPercents[length - 1] / 100 * widths[length - 1] - startX + items[length - 1].offsetWidth * (gsap.getProperty(items[length - 1], "scaleX") as number) + (parseFloat(config.paddingRight) || 0);

  for (i = 0; i < length; i++) {
    item = items[i];
    curX = xPercents[i] / 100 * widths[i];
    distanceToStart = item.offsetLeft + curX - startX;
    distanceToLoop = distanceToStart + widths[i] * (gsap.getProperty(item, "scaleX") as number);

    tl.to(item, { xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond }, 0)
      .fromTo(item, { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) }, { xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false }, distanceToLoop / pixelsPerSecond)
      .add("label" + i, distanceToStart / pixelsPerSecond);
    
    times[i] = distanceToStart / pixelsPerSecond;
  }

  return tl;
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
  // We no longer use a manual pointerdown event.
  // Instead, we hook into Astro's native router events below.
}

/** foto del catálogo en el momento del click, para volver al mismo sitio */
type CatalogState = {
  /** ruta del catálogo: el estado solo se consume al regresar a ella */
  from: string;
  /** índice de history del catálogo, para saber si `back()` vuelve justo ahí */
  historyIndex: number | null;
  vt: string | null;
  vtIndex: number | null;
  carousel: (number | null)[];
  scaler: string;
  worksHeight: string;
  scrollY: number;
};

const CATALOG_KEY = 'vt-catalog';

function readCatalogState(): CatalogState | null {
  const raw = sessionStorage.getItem(CATALOG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CatalogState;
  } catch {
    sessionStorage.removeItem(CATALOG_KEY);
    return null;
  }
}

/** la librería aparece repetida en varias filas: vuelve a la copia que se veía */
function findTile(vt: string, index: number | null): HTMLElement | null {
  const tiles = Array.from(document.querySelectorAll<HTMLElement>('[data-vt]'));
  if (index !== null && tiles[index]?.dataset.vt === vt) return tiles[index];

  const matches = tiles.filter((t) => t.dataset.vt === vt);
  if (!matches.length) return null;

  let best = matches[0];
  let bestArea = -1;
  for (const tile of matches) {
    const r = tile.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.right, window.innerWidth) - Math.max(r.left, 0));
    const h = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
    if (w * h > bestArea) {
      bestArea = w * h;
      best = tile;
    }
  }
  return best;
}

/** deja el catálogo exactamente como estaba antes de abrir la ficha */
function restoreCatalog(state: CatalogState) {
  // 1. las filas vuelven a su desplazamiento horizontal
  if (state.carousel) {
    const tracks = Array.from(document.querySelectorAll<HTMLElement>('.row__track'));
    tracks.forEach((track, i) => {
      if (typeof state.carousel[i] === 'number') {
        track.style.transform = `translate3d(${state.carousel[i]}px,0,0)`;
      }
    });
    pendingCarousel = state.carousel;
  }

  // 2. el zoom, congelado hasta que ScrollTrigger calcule el progreso real
  if (state.scaler) {
    const scaler = document.querySelector<HTMLElement>('.works__scaler');
    if (scaler) {
      scaler.style.transform = state.scaler;
      window._vtRestoring = true;
    }
  }

  // 3. el alto del recorrido, antes de tocar el scroll: si el documento
  //    todavía es más corto, el navegador recorta la posición y salta arriba
  if (state.worksHeight) {
    const works = document.querySelector<HTMLElement>('.works');
    if (works) works.style.height = state.worksHeight;
  }

  // 4. el scroll: Astro ya movió la página (arriba del todo si es navegación
  //    nueva), así que lo devolvemos al valor guardado
  pendingScrollY = state.scrollY;
  window.scrollTo(0, state.scrollY);

  // 5. la imagen que recibe la transición de vuelta
  if (state.vt) {
    const tile = findTile(state.vt, state.vtIndex);
    const img = tile?.querySelector<HTMLImageElement>('img');
    if (img) {
      img.style.viewTransitionName = state.vt;
      img.setAttribute('loading', 'eager');
    }
  }
}

/** ¿la entrada anterior del historial es el catálogo del que venimos? */
function catalogIsPreviousEntry(state: CatalogState | null): boolean {
  if (!state || state.historyIndex === null) return false;
  const index = (window.history.state as { index?: number } | null)?.index;
  return typeof index === 'number' && index === state.historyIndex + 1;
}

if (typeof document !== 'undefined') {
  // Before Astro takes the snapshot of the OLD page
  document.addEventListener('astro:before-preparation', (ev: any) => {
    const grid = document.querySelector<HTMLElement>('.works');
    const tile = ev.sourceElement?.closest?.('[data-vt]') as HTMLElement | null | undefined;

    // salimos del catálogo (por una tarjeta o por cualquier enlace del pie):
    // se guarda su estado para devolverlo tal cual al volver
    if (grid) {
      // Clear all previous transition names
      document.querySelectorAll<HTMLElement>('[data-vt] img').forEach((img) => {
        img.style.viewTransitionName = '';
      });

      // Set transition name on the exact image we clicked
      const img = tile?.querySelector<HTMLElement>('img');
      const vt = tile?.dataset.vt ?? null;
      if (img && vt) img.style.viewTransitionName = vt;

      const allTiles = Array.from(document.querySelectorAll<HTMLElement>('[data-vt]'));
      const tracks = Array.from(document.querySelectorAll<HTMLElement>('.row__track'));
      const scaler = document.querySelector<HTMLElement>('.works__scaler');

      const state: CatalogState = {
        from: location.pathname,
        historyIndex: (window.history.state as { index?: number } | null)?.index ?? null,
        vt,
        vtIndex: vt && tile ? allTiles.indexOf(tile) : null,
        carousel: tracks.map((track) => {
          const match = track.style.transform.match(/translate3d\(([-\d.]+)px/);
          return match ? parseFloat(match[1]) : null;
        }),
        scaler: scaler?.style.transform ?? '',
        worksHeight: grid.style.height,
        scrollY: window.scrollY,
      };
      sessionStorage.setItem(CATALOG_KEY, JSON.stringify(state));
      return;
    }

    // saltar de una ficha a otra (anterior/siguiente) no toca el catálogo,
    // pero sí cambia la imagen a la que hay que volver
    const to = ev.to as URL | undefined;
    const slug = to && new URL(to, location.href).pathname.match(/^\/libreria\/([^/]+)\/?$/)?.[1];
    if (slug) {
      const state = readCatalogState();
      if (state && state.vt !== `cover-${slug}`) {
        state.vt = `cover-${slug}`;
        state.vtIndex = null; // ya no sabemos qué copia de la grilla es
        sessionStorage.setItem(CATALOG_KEY, JSON.stringify(state));
      }
    }
  });

  // After Astro swaps the DOM, but BEFORE the transition animates
  document.addEventListener('astro:after-swap', () => {
    const state = readCatalogState();
    // mientras estemos fuera del catálogo el estado se conserva: solo se gasta
    // al volver a él (antes se consumía en la ficha y la vuelta quedaba sin datos)
    if (!state || location.pathname !== state.from) return;
    sessionStorage.removeItem(CATALOG_KEY);
    restoreCatalog(state);
  });
}

/* =========================================================
   5. Ficha de librería: Escape vuelve al catálogo.
   ========================================================= */
function setupProjectView() {
  const close = document.querySelector<HTMLAnchorElement>('.project__close');
  if (!close) return;

  // si el catálogo es justo la entrada anterior, volvemos por el historial:
  // el navegador restaura su posición y no se acumulan entradas. Si llegamos
  // saltando entre fichas (o por enlace directo), navegamos al href y el
  // estado guardado se encarga de recolocar la grilla.
  const cerrar = (e?: Event) => {
    if (catalogIsPreviousEntry(readCatalogState())) {
      e?.preventDefault();
      window.history.back();
    } else if (!e) {
      close.click();
    }
  };

  close.addEventListener('click', cerrar, { signal: abort!.signal });

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape') return;
      cerrar();
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

  // el pie cambia de alto cuando entra la tipografía gigante; si el margen se
  // queda con la medida vieja, main tapa las primeras líneas del footer
  document.fonts.ready.then(sync);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(sync);
    ro.observe(reveal);
    abort!.signal.addEventListener('abort', () => ro.disconnect());
  }
}

/* la misma paleta del glitch del hero. El negro del final es --ink escrito a
   mano: GSAP no sabe interpolar hacia una variable de CSS */
const COLORES_TITULO = ['#ff4d8d', '#7b61ff', '#0ae448', '#0a0a0a'];

/** una palabra larga ("TRANSITIONS") se pasa del ancho en pantallas angostas:
 *  se achica lo justo para que entre. Hace falta JS porque el cuerpo depende
 *  del largo del nombre, que el CSS no puede medir */
function ajustarTituloFiltro(titulo: HTMLElement) {
  const letras = Array.from(titulo.querySelectorAll<HTMLElement>('span'));
  if (!letras.length) return;

  // se mide siempre contra el cuerpo de la hoja, no contra el ya achicado
  titulo.style.removeProperty('font-size');
  const cs = getComputedStyle(titulo);
  const disponible =
    titulo.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const ancho = letras.reduce((suma, el) => suma + el.getBoundingClientRect().width, 0);

  if (ancho > disponible && disponible > 0) {
    const base = parseFloat(cs.fontSize);
    titulo.style.fontSize = `${((base * disponible) / ancho).toFixed(1)}px`;
  }
}

/** escribe la categoría activa en el título gigante y le deja corriendo lo
 *  único que se mueve ahí: el color, que recorre las letras en cascada */
// function pintarTituloFiltro(titulo: HTMLElement, texto: string) {
//   filterTitleTl?.kill();
//   filterTitleTl = null;

//   const palabra = texto.toUpperCase();
//   titulo.textContent = '';
//   // las letras sueltas se leerían de a una: el nombre va en la etiqueta
//   titulo.setAttribute('aria-label', palabra);

//   const letras = palabra.split('').map((letra) => {
//     const span = document.createElement('span');
//     span.textContent = letra;
//     span.setAttribute('aria-hidden', 'true');
//     titulo.appendChild(span);
//     return span;
//   });

//   ajustarTituloFiltro(titulo);

//   if (reduced() || !letras.length) return;

//   filterTitleTl = gsap.timeline({ repeat: -1 });
//   for (const color of COLORES_TITULO) {
//     filterTitleTl.to(letras, {
//       color,
//       duration: 0.45,
//       stagger: 0.06,
//       ease: 'sine.inOut',
//     });
//   }
// }
function pintarTituloFiltro(titulo: HTMLElement, texto: string) {
  filterTitleTl?.kill();
  filterTitleTl = null;

  const palabra = texto.toUpperCase();
  titulo.textContent = '';
  // las letras sueltas se leerían de a una: el nombre va en la etiqueta
  titulo.setAttribute('aria-label', palabra);

  const letras = palabra.split('').map((letra) => {
    const span = document.createElement('span');
    span.textContent = letra;
    span.setAttribute('aria-hidden', 'true');
    titulo.appendChild(span);
    return span;
  });

  ajustarTituloFiltro(titulo);

  if (reduced() || !letras.length) return;

  // 👇 NUEVO: Índice para recorrer tu arreglo de colores
  let colorIndex = 0;

  // Creamos una función que se llamará a sí misma al terminar
  function animarLetraAleatoria() {
    // 1. Elegimos una letra al azar del array en este instante exacto
    const letra = gsap.utils.random(letras);
    
    // 2. Elegimos el color actual y avanzamos al siguiente para el próximo turno
    const color = COLORES_TITULO[colorIndex % COLORES_TITULO.length];
    colorIndex++;

    // 3. Asignamos la animación a filterTitleTl para poder matarla (kill) después si es necesario
    filterTitleTl = gsap.to(letra, {
      color: color,
      duration: 0.45,
      yoyo: true,             // Importante: hace que la letra vuelva a su color original
      repeat: 1,              // Va hacia el nuevo color y vuelve al normal
      ease: 'sine.inOut',
      onComplete: animarLetraAleatoria // 4. Cuando termina esta letra, ejecuta esta misma función de nuevo
    });
  }

  // Arrancamos el ciclo infinito por primera vez
  animarLetraAleatoria();
}/* =========================================================
   7. Filter Island: Dynamic island style filter menu
   ========================================================= */
function setupFilterIsland() {
  const island = document.querySelector<HTMLElement>('.island');
  const btn = document.getElementById('menuToggle');
  const backdrop = document.querySelector<HTMLElement>('.menu-backdrop');
  const overlay = document.querySelector<HTMLElement>('.menu-overlay');
  if (!island || !btn || !backdrop || !overlay) return;

  let isOpen = false;
  let tl: gsap.core.Timeline;

  function initTimeline() {
    tl && tl.revert();
    const expandedWidth = Math.min(window.innerWidth * 0.9, 400);
    
    tl = gsap.timeline({ paused: true })
      .set(overlay, { pointerEvents: 'auto' })
      .to(island, { width: expandedWidth, duration: 0.8, ease: 'back.out(2)', easeReverse: 'power2.out' }, 0)
      .to('.island-logo', { opacity: 1, duration: 0.5, ease: 'back.out', easeReverse: 'power4.out' }, 0.12)
      .to('.bar-mid', { opacity: 0, duration: 0.15, ease: 'power2.in', easeReverse: true }, 0)
      .to('.bar-top', { attr: { x1: 3, y1: 3, x2: 13, y2: 13 }, duration: 0.28, ease: 'power3.inOut' }, 0)
      .to('.bar-bot', { attr: { x1: 13, y1: 3, x2: 3, y2: 13 }, duration: 0.28, ease: 'power3.inOut' }, 0)
      .to(backdrop, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
      .from('.menu-panel', { autoAlpha: 0, yPercent: -10, scale: 0.6, duration: 0.8, transformOrigin: 'top center', ease: 'back.out(2)', easeReverse: 'power3.out' }, 0.1)
      .from('.menu-link', { opacity: 0, y: 6, duration: 0.32, ease: 'power2.out', easeReverse: true, stagger: 0.05 }, 0.22);
  }

  initTimeline();

  window.addEventListener('resize', () => {
    if (isOpen) {
      isOpen = false;
      btn.setAttribute('aria-expanded', 'false');
    }
    initTimeline();
  }, { signal: abort!.signal });

  function toggle() {
    isOpen = !isOpen;
    btn!.setAttribute('aria-expanded', String(isOpen));
    btn!.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open filter menu');
    document.querySelectorAll('.menu-link').forEach(l => l.setAttribute('tabindex', isOpen ? '0' : '-1'));
    
    if (isOpen) {
      tl.timeScale(1).play();
    } else {
      tl.eventCallback('onReverseComplete', () => gsap.set(overlay, { pointerEvents: 'none' }));
      tl.timeScale(1.5).reverse(); // Exit a bit faster
    }
  }

  btn.addEventListener('click', toggle, { signal: abort!.signal });
  backdrop.addEventListener('click', () => { if (isOpen) toggle(); }, { signal: abort!.signal });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) { toggle(); btn.focus(); }
  }, { signal: abort!.signal });

  // Trap focus
  overlay.addEventListener('keydown', (e) => {
    if (!isOpen || e.key !== 'Tab') return;
    const focusable = Array.from(document.querySelectorAll<HTMLElement>('.menu-link[tabindex="0"]'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, { signal: abort!.signal });

  // Filtering Logic: elegir una categoría cambia el carrusel horizontal por
  // una grilla estática con esas tarjetas nada más — sin zoom, sin scroll-
  // jacking. .works pasa a alto automático y .works__stage se esconde
  // entero (ver .works.is-filtered en global.css); measure()/apply() en
  // setupWorks respetan ese estado y no lo pisan.
  const links = document.querySelectorAll<HTMLElement>('.menu-link');
  const works = document.querySelector<HTMLElement>('.works');
  const filteredGrid = document.querySelector<HTMLElement>('.filtered-grid');
  const filterTitle = document.querySelector<HTMLElement>('.filter-title');
  const gridTiles = filteredGrid
    ? Array.from(filteredGrid.querySelectorAll<HTMLElement>('.tile'))
    : [];

  // el cuerpo del título se calcula contra el ancho de pantalla: al cambiarlo
  // hay que volver a medir, o queda con el tamaño de la ventana anterior
  if (filterTitle) {
    window.addEventListener('resize', () => ajustarTituloFiltro(filterTitle), {
      signal: abort!.signal,
    });
  }

  /** el alto de .works cambia de golpe al entrar o salir del filtro: sin
   *  recolocar el scroll, lo que hay debajo (Techniques, contacto, pie)
   *  pega un salto y se pierde el lugar en la página */
  function irACatalogo() {
    const el = document.getElementById('catalogo');
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -20, duration: 0.6 });
    else el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = link.dataset.filter;

      links.forEach(l => l.classList.remove('is-active'));
      link.classList.add('is-active');

      const logoText = document.querySelector('.island-logo');
      if (logoText) {
        const idioma = idiomaActual();
        logoText.textContent =
          filter === 'all'
            ? t('filtro.etiqueta', idioma)
            : CATEGORIAS[filter as Categoria][idioma].toUpperCase();
      }

      if (works) {
        const yaFiltrado = works.classList.contains('is-filtered');

        if (filter === 'all') {
          if (yaFiltrado) {
            works.classList.remove('is-filtered');
            works.style.height = '';
            if (rowsTick) gsap.ticker.add(rowsTick);
            // vuelve el riel del hero: el título de categoría sobra, y su
            // ciclo de color seguiría corriendo sobre un elemento oculto
            filterTitleTl?.kill();
            filterTitleTl = null;
            if (filterTitle) {
              filterTitle.textContent = '';
              filterTitle.removeAttribute('aria-label');
            }
            // measure() recalcula el alto real del carrusel y refresca el
            // ScrollTrigger del zoom, desactualizado mientras estuvo filtrado
            window.dispatchEvent(new Event('resize'));
            irACatalogo();
          }
        } else {
          if (!yaFiltrado) {
            works.classList.add('is-filtered');
            works.style.height = 'auto';
            if (rowsTick) gsap.ticker.remove(rowsTick);
            window.dispatchEvent(new Event('resize'));
            irACatalogo();
          }

          // después de encender is-filtered: hasta acá el título sigue en
          // display:none y mediría cero ancho, así que no sabría cuánto
          // achicarse. Fuera del `if`: saltar de una categoría a otra no
          // vuelve a entrar al filtro, pero sí tiene que cambiar el título
          if (filterTitle) {
            pintarTituloFiltro(filterTitle, CATEGORIAS[filter as Categoria][idiomaActual()]);
          }

          const visibles: HTMLElement[] = [];
          gridTiles.forEach(tile => {
            // por data-categoria y no por el texto: la etiqueta se traduce
            // ("effects" / "efectos") y compararla contra el slug fallaría
            const cat = tile.querySelector<HTMLElement>('.tile__cat')?.dataset.categoria;
            if (cat === filter) {
              tile.style.display = '';
              visibles.push(tile);
            } else {
              tile.style.display = 'none';
            }
          });

          if (reduced()) {
            gsap.set(visibles, { clearProps: 'opacity,transform' });
          } else {
            gsap.fromTo(
              visibles,
              { opacity: 0, y: 16 },
              { opacity: 1, y: 0, duration: 0.5, stagger: 0.035, ease: 'power2.out', overwrite: true },
            );
          }
        }
      }

      // Close menu
      toggle();
    }, { signal: abort!.signal });
  });
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
  setupFilterIsland();
  ScrollTrigger.refresh();
}
