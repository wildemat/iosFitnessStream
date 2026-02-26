import { useState } from "react";
import "./ControlBar.css";

const OVERLAYS = [
  { value: "heartrate", label: "Heart Rate" },
  { value: "elapsed", label: "Time" },
  { value: "pace", label: "Pace" },
  { value: "distance", label: "Distance" },
  { value: "calories", label: "Calories" },
  { value: "steps", label: "Steps" },
  { value: "elevation", label: "Elevation" },
  { value: "workout", label: "Workout" },
  { value: "minimap", label: "Minimap" },
] as const;

export const DEFAULT_SERVER = "http://localhost:8080/events";

export interface ControlBarProps {
  overlay: string | null;
  transparent: boolean;
  zoom: number | undefined;
  serverUrl: string;
  listening: boolean;
  onOverlayChange: (value: string | null) => void;
  onTransparentChange: (value: boolean) => void;
  onZoomChange: (value: number) => void;
  onServerUrlChange: (value: string) => void;
  onListeningChange: (value: boolean) => void;
}

export const ControlBar = ({
  overlay,
  transparent,
  zoom,
  serverUrl: activeUrl,
  listening,
  onOverlayChange,
  onTransparentChange,
  onZoomChange,
  onServerUrlChange,
  onListeningChange,
}: ControlBarProps) => {
  const [draft, setDraft] = useState(activeUrl);
  const isDirty = draft !== activeUrl;

  return (
    <div className="control-bar">
      <div className="control-bar__section">
        <span className="control-bar__label">View</span>
        <div className="control-bar__group">
          <button
            className={`control-bar__btn ${overlay === null ? "control-bar__btn--active" : ""}`}
            onClick={() => onOverlayChange(null)}
          >
            Dashboard
          </button>
          {OVERLAYS.map(({ value, label }) => (
            <button
              key={value}
              className={`control-bar__btn ${overlay === value ? "control-bar__btn--active" : ""}`}
              onClick={() => onOverlayChange(overlay === value ? null : value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-bar__divider" />

      <div className="control-bar__section">
        <span className="control-bar__label">Options</span>
        <div className="control-bar__group">
          <button
            className={`control-bar__btn ${transparent ? "control-bar__btn--active" : ""}`}
            onClick={() => onTransparentChange(!transparent)}
          >
            Transparent
          </button>

          {overlay === "minimap" && (
            <div className="control-bar__zoom">
              <button
                className="control-bar__btn control-bar__btn--small"
                onClick={() => onZoomChange((zoom ?? 15) - 1)}
              >
                &minus;
              </button>
              <span className="control-bar__zoom-value">Zoom {zoom ?? 15}</span>
              <button
                className="control-bar__btn control-bar__btn--small"
                onClick={() => onZoomChange((zoom ?? 15) + 1)}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="control-bar__divider" />

      <div className="control-bar__section">
        <span className="control-bar__label">Server</span>
        <div className="control-bar__server-row">
          <button
            className={`control-bar__btn ${listening ? "control-bar__btn--listening" : "control-bar__btn--stopped"}`}
            onClick={() => onListeningChange(!listening)}
          >
            {listening ? "● Live" : "○ Stopped"}
          </button>
          <input
            className="control-bar__input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isDirty) onServerUrlChange(draft);
            }}
            spellCheck={false}
          />
          <button
            className={`control-bar__btn control-bar__btn--save ${isDirty ? "control-bar__btn--active" : ""}`}
            disabled={!isDirty}
            onClick={() => onServerUrlChange(draft)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
