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
  showCoords: boolean;
}

function defaultWidgetOpts(key: PanelKey): WidgetOpts {
  return {
    theme: "lofi",
    transparent: false,
    opacity: 1,
    zoom: key === "minimap" ? 15 : 0,
    showCoords: false,
  };
}

function buildDefaultWidgetOptions(): Record<PanelKey, WidgetOpts> {
  const opts = {} as Record<PanelKey, WidgetOpts>;
  PANEL_KEYS.forEach((k) => {
    opts[k] = defaultWidgetOpts(k);
  });
  return opts;
}

export interface BaseDims {
  w: number;
  h: number;
}

const DEFAULT_BASE: BaseDims = { w: 200, h: 130 };

const BASE_DIMS_DEFAULTS: Record<PanelKey, BaseDims> = {
  workout: { w: 200, h: 80 },
  heartrate: { w: 200, h: 140 },
  elapsed: { w: 200, h: 130 },
  pace: { w: 200, h: 130 },
  distance: { w: 200, h: 130 },
  calories: { w: 200, h: 130 },
  steps: { w: 200, h: 130 },
  elevation: { w: 200, h: 130 },
  minimap: { w: 280, h: 250 },
};

function buildDefaultBaseDims(): Record<PanelKey, BaseDims> {
  const dims = {} as Record<PanelKey, BaseDims>;
  PANEL_KEYS.forEach((k) => {
    dims[k] = BASE_DIMS_DEFAULTS[k] ?? DEFAULT_BASE;
  });
  return dims;
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

export interface SerializedState {
  enabledWidgets: PanelKey[];
  widgetOptions: Record<PanelKey, WidgetOpts>;
  panels: Record<PanelKey, PanelRect>;
}

interface LayoutState {
  panels: Record<PanelKey, PanelRect>;
  controlBarHeight: number;
  selectedPanel: PanelKey | null;
  enabledWidgets: Set<PanelKey>;
  widgetOptions: Record<PanelKey, WidgetOpts>;
  baseDimensions: Record<PanelKey, BaseDims>;

  resetLayout: (controlBarHeight?: number) => void;
  movePanel: (key: PanelKey, x: number, y: number) => void;
  resizePanel: (key: PanelKey, w: number, h: number) => void;
  setControlBarHeight: (h: number) => void;
  selectPanel: (key: PanelKey | null) => void;
  toggleWidget: (key: PanelKey) => void;
  getEnabledKeys: () => PanelKey[];
  setWidgetOption: (key: PanelKey, patch: Partial<WidgetOpts>) => void;
  setBaseDimension: (key: PanelKey, w: number, h: number) => void;
  exportState: () => string;
  importState: (json: string) => boolean;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  panels: computeGridLayout(0),
  controlBarHeight: 0,
  selectedPanel: null,
  enabledWidgets: new Set<PanelKey>(PANEL_KEYS),
  widgetOptions: buildDefaultWidgetOptions(),
  baseDimensions: buildDefaultBaseDims(),

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

  setBaseDimension: (key, w, h) => {
    const prev = get().baseDimensions;
    set({ baseDimensions: { ...prev, [key]: { w, h } } });
  },

  exportState: () => {
    const { enabledWidgets, widgetOptions, panels } = get();
    const payload: SerializedState = {
      enabledWidgets: PANEL_KEYS.filter((k) => enabledWidgets.has(k)),
      widgetOptions,
      panels,
    };
    return JSON.stringify(payload, null, 2);
  },

  importState: (json) => {
    try {
      const data = JSON.parse(json) as SerializedState;
      if (
        !data.enabledWidgets ||
        !Array.isArray(data.enabledWidgets) ||
        !data.widgetOptions ||
        !data.panels
      ) {
        return false;
      }
      const validKeys = new Set<string>(PANEL_KEYS);
      const enabled = new Set<PanelKey>(
        data.enabledWidgets.filter((k) => validKeys.has(k)),
      );
      const opts = { ...buildDefaultWidgetOptions() };
      for (const k of PANEL_KEYS) {
        if (data.widgetOptions[k]) {
          opts[k] = { ...opts[k], ...data.widgetOptions[k] };
        }
      }
      const panels = { ...computeGridLayout(get().controlBarHeight) };
      for (const k of PANEL_KEYS) {
        if (data.panels[k]) {
          panels[k] = data.panels[k];
        }
      }
      set({
        enabledWidgets: enabled,
        widgetOptions: opts,
        panels,
        selectedPanel: null,
      });
      return true;
    } catch {
      return false;
    }
  },
}));
