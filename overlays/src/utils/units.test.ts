import { describe, it, expect } from 'vitest';
import {
  metersToMiles,
  metersToYards,
  paceKmToMi,
  formatImperialDistance,
  formatMetricDistance,
  formatPaceValue,
} from './units';

describe('metersToMiles', () => {
  it('converts correctly', () => {
    expect(metersToMiles(1609.344)).toBeCloseTo(1.0, 3);
    expect(metersToMiles(0)).toBe(0);
  });
});

describe('metersToYards', () => {
  it('converts correctly', () => {
    expect(metersToYards(914.4)).toBeCloseTo(1000, 1);
  });
});

describe('paceKmToMi', () => {
  it('converts 6:00/km to approx 9:39/mi', () => {
    const result = paceKmToMi(6.0);
    expect(result).toBeCloseTo(9.656, 2); // 6 * 1.60934
  });
});

describe('formatImperialDistance', () => {
  it('shows yards below 0.1 miles (~161m)', () => {
    const { value, unit } = formatImperialDistance(100);
    expect(unit).toBe('yd');
    expect(Number(value)).toBeGreaterThan(100); // yards > meters
  });

  it('shows miles at 1000m', () => {
    const { value, unit } = formatImperialDistance(1000);
    expect(unit).toBe('mi');
    expect(value).toBe('0.62');
  });

  it('shows miles for marathon distance', () => {
    const { unit } = formatImperialDistance(42195);
    expect(unit).toBe('mi');
  });
});

describe('formatMetricDistance', () => {
  it('shows meters below 1000m', () => {
    const { value, unit } = formatMetricDistance(500);
    expect(unit).toBe('m');
    expect(value).toBe('500');
  });

  it('shows km at 1000m+', () => {
    const { value, unit } = formatMetricDistance(5000);
    expect(unit).toBe('km');
    expect(value).toBe('5.00');
  });
});

describe('formatPaceValue', () => {
  it('formats 6.0 min/km as 6:00', () => {
    expect(formatPaceValue(6.0)).toBe('6:00');
  });

  it('formats 5.5 min/km as 5:30', () => {
    expect(formatPaceValue(5.5)).toBe('5:30');
  });

  it('pads seconds', () => {
    expect(formatPaceValue(6.083333)).toBe('6:05');
  });
});
