import React, { useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { PANEL_KEYS, type SerializedState } from "../../store/useLayoutStore";
import "./ImportModal.css";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

type Tab = "upload" | "url";

interface ImportModalProps {
  onImport: (json: string) => boolean;
  onClose: () => void;
}

function validateConfig(raw: string): string | null {
  if (new Blob([raw]).size > MAX_SIZE) {
    return "File exceeds the 2 MB size limit.";
  }

  let data: SerializedState;
  try {
    data = JSON.parse(raw);
  } catch {
    return "File is not valid JSON.";
  }

  if (!Array.isArray(data.enabledWidgets)) {
    return 'Missing or invalid "enabledWidgets" array.';
  }

  const validKeys = new Set<string>(PANEL_KEYS);
  if (!data.enabledWidgets.every((k) => validKeys.has(k))) {
    return '"enabledWidgets" contains unknown widget keys.';
  }

  if (
    typeof data.widgetOptions !== "object" ||
    data.widgetOptions === null ||
    Array.isArray(data.widgetOptions)
  ) {
    return 'Missing or invalid "widgetOptions" object.';
  }

  if (
    typeof data.panels !== "object" ||
    data.panels === null ||
    Array.isArray(data.panels)
  ) {
    return 'Missing or invalid "panels" object.';
  }

  return null;
}

export function ImportModal({ onImport, onClose }: ImportModalProps) {
  const [tab, setTab] = useState<Tab>("upload");
  const [error, setError] = useState<string | null>(null);
  const [validJson, setValidJson] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const ingest = useCallback((raw: string, name?: string) => {
    const err = validateConfig(raw);
    if (err) {
      setError(err);
      setValidJson(null);
      return;
    }
    setError(null);
    setValidJson(raw);
    if (name) setFileName(name);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setError("File exceeds the 2 MB size limit.");
      setValidJson(null);
      setFileName(null);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        ingest(reader.result, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleFetchUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setFetching(true);
    setError(null);
    setValidJson(null);
    setFileName(null);

    try {
      const res = await fetch(trimmed);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("text/html")) {
        throw new Error(
          "The URL returned an HTML page instead of a JSON file. " +
            "Make sure the link points directly to the raw file.",
        );
      }
      const text = await res.text();
      ingest(text, trimmed.split("/").pop() ?? "remote-config.json");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch the file.";
      setError(
        msg === "Failed to fetch"
          ? "Network error — the server may not allow cross-origin requests. " +
              "Try downloading the file and using File Upload instead."
          : msg,
      );
      setValidJson(null);
    } finally {
      setFetching(false);
    }
  };

  const handleImport = () => {
    if (!validJson) return;
    const ok = onImport(validJson);
    if (ok) {
      onClose();
    } else {
      setError("Failed to apply configuration.");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
    setValidJson(null);
    setFileName(null);
  };

  return createPortal(
    <div className="import-modal-backdrop" onMouseDown={handleBackdropClick}>
      <div
        className="import-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="import-modal__header">
          <span className="import-modal__title">Import Configuration</span>
          <button className="import-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="import-modal__tabs">
          <button
            className={`import-modal__tab ${tab === "upload" ? "import-modal__tab--active" : ""}`}
            onClick={() => switchTab("upload")}
          >
            File Upload
          </button>
          <button
            className={`import-modal__tab ${tab === "url" ? "import-modal__tab--active" : ""}`}
            onClick={() => switchTab("url")}
          >
            File URL
          </button>
        </div>

        <div className="import-modal__body">
          {tab === "upload" && (
            <div className="import-modal__upload">
              <button
                className="import-modal__pick-btn"
                onClick={() => fileRef.current?.click()}
              >
                Choose File
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {fileName && (
                <span className="import-modal__file-name">{fileName}</span>
              )}
            </div>
          )}

          {tab === "url" && (
            <div className="import-modal__url">
              <input
                className="import-modal__url-input"
                type="text"
                placeholder="https://example.com/config.json"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFetchUrl();
                }}
                spellCheck={false}
              />
              <button
                className="import-modal__fetch-btn"
                onClick={handleFetchUrl}
                disabled={fetching || !url.trim()}
              >
                {fetching ? "Fetching…" : "Fetch"}
              </button>
            </div>
          )}
        </div>

        {error && <div className="import-modal__error">{error}</div>}

        <div className="import-modal__footer">
          <button className="import-modal__cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="import-modal__import-btn"
            disabled={!validJson}
            onClick={handleImport}
          >
            Import
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
