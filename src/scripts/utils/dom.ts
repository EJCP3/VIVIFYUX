import { CLAVE_MOTION } from '../../i18n';

/** el interruptor del pie. La clase la pone el script del <head> antes del
 *  primer pintado, así que preguntarle al documento es más barato y más fiable
 *  que volver a leer localStorage en cada consulta */
export const motionApagado = () =>
  document.documentElement.classList.contains('sin-motion');

/** la única pregunta que hace el resto del sitio: ¿me toca quedarme quieto?
 *  Dice que sí tanto si lo pide el sistema como si lo apagó el usuario */
export const reduced = () =>
  motionApagado() || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function fijarMotion(apagado: boolean) {
  document.documentElement.classList.toggle('sin-motion', apagado);
  try {
    localStorage.setItem(CLAVE_MOTION, apagado ? 'off' : 'on');
  } catch {
    /* modo privado o cookies bloqueadas: la elección vale para esta visita */
  }
}

/** espejo del breakpoint de teléfonos de global.css */
export const esMovil = () => window.matchMedia('(max-width: 700px)').matches;
