# VivifyUX

Directorio de librerías de interacción para la web: scroll, texto,
transiciones, efectos, sonido y motores de animación. Cada ficha resume qué
hace la librería, con qué está hecha y enlaza a su sitio y a su paquete de npm.
El catálogo corre con las mismas librerías que cataloga.


[Proponer una librería](https://github.com/EJCP3/VIVIFYUX-/issues/new) ·
[Reportar un fallo](https://github.com/EJCP3/VIVIFYUX-/issues) ·
[Guía de contribución](CONTRIBUTING.md)

## Cómo correrlo

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # genera /dist
```

## Contribuir

Cualquiera puede sumar una librería al catálogo. Antes de abrir un PR leé la
[guía de contribución](CONTRIBUTING.md): explica qué campos lleva una ficha,
cómo tiene que ser la captura y cómo probarla en local. Si no querés tocar
código, alcanza con
[abrir un issue](https://github.com/EJCP3/VIVIFYUX-/issues/new).

## Cómo está hecho

- [Astro](https://astro.build) — contenido en colecciones y View Transitions
  entre la grilla y la ficha
- [GSAP](https://gsap.com) — ScrollTrigger para el zoom de la grilla y las
  marquesinas horizontales
- [Lenis](https://lenis.dev) — scroll suave
- [Cuelume](https://www.npmjs.com/package/cuelume) — sonidos de interfaz


