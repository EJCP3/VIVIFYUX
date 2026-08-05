# Cómo sumar una librería

[English Version](CONTRIBUTING.md) | [Versión en Español](CONTRIBUTING.es.md)

Gracias por querer aportar. El catálogo se arma con lo que propone quien lo
usa, así que toda sugerencia es bienvenida.

Hay dos caminos: **abrir un issue** (nosotros la damos de alta) o **mandar un
pull request** con la ficha ya hecha. Las dos valen lo mismo.

---

## Qué entra en el catálogo

VivifyUX lista librerías de **interacción** para la web. Antes de proponer una,
comprobá que cumpla esto:

- Resuelve algo de interacción o movimiento en el navegador: scroll, texto,
  transiciones, efectos visuales, sonido o animación general.
- Es pública y se puede usar hoy: repositorio abierto o paquete publicado.
- Tiene documentación o una demo donde se vea funcionando.
- No está ya en el catálogo. Revisá
  [`src/content/librerias/`](src/content/librerias/) antes de escribir.

No hace falta que sea popular ni que tenga muchas estrellas. Sí que se entienda
qué hace y que alguien pueda instalarla. hasta puede ser tuya la libreria.



---

## Camino corto: abrir un issue

Si no querés tocar código,
[abrí un issue](https://github.com/EJCP3/VivifyUX/issues/new) con:

- Nombre de la librería y enlace a su sitio o repositorio.
- Una línea sobre qué hace.
- En qué categoría te parece que va.

Con eso alcanza. Nosotros preparamos la ficha y la captura.

---

## Camino largo: mandar un pull request

### 1. Preparar el proyecto

```bash
git clone https://github.com/EJCP3/VivifyUX.git
cd VivifyUX
npm install
npm run dev       # http://localhost:4321
```

Trabajá en una rama aparte:

```bash
git checkout -b agregar-nombre-de-la-libreria
```

### 2. Agregar la captura

Guardá una imagen en `src/assets/<slug>.webp`, donde `<slug>` es el nombre en
minúsculas y sin espacios (`slot-text`, `gsap`, `border-beam`). Tambien puede enviar una imagen guardadad en algun storage externo y proporcionar la URL.

- **Formato**: WebP.
- **Tamaño**: alrededor de **1860 × 975** px, que es el de las capturas que ya
  están. Más grande no aporta; bastante más chica se ve borrosa en la ficha.
- **Qué capturar**: la portada de la librería o su demo, tal como se ve. Sin
  barra del navegador, sin cursor, sin marcos ni sombras añadidas.
- **Composición**: tanto la tarjeta de la grilla como la ficha recortan la
  imagen con `object-fit: cover`, y la ficha es casi cuadrada, así que **recorta
  por los costados**. Dejá lo importante hacia el centro.

#### Opcional: un mini video

La mayoría de las fichas solo necesita la captura. Pero si lo que hace a la
librería es algo en movimiento -un morph, una transición con física, un efecto
que una imagen fija no vende- podés sumar un clip corto y mudo encima. Se
muestra al pasar el mouse, tanto en la tarjeta de la grilla como en la ficha;
la captura se queda como la imagen real, no como un placeholder, así que si no
lo agregás no rompe nada.

- Guardalo en `public/videos/<slug>.webm`, **no** en `src/assets/` -el video no
  pasa por el pipeline de imágenes que usa `imagen`.
- Formato **WebM (VP9)**, mudo, sin pista de audio. Con unos segundos en loop
  alcanza; que pese poco, menos de ~150 KB es normal para un clip corto de UI.
- Referencialo desde el frontmatter con `video: "/videos/<slug>.webm"` (ver la
  tabla de campos más abajo).
- Es la excepción, no la regla: sumalo solo cuando el movimiento sea la razón
  real por la que la librería vale la pena, no en cada alta.

### 3. Crear la ficha

Un archivo por librería en `src/content/librerias/<slug>.md`. El nombre del
archivo es la URL: `slot-text.md` → `/libreria/slot-text/`.

El sitio es bilingüe: los textos que se leen en pantalla van en inglés y en
español dentro del mismo archivo, y el botón EN/ES del encabezado cambia entre
uno y otro sin recargar.

```md
---
nombre: "Rive"
categoria: "effects"
claim:
  en: "Interactive vector animation in real time."
  es: "Animaciones vectoriales interactivas en tiempo real."
descripcion:
  en: "An editor and runtime for vector animation that reacts to state. You export one file and the runtime plays it on canvas, driven by state machines instead of fixed timelines."
  es: "Editor y runtime para animaciones vectoriales que responden a estados. Se exporta un archivo y el runtime lo reproduce en canvas, con máquinas de estado en vez de líneas de tiempo fijas."
tips:
  - en: "Export a single .riv file and load it once: each extra file is another request."
    es: "Exportá un único archivo .riv y cargalo una sola vez: cada archivo extra es otra petición."
  - en: "State machines replace timeline scrubbing — drive them with inputs, not with seek()."
    es: "Las máquinas de estado reemplazan el barrido de la línea de tiempo: movelas con inputs, no con seek()."
url: "https://rive.app"
imagen: "../../assets/rive.webp"
orden: 11
---
```

Los campos están validados en
[`src/content/config.ts`](src/content/config.ts): si falta uno o el tipo no
corresponde, `npm run dev` te lo dice con el nombre del campo.

| Campo | Tipo | ¿Obligatorio? | Notas |
| --- | --- | --- | --- |
| `nombre` | texto | Sí | Como lo escribe su autor: `GSAP`, `Lenis`, `slot-text`. |
| `categoria` | `scroll`, `text`, `transitions`, `effects`, `sound`, `engine`, `components` o `generators` | Sí | Una sola. Son las ocho del filtro; no se inventan nuevas en un PR de alta. |
| `claim` | `en` + `es` | Sí | Una línea en cada idioma, la que se lee bajo el título de la ficha. Sin punto final si es un lema. |
| `descripcion` | `en` + `es` | Sí | Dos a cuatro frases por idioma: qué hace y por qué importa. Es el cuerpo de la ficha. |
| `tips` | lista de `en` + `es` | No | Dos apuntes prácticos. La ficha no muestra el bloque hasta que los dos idiomas tengan texto, así que se puede dejar vacío y completarlo después. |
| `url` | URL completa | Sí | Sitio oficial; si no tiene, el repositorio. Con `https://`. |
| `npm` | texto | No | Nombre exacto del paquete, tal cual se instala. Omitilo si no se publica en npm. |
| `imagen` | ruta | Sí | Siempre `../../assets/<slug>.webp`. |
| `video` | ruta | No | `/videos/<slug>.webm`. Solo para la ficha excepcional donde un clip corto explica más que la captura; la mayoría no lo tiene. |
| `orden` | número | Sí | Posición en la grilla y en el anterior/siguiente. Usá el siguiente número libre. |

### 4. Probar antes de mandar

Con `npm run dev` abierto, revisá que:

- La tarjeta aparece en la grilla con su nombre y categoría.
- Al hacer click, la imagen viaja a la ficha sin saltos.
- La ficha se lee bien: claim, descripción, chips y el botón **Ver sitio** abre
  la página correcta.
- El anterior/siguiente encadena con las librerías de al lado.

Y que compile limpio:

```bash
npm run build
```

No hace falta que subas `dist/` en el PR.

### 5. Abrir el pull request

Un PR por librería. En la descripción, contá en una línea por qué merece estar
y pegá el enlace a su sitio.

---

## Qué miramos al revisar

- Que la librería cumpla lo de arriba y no esté repetida.
- Que la categoría sea la que uno esperaría al buscarla.
- Que la descripción explique la librería y no la venda.
- Que la captura se vea nítida y no quede recortada por la mitad.

Si algo no encaja lo comentamos en el PR; casi siempre se arregla cambiando una
categoría o volviendo a sacar la captura.

## Otras contribuciones

Los arreglos de bugs, accesibilidad, rendimiento o textos también son
bienvenidos, con las mismas dos vías: issue o PR. Si el cambio es grande,
mejor abrir antes un issue para acordar el enfoque.
