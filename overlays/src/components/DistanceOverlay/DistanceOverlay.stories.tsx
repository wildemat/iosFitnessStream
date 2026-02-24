import type { Meta, StoryObj } from '@storybook/react';
import { DistanceOverlay } from './DistanceOverlay';
import { MOCK_METRICS } from '../../types/metrics';

const meta = {
  title: 'Overlays/DistanceOverlay',
  component: DistanceOverlay,
  tags: ['autodocs'],
} satisfies Meta<typeof DistanceOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { metrics: null },
};

export const UnderOneKm: Story = {
  args: { metrics: { ...MOCK_METRICS, distance_meters: 420 } },
};

export const FiveKm: Story = {
  args: { metrics: { ...MOCK_METRICS, distance_meters: 5000 } },
};

export const Active: Story = {
  args: { metrics: MOCK_METRICS },
};
