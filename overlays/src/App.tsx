import { useState, useCallback, useEffect } from "react";
import { useMetricsStream } from "./hooks/useMetricsStream";
import { DashboardGrid } from "./components/DashboardGrid/DashboardGrid";
import { ControlBar } from "./components/ControlBar/ControlBar";
import { useLayoutStore } from "./store/useLayoutStore";
import { loadPresetJson } from "./utils/presets";
import { parseUrlParams } from "./utils/parseUrlParams";

const { server: initServer, delayMs: initDelay, preset, configJson } = parseUrlParams();

export default function App() {
  const [serverUrl, setServerUrl] = useState(initServer);
  const [delayMs, setDelayMs] = useState(initDelay);
  const [listening, setListening] = useState(true);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("overlays_api_key") ?? "");

  useEffect(() => {
    if (configJson) {
      useLayoutStore.getState().importState(configJson);
    } else if (preset) {
      const json = loadPresetJson(preset);
      if (json) useLayoutStore.getState().importState(json);
    }
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
