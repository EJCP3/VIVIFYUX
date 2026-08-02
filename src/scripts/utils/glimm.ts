import { createShader, playSweep, accentChain } from 'glimm';
import { reduced } from './dom';

export function getGlimmCanvas(): HTMLCanvasElement {
  let canvas = document.querySelector<HTMLCanvasElement>('#glimm-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'glimm-canvas';
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  return canvas;
}

/** un barrido a la vez: todos comparten el mismo canvas, y montar un shader
 *  encima del que está corriendo deja a los dos a medias (el primero en acabar
 *  destruye el contexto del otro, y el midpoint del otro no llega nunca).
 *
 *  Pasa de verdad en el cambio de idioma: el barrido lo lanza idioma.ts y a
 *  mitad remonta el sitio, que a su vez quiere barrer para estrenar el
 *  carrusel. Si ya hay uno en marcha, el trabajo del midpoint se hace en el
 *  acto y se aprovecha la pasada que ya está tapando la pantalla */
let enCurso = false;

export function ejecutarGlimmTransition(onMidpoint: () => void) {
  if (reduced() || enCurso) {
    onMidpoint();
    return;
  }

  try {
    const canvas = getGlimmCanvas();
    const ctrl = createShader({ canvas });
    if (ctrl) {
      enCurso = true;
      playSweep(ctrl, {
        palette: accentChain(['#D33CFF', '#7B4FFF', '#2E70FF', '#1FC8FF']),
        waveAmount: 0.5,
        brightness: 0.9,
        sweepMs: 900,
        onMidpoint: () => {
          onMidpoint();
        },
        onComplete: () => {
          enCurso = false;
          ctrl.destroy();
        },
      });
    } else {
      onMidpoint();
    }
  } catch {
    enCurso = false;
    onMidpoint();
  }
}
