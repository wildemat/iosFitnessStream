import React, { useEffect, useRef } from "react";
import type { WorkoutMetrics } from "../../types/metrics";
import { useLayoutStore, type PanelKey } from "../../store/useLayoutStore";
import { DraggablePanel } from "../DraggablePanel/DraggablePanel";
import { HeartRateOverlay } from "../HeartRateOverlay/HeartRateOverlay";
import { ElapsedTimeOverlay } from "../ElapsedTimeOverlay/ElapsedTimeOverlay";
import { PaceOverlay } from "../PaceOverlay/PaceOverlay";
import { DistanceOverlay } from "../DistanceOverlay/DistanceOverlay";
import { CaloriesOverlay } from "../CaloriesOverlay/CaloriesOverlay";
import { StepsOverlay } from "../StepsOverlay/StepsOverlay";
import { ElevationOverlay } from "../ElevationOverlay/ElevationOverlay";
import { WorkoutTypeOverlay } from "../WorkoutTypeOverlay/WorkoutTypeOverlay";
import { MinimapOverlay } from "../MinimapOverlay/MinimapOverlay";
import "./DashboardGrid.css";

export interface DashboardGridProps {
  metrics: WorkoutMetrics | null;
}

interface RendererProps {
  metrics: WorkoutMetrics | null;
}

const RENDERERS: Record<PanelKey, (p: RendererProps) => React.ReactNode> = {
  workout: (p) => <WorkoutTypeOverlay metrics={p.metrics} />,
  heartrate: (p) => <HeartRateOverlay metrics={p.metrics} />,
  elapsed: (p) => <ElapsedTimeOverlay metrics={p.metrics} />,
  pace: (p) => <PaceOverlay metrics={p.metrics} />,
  distance: (p) => <DistanceOverlay metrics={p.metrics} />,
  calories: (p) => <CaloriesOverlay metrics={p.metrics} />,
  steps: (p) => <StepsOverlay metrics={p.metrics} />,
  elevation: (p) => <ElevationOverlay metrics={p.metrics} />,
  minimap: (p) => <MinimapOverlay metrics={p.metrics} />,
};

export function DashboardGrid({ metrics }: DashboardGridProps) {
  const resetLayout = useLayoutStore((s) => s.resetLayout);
  const setControlBarHeight = useLayoutStore((s) => s.setControlBarHeight);
  const getEnabledKeys = useLayoutStore((s) => s.getEnabledKeys);
  const hasInit = useRef(false);

  useEffect(() => {
    const bar = document.querySelector(".control-bar");
    const cbh = bar ? bar.getBoundingClientRect().height : 0;
    setControlBarHeight(cbh);
    if (!hasInit.current) {
      resetLayout(cbh);
      hasInit.current = true;
    }
  }, [resetLayout, setControlBarHeight]);

  const selectPanel = useLayoutStore((s) => s.selectPanel);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) selectPanel(null);
  };

  const enabledKeys = getEnabledKeys();

  return (
    <div className="dashboard-canvas" onMouseDown={handleCanvasClick}>
      {enabledKeys.map((key) => (
        <DraggablePanel key={key} panelKey={key}>
          {RENDERERS[key]({ metrics })}
        </DraggablePanel>
      ))}
    </div>
  );
}
