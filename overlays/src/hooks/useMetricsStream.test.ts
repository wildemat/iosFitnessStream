import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { metricsStore, _publishMetrics, _resetForTests } from './useMetricsStream';
import type { WorkoutMetrics } from '../types/metrics';

const SAMPLE: WorkoutMetrics = {
  workout_type: 'Running',
  elapsed_seconds: 1800,
  heart_rate: 150,
  distance_meters: 3200,
  pace_min_per_km: 5.5,
  active_energy_kcal: 320,
  step_count: 4500,
  elevation_meters: 42,
  latitude: 37.77,
  longitude: -122.41,
  timestamp: '2026-03-09T10:00:00Z',
};

describe('Overlay resilience timing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetForTests();
  });

  afterEach(() => {
    _resetForTests();
    vi.useRealTimers();
  });

  it('initial state is { metrics: null, isStale: false }', () => {
    const state = metricsStore.getState();
    expect(state.metrics).toBeNull();
    expect(state.isStale).toBe(false);
  });

  it('after receiving data, metrics are set and isStale is false', () => {
    _publishMetrics(SAMPLE);
    const state = metricsStore.getState();
    expect(state.metrics).toEqual(SAMPLE);
    expect(state.isStale).toBe(false);
  });

  it('marks stale after 20 s of no new data, but retains last known metrics', () => {
    _publishMetrics(SAMPLE);

    vi.advanceTimersByTime(20_001);

    const state = metricsStore.getState();
    expect(state.isStale).toBe(true);
    expect(state.metrics).toEqual(SAMPLE);
  });

  it('does not mark stale before 20 s', () => {
    _publishMetrics(SAMPLE);

    vi.advanceTimersByTime(19_000);

    const state = metricsStore.getState();
    expect(state.isStale).toBe(false);
    expect(state.metrics).toEqual(SAMPLE);
  });

  it('nulls out metrics after 30 s of no new data', () => {
    _publishMetrics(SAMPLE);

    vi.advanceTimersByTime(30_001);

    const state = metricsStore.getState();
    expect(state.metrics).toBeNull();
    expect(state.isStale).toBe(false);
  });

  it('receiving new data after stale period resets isStale to false', () => {
    _publishMetrics(SAMPLE);

    vi.advanceTimersByTime(20_001);
    expect(metricsStore.getState().isStale).toBe(true);

    const updated: WorkoutMetrics = { ...SAMPLE, heart_rate: 160 };
    _publishMetrics(updated);

    const state = metricsStore.getState();
    expect(state.isStale).toBe(false);
    expect(state.metrics).toEqual(updated);
  });

  it('stopConnection clears lastGoodMetrics so reconnect cannot resurrect old session data', () => {
    _publishMetrics(SAMPLE);
    expect(metricsStore.getState().metrics).toEqual(SAMPLE);

    _resetForTests();

    vi.advanceTimersByTime(20_001);
    expect(metricsStore.getState().metrics).toBeNull();
    expect(metricsStore.getState().isStale).toBe(false);
  });

  it('fresh data resets the stale/disable timers', () => {
    _publishMetrics(SAMPLE);

    // Advance 15 s (not yet stale at 20 s threshold)
    vi.advanceTimersByTime(15_000);
    expect(metricsStore.getState().isStale).toBe(false);

    // New data arrives at t=15 s, resetting both timers
    _publishMetrics({ ...SAMPLE, heart_rate: 155 });

    // Advance another 15 s (total 30 s from first publish, but only 15 s from second)
    vi.advanceTimersByTime(15_000);

    // Should still be fresh (timer restarted from t=15)
    expect(metricsStore.getState().isStale).toBe(false);

    // Advance past 20 s from the second publish
    vi.advanceTimersByTime(5_100);
    expect(metricsStore.getState().isStale).toBe(true);
  });
});
