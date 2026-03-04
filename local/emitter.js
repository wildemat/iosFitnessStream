#!/usr/bin/env node
/**
 * FitnessStream metric emitter
 *
 * Simulates an iOS workout session by POSTing random metrics to the local
 * receiver every second.  Elapsed time, energy, distance, and steps
 * accumulate realistically; GPS coordinates do a gentle random walk.
 *
 * Usage:
 *   node emitter.js                # posts to http://localhost:8080/
 *   PORT=3000 node emitter.js
 */

const http = require('http');

const PORT = process.env.PORT || 8080;
const INTERVAL_MS = 1_000;

const WORKOUT_TYPES = ['Running', 'Cycling', 'Walking', 'Hiking'];
const workoutType = WORKOUT_TYPES[Math.floor(Math.random() * WORKOUT_TYPES.length)];

// Accumulated state
let elapsedSeconds = 0;
let activeEnergyKcal = 0;
let distanceMeters = 0;
let stepCount = 0;
let latitude = 37.7749;
let longitude = -122.4194;
let elevationMeters = 48;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function buildPayload() {
  elapsedSeconds += INTERVAL_MS / 1000;

  const heartRate = Math.round(rand(100, 180));
  const heartRateZone = heartRate < 110 ? 1
    : heartRate < 130 ? 2
    : heartRate < 150 ? 3
    : heartRate < 170 ? 4
    : 5;

  activeEnergyKcal += rand(0.1, 0.4);
  distanceMeters += rand(1, 5);
  stepCount += Math.round(rand(1, 4));

  latitude += rand(-0.00002, 0.00002);
  longitude += rand(-0.00002, 0.00002);
  elevationMeters += rand(-0.3, 0.3);

  const paceMinPerKm = rand(4.0, 8.0);

  return {
    workout_type: workoutType,
    elapsed_seconds: elapsedSeconds,
    heart_rate: heartRate,
    heart_rate_zone: heartRateZone,
    active_energy_kcal: Math.round(activeEnergyKcal * 100) / 100,
    distance_meters: Math.round(distanceMeters * 100) / 100,
    pace_min_per_km: Math.round(paceMinPerKm * 100) / 100,
    step_count: stepCount,
    latitude: Math.round(latitude * 1e6) / 1e6,
    longitude: Math.round(longitude * 1e6) / 1e6,
    elevation_meters: Math.round(elevationMeters * 100) / 100,
    timestamp: new Date().toISOString(),
  };
}

function send(payload) {
  const data = JSON.stringify(payload);
  const req = http.request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    },
    (res) => {
      res.resume(); // drain
    },
  );
  req.on('error', (err) => {
    process.stderr.write(`[emitter] POST failed: ${err.message}\n`);
  });
  req.end(data);
}

console.log(`Emitting ${workoutType} metrics to http://localhost:${PORT}/ every ${INTERVAL_MS}ms`);

const timer = setInterval(() => send(buildPayload()), INTERVAL_MS);

process.on('SIGINT', () => { clearInterval(timer); process.exit(0); });
process.on('SIGTERM', () => { clearInterval(timer); process.exit(0); });
