import type { Meta, StoryObj } from '@storybook/react';
import { PaceOverlay } from './PaceOverlay';
import { MOCK_METRICS } from '../../types/metrics';

const meta = {
  title: 'Overlays/PaceOverlay',
  component: PaceOverlay,
  tags: ['autodocs'],
} satisfies Meta<typeof PaceOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { metrics: null },
};

export const EasyPace: Story = {
  args: { metrics: { ...MOCK_METRICS, pace_min_per_km: 7.5 } },
};

export const RacePace: Story = {
  args: { metrics: { ...MOCK_METRICS, pace_min_per_km: 4.17 } },
};

export const Active: Story = {
  args: { metrics: MOCK_METRICS },
};
