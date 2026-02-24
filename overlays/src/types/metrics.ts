/** Mirrors the WorkoutMetrics struct streamed by the iOS app (snake_case JSON) */
export interface WorkoutMetrics {
  workout_type: string;
  elapsed_seconds: number;
  heart_rate?: number;
  heart_rate_zone?: number;         // 1–5
  active_energy_kcal?: number;
  distance_meters?: number;
  pace_min_per_km?: number;
  step_count?: number;
  latitude?: number;
  longitude?: number;
  elevation_meters?: number;
  timestamp: string;                // ISO 8601
}

export const MOCK_METRICS: WorkoutMetrics = {
  workout_type: 'Running',
  elapsed_seconds: 1845,
  heart_rate: 148,
  heart_rate_zone: 4,
  active_energy_kcal: 285,
  distance_meters: 4200,
  pace_min_per_km: 5.72,
  step_count: 4120,
  latitude: 37.7749,
  longitude: -122.4194,
  elevation_meters: 48,
  timestamp: '2026-02-24T12:30:45Z',
};
