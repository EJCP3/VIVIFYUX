/* =========================================================
   Cambio de idioma sin recargar.

   El HTML se sirve en IDIOMA_BASE con los dos textos ya escritos en el DOM:
   los de la interfaz como clave de diccionario (data-i18n) y los del catálogo
   como literales (data-en / data-es). Cambiar de idioma es recorrer esos
   elementos y reescribir su textContent —nunca innerHTML—.
   ========================================================= */
import {
  CLAVE_IDIOMA,
  IDIOMA_BASE,
  TEXTOS,
  type ClaveTexto,
  type Idioma,
} from '../i18n';
import { ejecutarGlimmTransition } from './utils/glimm';

const EVENTO = 'vivifyux:idioma';

const esIdioma = (v: unknown): v is Idioma => v === 'en' || v === 'es';

/** lo elegido antes; si es la primera visita, lo que pida el navegador */
export function idiomaGuardado(): Idioma {
  try {
    const guardado = localStorage.getItem(CLAVE_IDIOMA);
    if (esIdioma(guardado)) return guardado;
  } catch {
    /* modo privado o cookies bloqueadas: seguimos con el del navegador */
  }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : IDIOMA_BASE;
}

export function idiomaActual(): Idioma {
  const attr = document.documentElement.getAttribute('lang');
  return esIdioma(attr) ? attr : IDIOMA_BASE;
}

/** reescribe todo lo traducible que haya en el documento */
export function pintarIdioma(idioma: Idioma) {
  const raiz = document.documentElement;
  raiz.setAttribute('lang', idioma);
  raiz.dataset.idioma = idioma;

  // 1. textos de la interfaz, por clave de diccionario
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const valor = TEXTOS[el.dataset.i18n as ClaveTexto]?.[idioma];
    if (valor === undefined) return;
    escribir(el, valor);
  });

  // 2. textos del catálogo, escritos como literales en el propio elemento
  //    (claim, descripción, categoría, alt de las capturas…)
  document.querySelectorAll<HTMLElement>('[data-es]').forEach((el) => {
    const valor = el.dataset[idioma];
    if (valor === undefined) return;
    escribir(el, valor);
  });

  // el <title> y la meta description no son nodos de texto normales
  const titulo = document.querySelector<HTMLElement>('title[data-titulo-en]');
  if (titulo) {
    const valor = idioma === 'es' ? titulo.dataset.tituloEs : titulo.dataset.tituloEn;
    if (valor) document.title = valor;
  }
}

/** un elemento puede traducir su texto o uno de sus atributos, no ambos */
function escribir(el: HTMLElement, valor: string) {
  const attr = el.dataset.i18nAttr;
  if (attr) el.setAttribute(attr, valor);
  else el.textContent = valor;
}

export function fijarIdioma(idioma: Idioma) {
  pintarIdioma(idioma);
  try {
    localStorage.setItem(CLAVE_IDIOMA, idioma);
  } catch {
    /* si no se puede guardar, el cambio vale igual para esta visita */
  }
  document.dispatchEvent(new CustomEvent<Idioma>(EVENTO, { detail: idioma }));
}

/** deja el documento en el idioma que corresponda y engancha el botón */
export function iniciarIdioma() {
  pintarIdioma(idiomaGuardado());

  document.querySelectorAll<HTMLElement>('[data-idioma-opcion]').forEach((btn) => {
    if (btn.dataset.enganchado) return; // con ViewTransitions el nodo sobrevive
    btn.dataset.enganchado = 'si';
    btn.addEventListener('click', () => {
      const elegido = btn.dataset.idiomaOpcion;
      if (esIdioma(elegido) && elegido !== idiomaActual()) {
        ejecutarGlimmTransition(() => fijarIdioma(elegido));
      }
    });
  });
}

/** avisa cuando el idioma cambió por mano del usuario, no en la carga */
export function alCambiarIdioma(cb: (idioma: Idioma) => void) {
  document.addEventListener(EVENTO, (e) => cb((e as CustomEvent<Idioma>).detail));
}
