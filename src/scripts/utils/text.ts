import { gsap } from 'gsap';

/**
 * Helper function from GSAP for seamless horizontal looping.
 */
export function horizontalLoop(items: any[], config: any) {
  items = gsap.utils.toArray(items);
  config = config || {};
  let tl = gsap.timeline({
      repeat: config.repeat,
      paused: config.paused,
      defaults: { ease: "none" },
      onReverseComplete: () => { tl.totalTime(tl.rawTime() + tl.duration() * 100); }
    }),
    length = items.length,
    startX = items[0].offsetLeft,
    times: number[] = [],
    widths: number[] = [],
    xPercents: number[] = [],
    curIndex = 0,
    pixelsPerSecond = (config.speed || 1) * 100,
    snap = config.snap === false ? (v: number) => v : gsap.utils.snap(config.snap || 1),
    totalWidth: number, curX: number, distanceToStart: number, distanceToLoop: number, item: any, i: number;

  gsap.set(items, {
    xPercent: (i, el) => {
      let w = widths[i] = parseFloat(gsap.getProperty(el, "width", "px") as string);
      xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px") as string) / w * 100 + (gsap.getProperty(el, "xPercent") as number));
      return xPercents[i];
    }
  });
  gsap.set(items, { x: 0 });

  totalWidth = items[length - 1].offsetLeft + xPercents[length - 1] / 100 * widths[length - 1] - startX + items[length - 1].offsetWidth * (gsap.getProperty(items[length - 1], "scaleX") as number) + (parseFloat(config.paddingRight) || 0);

  for (i = 0; i < length; i++) {
    item = items[i];
    curX = xPercents[i] / 100 * widths[i];
    distanceToStart = item.offsetLeft + curX - startX;
    distanceToLoop = distanceToStart + widths[i] * (gsap.getProperty(item, "scaleX") as number);

    tl.to(item, { xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond }, 0)
      .fromTo(item, { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) }, { xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false }, distanceToLoop / pixelsPerSecond)
      .add("label" + i, distanceToStart / pixelsPerSecond);
    
    times[i] = distanceToStart / pixelsPerSecond;
  }

  return tl;
}

/** una palabra larga ("TRANSITIONS") se pasa del ancho en pantallas angostas:
 *  se achica lo justo para que entre. Hace falta JS porque el cuerpo depende
 *  del largo del nombre, que el CSS no puede medir */
export function ajustarTituloFiltro(titulo: HTMLElement) {
  const letras = Array.from(titulo.querySelectorAll<HTMLElement>('span'));
  if (!letras.length) return;

  // se mide siempre contra el cuerpo de la hoja, no contra el ya achicado
  titulo.style.removeProperty('font-size');
  const cs = getComputedStyle(titulo);
  const disponible =
    titulo.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const ancho = letras.reduce((suma, el) => suma + el.getBoundingClientRect().width, 0);

  if (ancho > disponible && disponible > 0) {
    const base = parseFloat(cs.fontSize);
    titulo.style.fontSize = `${((base * disponible) / ancho).toFixed(1)}px`;
  }
}
