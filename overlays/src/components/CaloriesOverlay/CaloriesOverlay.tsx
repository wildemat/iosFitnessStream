import type { WorkoutMetrics } from '../../types/metrics';
import { OverlayWrapper } from '../shared/OverlayWrapper';
import './CaloriesOverlay.css';

export interface CaloriesOverlayProps {
  metrics: WorkoutMetrics | null;
}

export function CaloriesOverlay({ metrics }: CaloriesOverlayProps) {
  const kcal    = metrics?.active_energy_kcal;
  const hasData = kcal != null;

  return (
    <OverlayWrapper hasData={hasData}>
      <div className="calories-overlay">
        <div className="calories-overlay__header">
          <span className="calories-overlay__icon" aria-hidden="true">◉</span>
          <span className="calories-overlay__label">Calories</span>
        </div>

        <div className="calories-overlay__value">
          <span className="calories-overlay__number" key={kcal != null ? Math.round(kcal) : 'empty'}>
            {kcal != null ? Math.round(kcal) : '—'}
          </span>
          <span className="calories-overlay__unit">kcal</span>
        </div>
      </div>
    </OverlayWrapper>
  );
}
