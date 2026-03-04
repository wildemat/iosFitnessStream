import { useState, useCallback } from "react";
import { useMetricsStream } from "./hooks/useMetricsStream";
import { DashboardGrid } from "./components/DashboardGrid/DashboardGrid";
import { ControlBar, DEFAULT_SERVER } from "./components/ControlBar/ControlBar";

export default function App() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER);
  const [delayMs, setDelayMs] = useState(0);
  const [listening, setListening] = useState(true);

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
