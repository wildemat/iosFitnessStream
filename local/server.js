#!/usr/bin/env node
/**
 * FitnessStream local receiver
 *
 * Starts an HTTP server that accepts POST requests from the iOS app
 * and pretty-prints each workout metrics payload to stdout.
 *
 * Usage:
 *   node server.js          # listens on port 8080
 *   PORT=3000 node server.js
 *
 * Set your iPhone's endpoint to:
 *   http://<your-mac-local-ip>:<PORT>/
 *
 * Find your Mac's local IP with: ipconfig getifaddr en0
 */

const http = require('http');

const PORT = process.env.PORT || 8080;

// ANSI colors for readable output
const DIM   = '\x1b[2m';
const CYAN  = '\x1b[36m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { Allow: 'POST' });
    res.end('Method Not Allowed');
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const now = new Date().toISOString();

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      process.stdout.write(`${DIM}[${now}]${RESET} (non-JSON body) ${body}\n`);
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }

    // Pretty-print the metrics fields in a readable order
    const {
      workout_type,
      elapsed_seconds,
      heart_rate,
      heart_rate_zone,
      active_energy_kcal,
      distance_meters,
      pace_min_per_km,
      step_count,
      latitude,
      longitude,
      elevation_meters,
      timestamp,
    } = parsed;

    const elapsed = formatElapsed(elapsed_seconds);
    const lines = [
      `${DIM}[${now}]${RESET} ${CYAN}${workout_type || 'workout'}${RESET}  ${GREEN}${elapsed}${RESET}`,
      `  heart_rate=${fmt(heart_rate, 'bpm')}  zone=${heart_rate_zone ?? '—'}`,
      `  energy=${fmt(active_energy_kcal, 'kcal')}  distance=${fmt(distKm(distance_meters), 'km')}  pace=${fmt(pace_min_per_km, 'min/km')}  steps=${step_count ?? '—'}`,
      `  lat=${fmt(latitude)}  lon=${fmt(longitude)}  elev=${fmt(elevation_meters, 'm')}`,
      `  app_ts=${timestamp ?? '—'}`,
    ];

    process.stdout.write(lines.join('\n') + '\n\n');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
});

function fmt(val, unit = '') {
  if (val == null) return '—';
  const n = typeof val === 'number' ? val.toFixed(2) : val;
  return unit ? `${n} ${unit}` : String(n);
}

function distKm(meters) {
  return meters != null ? meters / 1000 : null;
}

function formatElapsed(secs) {
  if (secs == null) return '0:00';
  const s = Math.floor(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`FitnessStream receiver listening on port ${PORT}`);
  console.log(`Set the app endpoint to: http://${ip}:${PORT}/`);
  console.log('Waiting for workout data...\n');
});

function getLocalIP() {
  const { networkInterfaces } = require('os');
  for (const ifaces of Object.values(networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}
