import { useState } from "react";
import {
  useLayoutStore,
  PANEL_KEYS,
  type PanelKey,
} from "../../store/useLayoutStore";
import "./ControlBar.css";

const WIDGET_LABELS: Record<PanelKey, string> = {
  heartrate: "Heart Rate",
  elapsed: "Time",
  pace: "Pace",
  distance: "Distance",
  calories: "Calories",
  steps: "Steps",
  elevation: "Elevation",
  workout: "Workout",
  minimap: "Minimap",
};

export const DEFAULT_SERVER = "http://localhost:8080/events";

export interface ControlBarProps {
  serverUrl: string;
  listening: boolean;
  onServerUrlChange: (value: string) => void;
  onListeningChange: (value: boolean) => void;
}

export const ControlBar = ({
  serverUrl: activeUrl,
  listening,
  onServerUrlChange,
  onListeningChange,
}: ControlBarProps) => {
  const [draft, setDraft] = useState(activeUrl);
  const isDirty = draft !== activeUrl;
  const resetLayout = useLayoutStore((s) => s.resetLayout);
  const toggleWidget = useLayoutStore((s) => s.toggleWidget);
  const enabledWidgets = useLayoutStore((s) => s.enabledWidgets);

  return (
    <div className="control-bar">
      <div className="control-bar__section">
        <span className="control-bar__label">Widgets</span>
        <div className="control-bar__group">
          {PANEL_KEYS.map((key) => (
            <button
              key={key}
              className={`control-bar__btn ${enabledWidgets.has(key) ? "control-bar__btn--active" : ""}`}
              onClick={() => toggleWidget(key)}
            >
              {WIDGET_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="control-bar__divider" />

      <div className="control-bar__section">
        <span className="control-bar__label">Options</span>
        <div className="control-bar__group">
          <button className="control-bar__btn" onClick={() => resetLayout()}>
            Reset Layout
          </button>
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
