import type { WorkoutMetrics } from '../../types/metrics';
import { HeartRateOverlay }   from '../HeartRateOverlay/HeartRateOverlay';
import { ElapsedTimeOverlay } from '../ElapsedTimeOverlay/ElapsedTimeOverlay';
import { PaceOverlay }        from '../PaceOverlay/PaceOverlay';
import { DistanceOverlay }    from '../DistanceOverlay/DistanceOverlay';
import { CaloriesOverlay }    from '../CaloriesOverlay/CaloriesOverlay';
import { StepsOverlay }       from '../StepsOverlay/StepsOverlay';
import { ElevationOverlay }   from '../ElevationOverlay/ElevationOverlay';
import { WorkoutTypeOverlay } from '../WorkoutTypeOverlay/WorkoutTypeOverlay';
import { MinimapOverlay }     from '../MinimapOverlay/MinimapOverlay';
import './DashboardGrid.css';

export interface DashboardGridProps {
  metrics: WorkoutMetrics | null;
  transparent?: boolean;
}

const CELLS: Array<{ key: string; render: (props: DashboardGridProps) => React.ReactNode }> = [
  { key: 'workout',   render: (p) => <WorkoutTypeOverlay metrics={p.metrics} transparent={p.transparent} /> },
  { key: 'heartrate', render: (p) => <HeartRateOverlay   metrics={p.metrics} transparent={p.transparent} /> },
  { key: 'elapsed',   render: (p) => <ElapsedTimeOverlay metrics={p.metrics} transparent={p.transparent} /> },
  { key: 'pace',      render: (p) => <PaceOverlay        metrics={p.metrics} transparent={p.transparent} /> },
  { key: 'distance',  render: (p) => <DistanceOverlay    metrics={p.metrics} transparent={p.transparent} /> },
  { key: 'calories',  render: (p) => <CaloriesOverlay    metrics={p.metrics} transparent={p.transparent} /> },
  { key: 'steps',     render: (p) => <StepsOverlay       metrics={p.metrics} transparent={p.transparent} /> },
  { key: 'elevation', render: (p) => <ElevationOverlay   metrics={p.metrics} transparent={p.transparent} /> },
  { key: 'minimap',   render: (p) => <MinimapOverlay     metrics={p.metrics} transparent={p.transparent} /> },
];

export function DashboardGrid({ metrics, transparent = false }: DashboardGridProps) {
  return (
    <div className="dashboard-grid">
      {CELLS.map(({ key, render }) => (
        <div key={key} className="dashboard-grid__cell">
          {render({ metrics, transparent })}
        </div>
      ))}
    </div>
  );
}
