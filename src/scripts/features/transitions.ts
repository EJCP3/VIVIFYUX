import { globalState } from '../state';

export type CatalogState = {
  from: string;
  historyIndex: number | null;
  vt: string | null;
  vtIndex: number | null;
  carousel: (number | null)[];
  scaler: string;
  worksHeight: string;
  scrollY: number;
};

const CATALOG_KEY = 'vt-catalog';

export function readCatalogState(): CatalogState | null {
  const raw = sessionStorage.getItem(CATALOG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CatalogState;
  } catch {
    sessionStorage.removeItem(CATALOG_KEY);
    return null;
  }
}

function findTile(vt: string, index: number | null): HTMLElement | null {
  const tiles = Array.from(document.querySelectorAll<HTMLElement>('[data-vt]'));
  if (index !== null && tiles[index]?.dataset.vt === vt) return tiles[index];

  const matches = tiles.filter((t) => t.dataset.vt === vt);
  if (!matches.length) return null;

  let best = matches[0];
  let bestArea = -1;
  for (const tile of matches) {
    const r = tile.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.right, window.innerWidth) - Math.max(r.left, 0));
    const h = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
    if (w * h > bestArea) {
      bestArea = w * h;
      best = tile;
    }
  }
  return best;
}

function restoreCatalog(state: CatalogState) {
  if (state.carousel) {
    const tracks = Array.from(document.querySelectorAll<HTMLElement>('.row__track'));
    tracks.forEach((track, i) => {
      if (typeof state.carousel[i] === 'number') {
        track.style.transform = `translate3d(${state.carousel[i]}px,0,0)`;
      }
    });
    globalState.pendingCarousel = state.carousel;
  }

  if (state.scaler) {
    const scaler = document.querySelector<HTMLElement>('.works__scaler');
    if (scaler) {
      scaler.style.transform = state.scaler;
      window._vtRestoring = true;
    }
  }

  if (state.worksHeight) {
    const works = document.querySelector<HTMLElement>('.works');
    if (works) works.style.height = state.worksHeight;
  }

  globalState.pendingScrollY = state.scrollY;
  window.scrollTo(0, state.scrollY);

  if (state.vt) {
    const tile = findTile(state.vt, state.vtIndex);
    const img = tile?.querySelector<HTMLImageElement>('img');
    if (img) {
      img.style.viewTransitionName = state.vt;
      img.setAttribute('loading', 'eager');
    }
  }
}

export function catalogIsPreviousEntry(state: CatalogState | null): boolean {
  if (!state || state.historyIndex === null) return false;
  const index = (window.history.state as { index?: number } | null)?.index;
  return typeof index === 'number' && index === state.historyIndex + 1;
}

export function setupTransitionNames() {
  if (typeof document !== 'undefined') {
    document.addEventListener('astro:before-preparation', (ev: any) => {
      const grid = document.querySelector<HTMLElement>('.works');
      const tile = ev.sourceElement?.closest?.('[data-vt]') as HTMLElement | null | undefined;

      if (grid) {
        document.querySelectorAll<HTMLElement>('[data-vt] img').forEach((img) => {
          img.style.viewTransitionName = '';
        });

        const img = tile?.querySelector<HTMLElement>('img');
        const vt = tile?.dataset.vt ?? null;
        if (img && vt) img.style.viewTransitionName = vt;

        const allTiles = Array.from(document.querySelectorAll<HTMLElement>('[data-vt]'));
        const tracks = Array.from(document.querySelectorAll<HTMLElement>('.row__track'));
        const scaler = document.querySelector<HTMLElement>('.works__scaler');

        const state: CatalogState = {
          from: location.pathname,
          historyIndex: (window.history.state as { index?: number } | null)?.index ?? null,
          vt,
          vtIndex: vt && tile ? allTiles.indexOf(tile) : null,
          carousel: tracks.map((track) => {
            const match = track.style.transform.match(/translate3d\(([-\d.]+)px/);
            return match ? parseFloat(match[1]) : null;
          }),
          scaler: scaler?.style.transform ?? '',
          worksHeight: grid.style.height,
          scrollY: window.scrollY,
        };
        sessionStorage.setItem(CATALOG_KEY, JSON.stringify(state));
        return;
      }

      const to = ev.to as URL | undefined;
      const slug = to && new URL(to, location.href).pathname.match(/^\/libreria\/([^/]+)\/?$/)?.[1];
      if (slug) {
        const state = readCatalogState();
        if (state && state.vt !== `cover-${slug}`) {
          state.vt = `cover-${slug}`;
          state.vtIndex = null;
          sessionStorage.setItem(CATALOG_KEY, JSON.stringify(state));
        }
      }
    });

    document.addEventListener('astro:after-swap', () => {
      const state = readCatalogState();
      if (!state || location.pathname !== state.from) return;
      sessionStorage.removeItem(CATALOG_KEY);
      restoreCatalog(state);
    });
  }
}
