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

export function ejecutarGlimmTransition(onMidpoint: () => void) {
  if (reduced()) {
    onMidpoint();
    return;
  }

  try {
    const canvas = getGlimmCanvas();
    const ctrl = createShader({ canvas });
    if (ctrl) {
      playSweep(ctrl, {
        palette: accentChain(['#D33CFF', '#7B4FFF', '#2E70FF', '#1FC8FF']),
        waveAmount: 0.5,
        brightness: 0.9,
        sweepMs: 900,
        onMidpoint: () => {
          onMidpoint();
        },
        onComplete: () => {
          ctrl.destroy();
        },
      });
    } else {
      onMidpoint();
    }
  } catch {
    onMidpoint();
  }
}
