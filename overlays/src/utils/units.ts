/** Convert meters to miles */
export function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}

/** Convert meters to yards */
export function metersToYards(meters: number): number {
  return meters * 1.09361;
}

/** Convert min/km pace to min/mi pace */
export function paceKmToMi(minPerKm: number): number {
  return minPerKm * 1.60934;
}

/** Format a distance in imperial units */
export function formatImperialDistance(meters: number): { value: string; unit: string } {
  const miles = metersToMiles(meters);
  if (miles < 0.1) {
    const yards = Math.round(metersToYards(meters));
    return { value: String(yards), unit: 'yd' };
  }
  return { value: miles.toFixed(2), unit: 'mi' };
}

/** Format a metric distance (current behavior) */
export function formatMetricDistance(meters: number): { value: string; unit: string } {
  if (meters < 1000) {
    return { value: String(Math.round(meters)), unit: 'm' };
  }
  return { value: (meters / 1000).toFixed(2), unit: 'km' };
}

/** Format a pace value (min/unit) as mm:ss */
export function formatPaceValue(minPerUnit: number): string {
  const totalSecs = minPerUnit * 60;
  const mins = Math.floor(totalSecs / 60);
  const secs = Math.round(totalSecs % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
