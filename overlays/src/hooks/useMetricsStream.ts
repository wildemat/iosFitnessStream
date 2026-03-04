import { useEffect } from "react";
import { createStore, useStore } from "zustand";
import type { WorkoutMetrics } from "../types/metrics";

interface BufferedEvent {
  data: WorkoutMetrics;
  receivedAt: number;
}

interface MetricsState {
  metrics: WorkoutMetrics | null;
}

const metricsStore = createStore<MetricsState>(() => ({ metrics: null }));

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

  if (latest) metricsStore.setState({ metrics: latest });
}

function handleMetrics(data: WorkoutMetrics) {
  if (activeDelayMs <= 0) {
    metricsStore.setState({ metrics: data });
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

  metricsStore.setState({ metrics: null });
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

/**
 * Connects to the SSE endpoint and returns the latest metrics.
 *
 * When `delayMs > 0`, incoming events are buffered and released only after
 * the delay has elapsed (relative to each event's arrival time), creating a
 * time-shifted stream.  The buffer lives at module scope so component
 * re-renders never reset the delay counter — only a page reload does.
 */
export function useMetricsStream(
  url = "http://localhost:8080/events",
  listening = true,
  delayMs = 0,
): WorkoutMetrics | null {
  useEffect(() => {
    configure(url, delayMs, listening);
  }, [url, delayMs, listening]);

  return useStore(metricsStore, (s) => s.metrics);
}
