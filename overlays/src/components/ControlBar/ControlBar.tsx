import { useState } from "react";
import {
  useLayoutStore,
  PANEL_KEYS,
  type PanelKey,
} from "../../store/useLayoutStore";
import { ImportModal } from "../ImportModal/ImportModal";
import { ExportModal } from "../ExportModal/ExportModal";
import { listPresetNames, loadPresetJson } from "../../utils/presets";
import "./ControlBar.css";

const PRESET_NAMES = listPresetNames();

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

export const DEFAULT_SERVER = "https://api.wildmat.dev/fitness/events";

export interface ControlBarProps {
  serverUrl: string;
  delayMs: number;
  apiKey: string;
  listening: boolean;
  onSave: (url: string, delayMs: number, apiKey: string) => void;
  onListeningChange: (value: boolean) => void;
}

export const ControlBar = ({
  serverUrl: activeUrl,
  delayMs: activeDelay,
  apiKey: activeApiKey,
  listening,
  onSave,
  onListeningChange,
}: ControlBarProps) => {
  const [draftUrl, setDraftUrl] = useState(activeUrl);
  const [draftDelay, setDraftDelay] = useState(String(activeDelay));
  const [draftApiKey, setDraftApiKey] = useState(activeApiKey);
  const parsedDelay = Math.max(0, parseInt(draftDelay, 10) || 0);
  const isDirty = draftUrl !== activeUrl || parsedDelay !== activeDelay || draftApiKey !== activeApiKey;

  const handleSave = () => {
    if (isDirty) onSave(draftUrl, parsedDelay, draftApiKey);
  };

  const resetLayout = useLayoutStore((s) => s.resetLayout);
  const toggleWidget = useLayoutStore((s) => s.toggleWidget);
  const enabledWidgets = useLayoutStore((s) => s.enabledWidgets);
  const exportState = useLayoutStore((s) => s.exportState);
  const importState = useLayoutStore((s) => s.importState);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    if (!name) return;
    const json = loadPresetJson(name);
    if (json) importState(json);
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
          {PRESET_NAMES.length > 0 && (
            <select
              className="control-bar__select"
              value=""
              onChange={handlePresetChange}
            >
              <option value="" disabled>
                Load Preset…
              </option>
              {PRESET_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
          <button className="control-bar__btn" onClick={() => setExportOpen(true)}>
            Export
          </button>
          <button
            className="control-bar__btn"
            onClick={() => setImportOpen(true)}
          >
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
          <span className="control-bar__label">API Key</span>
          <input
            className="control-bar__input control-bar__input--apikey"
            type="password"
            value={draftApiKey}
            placeholder="optional"
            onChange={(e) => setDraftApiKey(e.target.value)}
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
      {exportOpen && (
        <ExportModal
          json={exportState()}
          onClose={() => setExportOpen(false)}
        />
      )}
      {importOpen && (
        <ImportModal
          onImport={importState}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
};
