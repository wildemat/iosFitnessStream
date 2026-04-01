import { describe, it, expect } from 'vitest';
import { getTileUrl } from './mapTiles';

describe('getTileUrl', () => {
  it('returns labels URL when hideLabels is false', () => {
    const url = getTileUrl(false);
    expect(url).toContain('dark_all');
    expect(url).not.toContain('nolabels');
  });

  it('returns no-labels URL when hideLabels is true', () => {
    const url = getTileUrl(true);
    expect(url).toContain('dark_nolabels');
    expect(url).not.toContain('dark_all');
  });

  it('returns valid CartoDB URL format', () => {
    const url = getTileUrl(false);
    expect(url).toMatch(/^https:\/\/\{s\}\.basemaps\.cartocdn\.com\//);
    expect(url).toMatch(/\.png$/);
  });
});
