import { useEffect, useRef, useState } from 'react';
import type { WorkoutMetrics } from '../../types/metrics';
import { OverlayWrapper } from '../shared/OverlayWrapper';
import './PaceOverlay.css';

function formatPace(minPerKm: number): string {
  const totalSecs = minPerKm * 60;
  const mins = Math.floor(totalSecs / 60);
  const secs = Math.round(totalSecs % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

type TrendDir = 'faster' | 'slower' | 'steady';

function getTrend(current: number, previous: number | null): TrendDir {
  if (previous === null) return 'steady';
  const delta = current - previous; // lower pace = faster
  if (delta < -0.05) return 'faster';
  if (delta >  0.05) return 'slower';
  return 'steady';
}

export interface PaceOverlayProps {
  metrics: WorkoutMetrics | null;
}

export function PaceOverlay({ metrics }: PaceOverlayProps) {
  const pace    = metrics?.pace_min_per_km;
  const hasData = pace != null;

  const prevPaceRef = useRef<number | null>(null);
  const [trend, setTrend] = useState<TrendDir>('steady');

  useEffect(() => {
    if (pace != null) {
      setTrend(getTrend(pace, prevPaceRef.current));
      prevPaceRef.current = pace;
    }
  }, [pace]);

  const TREND_ICONS: Record<TrendDir, string> = {
    faster: '↓',
    slower: '↑',
    steady: '→',
  };
  const TREND_LABELS: Record<TrendDir, string> = {
    faster: 'picking up',
    slower: 'slowing',
    steady: 'steady',
  };

  return (
    <OverlayWrapper hasData={hasData}>
      <div className="pace-overlay">
        <div className="pace-overlay__header">
          <span className="pace-overlay__icon" aria-hidden="true">⟳</span>
          <span className="pace-overlay__label">Pace</span>
        </div>

        <div className="pace-overlay__value">
          <span className="pace-overlay__number" key={pace}>
            {pace != null ? formatPace(pace) : '—:——'}
          </span>
          <span className="pace-overlay__unit">/km</span>
        </div>

        {hasData && (
          <div className={`pace-overlay__trend pace-overlay__trend--${trend}`}>
            <span>{TREND_ICONS[trend]}</span>
            <span>{TREND_LABELS[trend]}</span>
          </div>
        )}
      </div>
    </OverlayWrapper>
  );
}
