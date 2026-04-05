import type { WorkoutMetrics } from '../../types/metrics';
import { OverlayWrapper } from '../shared/OverlayWrapper';
import { formatImperialDistance, formatMetricDistance } from '../../utils/units';
import './DistanceOverlay.css';

export interface DistanceOverlayProps {
  metrics: WorkoutMetrics | null;
  transparent?: boolean;
  useImperial?: boolean;
}

export function DistanceOverlay({ metrics, transparent = false, useImperial = false }: DistanceOverlayProps) {
  const meters  = metrics?.distance_meters;
  const hasData = meters != null;

  const { value: displayNum, unit } = meters == null
    ? { value: '—', unit: useImperial ? 'mi' : 'km' }
    : useImperial
      ? formatImperialDistance(meters)
      : formatMetricDistance(meters);

  const isKm = !useImperial && (meters ?? 0) >= 1000;

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
