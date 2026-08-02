import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';
import { globalState } from '../state';
import { horizontalLoop } from '../utils/text';
import { idiomaActual } from '../idioma';
import { reduced } from '../utils/dom';

const SIGNOS = [
  `<svg viewBox="0 0 100 100" fill="#ff8a6b" aria-hidden="true"><rect x="42" y="0" width="16" height="100" rx="8"/><rect x="0" y="42" width="100" height="16" rx="8"/><rect x="42" y="0" width="16" height="100" rx="8" transform="rotate(45 50 50)"/><rect x="42" y="0" width="16" height="100" rx="8" transform="rotate(-45 50 50)"/></svg>`,
  `<svg viewBox="0 0 100 100" fill="none" stroke="#0ae448" stroke-width="8" stroke-linejoin="round" aria-hidden="true"><path d="M60 5 24 55h24l-8 40 36-52H52z"/></svg>`,
  `<svg viewBox="0 0 100 100" fill="#ff9a7b" aria-hidden="true"><circle cx="50" cy="26" r="25"/><circle cx="74" cy="50" r="25"/><circle cx="50" cy="74" r="25"/><circle cx="26" cy="50" r="25"/></svg>`,
  `<svg viewBox="0 0 100 100" fill="#7b61ff" aria-hidden="true"><path d="M50 2c4 26 20 42 48 48-28 6-44 22-48 48-4-26-20-42-48-48 28-6 44-22 48-48z"/></svg>`,
  `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="34" fill="none" stroke="#7b61ff" stroke-width="18"/></svg>`,
];

function sincronizarPalabrasHero() {
  const idioma = idiomaActual();
  document.querySelectorAll<HTMLElement>('.scrolling-text .rail h4').forEach((h4) => {
    const palabra = idioma === 'es' ? h4.dataset.palabraEs : h4.dataset.palabraEn;
    if (!palabra || h4.dataset.text === palabra) return;

    h4.dataset.text = palabra;
    h4.querySelectorAll(':scope > span').forEach((s) => s.remove());
    for (const letra of palabra) {
      const span = document.createElement('span');
      span.textContent = letra;
      h4.appendChild(span);
    }
  });
}

export function setupSlotText() {
  // las palabras se escriben siempre: sin motion el riel no corre, pero el
  // título tiene que estar puesto y en el idioma que toca
  sincronizarPalabrasHero();
  if (reduced()) return;

  const scrollingText = gsap.utils.toArray<HTMLElement>('.scrolling-text .rail h4');
  if (scrollingText.length === 0) return;

  const signal = globalState.abort.signal;

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
        // 'auto' y no true: true se lleva por delante cualquier tween de las
        // letras, incluido el barrido de color del glitch, que se quedaba
        // congelado a mitad. 'auto' solo pisa las propiedades que chocan
        overwrite: 'auto',
        // si el salto se corta a medias (otro salto encima, un remontaje), las
        // letras vuelven a su sitio en vez de quedarse levantadas
        onInterrupt: () => {
          gsap.set(letras, { yPercent: 0, scaleY: 1 });
        },
      }
    );
  }

  scrollingText.forEach((palabra) => {
    palabra.addEventListener('pointerenter', () => ola(palabra, -10, 1.05, 0.026), { signal });
    palabra.addEventListener('pointerdown', () => ola(palabra, -22, 1.14, 0.02), { signal });
  });

  document.fonts.ready.then(() => {
    /** el bucle se arma midiendo el ancho de cada palabra. Si el riel está
     *  escondido —montar el sitio con un filtro puesto deja el escenario en
     *  display:none— todo mide cero y el bucle nace sin recorrido: quieto para
     *  siempre. Se anota si la medida valía, para poder rehacerlo cuando el
     *  riel recupere su ancho */
    let medidoConAncho = false;

    function montarRiel() {
      globalState.heroLoopTl?.kill();
      gsap.set(scrollingText, { clearProps: 'transform,x,xPercent,y,yPercent' });
      globalState.heroLoopTl = horizontalLoop(scrollingText, {
        repeat: -1,
        paddingRight: parseFloat(getComputedStyle(scrollingText[0]).marginRight) || 0,
        speed: 1.00,
      });
      medidoConAncho = scrollingText[0].offsetWidth > 0;
    }

    montarRiel();

    /* solo se rehace si la medida anterior no valía: en un resize normal el
       bucle sigue como está, que rehacerlo lo devolvería al principio de un
       salto. Acá llega el resize que dispara quitarFiltro, ya con el riel
       destapado */
    window.addEventListener(
      'resize',
      () => {
        if (!medidoConAncho) montarRiel();
      },
      { signal },
    );

    const RAFAGA = 2.2;
    /* la ráfaga se pide a globalState y no a una variable capturada: si el riel
       se rehizo, la línea de tiempo vieja ya está muerta */
    let rafaga: gsap.core.Timeline | null = null;
    Observer.create({
      target: window,
      type: 'wheel,touch',
      onChangeY(self) {
        const tl = globalState.heroLoopTl;
        if (!tl) return;
        const sentido = self.deltaY < 0 ? -1 : 1;
        rafaga?.kill();
        rafaga = gsap.timeline({ defaults: { ease: 'none' } })
          .to(tl, { timeScale: sentido * RAFAGA, duration: 0.3, overwrite: true })
          .to(tl, { timeScale: sentido, duration: 1 }, '+=0.3');
      },
    });

    const glitchClasses = [
      'is-glitching',
      'glitch-var-2',
      'glitch-var-3',
      'glitch-swap',
      'glitch-scatter',
      'glitch-sweep',
    ];

    const letrasDe = (palabra: HTMLElement) =>
      Array.from(palabra.querySelectorAll<HTMLElement>(':scope > span'));

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
        const paso = 0.085;
        const tlInner = gsap.timeline({ defaults: { ease: 'sine.inOut' } })
          .to(letras, { color: '#0ae448', duration: 0.28, stagger: paso })
          .to(letras, { color: '#0a0a0a', duration: 0.28, stagger: paso }, paso * letras.length + 0.25);
        duracion = (paso * letras.length * 2 + 0.8) * 1000;
        deshacer.push(() => {
          tlInner.kill();
          gsap.set(letras, { clearProps: 'color' });
        });
      }

      return { duracion, deshacer: () => deshacer.forEach((fn) => fn()) };
    }

    function glitchear(palabra: HTMLElement) {
      if (glitchClasses.some((c) => palabra.classList.contains(c))) return;
      if (palabra.querySelector('.letra-signo')) return;
      const variante = glitchClasses[Math.floor(Math.random() * glitchClasses.length)];
      const { duracion, deshacer } = aplicarGlitch(palabra, variante);
      window.setTimeout(deshacer, duracion);
    }

    const enPantalla = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.right > 0 && r.left < window.innerWidth;
    };

    scrollingText.filter(enPantalla).forEach((el, index) => {
      setTimeout(() => glitchear(el), index * 150);
    });

    const container = document.querySelector('.scrolling-text');
    globalState.wordTimer = window.setInterval(() => {
      if (Math.random() > 0.45) return;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        if (containerRect.bottom < 0 || containerRect.top > window.innerHeight) return;
      }
      const visibleEls = scrollingText.filter(enPantalla);
      if (visibleEls.length === 0) return;
      glitchear(visibleEls[Math.floor(Math.random() * visibleEls.length)]);
    }, 1600);
  });
}
