import { useState } from "react";
import {
  useLayoutStore,
  PANEL_KEYS,
  type PanelKey,
} from "../../store/useLayoutStore";
import { ImportModal } from "../ImportModal/ImportModal";
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
  delayMs: number;
  listening: boolean;
  onSave: (url: string, delayMs: number) => void;
  onListeningChange: (value: boolean) => void;
}

function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ControlBar = ({
  serverUrl: activeUrl,
  delayMs: activeDelay,
  listening,
  onSave,
  onListeningChange,
}: ControlBarProps) => {
  const [draftUrl, setDraftUrl] = useState(activeUrl);
  const [draftDelay, setDraftDelay] = useState(String(activeDelay));
  const parsedDelay = Math.max(0, parseInt(draftDelay, 10) || 0);
  const isDirty = draftUrl !== activeUrl || parsedDelay !== activeDelay;

  const handleSave = () => {
    if (isDirty) onSave(draftUrl, parsedDelay);
  };

  const resetLayout = useLayoutStore((s) => s.resetLayout);
  const toggleWidget = useLayoutStore((s) => s.toggleWidget);
  const enabledWidgets = useLayoutStore((s) => s.enabledWidgets);
  const exportState = useLayoutStore((s) => s.exportState);
  const importState = useLayoutStore((s) => s.importState);
  const [importOpen, setImportOpen] = useState(false);

  const handleExport = () => {
    const json = exportState();
    downloadJson(json, "overlay-config.json");
  };

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
          <button className="control-bar__btn" onClick={handleExport}>
            Export
          </button>
          <button className="control-bar__btn" onClick={() => setImportOpen(true)}>
            Import
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
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isDirty) handleSave();
            }}
            spellCheck={false}
          />
          <span className="control-bar__label">Delay</span>
          <input
            className="control-bar__input control-bar__input--delay"
            type="number"
            min="0"
            step="100"
            value={draftDelay}
            onChange={(e) => setDraftDelay(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isDirty) handleSave();
            }}
          />
          <span className="control-bar__unit">ms</span>
          <button
            className={`control-bar__btn control-bar__btn--save ${isDirty ? "control-bar__btn--active" : ""}`}
            disabled={!isDirty}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
      {importOpen && (
        <ImportModal
          onImport={importState}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
};
