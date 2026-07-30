# VivifyUX

Directorio curado de librerías de interacción para la web, con el sistema
editorial monocromo descrito en [`desing.md`](desing.md) (referencia:
[ingamana.com](https://www.ingamana.com/)). El sitio corre con las mismas
librerías que cataloga: Lenis mueve el scroll y GSAP mueve la grilla.

## Cómo correrlo

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # genera /dist
```

## Cómo funciona la portada

Toda la portada es un solo "capítulo" de scroll (`.works`, 4 pantallas de alto)
con un `position: sticky` adentro:

- `.works__scaler` arranca en `scale(1)`: título gigante sangrando por los dos
  costados y la primera fila de tarjetas al ras del borde inferior. Si la
  pantalla es baja, el título se recorta solo lo justo para que la fila entre
  entera.
- A medida que bajás, `ScrollTrigger` interpola escala y desplazamiento **hacia
  adentro**, hasta que cada captura ocupa el 58% del ancho de pantalla (92% en
  mobile) y se puede ver en detalle.

**La grilla se maqueta al tamaño final del zoom, no al inicial.** `--tile-w` es
`58vw` y el recorrido va de `--zoom0` (0.45) a `scale(1)`: el estado en el que
mirás la captura no tiene ningún transform que la agrande, así que se pinta a
resolución nativa. Al revés —maquetar chico y escalar hacia arriba— el
navegador rasteriza la capa al tamaño chico y la estira, y las imágenes salen
pixeladas. Consecuencias de ese modelo:

- Todo lo que adentro del scaler se mide en px se divide por `--zoom0`
  (`--tile-gap`, tipografías de las etiquetas, márgenes). Si no, se ve a menos
  de la mitad de tamaño en el estado inicial.
- El `sizes` de `Tile.astro` es espejo de `--tile-w`: si cambiás uno, cambiá el
  otro.
- El scaler no lleva `will-change: transform` a propósito: esa propiedad le
  pide al navegador que congele el rasterizado, que es justo lo que borronea
  las capturas al agrandarlas.
- Cada fila es una marquesina infinita: el catálogo repetido 3 veces, con
  velocidad y dirección propias, más un empujón extra proporcional a la
  velocidad del scroll (`lenis.on('scroll')`). El desplazamiento se divide por
  la escala, así que al acercarse las tarjetas se ven más grandes pero no se
  mueven más rápido.

El título gigante es una sola pieza animada con
[slot-text](https://textmotion.dev/lab): arranca revuelto, rueda hasta
`Vivifyux` y de ahí en más va rotando cada 2,8 s entre palabras sueltas y
frases cortas —vida, dale vida a tu web, fluidez, scroll sin saltos…— antes de
volver a la marca. El © solo acompaña a la marca (clase `is-brand`), y la
rotación se frena sola cuando el hero sale de pantalla.

El tamaño de cada frase lo calcula el JS: mide su ancho en `em` con canvas y le
baja el `font-size` hasta que entre en el 94% del ancho de pantalla, sin pasar
del techo que fija `--wm-fs` (33vw). Por eso una palabra entra a 33vw y una
frase de 18 caracteres a ~16vw. La caja del título tiene alto fijo
(`height: calc(var(--wm-fs) * .9)`), así que el texto cambia de tamaño sin
mover ni un píxel las tarjetas de abajo. Para agregar frases nuevas alcanza con
sumarlas al array `PALABRAS` de `index.astro`: el tamaño se resuelve solo.

Todo eso vive en [`src/scripts/site.ts`](src/scripts/site.ts). Con
`prefers-reduced-motion` no hay Lenis, ni marquesina, ni recorrido de zoom: la
grilla se muestra completa y quieta.

## Ficha de librería y view transition

Cada tarjeta linkea a `/libreria/<slug>/`, una vista partida (imagen a la
izquierda, datos a la derecha) con navegación anterior/siguiente y Escape para
volver.

La imagen viaja de la grilla a la ficha con la View Transitions API. Como cada
librería aparece repetida en varias filas, el `view-transition-name` no puede
estar en el HTML: se asigna en el click, sobre la imagen exacta que tocaste
(ver `setupTransitionNames` en `src/scripts/site.ts`), y en la ficha coincide
con el `transition:name` del `<Image>` de destino.

## Cómo agregar una librería nueva

Un archivo por librería en `src/content/librerias/nombre.md`, más la captura en
`src/assets/`. El esquema está validado en `src/content/config.ts`: si falta un
campo, Astro te avisa en build.

```md
---
nombre: "Rive"
categoria: "efectos"        # scroll | texto | transiciones | efectos | sonido | motor
claim: "Animaciones vectoriales interactivas en tiempo real."
descripcion: "Párrafo largo para la ficha."
url: "https://rive.app"
npm: "@rive-app/canvas"     # opcional
imagen: "../../assets/rive.png"
stack: ["Canvas", "Runtime propio"]
orden: 11
---
```

`orden` define la posición en la grilla y el anterior/siguiente de las fichas.
Las secciones **Técnicas**, **Tecnologías** y **Números** se calculan solas a
partir de las fichas: no hay que tocar `index.astro` para sumar una librería.

## Leyes de UX aplicadas

La sección **Leyes** no es decorativa: cada fila nombra una ley de
[lawsofux.com/es](https://lawsofux.com/es/) y describe algo que el sitio
realmente hace. Si cambiás una de esas cosas, corregí la fila — el valor de esa
sección es que sea verificable. Las que están atadas a código:

- **Umbral de Doherty** — ninguna duración de CSS pasa de 380 ms, incluida la
  view transition de la ficha. Auditá con
  `grep -oE '[0-9]+ms' src/styles/global.css` antes de subir una.
- **Efecto de tendencia a la meta** — la barra de 2px de arriba (`.progress`),
  que se pinta desde `setupProgress()` en `src/scripts/site.ts`.
- **Ley de Miller / Sobrecarga de opciones** — seis categorías y diez
  librerías; los dos números salen de las fichas, no están escritos a mano.
- **Ley de Fitts / Región común** — el `<a>` de la tarjeta envuelve imagen +
  nombre + categoría, así que el click es todo el bloque.
- **Paradoja del usuario activo** — las filas se mueven solas; la única frase
  que explica algo es la pista de scroll, y se apaga a media pantalla.

## Sistema de diseño

- **Monocromo**: `#FFFFFF` de fondo, `#0A0A0A` de tinta, hairlines `#E7E7E7`.
  El único color de la pantalla lo ponen las capturas de las librerías.
- **Contraste tipográfico**: Bebas Neue gigante (wordmark y títulos de sección)
  contra Nunito diminuta en mayúsculas con tracking abierto (nav, metadatos,
  listas). Ese contraste es la firma del diseño y se mantiene en mobile.
- **Sin adornos**: nada de sombras, radios ni gradientes. Los estados hover
  invierten a negro/blanco o desplazan el texto unos píxeles.
