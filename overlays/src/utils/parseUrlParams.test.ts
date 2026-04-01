import { describe, it, expect, vi } from 'vitest';

vi.mock('../components/ControlBar/ControlBar', () => ({
  DEFAULT_SERVER: 'https://api.wildmat.dev/fitness/events',
}));

// Import AFTER mocking
const { parseUrlParams } = await import('./parseUrlParams');

describe('parseUrlParams', () => {
  it('returns defaults when no params', () => {
    const r = parseUrlParams('');
    expect(r.server).toBe('https://api.wildmat.dev/fitness/events');
    expect(r.delayMs).toBe(0);
    expect(r.preset).toBeNull();
    expect(r.configJson).toBeNull();
  });

  it('parses ?server param', () => {
    expect(parseUrlParams('?server=http://192.168.1.1:8080/events').server)
      .toBe('http://192.168.1.1:8080/events');
  });

  it('parses ?delay param', () => {
    expect(parseUrlParams('?delay=5000').delayMs).toBe(5000);
  });

  it('clamps negative delay to 0', () => {
    expect(parseUrlParams('?delay=-100').delayMs).toBe(0);
  });

  it('handles non-numeric delay gracefully', () => {
    expect(parseUrlParams('?delay=abc').delayMs).toBe(0);
  });

  it('parses ?preset param', () => {
    expect(parseUrlParams('?preset=mypreset').preset).toBe('mypreset');
  });

  it('decodes valid ?config base64', () => {
    const json = JSON.stringify({ enabledWidgets: ['heartrate'] });
    const b64 = btoa(json);
    expect(parseUrlParams(`?config=${b64}`).configJson).toBe(json);
  });

  it('returns null configJson for invalid base64', () => {
    expect(parseUrlParams('?config=!!!invalid!!!').configJson).toBeNull();
  });

  it('combines multiple params', () => {
    const r = parseUrlParams('?server=http://localhost:8080/events&delay=3000&preset=test');
    expect(r.server).toBe('http://localhost:8080/events');
    expect(r.delayMs).toBe(3000);
    expect(r.preset).toBe('test');
  });
});
