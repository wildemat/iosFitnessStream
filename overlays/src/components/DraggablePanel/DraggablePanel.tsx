import React, { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  useLayoutStore,
  type PanelKey,
} from "../../store/useLayoutStore";
import { WidgetOptionsPopover } from "../WidgetOptionsPopover/WidgetOptionsPopover";
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
  const opts = useLayoutStore((s) => s.widgetOptions[panelKey]);
  const base = useLayoutStore((s) => s.baseDimensions[panelKey]);

  const [showOptions, setShowOptions] = useState(false);

  const scaleX = base.w > 0 ? rect.w / base.w : 1;
  const scaleY = base.h > 0 ? rect.h / base.h : 1;
  const scale = Math.min(scaleX, scaleY);
  const actualW = base.w * scale;
  const actualH = base.h * scale;

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
      if ((e.target as HTMLElement).closest(".draggable-panel__gear")) return;
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
        origW: actualW,
        origH: actualH,
      };

      const onMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const dw = ev.clientX - resizeRef.current.startX;
        const dh = ev.clientY - resizeRef.current.startY;
        const newScale = Math.min(
          (resizeRef.current.origW + dw) / base.w,
          (resizeRef.current.origH + dh) / base.h,
        );
        resizePanel(panelKey, base.w * newScale, base.h * newScale);
      };

      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [panelKey, isSelected, actualW, actualH, base.w, base.h, resizePanel],
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
        width: actualW,
        height: actualH,
        zIndex: isSelected ? 10 : 1,
        opacity: opts.opacity,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="draggable-panel__content"
        style={{
          width: base.w,
          height: base.h,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>

      {isSelected && (
        <>
          <button
            className="draggable-panel__gear"
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions((v) => !v);
            }}
            title="Widget options"
          >
            ⚙
          </button>
          <div
            className="draggable-panel__resize-handle"
            data-resize="true"
            onMouseDown={handleResizeStart}
          />
        </>
      )}

      {showOptions &&
        createPortal(
          <WidgetOptionsPopover
            panelKey={panelKey}
            onClose={() => setShowOptions(false)}
          />,
          document.body,
        )}
    </div>
  );
}
