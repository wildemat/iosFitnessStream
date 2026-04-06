import { useState } from "react";
import { createPortal } from "react-dom";
import "./ExportModal.css";

interface ExportModalProps {
  json: string;
  onClose: () => void;
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

export function ExportModal({ json, onClose }: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = json;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleDownloadFile = () => {
    downloadJson(json, "overlay-config.json");
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className="export-modal-backdrop" onMouseDown={handleBackdropClick}>
      <div
        className="export-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="export-modal__header">
          <span className="export-modal__title">Export Configuration</span>
          <button className="export-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="export-modal__body">
          <button className="export-modal__action" onClick={handleCopyJson}>
            <span className="export-modal__action-label">
              {copied ? "Copied!" : "JSON"}
            </span>
            <span className="export-modal__action-desc">
              Copy config to clipboard
            </span>
          </button>
          <button className="export-modal__action" onClick={handleDownloadFile}>
            <span className="export-modal__action-label">File</span>
            <span className="export-modal__action-desc">
              Download as overlay-config.json
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
