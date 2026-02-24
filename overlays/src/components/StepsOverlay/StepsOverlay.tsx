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
      <div className={`steps-overlay${transparent ? ' steps-overlay--transparent' : ''}`}>
        <div className="steps-overlay__header">
          <span className="steps-overlay__icon" aria-hidden="true">⊹</span>
          <span className="steps-overlay__label">Steps</span>
        </div>

        <div className="steps-overlay__value">
          <span className="steps-overlay__number" key={steps}>
            {steps != null ? steps.toLocaleString() : '—'}
          </span>
          <span className="steps-overlay__unit">steps</span>
        </div>
      </div>
    </OverlayWrapper>
  );
}
