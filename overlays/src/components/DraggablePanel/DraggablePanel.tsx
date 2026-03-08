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

function clientXY(e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) {
  if ("touches" in e) {
    const t = e.touches[0] ?? (e as TouchEvent).changedTouches[0];
    return { x: t.clientX, y: t.clientY };
  }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
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

  const startDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if ((e.target as HTMLElement).dataset.resize) return;
      if ((e.target as HTMLElement).closest(".draggable-panel__gear")) return;
      e.preventDefault();
      e.stopPropagation();

      if (!isSelected) {
        selectPanel(panelKey);
        return;
      }

      const { x, y } = clientXY(e);
      dragRef.current = { startX: x, startY: y, origX: rect.x, origY: rect.y, moved: false };

      const onMove = (ev: MouseEvent | TouchEvent) => {
        if (!dragRef.current) return;
        ev.preventDefault();
        dragRef.current.moved = true;
        const pos = clientXY(ev);
        movePanel(panelKey, dragRef.current.origX + pos.x - dragRef.current.startX, dragRef.current.origY + pos.y - dragRef.current.startY);
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onUp);
      };

      window.addEventListener("mousemove", onMove, { passive: false });
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onUp);
    },
    [panelKey, isSelected, rect.x, rect.y, movePanel, selectPanel],
  );

  const startResize = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isSelected) return;
      e.preventDefault();
      e.stopPropagation();
      const { x, y } = clientXY(e);
      resizeRef.current = { startX: x, startY: y, origW: actualW, origH: actualH };

      const onMove = (ev: MouseEvent | TouchEvent) => {
        if (!resizeRef.current) return;
        ev.preventDefault();
        const pos = clientXY(ev);
        const dw = pos.x - resizeRef.current.startX;
        const dh = pos.y - resizeRef.current.startY;
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
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onUp);
      };

      window.addEventListener("mousemove", onMove, { passive: false });
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onUp);
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
        touchAction: "none",
      }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
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
            onMouseDown={startResize}
            onTouchStart={startResize}
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
