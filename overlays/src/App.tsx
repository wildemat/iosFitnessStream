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
import { MinimapOverlay }     from './components/MinimapOverlay/MinimapOverlay';

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
 *   http://localhost:5173/?overlay=minimap
 *   http://localhost:5173/?overlay=minimap&zoom=17
 *
 * Append &transparent=true to any overlay URL to remove the card
 * background and border, leaving just the content floating on the stream.
 *
 * The Vite dev server and local/server.js must both be running.
 * Set the server URL via ?server=http://your-mac-ip:8080
 */
export default function App() {
  const params      = new URLSearchParams(window.location.search);
  const overlay     = params.get('overlay')     ?? 'workout';
  const serverUrl   = params.get('server')      ?? 'http://localhost:8080/events';
  const zoom        = params.get('zoom')        != null ? Number(params.get('zoom')) : undefined;
  const transparent = params.get('transparent') === 'true';

  const metrics = useMetricsStream(serverUrl);

  const components: Record<string, React.ReactNode> = {
    heartrate: <HeartRateOverlay   metrics={metrics} transparent={transparent} />,
    elapsed:   <ElapsedTimeOverlay metrics={metrics} transparent={transparent} />,
    pace:      <PaceOverlay        metrics={metrics} transparent={transparent} />,
    distance:  <DistanceOverlay    metrics={metrics} transparent={transparent} />,
    calories:  <CaloriesOverlay    metrics={metrics} transparent={transparent} />,
    steps:     <StepsOverlay       metrics={metrics} transparent={transparent} />,
    elevation: <ElevationOverlay   metrics={metrics} transparent={transparent} />,
    workout:   <WorkoutTypeOverlay metrics={metrics} transparent={transparent} />,
    minimap:   <MinimapOverlay     metrics={metrics} zoom={zoom} transparent={transparent} />,
  };

  return (
    <div style={{ display: 'inline-block' }}>
      {components[overlay] ?? components['workout']}
    </div>
  );
}
