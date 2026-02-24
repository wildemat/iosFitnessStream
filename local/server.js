#!/usr/bin/env node
/**
 * FitnessStream local receiver
 *
 * Accepts POST requests from the iOS app and:
 *   1. Pretty-prints each metrics payload to stdout.
 *   2. Broadcasts metrics to any connected SSE clients (used by the
 *      React overlay components running in OBS Browser Source).
 *
 * Usage:
 *   node server.js          # listens on port 8080
 *   PORT=3000 node server.js
 *
 * Set your iPhone's endpoint to:
 *   http://<your-mac-local-ip>:<PORT>/
 *
 * Overlay SSE endpoint (consumed by overlays/):
 *   http://localhost:<PORT>/events
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

// ─── SSE client registry ───────────────────────────────────────────────────
/** @type {Set<import('http').ServerResponse>} */
const sseClients = new Set();

function broadcastMetrics(payload) {
  if (sseClients.size === 0) return;
  const data  = JSON.stringify(payload);
  const frame = `event: metrics\ndata: ${data}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(frame);
    } catch {
      sseClients.delete(res);
    }
  }
}

// ─── HTTP server ───────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS — allow the Vite dev server (any localhost origin) to subscribe
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── SSE subscription (/events) ──────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/events') {
    res.writeHead(200, {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',  // disable nginx buffering if behind a proxy
    });

    // Tell clients to reconnect after 3 s if the stream drops
    res.write('retry: 3000\n\n');

    sseClients.add(res);
    process.stdout.write(`${DIM}[SSE]${RESET} client connected (${sseClients.size} total)\n`);

    // Heartbeat — keeps the TCP connection alive during idle periods
    const heartbeat = setInterval(() => {
      try { res.write(': ping\n\n'); } catch { /* client gone */ }
    }, 15_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
      process.stdout.write(`${DIM}[SSE]${RESET} client disconnected (${sseClients.size} remaining)\n`);
    });

    return;
  }

  // ── Metrics POST (from iOS app) ─────────────────────────────────────────
  if (req.method !== 'POST') {
    res.writeHead(405, { Allow: 'POST, GET' });
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

    // Broadcast to SSE subscribers (the overlay components)
    broadcastMetrics(parsed);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
});

// ─── Helpers ───────────────────────────────────────────────────────────────
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

// ─── Start ─────────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`FitnessStream receiver listening on port ${PORT}`);
  console.log(`Set the app endpoint to:  http://${ip}:${PORT}/`);
  console.log(`SSE overlay endpoint:     http://localhost:${PORT}/events`);
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
