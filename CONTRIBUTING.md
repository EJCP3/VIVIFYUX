# How to add a library

[English Version](CONTRIBUTING.md) | [Versión en Español](CONTRIBUTING.es.md)

Thank you for wanting to contribute. The catalog is built with what its users propose, so every suggestion is welcome.

There are two ways: **open an issue** (we add it) or **submit a pull request** with the card already made. Both are equally valid.

---

## What goes into the catalog

VivifyUX lists **interaction** libraries for the web. Before proposing one, make sure it meets the following:

- Solves something related to interaction or movement in the browser: scroll, text, transitions, visual effects, sound, or general animation.
- It is public and can be used today: open repository or published package.
- Has documentation or a demo where it can be seen working.
- Is not already in the catalog. Check [`src/content/librerias/`](src/content/librerias/) before writing.

It doesn't need to be popular or have many stars. It just needs to be clear what it does and that someone can install it. It can even be your own library.

---

## Short way: open an issue

If you don't want to touch code, [open an issue](https://github.com/EJCP3/VivifyUX/issues/new) with:

- Name of the library and link to its site or repository.
- One line about what it does.
- Which category you think it belongs in.

That's enough. We will prepare the card and the screenshot.

---

## Long way: submit a pull request

### 1. Prepare the project

```bash
git clone https://github.com/EJCP3/VivifyUX.git
cd VivifyUX
pnpm install
pnpm run dev       # http://localhost:4321
```

Work on a separate branch:

```bash
git checkout -b add-library-name
```

### 2. Add the screenshot

Save an image in `src/assets/<slug>.webp`, where `<slug>` is the name in lowercase and without spaces (`slot-text`, `gsap`, `border-beam`). You can also send an image saved in external storage and provide the URL.

- **Format**: WebP.
- **Size**: around **1860 × 975** px, which is the size of the existing screenshots. Larger doesn't help; much smaller looks blurry on the card.
- **What to capture**: the cover of the library or its demo, as it is seen. No browser bar, no cursor, no added frames or shadows.
- **Composition**: both the grid card and the detail card crop the image with `object-fit: cover`, and the detail card is almost square, so **it crops from the sides**. Leave the important part towards the center.

### 3. Create the card

One file per library in `src/content/librerias/<slug>.md`. The name of the file is the URL: `slot-text.md` → `/libreria/slot-text/`.

The site is bilingual: the texts read on screen go in English and Spanish within the same file, and the EN/ES button in the header switches between them without reloading.

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
npm: "@rive-app/canvas"
imagen: "../../assets/rive.webp"
orden: 11
---
```

The fields are validated in [`src/content/config.ts`](src/content/config.ts): if one is missing or the type doesn't match, `npm run dev` will tell you with the field name.

| Field | Type | Required? | Notes |
| --- | --- | --- | --- |
| `nombre` | text | Yes | As the author writes it: `GSAP`, `Lenis`, `slot-text`. |
| `categoria` | `scroll`, `text`, `transitions`, `effects`, `sound`, `engine`, `components` or `generators` | Yes | Only one. These are the eight in the filter; no new ones are invented in an addition PR. |
| `claim` | `en` + `es` | Yes | One line per language, read under the card title. No period if it's a slogan. |
| `descripcion` | `en` + `es` | Yes | Two to four sentences per language: what it does and why it matters. It is the body of the card. |
| `tips` | list of `en` + `es` | No | Two practical tips. The card doesn't show the block until both languages have text, so it can be left empty and completed later. |
| `url` | full URL | Yes | Official site; if none, the repository. With `https://`. |
| `npm` | text | No | Exact name of the package, as installed. Omit if not published on npm. |
| `imagen` | path | Yes | Always `../../assets/<slug>.webp`. |
| `orden` | number | Yes | Position in the grid and in prev/next. Use the next free number. |

### 4. Test before submitting

With `npm run dev` running, check that:

- The card appears in the grid with its name and category.
- When clicked, the image transitions to the card without jumping.
- The card reads well: claim, description, chips, and the **Visit site** button opens the correct page.
- The prev/next links chain with the adjacent libraries.

And that it builds cleanly:

```bash
npm run build
```

You do not need to upload `dist/` in the PR.

### 5. Open the pull request

One PR per library. In the description, tell in one line why it deserves to be included and paste the link to its site.

---

## What we look for when reviewing

- That the library meets the requirements above and is not repeated.
- That the category is the one someone would expect when searching for it.
- That the description explains the library and does not sell it.
- That the screenshot looks sharp and is not cropped in half.

If something doesn't fit, we'll comment on the PR; it's almost always fixed by changing a category or retaking the screenshot.

## Other contributions

Fixes for bugs, accessibility, performance, or texts are also welcome, via the same two channels: issue or PR. If the change is large, it's better to open an issue first to agree on the approach.
