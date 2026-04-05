import { useEffect, useRef, useState } from 'react';
import type { WorkoutMetrics } from '../../types/metrics';
import { OverlayWrapper } from '../shared/OverlayWrapper';
import { paceKmToMi, formatPaceValue } from '../../utils/units';
import './PaceOverlay.css';

type TrendDir = 'faster' | 'slower' | 'steady';

function getTrend(current: number, previous: number | null): TrendDir {
  if (previous === null) return 'steady';
  const delta = current - previous;
  if (delta < -0.05) return 'faster';
  if (delta >  0.05) return 'slower';
  return 'steady';
}

export interface PaceOverlayProps {
  metrics: WorkoutMetrics | null;
  transparent?: boolean;
  useImperial?: boolean;
}

export function PaceOverlay({ metrics, transparent = false, useImperial = false }: PaceOverlayProps) {
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

  const displayPace = pace != null
    ? formatPaceValue(useImperial ? paceKmToMi(pace) : pace)
    : '—:——';
  const paceUnit = useImperial ? '/mi' : '/km';

  return (
    <OverlayWrapper hasData={hasData}>
      <div className={`widget pace-overlay${transparent ? ' widget--transparent' : ''}`}>
        <div className="widget__header">
          <span className="widget__icon pace-overlay__icon" aria-hidden="true">⟳</span>
          <span className="widget__label">Pace</span>
        </div>

        <div className="widget__value pace-overlay__value">
          <span className="widget__number" key={pace}>
            {displayPace}
          </span>
          <span className="widget__unit">{paceUnit}</span>
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
