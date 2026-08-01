import { globalState } from '../state';
import { catalogIsPreviousEntry, readCatalogState } from './transitions';

export function setupProjectView() {
  const close = document.querySelector<HTMLAnchorElement>('.project__close');
  if (!close) return;

  const cerrar = (e?: Event) => {
    if (catalogIsPreviousEntry(readCatalogState())) {
      e?.preventDefault();
      window.history.back();
    } else if (!e) {
      close.click();
    }
  };

  close.addEventListener('click', cerrar, { signal: globalState.abort.signal });

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape') return;
      cerrar();
    },
    { signal: globalState.abort.signal },
  );
}
