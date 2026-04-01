import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from './useLayoutStore';

describe('useLayoutStore — hideLabels', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useLayoutStore.setState(useLayoutStore.getInitialState());
  });

  it('defaults hideLabels to false for the minimap widget', () => {
    const opts = useLayoutStore.getState().widgetOptions.minimap;
    expect(opts.hideLabels).toBe(false);
  });

  it('setWidgetOption can toggle hideLabels to true', () => {
    const { setWidgetOption } = useLayoutStore.getState();
    setWidgetOption('minimap', { hideLabels: true });
    const opts = useLayoutStore.getState().widgetOptions.minimap;
    expect(opts.hideLabels).toBe(true);
  });

  it('setWidgetOption does not affect other widget opts', () => {
    const { setWidgetOption } = useLayoutStore.getState();
    setWidgetOption('minimap', { hideLabels: true });
    const heartrateOpts = useLayoutStore.getState().widgetOptions.heartrate;
    expect(heartrateOpts.hideLabels).toBe(false);
  });
});
