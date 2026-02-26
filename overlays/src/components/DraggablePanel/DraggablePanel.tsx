import React, { useCallback, useRef } from "react";
import { useLayoutStore, type PanelKey } from "../../store/useLayoutStore";
import "./DraggablePanel.css";

export interface DraggablePanelProps {
  panelKey: PanelKey;
  children: React.ReactNode;
}

export function DraggablePanel({ panelKey, children }: DraggablePanelProps) {
  const rect = useLayoutStore((s) => s.panels[panelKey]);
  const isSelected = useLayoutStore((s) => s.selectedPanel === panelKey);
  const movePanel = useLayoutStore((s) => s.movePanel);
  const resizePanel = useLayoutStore((s) => s.resizePanel);
  const selectPanel = useLayoutStore((s) => s.selectPanel);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const resizeRef = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).dataset.resize) return;
      e.preventDefault();
      e.stopPropagation();

      if (!isSelected) {
        selectPanel(panelKey);
        return;
      }

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: rect.x,
        origY: rect.y,
        moved: false,
      };

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        dragRef.current.moved = true;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        movePanel(
          panelKey,
          dragRef.current.origX + dx,
          dragRef.current.origY + dy,
        );
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [panelKey, isSelected, rect.x, rect.y, movePanel, selectPanel],
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelected) return;
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origW: rect.w,
        origH: rect.h,
      };

      const onMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const dw = ev.clientX - resizeRef.current.startX;
        const dh = ev.clientY - resizeRef.current.startY;
        resizePanel(
          panelKey,
          resizeRef.current.origW + dw,
          resizeRef.current.origH + dh,
        );
      };

      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [panelKey, isSelected, rect.w, rect.h, resizePanel],
  );

  const cls = [
    "draggable-panel",
    isSelected && "draggable-panel--selected",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cls}
      style={{
        transform: `translate(${rect.x}px, ${rect.y}px)`,
        width: rect.w,
        height: rect.h,
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="draggable-panel__content">{children}</div>
      {isSelected && (
        <div
          className="draggable-panel__resize-handle"
          data-resize="true"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}
