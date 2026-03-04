import React from "react";
import {
  useLayoutStore,
  THEMES,
  type PanelKey,
  type ThemeId,
} from "../../store/useLayoutStore";
import "./WidgetOptionsPopover.css";

interface WidgetOptionsPopoverProps {
  panelKey: PanelKey;
  onClose: () => void;
}

export function WidgetOptionsPopover({
  panelKey,
  onClose,
}: WidgetOptionsPopoverProps) {
  const opts = useLayoutStore((s) => s.widgetOptions[panelKey]);
  const setOpt = useLayoutStore((s) => s.setWidgetOption);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="wop-backdrop" onMouseDown={handleBackdropClick}>
      <div
        className="wop"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="wop__header">
          <span className="wop__title">{panelKey}</span>
          <button className="wop__close" onClick={onClose}>
            ×
          </button>
        </div>

        <label className="wop__row">
          <span className="wop__label">Theme</span>
          <select
            className="wop__select"
            value={opts.theme}
            onChange={(e) =>
              setOpt(panelKey, { theme: e.target.value as ThemeId })
            }
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="wop__row">
          <span className="wop__label">Transparent</span>
          <input
            type="checkbox"
            checked={opts.transparent}
            onChange={(e) => setOpt(panelKey, { transparent: e.target.checked })}
          />
        </label>

        <label className="wop__row">
          <span className="wop__label">Opacity</span>
          <input
            className="wop__range"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opts.opacity}
            onChange={(e) =>
              setOpt(panelKey, { opacity: Number(e.target.value) })
            }
          />
          <span className="wop__value">{Math.round(opts.opacity * 100)}%</span>
        </label>

        {panelKey === "minimap" && (
          <>
            <label className="wop__row">
              <span className="wop__label">Zoom</span>
              <input
                className="wop__range"
                type="range"
                min={1}
                max={20}
                step={1}
                value={opts.zoom}
                onChange={(e) =>
                  setOpt(panelKey, { zoom: Number(e.target.value) })
                }
              />
              <span className="wop__value">{opts.zoom}</span>
            </label>

            <label className="wop__row">
              <span className="wop__label">Coordinates</span>
              <input
                type="checkbox"
                checked={opts.showCoords}
                onChange={(e) =>
                  setOpt(panelKey, { showCoords: e.target.checked })
                }
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
