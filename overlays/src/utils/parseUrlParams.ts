import { DEFAULT_SERVER } from '../components/ControlBar/ControlBar';

export interface UrlParamConfig {
  server: string;
  delayMs: number;
  preset: string | null;
  configJson: string | null;
}

export function parseUrlParams(search: string = window.location.search): UrlParamConfig {
  const params = new URLSearchParams(search);

  const rawServer = params.get('server');
  let server = DEFAULT_SERVER;
  if (rawServer) {
    try {
      new URL(rawServer);   // throws if not a valid URL
      server = rawServer;
    } catch {
      // malformed ?server= value — fall back to default silently
    }
  }
  const delayRaw = params.get('delay');
  const delayMs = delayRaw != null ? Math.max(0, parseInt(delayRaw, 10) || 0) : 0;
  const preset = params.get('preset');
  const configB64 = params.get('config');

  let configJson: string | null = null;
  if (configB64) {
    try {
      configJson = atob(configB64);
    } catch {
      // invalid base64 — ignore
    }
  }

  return { server, delayMs, preset, configJson };
}
