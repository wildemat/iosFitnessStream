import { useEffect, useRef, useState } from 'react';
import type { WorkoutMetrics } from '../../types/metrics';
import { OverlayWrapper } from '../shared/OverlayWrapper';
import './WorkoutTypeOverlay.css';

const TYPE_ICONS: Record<string, string> = {
  Running:  '🏃',
  Cycling:  '🚴',
  Walking:  '🚶',
  Swimming: '🏊',
  Hiking:   '🥾',
  Yoga:     '🧘',
  HIIT:     '⚡',
  Strength: '🏋️',
  Rowing:   '🚣',
  Elliptical: '〇',
  Dance:    '💃',
  Cooldown: '🌿',
};

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

export interface WorkoutTypeOverlayProps {
  metrics: WorkoutMetrics | null;
}

export function WorkoutTypeOverlay({ metrics }: WorkoutTypeOverlayProps) {
  const hasData    = metrics != null && metrics.workout_type !== '';
  const workoutType = metrics?.workout_type ?? '';
  const icon        = TYPE_ICONS[workoutType] ?? '◉';

  // Local elapsed time counter (same trick as ElapsedTimeOverlay)
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
      <div className="workout-overlay">
        <div className="workout-overlay__top">
          <span className="workout-overlay__type-icon" aria-hidden="true">
            {hasData ? icon : '◉'}
          </span>
          <span className={`workout-overlay__name${!hasData ? ' workout-overlay__name--empty' : ''}`}>
            {hasData ? workoutType : 'Waiting…'}
          </span>
          <div className="workout-overlay__status">
            <div className={`workout-overlay__dot${!hasData ? ' workout-overlay__dot--inactive' : ''}`} />
            <span className="workout-overlay__status-text">
              {hasData ? 'Live' : 'Idle'}
            </span>
          </div>
        </div>

        {hasData && (
          <>
            <div className="workout-overlay__divider" />
            <div className="workout-overlay__time-row">
              <span className="workout-overlay__time-label">Time</span>
              <span className="workout-overlay__time-value">
                {formatTime(displaySeconds)}
              </span>
            </div>
          </>
        )}
      </div>
    </OverlayWrapper>
  );
}
