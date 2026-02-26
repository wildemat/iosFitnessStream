import React, { useState, useCallback } from "react";
import { useMetricsStream } from "./hooks/useMetricsStream";
import { HeartRateOverlay } from "./components/HeartRateOverlay/HeartRateOverlay";
import { ElapsedTimeOverlay } from "./components/ElapsedTimeOverlay/ElapsedTimeOverlay";
import { PaceOverlay } from "./components/PaceOverlay/PaceOverlay";
import { DistanceOverlay } from "./components/DistanceOverlay/DistanceOverlay";
import { CaloriesOverlay } from "./components/CaloriesOverlay/CaloriesOverlay";
import { StepsOverlay } from "./components/StepsOverlay/StepsOverlay";
import { ElevationOverlay } from "./components/ElevationOverlay/ElevationOverlay";
import { WorkoutTypeOverlay } from "./components/WorkoutTypeOverlay/WorkoutTypeOverlay";
import { MinimapOverlay } from "./components/MinimapOverlay/MinimapOverlay";
import { DashboardGrid } from "./components/DashboardGrid/DashboardGrid";
import { ControlBar } from "./components/ControlBar/ControlBar";

const DEFAULT_SERVER = "http://localhost:8080/events";

function readParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    overlay: p.get("overlay"),
    serverUrl: p.get("server") ?? DEFAULT_SERVER,
    zoom: p.get("zoom") != null ? Number(p.get("zoom")) : undefined,
    transparent: p.get("transparent") === "true",
  };
}

function pushParams(state: {
  overlay: string | null;
  transparent: boolean;
  zoom: number | undefined;
  serverUrl: string;
}) {
  const p = new URLSearchParams();
  if (state.overlay) p.set("overlay", state.overlay);
  if (state.transparent) p.set("transparent", "true");
  if (state.zoom != null) p.set("zoom", String(state.zoom));
  if (state.serverUrl !== DEFAULT_SERVER) p.set("server", state.serverUrl);
  const qs = p.toString();
  window.history.replaceState(
    null,
    "",
    qs ? `?${qs}` : window.location.pathname,
  );
}

export default function App() {
  const init = readParams();
  const [overlay, setOverlay] = useState(init.overlay);
  const [transparent, setTransparent] = useState(init.transparent);
  const [zoom, setZoom] = useState(init.zoom);
  const [serverUrl, setServerUrl] = useState(init.serverUrl);

  const sync = useCallback(
    (
      next: Partial<{
        overlay: string | null;
        transparent: boolean;
        zoom: number | undefined;
        serverUrl: string;
      }>,
    ) => {
      const state = {
        overlay: next.overlay !== undefined ? next.overlay : overlay,
        transparent:
          next.transparent !== undefined ? next.transparent : transparent,
        zoom: next.zoom !== undefined ? next.zoom : zoom,
        serverUrl: next.serverUrl !== undefined ? next.serverUrl : serverUrl,
      };
      pushParams(state);
    },
    [overlay, transparent, zoom, serverUrl],
  );

  const handleOverlay = useCallback(
    (v: string | null) => {
      setOverlay(v);
      const nextZoom = v !== "minimap" ? undefined : zoom;
      if (v !== "minimap") setZoom(undefined);
      sync({ overlay: v, zoom: nextZoom });
    },
    [sync, zoom],
  );

  const handleTransparent = useCallback(
    (v: boolean) => {
      setTransparent(v);
      sync({ transparent: v });
    },
    [sync],
  );

  const handleZoom = useCallback(
    (v: number) => {
      const clamped = Math.max(1, Math.min(20, v));
      setZoom(clamped);
      sync({ zoom: clamped });
    },
    [sync],
  );

  const handleServer = useCallback(
    (v: string) => {
      // Debounce the update by 5 seconds (5000ms)
      if ((handleServer as any)._debounceTimer) {
        clearTimeout((handleServer as any)._debounceTimer);
      }
      (handleServer as any)._debounceTimer = setTimeout(() => {
        setServerUrl(v);
        sync({ serverUrl: v });
      }, 5000);
    },
    [sync],
  );

  const metrics = useMetricsStream(serverUrl);

  const components: Record<string, React.ReactNode> = {
    heartrate: <HeartRateOverlay metrics={metrics} transparent={transparent} />,
    elapsed: <ElapsedTimeOverlay metrics={metrics} transparent={transparent} />,
    pace: <PaceOverlay metrics={metrics} transparent={transparent} />,
    distance: <DistanceOverlay metrics={metrics} transparent={transparent} />,
    calories: <CaloriesOverlay metrics={metrics} transparent={transparent} />,
    steps: <StepsOverlay metrics={metrics} transparent={transparent} />,
    elevation: <ElevationOverlay metrics={metrics} transparent={transparent} />,
    workout: <WorkoutTypeOverlay metrics={metrics} transparent={transparent} />,
    minimap: (
      <MinimapOverlay metrics={metrics} zoom={zoom} transparent={transparent} />
    ),
  };

  const content = overlay ? (
    <div style={{ display: "inline-block" }}>
      {components[overlay] ?? components["workout"]}
    </div>
  ) : (
    <DashboardGrid metrics={metrics} transparent={transparent} />
  );

  return (
    <>
      <ControlBar
        overlay={overlay}
        transparent={transparent}
        zoom={zoom}
        serverUrl={serverUrl}
        onOverlayChange={handleOverlay}
        onTransparentChange={handleTransparent}
        onZoomChange={handleZoom}
        onServerUrlChange={handleServer}
      />
      {content}
    </>
  );
}
