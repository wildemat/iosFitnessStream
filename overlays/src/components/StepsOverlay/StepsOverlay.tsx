import type { WorkoutMetrics } from '../../types/metrics';
import { OverlayWrapper } from '../shared/OverlayWrapper';
import './StepsOverlay.css';

export interface StepsOverlayProps {
  metrics: WorkoutMetrics | null;
  transparent?: boolean;
}

export function StepsOverlay({ metrics, transparent = false }: StepsOverlayProps) {
  const steps   = metrics?.step_count;
  const hasData = steps != null;

  return (
    <OverlayWrapper hasData={hasData}>
      <div className={`widget steps-overlay${transparent ? ' widget--transparent' : ''}`}>
        <div className="widget__header">
          <span className="widget__icon steps-overlay__icon" aria-hidden="true">⊹</span>
          <span className="widget__label">Steps</span>
        </div>

        <div className="widget__value">
          <span className="widget__number" key={steps}>
            {steps != null ? steps.toLocaleString() : '—'}
          </span>
          <span className="widget__unit steps-overlay__unit">steps</span>
        </div>
      </div>
    </OverlayWrapper>
  );
}
