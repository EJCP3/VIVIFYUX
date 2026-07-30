# Design Reference — Ingamana-style site

Referencia de diseño basada en [ingamana.com](https://www.ingamana.com/). Sitio de estudio de desarrollo web: minimalista, editorial, blanco y negro, con la tipografía como protagonista absoluto y el color aportado únicamente por las imágenes de los proyectos.

---

## 1. Esencia de marca

- **Tono:** seco, directo, seguro de sí mismo. Sin gradientes, sin adornos, sin iconografía decorativa.
- **Principio rector:** el logotipo/wordmark y los títulos son gigantes; todo lo demás (nav, meta info, fechas) es diminuto, en mayúsculas y con mucho aire alrededor.
- **Color:** el sitio en sí es monocromo (blanco + negro). El único color permitido en pantalla proviene de las fotos/covers de los proyectos en la grilla de trabajos.

---

## 2. Paleta

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#FFFFFF` | Fondo general |
| `--ink` | `#0A0A0A` | Texto principal, wordmark, títulos |
| `--ink-soft` | `#3A3A3A` | Texto secundario opcional (poco usado) |
| `--line` | `#E7E7E7` | Hairlines / divisores sutiles |
| `--hover` | `#000000` sobre `#FFFFFF` invertido | Estados hover (invert bg/ink) |

No hay accent color de marca — el acento lo pone cada imagen de proyecto (violeta de Jitter, verde de Metamask Learn, azul/rosa de Kikk, rojo de Fix, etc).

---

## 3. Tipografía

Dos familias, roles totalmente separados. No se mezclan pesos entre ellas.

### Bebas Neue — Display
- Fuente condensada, un solo peso (400), todo en mayúsculas.
- Uso exclusivo: **wordmark gigante del hero** y **títulos de sección** (`Trabajos`, `About`, `Servicios`, `Clientes`, `Premios`, `Contacto`).
- Tracking: ligeramente negativo o neutro (`-0.01em` a `0em`) — las letras casi se tocan, como en el wordmark de referencia.
- Escala en el hero: **clamp(80px, 14vw, 220px)**, altura de línea ~0.85, puede sangrar/cortarse en los bordes del viewport (ver captura: la "I" y la "A" quedan cortadas a los costados).
- Import: `https://api.fontshare.com/v2/css?f[]=bebas-neue@400&display=swap`

### Nunito — Body / UI
- Fuente humanista redondeada, pesos 400/600/700/800.
- Uso exclusivo: nav, meta-info (fechas, coordenadas), párrafos de about, listas de servicios/clientes/premios, botones, footer.
- Todo el texto de UI va en **mayúsculas, peso 700–800, letter-spacing +0.04em a +0.08em**, tamaño pequeño (11–13px) — contraste deliberado frente al display gigante.
- Los párrafos de contenido (About) usan peso 500–600, minúsculas, tamaño 16–18px.
- Import: `https://api.fontshare.com/v2/css?f[]=nunito@400,600,700,800&display=swap`

### Escala tipográfica

| Rol | Fuente | Tamaño | Peso | Casing |
|---|---|---|---|---|
| Wordmark hero | Bebas Neue | clamp(80–220px) | 400 | UPPER |
| Título de sección | Bebas Neue | clamp(40–72px) | 400 | UPPER |
| Nav / meta info | Nunito | 11–13px | 800 | UPPER, tracking +0.06em |
| Nombre de proyecto (grid) | Nunito | 14–16px | 800 | UPPER |
| Fecha de proyecto | Nunito | 11–13px | 700 | `../AAAA` |
| Párrafo (about, subcopy) | Nunito | 16–18px | 500–600 | Normal |
| Botón / CTA | Nunito | 13–14px | 800 | UPPER, tracking +0.05em |

---

## 4. Layout & grid

- **Contenedor:** ancho completo, márgenes laterales de 32–40px en desktop (el wordmark del hero puede ignorar el margen y sangrar hasta el borde).
- **Grid base:** 12 columnas, gutter 6–8px (la grilla de trabajos usa gutters muy finos, casi sin separación).
- **Espaciado vertical entre secciones:** grande y consistente (~100–130px desktop, ~64px mobile), separado por hairlines (`--line`) o solo por whitespace, nunca por bloques de color.
- **Header:** fijo o estático arriba, 3 columnas: logo (izq) / claim de dos líneas (centro-izq) / links de contacto (der), todo alineado por baseline, todo en Nunito mayúsculas.

### Wireframe (desktop)

```
┌──────────────────────────────────────────────────────────────────┐
│ INGAMANA©      DEVELOPMENT PARTNER FOR         LATEST NEWS        │
│                BRANDS, AGENCIES & DESIGNERS.   INFO@INGAMANA.COM  │
│                                                                    │
│                                                                    │
│                    (mucho whitespace)                             │
│                                                                    │
│ ING A M A N A   ← wordmark Bebas Neue, gigante, sangra en bordes  │
├───────┬───────┬───────┬───────┬───────┬──────────────────────────┤
│ img1  │ img2  │ img3  │ img4  │ img5  │  ← grid de proyectos      │
│ NAME  │ NAME  │ NAME  │ NAME  │ NAME  │                           │
│ ../25 │ ../24 │ ../23 │ ../22 │ ../22 │                           │
├───────┴───────┴───────┴───────┴───────┴──────────────────────────┤
│  ABOUT           texto párrafo about...                           │
├────────────────────────────────────────────────────────────────── │
│  SERVICIOS       Frontend development                    01       │
│                   Backend development                     02      │
│                   Motion & interactions                    03     │
│                   ...                                              │
├────────────────────────────────────────────────────────────────── │
│  CLIENTES        [grid de logos/nombres en celdas con hairlines]  │
├────────────────────────────────────────────────────────────────── │
│  PREMIOS / NOMINACIONES   [dos columnas de listas]                │
├────────────────────────────────────────────────────────────────── │
│                     HABLEMOS ↗   (wordmark grande, centrado)      │
│                     info@ingamana.com                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Secciones y contenido de referencia

### Header
- `INGAMANA©` (logo, Nunito 800 o Bebas Neue chico).
- Claim en 2 líneas: `DEVELOPMENT PARTNER FOR / BRANDS, AGENCIES & DESIGNERS.`
- Derecha: `LATEST NEWS` / `INFO@INGAMANA.COM`.

### Hero — Wordmark
- Nombre del estudio en Bebas Neue, ocupando todo el ancho, cortado en los bordes izquierdo/derecho (efecto "zoom" — ver captura).
- Sin subtítulo adicional dentro del wordmark; el claim ya vive en el header.

### Grid de trabajos
- 5 columnas en desktop (2–3 en mobile), gutter mínimo.
- Cada card: imagen full-bleed a color (sin escala de grises — el color es el atractivo aquí) + fila inferior con **nombre del proyecto** (izq, bold) y **fecha** (der, formato `../2025`).
- Hover sugerido: leve zoom de imagen (scale 1.0 → 1.04) o cambio de cursor a "Ver proyecto", nada más.
- Proyectos de referencia: Nzero, C2MTL, Jitter, Opal Tadpole, Metamask Learn, KIKK Festival, Fix, FOAM Talent, Motto, ATID, Dayos, DUE, Vestwell, Sturdy.

### About
- Título de sección `About` en Bebas Neue.
- Copy: estudio de desarrollo web, socios de marcas/agencias/diseñadores, "gente agradable — del tipo que invitarías a cenar", trabajando globalmente desde 2005, L–V, con referencia horaria (NY/LA/Londres).

### Servicios
- Lista vertical con hairline entre filas: Frontend development, Backend development, Motion & interactions, E-Commerce, Accessibility, Web Performance Optimization, SEO/AEO/GEO, AI/LLM & Agent Integrations.
- Cada fila con número (01–08) a la derecha, alineado — dato real de secuencia (orden de servicios), no decorativo.

### Clientes
- Grid de celdas con hairlines (tipo tabla), un nombre de cliente por celda: Sony, Honda, Rakuten, Nike, Yahoo, Awwwards, Playstation, Pepsi, Carrefour, Adidas, Opal, Sesame AI, Dogstudio/DEPT®, Locomotive, DixonBaxi, Metamask, etc.

### Premios / Nominaciones
- Dos columnas de listas con contador `xN` (Webby Awards x3, Awwwards Site of the Day x19, Awwwards Dev Award x14, FWA Site of the Day x9, etc).

### Contacto
- Wordmark grande "Hablemos ↗" o similar, centrado, mismo tratamiento Bebas Neue que el hero.
- Email y teléfono en Nunito, chico.
- Nota de reclutamiento ("¿sos developer? buscamos gente...") + botón CTA con borde, radio full (pill).

### Footer
- Créditos del sitio (diseño, desarrollo, copywriting) + redes sociales, todo en Nunito 11–12px, mayúsculas.

---

## 6. Componentes

| Componente | Especificación |
|---|---|
| **Nav link** | Nunito 800, 12px, mayúscula, tracking +0.05em, hover: subrayado o invert |
| **Project card** | imagen a color + label inferior (nombre + fecha), sin bordes redondeados, sin sombras |
| **Section title** | Bebas Neue, alineado a la izquierda, precede siempre al bloque de contenido |
| **Service row** | hairline arriba y abajo, número a la derecha, hover invierte color (fondo negro/texto blanco) |
| **Client cell** | celda de grid con hairline, hover invierte color |
| **CTA button (pill)** | borde 1px `--line`, radio 100px, Nunito 800 mayúscula, hover: fondo negro / texto blanco |
| **Divider** | hairline `1px solid var(--line)`, nunca bloques de color |

---

## 7. Motion / interacción

- Nada de animaciones decorativas de fondo. El único "efecto" con jerarquía es el wordmark del hero, que puede tener una intro sutil (fade/scale-in al cargar) — pero no looping.
- Hover en grid de trabajos: zoom leve de imagen (300–400ms ease-out), sin cambio de color de imagen (el color es intencional, no debe apagarse a grises).
- Hover en filas de texto (servicios, clientes): invertir a negro/blanco o desplazar el texto unos px — feedback inmediato, sin easing largo.
- Transiciones cortas (200–350ms), sin bounce ni easing juguetón — coherente con el tono seco de la marca.

---

## 8. Responsive

- **Mobile:** wordmark del hero baja a `clamp(56px, 16vw, 90px)`, puede partirse en 2 líneas en vez de sangrar horizontalmente.
- Grid de trabajos: 5 → 2 columnas.
- Grid de clientes: 4 → 2 columnas.
- Header: el claim central puede ocultarse o pasar debajo del logo en mobile; mantener logo + contacto visibles.
- Mantener siempre el mismo contraste tipográfico (display gigante vs. UI diminuta) — es la firma del diseño, no se debe "normalizar" en mobile.

---

## 9. Accesibilidad

- Contraste negro sobre blanco es AAA por defecto — mantenerlo así, evitar grises claros para texto de body.
- Focus visible en todos los links/CTAs (outline 2px `--ink`, offset 2px).
- Respetar `prefers-reduced-motion`: desactivar zoom de imágenes y cualquier intro animada del wordmark.