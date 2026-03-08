import React, { useEffect, useRef, useState } from "react";
import type { WorkoutMetrics } from "../../types/metrics";
import {
  useLayoutStore,
  PAD,
  type PanelKey,
  type WidgetOpts,
} from "../../store/useLayoutStore";
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
  opts: WidgetOpts;
}

const RENDERERS: Record<PanelKey, (p: RendererProps) => React.ReactNode> = {
  workout: (p) => (
    <WorkoutTypeOverlay metrics={p.metrics} transparent={p.opts.transparent} />
  ),
  heartrate: (p) => (
    <HeartRateOverlay metrics={p.metrics} transparent={p.opts.transparent} />
  ),
  elapsed: (p) => (
    <ElapsedTimeOverlay metrics={p.metrics} transparent={p.opts.transparent} />
  ),
  pace: (p) => (
    <PaceOverlay metrics={p.metrics} transparent={p.opts.transparent} />
  ),
  distance: (p) => (
    <DistanceOverlay metrics={p.metrics} transparent={p.opts.transparent} />
  ),
  calories: (p) => (
    <CaloriesOverlay metrics={p.metrics} transparent={p.opts.transparent} />
  ),
  steps: (p) => (
    <StepsOverlay metrics={p.metrics} transparent={p.opts.transparent} />
  ),
  elevation: (p) => (
    <ElevationOverlay metrics={p.metrics} transparent={p.opts.transparent} />
  ),
  minimap: (p) => (
    <MinimapOverlay
      metrics={p.metrics}
      transparent={p.opts.transparent}
      zoom={p.opts.zoom || 15}
      showCoords={p.opts.showCoords}
    />
  ),
};

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

export function DashboardGrid({ metrics }: DashboardGridProps) {
  const resetLayout = useLayoutStore((s) => s.resetLayout);
  const setControlBarHeight = useLayoutStore((s) => s.setControlBarHeight);
  const getEnabledKeys = useLayoutStore((s) => s.getEnabledKeys);
  const widgetOptions = useLayoutStore((s) => s.widgetOptions);
  const panels = useLayoutStore((s) => s.panels);
  const controlBarHeight = useLayoutStore((s) => s.controlBarHeight);
  const hasInit = useRef(false);
  const [vpHeight, setVpHeight] = useState(getViewportHeight);

  useEffect(() => {
    const bar = document.querySelector(".control-bar");
    const cbh = bar ? bar.getBoundingClientRect().height : 0;
    setControlBarHeight(cbh);
    if (!hasInit.current) {
      resetLayout(cbh);
      hasInit.current = true;
    }
  }, [resetLayout, setControlBarHeight]);

  useEffect(() => {
    const onResize = () => {
      setVpHeight(getViewportHeight());
      const bar = document.querySelector(".control-bar");
      const cbh = bar ? bar.getBoundingClientRect().height : 0;
      setControlBarHeight(cbh);
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [setControlBarHeight]);

  const selectPanel = useLayoutStore((s) => s.selectPanel);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) selectPanel(null);
  };

  const enabledKeys = getEnabledKeys();

  const panelBottom = enabledKeys.reduce((max, key) => {
    const p = panels[key];
    return Math.max(max, p.y + p.h);
  }, 0);
  const canvasH = Math.max(vpHeight - controlBarHeight, panelBottom + PAD);

  return (
    <div
      className="dashboard-canvas"
      style={{ minHeight: canvasH }}
      onMouseDown={handleCanvasClick}
    >
      {enabledKeys.map((key) => (
        <DraggablePanel key={key} panelKey={key}>
          {RENDERERS[key]({ metrics, opts: widgetOptions[key] })}
        </DraggablePanel>
      ))}
    </div>
  );
}
