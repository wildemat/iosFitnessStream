import React from 'react';
import { useMetricsStream } from './hooks/useMetricsStream';
import { HeartRateOverlay }   from './components/HeartRateOverlay/HeartRateOverlay';
import { ElapsedTimeOverlay } from './components/ElapsedTimeOverlay/ElapsedTimeOverlay';
import { PaceOverlay }        from './components/PaceOverlay/PaceOverlay';
import { DistanceOverlay }    from './components/DistanceOverlay/DistanceOverlay';
import { CaloriesOverlay }    from './components/CaloriesOverlay/CaloriesOverlay';
import { StepsOverlay }       from './components/StepsOverlay/StepsOverlay';
import { ElevationOverlay }   from './components/ElevationOverlay/ElevationOverlay';
import { WorkoutTypeOverlay } from './components/WorkoutTypeOverlay/WorkoutTypeOverlay';

/**
 * OBS Browser Source routing.
 *
 * Add a Browser Source in OBS and point it to one of:
 *   http://localhost:5173/?overlay=heartrate
 *   http://localhost:5173/?overlay=elapsed
 *   http://localhost:5173/?overlay=pace
 *   http://localhost:5173/?overlay=distance
 *   http://localhost:5173/?overlay=calories
 *   http://localhost:5173/?overlay=steps
 *   http://localhost:5173/?overlay=elevation
 *   http://localhost:5173/?overlay=workout
 *
 * The Vite dev server and local/server.js must both be running.
 * Set the server URL via ?server=http://your-mac-ip:8080
 */
export default function App() {
  const params     = new URLSearchParams(window.location.search);
  const overlay    = params.get('overlay') ?? 'workout';
  const serverUrl  = params.get('server')  ?? 'http://localhost:8080/events';

  const metrics = useMetricsStream(serverUrl);

  const components: Record<string, React.ReactNode> = {
    heartrate: <HeartRateOverlay   metrics={metrics} />,
    elapsed:   <ElapsedTimeOverlay metrics={metrics} />,
    pace:      <PaceOverlay        metrics={metrics} />,
    distance:  <DistanceOverlay    metrics={metrics} />,
    calories:  <CaloriesOverlay    metrics={metrics} />,
    steps:     <StepsOverlay       metrics={metrics} />,
    elevation: <ElevationOverlay   metrics={metrics} />,
    workout:   <WorkoutTypeOverlay metrics={metrics} />,
  };

  return (
    <div style={{ display: 'inline-block' }}>
      {components[overlay] ?? components['workout']}
    </div>
  );
}
