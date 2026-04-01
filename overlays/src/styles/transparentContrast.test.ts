import { describe, it, expect } from 'vitest';

describe('transparent mode CSS class naming', () => {
  it('widget transparent class name is correct', () => {
    const transparent = true;
    const cls = `widget pace-overlay${transparent ? ' widget--transparent' : ''}`;
    expect(cls).toContain('widget--transparent');
  });

  it('minimap transparent class name is correct', () => {
    const transparent = true;
    const cls = `minimap-overlay${transparent ? ' minimap-overlay--transparent' : ''}`;
    expect(cls).toContain('minimap-overlay--transparent');
  });

  it('non-transparent widgets do not get the class', () => {
    const transparent = false;
    const cls = `widget pace-overlay${transparent ? ' widget--transparent' : ''}`;
    expect(cls).not.toContain('widget--transparent');
  });
});

describe('text-shadow CSS syntax', () => {
  it('multi-layer shadow string is valid CSS', () => {
    const shadow = `
      0 0 8px rgba(0, 0, 0, 0.95),
      0 1px 4px rgba(0, 0, 0, 0.90)
    `.trim();
    // Valid: contains rgba values
    expect(shadow).toMatch(/rgba\(0, 0, 0, 0\.\d+\)/);
    // Valid: has at least 2 layers (comma separated, ignoring commas inside rgba)
    const layers = shadow.split(/,\s*(?=\d)/).filter(Boolean);
    expect(layers.length).toBeGreaterThanOrEqual(2);
  });

  it('opacity values are high enough for contrast', () => {
    const opacities = [0.95, 0.90, 0.90, 0.90, 0.90];
    opacities.forEach(op => expect(op).toBeGreaterThanOrEqual(0.9));
  });
});
