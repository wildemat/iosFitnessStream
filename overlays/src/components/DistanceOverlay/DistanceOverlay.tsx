import type { WorkoutMetrics } from '../../types/metrics';
import { OverlayWrapper } from '../shared/OverlayWrapper';
import './DistanceOverlay.css';

export interface DistanceOverlayProps {
  metrics: WorkoutMetrics | null;
  transparent?: boolean;
}

export function DistanceOverlay({ metrics, transparent = false }: DistanceOverlayProps) {
  const meters  = metrics?.distance_meters;
  const hasData = meters != null;

  const isKm        = (meters ?? 0) >= 1000;
  const displayNum  = meters == null ? '—' : isKm
    ? (meters / 1000).toFixed(2)
    : String(Math.round(meters));
  const unit        = isKm ? 'km' : 'm';

  return (
    <OverlayWrapper hasData={hasData}>
      <div className={`widget distance-overlay${transparent ? ' widget--transparent' : ''}`}>
        <div className="widget__header">
          <span className="widget__icon distance-overlay__icon" aria-hidden="true">◈</span>
          <span className="widget__label">Distance</span>
        </div>

        <div className="widget__value distance-overlay__value">
          <span className="widget__number" key={displayNum}>
            {displayNum}
          </span>
          <span className="widget__unit distance-overlay__unit">{unit}</span>
        </div>

        {isKm && meters != null && (
          <div className="distance-overlay__sub">
            {Math.round(meters).toLocaleString()} m total
          </div>
        )}
      </div>
    </OverlayWrapper>
  );
}
