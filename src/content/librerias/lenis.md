---
nombre: "Lenis"
categoria: "scroll"
claim: 
  en: "Smooth scrolling that doesn't fight the browser."
  es: "Desplazamiento suave que no pelea con el navegador."
descripcion: 
  en: "A smooth scroll library with configurable inertia. Replaces the native scroll's jump-cut with continuous interpolation, and exposes progress so animations can lock to the page's exact position. It's the one driving this site."
  es: "Una biblioteca de desplazamiento suave con inercia configurable. Reemplaza el salto brusco del scroll nativo con una interpolación continua, y expone el progreso para que las animaciones puedan sincronizarse con la posición exacta de la página. Es la que impulsa este sitio."
tips:
  - en: "Lenis needs a single requestAnimationFrame loop. If GSAP is already on the page, drive it from gsap.ticker instead of starting a second one."
    es: "Lenis necesita un único bucle de requestAnimationFrame. Si ya tenés GSAP en la página, movelo desde gsap.ticker en vez de arrancar un segundo."
  - en: "It takes the scroll over, so CSS scroll-behavior and plain anchor jumps stop applying: use its own scrollTo() for in-page links."
    es: "Toma el control del scroll, así que scroll-behavior de CSS y los saltos de ancla dejan de aplicar: usá su propio scrollTo() para los enlaces internos."
url: "https://lenis.dev/"
imagen: "../../assets/lenis.webp"
orden: 6
---