import { useEffect } from "react";
import { createStore, useStore } from "zustand";
import type { WorkoutMetrics } from "../types/metrics";

interface BufferedEvent {
  data: WorkoutMetrics;
  receivedAt: number;
}

interface MetricsState {
  metrics: WorkoutMetrics | null;
  isStale: boolean;
}

export const metricsStore = createStore<MetricsState>(() => ({
  metrics: null,
  isStale: false,
}));

// ── Module-level stream engine ──
// Persists across React re-renders; only resets on full page reload.

let activeUrl = "";
let activeDelayMs = 0;
let isListening = false;

let source: EventSource | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let alive = false;

const buffer: BufferedEvent[] = [];
let bufferCursor = 0;
let playbackTimer: ReturnType<typeof setInterval> | undefined;

// After STALE_MS with no fresh data: mark stale but keep last known metrics.
// After DISABLE_MS: null out metrics entirely (complete loss).
// The iOS app POSTs every ~5 s, so allow several missed cycles before reacting.
const STALE_MS = 20_000;
const DISABLE_MS = 30_000;

let staleTimer: ReturnType<typeof setTimeout> | undefined;
let disableTimer: ReturnType<typeof setTimeout> | undefined;
let lastGoodMetrics: WorkoutMetrics | null = null;

function clearStalenessTimers() {
  clearTimeout(staleTimer);
  staleTimer = undefined;
  clearTimeout(disableTimer);
  disableTimer = undefined;
}

function publishMetrics(data: WorkoutMetrics) {
  lastGoodMetrics = data;
  metricsStore.setState({ metrics: data, isStale: false });

  clearStalenessTimers();

  staleTimer = setTimeout(() => {
    metricsStore.setState({ metrics: lastGoodMetrics, isStale: true });
  }, STALE_MS);

  disableTimer = setTimeout(() => {
    metricsStore.setState({ metrics: null, isStale: false });
  }, DISABLE_MS);
}

function releaseBuffered() {
  const threshold = Date.now() - activeDelayMs;
  let latest: WorkoutMetrics | null = null;

  while (
    bufferCursor < buffer.length &&
    buffer[bufferCursor].receivedAt <= threshold
  ) {
    latest = buffer[bufferCursor].data;
    bufferCursor++;
  }

  if (bufferCursor > 200) {
    buffer.splice(0, bufferCursor);
    bufferCursor = 0;
  }

  if (latest) publishMetrics(latest);
}

function handleMetrics(data: WorkoutMetrics) {
  if (activeDelayMs <= 0) {
    publishMetrics(data);
  } else {
    buffer.push({ data, receivedAt: Date.now() });
  }
}

function connect() {
  if (!alive) return;
  source = new EventSource(activeUrl);

  source.addEventListener("metrics", (e: MessageEvent) => {
    try {
      handleMetrics(JSON.parse(e.data as string) as WorkoutMetrics);
    } catch {
      // ignore malformed frames
    }
  });

  source.onerror = () => {
    source?.close();
    if (alive) retryTimer = setTimeout(connect, 3000);
  };
}

function stopConnection() {
  alive = false;
  source?.close();
  source = null;
  clearTimeout(retryTimer);
  retryTimer = undefined;
  clearStalenessTimers();
  // Clear last-known value so a reconnect can't resurrect data from a previous
  // session if the stale timer fires before any new event arrives.
  lastGoodMetrics = null;
  metricsStore.setState({ metrics: null, isStale: false });
}

function stopPlayback() {
  clearInterval(playbackTimer);
  playbackTimer = undefined;
}

function resetStream(url: string, delayMs: number) {
  stopConnection();
  stopPlayback();

  activeUrl = url;
  activeDelayMs = delayMs;
  buffer.length = 0;
  bufferCursor = 0;

  alive = true;
  connect();

  if (delayMs > 0) {
    playbackTimer = setInterval(releaseBuffered, 50);
  }

  metricsStore.setState({ metrics: null, isStale: false });
}

function configure(url: string, delayMs: number, listening: boolean) {
  const urlChanged = url !== activeUrl;
  const delayChanged = delayMs !== activeDelayMs;

  if (!listening) {
    if (isListening) stopConnection();
    isListening = false;
    return;
  }

  if (urlChanged || delayChanged) {
    isListening = true;
    resetStream(url, delayMs);
    return;
  }

  if (!isListening) {
    isListening = true;
    activeUrl = url;
    alive = true;
    connect();
    if (activeDelayMs > 0 && !playbackTimer) {
      playbackTimer = setInterval(releaseBuffered, 50);
    }
  }
}

export interface MetricsStreamResult {
  metrics: WorkoutMetrics | null;
  isStale: boolean;
}

/**
 * Connects to the SSE endpoint and returns the latest metrics plus staleness state.
 *
 * When `delayMs > 0`, incoming events are buffered and released only after
 * the delay has elapsed (relative to each event's arrival time), creating a
 * time-shifted stream. The buffer lives at module scope so component
 * re-renders never reset the delay counter — only a page reload does.
 *
 * Staleness behaviour:
 *   - After 20 s with no new data: isStale = true, metrics = last known value
 *   - After 30 s with no new data: metrics = null, isStale = false (disabled)
 */
export function useMetricsStream(
  url = "http://localhost:8080/events",
  listening = true,
  delayMs = 0,
): MetricsStreamResult {
  useEffect(() => {
    configure(url, delayMs, listening);
  }, [url, delayMs, listening]);

  const metrics = useStore(metricsStore, (s) => s.metrics);
  const isStale = useStore(metricsStore, (s) => s.isStale);
  return { metrics, isStale };
}

/**
 * Lightweight hook to read only the staleness flag from the metrics store.
 * Useful in components that don't need the full metrics object.
 */
export function useIsStale(): boolean {
  return useStore(metricsStore, (s) => s.isStale);
}

// ── Test helpers (not used in production code) ──────────────────────────────
/** @internal Exposed for unit tests only. Simulates receiving a new data event. */
export { publishMetrics as _publishMetrics };
/** @internal Exposed for unit tests only. Resets all module-level state. */
export function _resetForTests() {
  clearStalenessTimers();
  lastGoodMetrics = null;
  metricsStore.setState({ metrics: null, isStale: false });
}
