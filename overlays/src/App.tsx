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

  useEffect(() => {
    if (configJson) {
      useLayoutStore.getState().importState(configJson);
    } else if (preset) {
      const json = loadPresetJson(preset);
      if (json) useLayoutStore.getState().importState(json);
    }
  }, []);

  const handleSave = useCallback((url: string, delay: number) => {
    setServerUrl(url);
    setDelayMs(delay);
  }, []);

  const metrics = useMetricsStream(serverUrl, listening, delayMs);

  return (
    <>
      <ControlBar
        serverUrl={serverUrl}
        delayMs={delayMs}
        listening={listening}
        onSave={handleSave}
        onListeningChange={setListening}
      />
      <DashboardGrid metrics={metrics} />
    </>
  );
}
