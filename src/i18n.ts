/* =========================================================
   Textos del sitio en los dos idiomas.

   Este módulo lo importan tanto los .astro (en build, para escribir el HTML
   inicial) como el script del navegador (para cambiar de idioma sin recargar).
   Por eso no puede tocar el DOM ni depender de window.
   ========================================================= */

export type Idioma = 'en' | 'es';

/** el idioma con el que se sirve el HTML: lo que ve Google y quien entra sin JS */
export const IDIOMA_BASE: Idioma = 'en';

export const OTRO_IDIOMA: Record<Idioma, Idioma> = { en: 'es', es: 'en' };

/** clave de localStorage donde queda la elección */
export const CLAVE_IDIOMA = 'vivifyux:idioma';

/** dónde queda el interruptor de animaciones del pie. El script del <head> lo
 *  lee escrito a mano (no puede importar): si cambia acá, cambiarlo allá */
export const CLAVE_MOTION = 'vivifyux:motion';

export type Par = Record<Idioma, string>;

/* --- textos sueltos de la interfaz. La clave se usa tal cual en data-i18n --- */
export const TEXTOS = {
  'sitio.titulo': {
    en: 'VivifyUX — A directory of interactive web libraries',
    es: 'VivifyUX — Un directorio de librerías web interactivas',
  },
  'sitio.descripcion': {
    en: 'A curated directory of interaction libraries for the web: scroll, text, transitions, effects, sound, and animation engines.',
    es: 'Un directorio curado de librerías de interacción para la web: scroll, texto, transiciones, efectos, sonido y motores de animación.',
  },

  /* el salto de línea va como \n y lo dibuja white-space: pre-line, así el
     texto entero cabe en un atributo y el cambio de idioma es un textContent */
  'header.claim': {
    en: 'A directory of interactive\nweb libraries',
    es: 'Un directorio de librerías\nweb interactivas',
  },

  'footer.claim': {
    en: 'Your love for the web,\nin an instant.',
    es: 'Tu amor por la web,\nen un instante.',
  },
  'footer.inicio': { en: 'VivifyUX, back to home', es: 'VivifyUX, volver al inicio' },
  'footer.arriba': { en: 'Back to top', es: 'Volver arriba' },

  'tecnicas.titulo': { en: 'Techniques', es: 'Técnicas' },

  'contacto.titulo': { en: 'Missing\none?', es: '¿Falta\nalguna?' },
  'contacto.copy': {
    en: "The catalog grows with what its users propose. If you know a library that deserves to be here, tell us in an issue and we'll take a look.",
    es: 'El catálogo crece con lo que proponen quienes lo usan. Si conocés una librería que merezca estar acá, contanos en un issue y le echamos un vistazo.',
  },
  'contacto.cta': { en: 'Suggest a library ↗', es: 'Sugerir una librería ↗' },

  'ficha.categoria': { en: 'CATEGORY', es: 'CATEGORÍA' },
  'ficha.nota': { en: 'GOOD TO KNOW', es: 'CONVIENE SABER' },
  'ficha.visitar': { en: 'VISIT SITE', es: 'VER SITIO' },
  'ficha.anterior': { en: 'PREVIOUS', es: 'ANTERIOR' },
  'ficha.siguiente': { en: 'NEXT', es: 'SIGUIENTE' },
  'ficha.cerrar': { en: 'Close and return to catalog', es: 'Cerrar y volver al catálogo' },

  'filtro.etiqueta': { en: 'FILTER', es: 'FILTRAR' },
  'filtro.todas': { en: 'All', es: 'Todas' },
  'filtro.abrir': { en: 'Open filter menu', es: 'Abrir menú de filtros' },
  'filtro.cerrar': { en: 'Close menu', es: 'Cerrar menú' },
  'filtro.dialogo': { en: 'Filter menu', es: 'Menú de filtros' },

  'idioma.cambiar': { en: 'Cambiar a español', es: 'Switch to English' },

  /* el rótulo dice lo que hace el botón, no el estado en el que está: apagar la
     luz del sitio es dejarlo quieto */
  'motion.apagar': { en: 'Turn off the lights', es: 'Apagar la luz' },
  'motion.encender': { en: 'Turn on the lights', es: 'Encender la luz' },
} as const satisfies Record<string, Par>;

export type ClaveTexto = keyof typeof TEXTOS;

/** el slug de la categoría no se traduce (es la clave del filtro y del
 *  frontmatter): solo cambia la etiqueta que se lee en pantalla */
export const CATEGORIAS = {
  scroll: { en: 'scroll', es: 'scroll' },
  text: { en: 'text', es: 'texto' },
  transitions: { en: 'transitions', es: 'transiciones' },
  effects: { en: 'effects', es: 'efectos' },
  sound: { en: 'sound', es: 'sonido' },
  engine: { en: 'engine', es: 'motor' },
  components: { en: 'components', es: 'componentes' },
  generators: { en: 'generators', es: 'generadores' },
} as const satisfies Record<string, Par>;

export type Categoria = keyof typeof CATEGORIAS;

/** las palabras del riel del hero, en el mismo orden en los dos idiomas */
export const PALABRAS_HERO: Par[] = [
  { en: 'VIVIFYUX', es: 'VIVIFYUX' },
  { en: 'INTERACTION', es: 'INTERACCIÓN' },
  { en: 'FLUIDITY', es: 'FLUIDEZ' },
  { en: 'ANIMATION', es: 'ANIMACIÓN' },
  { en: 'VIVIFYUX', es: 'VIVIFYUX' },
  { en: 'EXPERIENCE', es: 'EXPERIENCIA' },
  { en: 'CREATIVITY', es: 'CREATIVIDAD' },
  { en: 'DYNAMISM', es: 'DINAMISMO' },
  { en: 'VIVIFYUX', es: 'VIVIFYUX' },
  { en: 'MOTION', es: 'MOVIMIENTO' },
  { en: 'DESIGN', es: 'DISEÑO' },
  { en: 'IMPACT', es: 'IMPACTO' },
  { en: 'INTERACTIVE', es: 'INTERACTIVO' },
  { en: 'VISUAL', es: 'VISUAL' },
  { en: 'ANIMATION', es: 'ANIMACIÓN' },
  { en: 'VIVIFYUX', es: 'VIVIFYUX' },
  { en: 'VIBRANT', es: 'VIBRANTE' },
];

/** captura de pantalla de X: la frase cambia de orden entre idiomas */
export function altCaptura(nombre: string, idioma: Idioma): string {
  return idioma === 'es' ? `Captura del sitio de ${nombre}` : `Screenshot of the ${nombre} site`;
}

export function t(clave: ClaveTexto, idioma: Idioma): string {
  return TEXTOS[clave][idioma];
}
