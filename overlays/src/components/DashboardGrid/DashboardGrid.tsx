import React, { useEffect, useRef } from "react";
import type { WorkoutMetrics } from "../../types/metrics";
import { useLayoutStore, PANEL_KEYS } from "../../store/useLayoutStore";
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
  transparent?: boolean;
}

type PanelKey = (typeof PANEL_KEYS)[number];

const RENDERERS: Record<
  PanelKey,
  (p: DashboardGridProps) => React.ReactNode
> = {
  workout: (p) => (
    <WorkoutTypeOverlay metrics={p.metrics} transparent={p.transparent} />
  ),
  heartrate: (p) => (
    <HeartRateOverlay metrics={p.metrics} transparent={p.transparent} />
  ),
  elapsed: (p) => (
    <ElapsedTimeOverlay metrics={p.metrics} transparent={p.transparent} />
  ),
  pace: (p) => (
    <PaceOverlay metrics={p.metrics} transparent={p.transparent} />
  ),
  distance: (p) => (
    <DistanceOverlay metrics={p.metrics} transparent={p.transparent} />
  ),
  calories: (p) => (
    <CaloriesOverlay metrics={p.metrics} transparent={p.transparent} />
  ),
  steps: (p) => (
    <StepsOverlay metrics={p.metrics} transparent={p.transparent} />
  ),
  elevation: (p) => (
    <ElevationOverlay metrics={p.metrics} transparent={p.transparent} />
  ),
  minimap: (p) => (
    <MinimapOverlay metrics={p.metrics} transparent={p.transparent} />
  ),
};

export function DashboardGrid({
  metrics,
  transparent = false,
}: DashboardGridProps) {
  const resetLayout = useLayoutStore((s) => s.resetLayout);
  const setControlBarHeight = useLayoutStore((s) => s.setControlBarHeight);
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

  return (
    <div className="dashboard-canvas" onMouseDown={handleCanvasClick}>
      {PANEL_KEYS.map((key) => (
        <DraggablePanel key={key} panelKey={key}>
          {RENDERERS[key]({ metrics, transparent })}
        </DraggablePanel>
      ))}
    </div>
  );
}
