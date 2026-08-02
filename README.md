# VivifyUX

[English Version](README.md) | [Versión en Español](README.es.md)

Directory of interaction libraries for the web: scroll, text, transitions, effects, sound, and animation engines. Each card summarizes what the library does, what it's made with, and links to its site and npm package. The catalog runs on the same libraries it catalogs.

[Propose a library](https://github.com/EJCP3/VivifyUX/issues/new) ·
[Report a bug](https://github.com/EJCP3/VivifyUX/issues) ·
[Contributing Guide](CONTRIBUTING.md)

## How to run it

```bash
pnpm install
pnpm run dev       # http://localhost:4321
pnpm run build     # generates /dist
```

## Contributing

Anyone can add a library to the catalog. Before opening a PR, read the [contributing guide](CONTRIBUTING.md): it explains what fields a card needs, how the screenshot should be, and how to test it locally. If you don't want to touch code, just [open an issue](https://github.com/EJCP3/VivifyUX/issues/new).

## How it's made

- [Astro](https://astro.build) — content in collections and View Transitions between the grid and the card
- [GSAP](https://gsap.com) — ScrollTrigger for the grid zoom and horizontal marquees
- [Lenis](https://lenis.dev) — smooth scrolling
- [Cuelume](https://www.npmjs.com/package/cuelume) — interface sounds
