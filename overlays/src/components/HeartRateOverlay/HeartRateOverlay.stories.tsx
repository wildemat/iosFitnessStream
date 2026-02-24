import type { Meta, StoryObj } from '@storybook/react';
import { HeartRateOverlay } from './HeartRateOverlay';
import { MOCK_METRICS } from '../../types/metrics';

const meta = {
  title: 'Overlays/HeartRateOverlay',
  component: HeartRateOverlay,
  tags: ['autodocs'],
} satisfies Meta<typeof HeartRateOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { metrics: null },
};

export const Zone1Recovery: Story = {
  args: { metrics: { ...MOCK_METRICS, heart_rate: 98, heart_rate_zone: 1 } },
};

export const Zone2Aerobic: Story = {
  args: { metrics: { ...MOCK_METRICS, heart_rate: 115, heart_rate_zone: 2 } },
};

export const Zone3Tempo: Story = {
  args: { metrics: { ...MOCK_METRICS, heart_rate: 132, heart_rate_zone: 3 } },
};

export const Zone4Threshold: Story = {
  args: { metrics: { ...MOCK_METRICS, heart_rate: 148, heart_rate_zone: 4 } },
};

export const Zone5Max: Story = {
  args: { metrics: { ...MOCK_METRICS, heart_rate: 177, heart_rate_zone: 5 } },
};

export const NoZoneData: Story = {
  args: { metrics: { ...MOCK_METRICS, heart_rate: 140, heart_rate_zone: undefined } },
};
