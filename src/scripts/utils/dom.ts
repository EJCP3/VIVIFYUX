export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** espejo del breakpoint de teléfonos de global.css */
export const esMovil = () => window.matchMedia('(max-width: 700px)').matches;
