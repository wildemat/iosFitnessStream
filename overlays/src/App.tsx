import { useState, useCallback, useEffect } from "react";
import { useMetricsStream } from "./hooks/useMetricsStream";
import { DashboardGrid } from "./components/DashboardGrid/DashboardGrid";
import { ControlBar, DEFAULT_SERVER } from "./components/ControlBar/ControlBar";
import { useLayoutStore } from "./store/useLayoutStore";
import { loadPresetJson } from "./utils/presets";

export default function App() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER);
  const [delayMs, setDelayMs] = useState(0);
  const [listening, setListening] = useState(true);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("overlays_api_key") ?? "");

  useEffect(() => {
    const name = new URLSearchParams(window.location.search).get("preset");
    if (!name) return;
    const json = loadPresetJson(name);
    if (json) useLayoutStore.getState().importState(json);
  }, []);

  const handleSave = useCallback((url: string, delay: number, key: string) => {
    setServerUrl(url);
    setDelayMs(delay);
    setApiKey(key);
    if (key) {
      localStorage.setItem("overlays_api_key", key);
    } else {
      localStorage.removeItem("overlays_api_key");
    }
  }, []);

  const effectiveUrl = apiKey ? `${serverUrl}?key=${apiKey}` : serverUrl;
  const { metrics } = useMetricsStream(effectiveUrl, listening, delayMs);

  return (
    <>
      <ControlBar
        serverUrl={serverUrl}
        delayMs={delayMs}
        apiKey={apiKey}
        listening={listening}
        onSave={handleSave}
        onListeningChange={setListening}
      />
      <DashboardGrid metrics={metrics} />
    </>
  );
}
