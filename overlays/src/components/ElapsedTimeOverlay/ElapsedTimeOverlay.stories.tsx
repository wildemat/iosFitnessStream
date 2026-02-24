import type { Meta, StoryObj } from '@storybook/react';
import { ElapsedTimeOverlay } from './ElapsedTimeOverlay';
import { MOCK_METRICS } from '../../types/metrics';

const meta = {
  title: 'Overlays/ElapsedTimeOverlay',
  component: ElapsedTimeOverlay,
  tags: ['autodocs'],
} satisfies Meta<typeof ElapsedTimeOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { metrics: null },
};

export const ShortRun: Story = {
  args: { metrics: { ...MOCK_METRICS, elapsed_seconds: 345 } },   // 5:45
};

export const LongRun: Story = {
  args: { metrics: { ...MOCK_METRICS, elapsed_seconds: 5580 } },  // 1:33:00
};

export const Active: Story = {
  args: { metrics: MOCK_METRICS },
};
