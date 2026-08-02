import { globalState } from '../state';
import { fijarMotion, motionApagado } from '../utils/dom';
import { idiomaActual } from '../idioma';
import { t, type ClaveTexto } from '../../i18n';

/** el rótulo dice lo que va a pasar si lo tocás, no cómo está ahora */
function pintar(btn: HTMLElement) {
  const apagado = motionApagado();
  const clave: ClaveTexto = apagado ? 'motion.encender' : 'motion.apagar';
  /* el data-i18n queda apuntando a la clave que toca en cada estado: así el
     cambio de idioma reescribe el rótulo bueno sin saber nada del interruptor */
  btn.dataset.i18n = clave;
  btn.textContent = t(clave, idiomaActual());
  btn.setAttribute('aria-pressed', String(apagado));
}

/** el interruptor de animaciones del pie.
 *
 *  No apaga nada por su cuenta: cambia la bandera que mira reduced() y vuelve a
 *  montar el sitio. Cada pieza se pregunta de nuevo si hay motion y se arma en
 *  su versión quieta —o en la animada, al volver a encenderlo—. Lo que anima la
 *  hoja de estilos lo corta la clase .sin-motion del <html>. */
export function setupMotionToggle(remontar: () => void) {
  const btn = document.querySelector<HTMLElement>('[data-motion-toggle]');
  if (!btn) return;

  pintar(btn);

  btn.addEventListener(
    'click',
    () => {
      fijarMotion(!motionApagado());
      pintar(btn);
      remontar();
    },
    { signal: globalState.abort.signal },
  );
}
