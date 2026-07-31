# Cómo sumar una librería

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
[abrí un issue](https://github.com/EJCP3/VIVIFYUX-/issues/new) con:

- Nombre de la librería y enlace a su sitio o repositorio.
- Una línea sobre qué hace.
- En qué categoría te parece que va.

Con eso alcanza. Nosotros preparamos la ficha y la captura.

---

## Camino largo: mandar un pull request

### 1. Preparar el proyecto

```bash
git clone https://github.com/EJCP3/VIVIFYUX-.git
cd VIVIFYUX-
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

### 3. Crear la ficha

Un archivo por librería en `src/content/librerias/<slug>.md`. El nombre del
archivo es la URL: `slot-text.md` → `/libreria/slot-text/`.

```md
---
nombre: "Rive"
categoria: "efectos"
claim: "Animaciones vectoriales interactivas en tiempo real."
descripcion: "Editor y runtime para animaciones vectoriales que responden a estados. Se exporta un archivo y el runtime lo reproduce en canvas, con máquinas de estado en vez de líneas de tiempo fijas."
url: "https://rive.app"
npm: "@rive-app/canvas"
imagen: "../../assets/rive.webp"
stack: ["Canvas", "Máquinas de estado", "Runtime propio"]
orden: 11
---
```

Los campos están validados en
[`src/content/config.ts`](src/content/config.ts): si falta uno o el tipo no
corresponde, `npm run dev` te lo dice con el nombre del campo.

| Campo | Tipo | ¿Obligatorio? | Notas |
| --- | --- | --- | --- |
| `nombre` | texto | Sí | Como lo escribe su autor: `GSAP`, `Lenis`, `slot-text`. |
| `categoria` | `scroll`, `texto`, `transiciones`, `efectos`, `sonido` o `motor` | Sí | Una sola. Son las seis del filtro; no se inventan nuevas en un PR de alta. |
| `claim` | texto | Sí | Una línea, la que se lee bajo el título de la ficha. Sin punto final si es un lema. |
| `descripcion` | texto | Sí | Dos a cuatro frases: qué hace y por qué importa. Es el cuerpo de la ficha. |
| `url` | URL completa | Sí | Sitio oficial; si no tiene, el repositorio. Con `https://`. |
| `npm` | texto | No | Nombre exacto del paquete, tal cual se instala. Omitilo si no se publica en npm. |
| `imagen` | ruta | Sí | Siempre `../../assets/<slug>.png`. |
| `stack` | lista de textos | Sí, mínimo uno | Con qué está construida. Salen como chips en la ficha. |
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
