import { create } from "zustand";

export interface PanelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PANEL_KEYS = [
  "workout",
  "heartrate",
  "elapsed",
  "pace",
  "distance",
  "calories",
  "steps",
  "elevation",
  "minimap",
] as const;

export type PanelKey = (typeof PANEL_KEYS)[number];

const COLS = 3;
const GAP = 16;
const PAD = 20;
const MIN_W = 120;
const MIN_H = 100;

/** Compute the default 3-column grid positions for the current viewport. */
export function computeGridLayout(
  controlBarHeight: number,
): Record<PanelKey, PanelRect> {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const top = controlBarHeight + PAD;
  const cellW = (vw - PAD * 2 - GAP * (COLS - 1)) / COLS;
  const rows = Math.ceil(PANEL_KEYS.length / COLS);
  const availH = vh - top - PAD;
  const cellH = (availH - GAP * (rows - 1)) / rows;

  const layout = {} as Record<PanelKey, PanelRect>;
  PANEL_KEYS.forEach((key, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    layout[key] = {
      x: PAD + col * (cellW + GAP),
      y: top + row * (cellH + GAP),
      w: cellW,
      h: cellH,
    };
  });
  return layout;
}

interface LayoutState {
  panels: Record<PanelKey, PanelRect>;
  controlBarHeight: number;
  selectedPanel: PanelKey | null;

  /** Initialise (or reset) every panel to the default grid. */
  resetLayout: (controlBarHeight?: number) => void;

  /** Move a single panel to a new position, clamped to the viewport. */
  movePanel: (key: PanelKey, x: number, y: number) => void;

  /** Resize a single panel, clamped to minimums and viewport. */
  resizePanel: (key: PanelKey, w: number, h: number) => void;

  /** Store the measured control-bar height so grid calc uses it. */
  setControlBarHeight: (h: number) => void;

  selectPanel: (key: PanelKey | null) => void;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  panels: computeGridLayout(0),
  controlBarHeight: 0,
  selectedPanel: null,

  resetLayout: (cbh) => {
    const height = cbh ?? get().controlBarHeight;
    set({ panels: computeGridLayout(height), controlBarHeight: height });
  },

  movePanel: (key, x, y) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = get().panels[key];
    set({
      panels: {
        ...get().panels,
        [key]: {
          ...rect,
          x: Math.max(0, Math.min(x, vw - rect.w)),
          y: Math.max(0, Math.min(y, vh - rect.h)),
        },
      },
    });
  },

  resizePanel: (key, w, h) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = get().panels[key];
    const clampedW = Math.max(MIN_W, Math.min(w, vw - rect.x));
    const clampedH = Math.max(MIN_H, Math.min(h, vh - rect.y));
    set({
      panels: {
        ...get().panels,
        [key]: { ...rect, w: clampedW, h: clampedH },
      },
    });
  },

  setControlBarHeight: (h) => set({ controlBarHeight: h }),

  selectPanel: (key) => set({ selectedPanel: key }),
}));
