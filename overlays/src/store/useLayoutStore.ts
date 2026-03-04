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

export const THEMES = ["lofi", "light"] as const;
export type ThemeId = (typeof THEMES)[number];

export interface WidgetOpts {
  theme: ThemeId;
  transparent: boolean;
  opacity: number;
  zoom: number;
}

function defaultWidgetOpts(key: PanelKey): WidgetOpts {
  return {
    theme: "lofi",
    transparent: false,
    opacity: 1,
    zoom: key === "minimap" ? 15 : 0,
  };
}

function buildDefaultWidgetOptions(): Record<PanelKey, WidgetOpts> {
  const opts = {} as Record<PanelKey, WidgetOpts>;
  PANEL_KEYS.forEach((k) => {
    opts[k] = defaultWidgetOpts(k);
  });
  return opts;
}

const COLS = 3;
const GAP = 16;
const PAD = 20;
const MIN_W = 120;
const MIN_H = 100;

export function computeGridLayout(
  controlBarHeight: number,
  enabledKeys: PanelKey[] = [...PANEL_KEYS],
): Record<PanelKey, PanelRect> {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const top = controlBarHeight + PAD;
  const count = enabledKeys.length;
  const cols = Math.min(COLS, count);
  const cellW = cols > 0 ? (vw - PAD * 2 - GAP * (cols - 1)) / cols : 0;
  const rows = cols > 0 ? Math.ceil(count / cols) : 0;
  const availH = vh - top - PAD;
  const cellH = rows > 0 ? (availH - GAP * (rows - 1)) / rows : 0;

  const layout = {} as Record<PanelKey, PanelRect>;

  PANEL_KEYS.forEach((key) => {
    layout[key] = { x: -9999, y: -9999, w: 0, h: 0 };
  });

  enabledKeys.forEach((key, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
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
  enabledWidgets: Set<PanelKey>;
  widgetOptions: Record<PanelKey, WidgetOpts>;

  resetLayout: (controlBarHeight?: number) => void;
  movePanel: (key: PanelKey, x: number, y: number) => void;
  resizePanel: (key: PanelKey, w: number, h: number) => void;
  setControlBarHeight: (h: number) => void;
  selectPanel: (key: PanelKey | null) => void;
  toggleWidget: (key: PanelKey) => void;
  getEnabledKeys: () => PanelKey[];
  setWidgetOption: (key: PanelKey, patch: Partial<WidgetOpts>) => void;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  panels: computeGridLayout(0),
  controlBarHeight: 0,
  selectedPanel: null,
  enabledWidgets: new Set<PanelKey>(PANEL_KEYS),
  widgetOptions: buildDefaultWidgetOptions(),

  getEnabledKeys: () => {
    const enabled = get().enabledWidgets;
    return PANEL_KEYS.filter((k) => enabled.has(k));
  },

  resetLayout: (cbh) => {
    const height = cbh ?? get().controlBarHeight;
    const enabledKeys = get().getEnabledKeys();
    set({
      panels: computeGridLayout(height, enabledKeys),
      controlBarHeight: height,
    });
  },

  toggleWidget: (key) => {
    const prev = get().enabledWidgets;
    const next = new Set(prev);
    if (next.has(key)) {
      next.delete(key);
      if (get().selectedPanel === key) {
        set({ selectedPanel: null });
      }
    } else {
      next.add(key);
    }
    const height = get().controlBarHeight;
    const enabledKeys = PANEL_KEYS.filter((k) => next.has(k));
    set({
      enabledWidgets: next,
      panels: computeGridLayout(height, enabledKeys),
    });
  },

  setWidgetOption: (key, patch) => {
    const prev = get().widgetOptions;
    set({
      widgetOptions: {
        ...prev,
        [key]: { ...prev[key], ...patch },
      },
    });
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
