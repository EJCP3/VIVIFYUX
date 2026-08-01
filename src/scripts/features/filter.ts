import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { globalState } from '../state';
import { ajustarTituloFiltro } from '../utils/text';
import { CATEGORIAS, t, type Categoria } from '../../i18n';
import { idiomaActual } from '../idioma';
import { reduced } from '../utils/dom';
import { ejecutarGlimmTransition } from '../utils/glimm';

const COLORES_TITULO = ['#ff4d8d', '#7b61ff', '#0ae448', '#0a0a0a'];

export function pintarTituloFiltro(titulo: HTMLElement, texto: string) {
  globalState.filterTitleTl?.kill();
  globalState.filterTitleTl = null;

  const palabra = texto.toUpperCase();
  titulo.textContent = '';
  titulo.setAttribute('aria-label', palabra);

  const letras = palabra.split('').map((letra) => {
    const span = document.createElement('span');
    span.textContent = letra;
    span.setAttribute('aria-hidden', 'true');
    span.style.display = 'inline-block';
    span.style.cursor = 'pointer';

    span.addEventListener('pointerenter', () => {
      const color = COLORES_TITULO[Math.floor(Math.random() * COLORES_TITULO.length)];
      gsap.to(span, {
        color: color,
        yPercent: -14,
        scale: 1.08,
        duration: 0.2,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
        overwrite: 'auto',
      });
    });

    titulo.appendChild(span);
    return span;
  });

  ajustarTituloFiltro(titulo);

  if (reduced() || !letras.length) return;

  let colorIndex = 0;

  function animarLetraAleatoria() {
    const letra = gsap.utils.random(letras);
    const color = COLORES_TITULO[colorIndex % COLORES_TITULO.length];
    colorIndex++;

    gsap.to(letra, {
      color: color,
      duration: 0.45,
      yoyo: true,
      repeat: 1,
      ease: 'sine.inOut',
      overwrite: 'auto',
    });

    globalState.filterTitleTl = gsap.delayedCall(0.9, animarLetraAleatoria) as any;
  }

  animarLetraAleatoria();
}

/** el rótulo de un filtro en el idioma activo. "all" no es una categoría del
 *  catálogo, tiene su propia entrada en el diccionario */
/** los ScrollTrigger de la grilla apuntan a las tarjetas de un filtro concreto:
 *  al cambiar de filtro hay que tirarlos, o quedan midiendo tarjetas ocultas */
function matarBatchTiles() {
  globalState.tilesBatch.forEach((st) => st.kill());
  globalState.tilesBatch = [];
}

function etiquetaDe(filter: string): string {
  const idioma = idiomaActual();
  return filter === 'all'
    ? t('filtro.todas', idioma)
    : CATEGORIAS[filter as Categoria][idioma];
}

export function setupFilterIsland() {
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
      .fromTo('.menu-panel', { autoAlpha: 0, yPercent: -10, scale: 0.6 }, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.8, transformOrigin: 'top center', ease: 'back.out(2)', easeReverse: 'power3.out' }, 0.1)
      .fromTo('.menu-link', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out', easeReverse: true, stagger: 0.05 }, 0.22);
  }

  initTimeline();

  window.addEventListener('resize', () => {
    if (isOpen) {
      isOpen = false;
      btn.setAttribute('aria-expanded', 'false');
    }
    initTimeline();
  }, { signal: globalState.abort.signal });

  function toggle() {
    isOpen = !isOpen;
    btn!.setAttribute('aria-expanded', String(isOpen));
    btn!.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open filter menu');
    document.querySelectorAll('.menu-link').forEach((l) => l.setAttribute('tabindex', isOpen ? '0' : '-1'));

    if (isOpen) {
      tl.timeScale(1).play();
    } else {
      tl.eventCallback('onReverseComplete', () => gsap.set(overlay, { pointerEvents: 'none' }));
      tl.timeScale(1.5).reverse();
    }
  }

  btn.addEventListener('click', toggle, { signal: globalState.abort.signal });
  backdrop.addEventListener('click', () => {
    if (isOpen) toggle();
  }, { signal: globalState.abort.signal });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      toggle();
      btn.focus();
    }
  }, { signal: globalState.abort.signal });

  overlay.addEventListener('keydown', (e) => {
    if (!isOpen || e.key !== 'Tab') return;
    const focusable = Array.from(document.querySelectorAll<HTMLElement>('.menu-link[tabindex="0"]'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, { signal: globalState.abort.signal });

  const links = document.querySelectorAll<HTMLElement>('.menu-link');
  const works = document.querySelector<HTMLElement>('.works');
  const filteredGrid = document.querySelector<HTMLElement>('.filtered-grid');
  const filterTitle = document.querySelector<HTMLElement>('.filter-title');
  const gridTiles = filteredGrid
    ? Array.from(filteredGrid.querySelectorAll<HTMLElement>('.tile'))
    : [];

  if (filterTitle) {
    window.addEventListener('resize', () => ajustarTituloFiltro(filterTitle), {
      signal: globalState.abort.signal,
    });
  }

  /** deja la vista en el arranque del catálogo.
   *
   *  Sin animación a propósito: esto siempre pasa tapado por el barrido del
   *  glimm, así que un recorrido suave no se vería, y con la grilla cambiando
   *  de alto de golpe el suave se atasca.
   *
   *  Se mueve a mano y después se le avisa a Lenis, en vez de dejarle el
   *  trabajo a él. Al esconder las tarjetas la página encoge y el navegador
   *  recorta el scroll por su cuenta, pero Lenis no se entera hasta el
   *  fotograma siguiente: mientras tanto su cuenta está vieja, y con ella
   *  resuelve mal el destino de un elemento (`rect.top + animatedScroll`) o
   *  directamente se salta la llamada por creer que ya estaba ahí */
  function irACatalogo() {
    const el = document.getElementById('catalogo');
    if (!el) return;
    const y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 20);
    window.scrollTo(0, y);
    globalState.lenis?.scrollTo(y, { immediate: true, force: true });
  }

  /** las tarjetas que le tocan a un filtro; "all" se las lleva todas */
  function tilesDe(filter: string) {
    if (filter === 'all') return gridTiles;
    return gridTiles.filter(
      (tile) => tile.querySelector<HTMLElement>('.tile__cat')?.dataset.categoria === filter,
    );
  }

  /** enciende la grilla con un filtro puesto.
   *
   *  `animar` va en false cuando esto no lo pidió el usuario sino un remontaje
   *  (cambiar de idioma rehace todo): ahí no se salta el scroll ni se repite
   *  la entrada de las tarjetas, solo se repintan los rótulos traducidos */
  function mostrarGrilla(filter: string, animar: boolean) {
    if (!works) return;

    const yaFiltrado = works.classList.contains('is-filtered');
    works.classList.add('is-filtered');
    works.style.height = 'auto';
    // siempre, no solo al entrar: tras un remontaje setupWorks volvió a añadir
    // el ticker del carrusel, que no tiene que correr detrás de la grilla
    if (globalState.rowsTick) gsap.ticker.remove(globalState.rowsTick);

    const etiqueta = etiquetaDe(filter);
    const logoText = document.querySelector('.island-logo');
    if (logoText) logoText.textContent = etiqueta.toUpperCase();
    if (filterTitle) pintarTituloFiltro(filterTitle, etiqueta);

    const visibles = tilesDe(filter);
    const aMostrar = new Set(visibles);
    gridTiles.forEach((tile) => {
      tile.style.display = aMostrar.has(tile) ? '' : 'none';
    });

    if (!yaFiltrado) window.dispatchEvent(new Event('resize'));

    // siempre, no solo al entrar al filtro: saltar de una categoría con muchas
    // librerías a una con pocas dejaba la vista a la altura de antes, que en la
    // grilla nueva ya es el pie de la página
    if (animar) irACatalogo();

    // las tarjetas que entran son otras: los disparadores viejos no valen
    matarBatchTiles();

    if (reduced()) {
      gsap.set(visibles, { clearProps: 'opacity,transform' });
      return;
    }

    if (!animar) {
      // esto es un remontaje (cambio de idioma): las tarjetas ya estaban a la
      // vista, volver a esconderlas para reanimarlas se vería como un parpadeo
      gsap.set(visibles, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.set(visibles, { autoAlpha: 0, y: 24 });

    /* batch() agrupa las tarjetas que entran en pantalla casi a la vez y las
       anima de una tacada. Un ScrollTrigger por tarjeta haría lo mismo, pero
       las de más abajo gastarían su entrada fuera de pantalla: acá cada fila
       espera a que se llegue hasta ella. */
    globalState.tilesBatch = ScrollTrigger.batch(visibles, {
      interval: 0.1, // ventana para juntar las que entran casi juntas
      batchMax: 6, // dos filas de la grilla: más y la cascada se hace larga
      start: 'top 92%', // arranca con la tarjeta apenas asomada por abajo
      onEnter: (batch) =>
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.09,
          ease: 'sine.out',
          overwrite: true,
        }),
      // sin onLeaveBack: una vez que entró se queda, volver a subir no la rebobina
    });

    // la grilla acaba de pasar de display:none a grid: sin volver a medir,
    // ScrollTrigger ubica las tarjetas donde estaban antes y nunca dispara
    ScrollTrigger.refresh();
  }

  /** apaga el filtro y devuelve la página a como se ve al entrar: el carrusel
   *  con su zoom y el riel del hero, sin ninguna categoría marcada */
  function quitarFiltro() {
    links.forEach((l) => l.classList.remove('is-active'));
    if (!works) return;

    // la grilla se esconde entera: sus disparadores ya no tienen nada que medir
    matarBatchTiles();

    works.classList.remove('is-filtered');
    works.style.height = '';
    if (globalState.rowsTick) gsap.ticker.add(globalState.rowsTick);

    globalState.filterTitleTl?.kill();
    globalState.filterTitleTl = null;
    if (filterTitle) {
      filterTitle.textContent = '';
      filterTitle.removeAttribute('aria-label');
    }

    const logoText = document.querySelector('.island-logo');
    if (logoText) logoText.textContent = t('filtro.etiqueta', idiomaActual());

    window.dispatchEvent(new Event('resize'));
    irACatalogo();
  }

  // al montar no hay filtro puesto: solo se restaura si una categoría quedó
  // marcada de antes (el DOM sobrevive al remontaje del cambio de idioma)
  const activo = document.querySelector<HTMLElement>('.menu-link.is-active');
  if (activo?.dataset.filter) mostrarGrilla(activo.dataset.filter, false);

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = link.dataset.filter;
      if (!filter) return;

      // volver a tocar la opción ya puesta la apaga: es la forma de salir del
      // filtro sin tener que buscar una opción "ninguno" que no existe
      const apagar = link.classList.contains('is-active');

      ejecutarGlimmTransition(() => {
        if (apagar) {
          quitarFiltro();
          return;
        }
        links.forEach((l) => l.classList.remove('is-active'));
        link.classList.add('is-active');
        mostrarGrilla(filter, true);
      });

      toggle();
    }, { signal: globalState.abort.signal });
  });
}
