import type { Meta, StoryObj } from '@storybook/react';
import { MinimapOverlay } from './MinimapOverlay';
import { MOCK_METRICS } from '../../types/metrics';

// Golden Gate Park, SF — good map detail at zoom 15
const SF: [number, number] = [37.7694, -122.4862];

const meta = {
  title: 'Overlays/MinimapOverlay',
  component: MinimapOverlay,
  tags: ['autodocs'],
  parameters: {
    // Give the map room to render in the story panel
    layout: 'centered',
  },
} satisfies Meta<typeof MinimapOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { metrics: null },
};

export const GPSLocked: Story = {
  args: {
    metrics: {
      ...MOCK_METRICS,
      latitude:  SF[0],
      longitude: SF[1],
    },
  },
};

export const ZoomedOut: Story = {
  args: {
    metrics: {
      ...MOCK_METRICS,
      latitude:  SF[0],
      longitude: SF[1],
    },
    zoom: 12,
  },
};

export const ZoomedIn: Story = {
  args: {
    metrics: {
      ...MOCK_METRICS,
      latitude:  SF[0],
      longitude: SF[1],
    },
    zoom: 17,
  },
};

export const NoGPSWithWorkout: Story = {
  name: 'No GPS (workout active)',
  args: {
    metrics: {
      ...MOCK_METRICS,
      latitude:  undefined,
      longitude: undefined,
    },
  },
};
