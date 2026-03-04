import type { WorkoutMetrics } from '../../types/metrics';
import { OverlayWrapper } from '../shared/OverlayWrapper';
import './CaloriesOverlay.css';

export interface CaloriesOverlayProps {
  metrics: WorkoutMetrics | null;
  transparent?: boolean;
}

export function CaloriesOverlay({ metrics, transparent = false }: CaloriesOverlayProps) {
  const kcal    = metrics?.active_energy_kcal;
  const hasData = kcal != null;

  return (
    <OverlayWrapper hasData={hasData}>
      <div className={`widget calories-overlay${transparent ? ' widget--transparent' : ''}`}>
        <div className="widget__header">
          <span className="widget__icon calories-overlay__icon" aria-hidden="true">◉</span>
          <span className="widget__label">Calories</span>
        </div>

        <div className="widget__value">
          <span className="widget__number" key={kcal != null ? Math.round(kcal) : 'empty'}>
            {kcal != null ? Math.round(kcal) : '—'}
          </span>
          <span className="widget__unit">kcal</span>
        </div>
      </div>
    </OverlayWrapper>
  );
}
