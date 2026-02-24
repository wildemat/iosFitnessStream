import type { Meta, StoryObj } from '@storybook/react';
import { ElevationOverlay } from './ElevationOverlay';
import { MOCK_METRICS } from '../../types/metrics';

const meta = {
  title: 'Overlays/ElevationOverlay',
  component: ElevationOverlay,
  tags: ['autodocs'],
} satisfies Meta<typeof ElevationOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { metrics: null },
};

export const SeaLevel: Story = {
  args: { metrics: { ...MOCK_METRICS, elevation_meters: 8 } },
};

export const Climbing: Story = {
  args: { metrics: { ...MOCK_METRICS, elevation_meters: 320 } },
};

export const Active: Story = {
  args: { metrics: MOCK_METRICS },
};
