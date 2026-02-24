import type { Meta, StoryObj } from '@storybook/react';
import { StepsOverlay } from './StepsOverlay';
import { MOCK_METRICS } from '../../types/metrics';

const meta = {
  title: 'Overlays/StepsOverlay',
  component: StepsOverlay,
  tags: ['autodocs'],
} satisfies Meta<typeof StepsOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { metrics: null },
};

export const Active: Story = {
  args: { metrics: MOCK_METRICS },
};

export const HighStepCount: Story = {
  args: { metrics: { ...MOCK_METRICS, step_count: 18240 } },
};
