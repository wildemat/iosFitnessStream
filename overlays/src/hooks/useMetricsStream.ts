import { useState, useEffect } from 'react';
import type { WorkoutMetrics } from '../types/metrics';

/**
 * Connects to the local server's SSE endpoint and returns the latest metrics.
 * The server must be running with SSE support (local/server.js).
 *
 * Usage in OBS browser source:
 *   http://localhost:5173/?overlay=heartrate
 *   (The Vite dev server must be running alongside local/server.js)
 */
export function useMetricsStream(
  url = 'http://localhost:8080/events',
): WorkoutMetrics | null {
  const [metrics, setMetrics] = useState<WorkoutMetrics | null>(null);

  useEffect(() => {
    let source: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;
    let alive = true;

    function connect() {
      if (!alive) return;
      source = new EventSource(url);

      source.addEventListener('metrics', (e: MessageEvent) => {
        try {
          setMetrics(JSON.parse(e.data as string) as WorkoutMetrics);
        } catch {
          // ignore malformed frames
        }
      });

      source.onerror = () => {
        source.close();
        if (alive) retryTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      alive = false;
      source?.close();
      clearTimeout(retryTimer);
    };
  }, [url]);

  return metrics;
}
