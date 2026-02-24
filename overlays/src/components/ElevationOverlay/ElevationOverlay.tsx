import { useEffect, useRef, useState } from 'react';
import type { WorkoutMetrics } from '../../types/metrics';
import { OverlayWrapper } from '../shared/OverlayWrapper';
import './ElevationOverlay.css';

type DeltaDir = 'gain' | 'loss' | 'flat';

export interface ElevationOverlayProps {
  metrics: WorkoutMetrics | null;
  transparent?: boolean;
}

export function ElevationOverlay({ metrics, transparent = false }: ElevationOverlayProps) {
  const elev    = metrics?.elevation_meters;
  const hasData = elev != null;

  const baseElevRef = useRef<number | null>(null);
  const [delta, setDelta] = useState<number>(0);
  const [dir, setDir]     = useState<DeltaDir>('flat');

  useEffect(() => {
    if (elev == null) return;

    if (baseElevRef.current === null) {
      baseElevRef.current = elev;
    }

    const diff = elev - baseElevRef.current;
    setDelta(Math.abs(diff));
    setDir(diff > 2 ? 'gain' : diff < -2 ? 'loss' : 'flat');
  }, [elev]);

  const DELTA_ICONS: Record<DeltaDir, string> = {
    gain: '↑',
    loss: '↓',
    flat: '→',
  };
  const DELTA_LABELS: Record<DeltaDir, string> = {
    gain: `+${Math.round(delta)} m gain`,
    loss: `−${Math.round(delta)} m loss`,
    flat: 'flat',
  };

  return (
    <OverlayWrapper hasData={hasData}>
      <div className={`elevation-overlay${transparent ? ' elevation-overlay--transparent' : ''}`}>
        <div className="elevation-overlay__header">
          <span className="elevation-overlay__icon" aria-hidden="true">△</span>
          <span className="elevation-overlay__label">Elevation</span>
        </div>

        <div className="elevation-overlay__value">
          <span className="elevation-overlay__number" key={elev != null ? Math.round(elev) : 'empty'}>
            {elev != null ? Math.round(elev) : '—'}
          </span>
          <span className="elevation-overlay__unit">m</span>
        </div>

        {hasData && (
          <div className={`elevation-overlay__delta elevation-overlay__delta--${dir}`}>
            <span>{DELTA_ICONS[dir]}</span>
            <span>{DELTA_LABELS[dir]}</span>
          </div>
        )}
      </div>
    </OverlayWrapper>
  );
}
