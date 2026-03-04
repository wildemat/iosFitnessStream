import { useEffect, useRef, useState } from 'react';
import type { WorkoutMetrics } from '../../types/metrics';
import { OverlayWrapper } from '../shared/OverlayWrapper';
import './ElapsedTimeOverlay.css';

function formatTime(totalSeconds: number): string {
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export interface ElapsedTimeOverlayProps {
  metrics: WorkoutMetrics | null;
  transparent?: boolean;
}

/**
 * Displays elapsed workout time.
 * Once data arrives, a local interval keeps the counter ticking between
 * server updates so the display never appears frozen.
 */
export function ElapsedTimeOverlay({ metrics, transparent = false }: ElapsedTimeOverlayProps) {
  const hasData = metrics?.elapsed_seconds != null;
  const [displaySeconds, setDisplaySeconds] = useState(0);

  const baseSecondsRef = useRef(0);
  const baseWallRef    = useRef(Date.now());
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (metrics?.elapsed_seconds != null) {
      baseSecondsRef.current = metrics.elapsed_seconds;
      baseWallRef.current    = Date.now();
      setDisplaySeconds(metrics.elapsed_seconds);
    }
  }, [metrics?.elapsed_seconds]);

  useEffect(() => {
    if (!hasData) return;

    intervalRef.current = setInterval(() => {
      const drift = (Date.now() - baseWallRef.current) / 1000;
      setDisplaySeconds(baseSecondsRef.current + drift);
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasData]);

  return (
    <OverlayWrapper hasData={hasData}>
      <div className={`widget elapsed-overlay${transparent ? ' widget--transparent' : ''}`}>
        <div className="widget__header">
          <span className="widget__icon elapsed-overlay__icon" aria-hidden="true">◷</span>
          <span className="widget__label">Elapsed</span>
        </div>
        <div className={`elapsed-overlay__value${!hasData ? ' elapsed-overlay__value--empty' : ''}`}>
          {hasData ? formatTime(displaySeconds) : '0:00'}
        </div>
      </div>
    </OverlayWrapper>
  );
}
