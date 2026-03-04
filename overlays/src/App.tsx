import { useState, useCallback } from "react";
import { useMetricsStream } from "./hooks/useMetricsStream";
import { DashboardGrid } from "./components/DashboardGrid/DashboardGrid";
import { ControlBar, DEFAULT_SERVER } from "./components/ControlBar/ControlBar";

export default function App() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER);
  const [listening, setListening] = useState(true);

  const handleServer = useCallback((v: string) => {
    setServerUrl(v);
  }, []);

  const metrics = useMetricsStream(serverUrl, listening);

  return (
    <>
      <ControlBar
        serverUrl={serverUrl}
        listening={listening}
        onServerUrlChange={handleServer}
        onListeningChange={setListening}
      />
      <DashboardGrid metrics={metrics} />
    </>
  );
}
