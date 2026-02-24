import type { Meta, StoryObj } from '@storybook/react';
import { WorkoutTypeOverlay } from './WorkoutTypeOverlay';
import { MOCK_METRICS } from '../../types/metrics';

const meta = {
  title: 'Overlays/WorkoutTypeOverlay',
  component: WorkoutTypeOverlay,
  tags: ['autodocs'],
} satisfies Meta<typeof WorkoutTypeOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { metrics: null },
};

export const Running: Story = {
  args: { metrics: MOCK_METRICS },
};

export const Cycling: Story = {
  args: { metrics: { ...MOCK_METRICS, workout_type: 'Cycling', elapsed_seconds: 3720 } },
};

export const HIIT: Story = {
  args: { metrics: { ...MOCK_METRICS, workout_type: 'HIIT', elapsed_seconds: 900 } },
};

export const Yoga: Story = {
  args: { metrics: { ...MOCK_METRICS, workout_type: 'Yoga', elapsed_seconds: 2400 } },
};

export const Swimming: Story = {
  args: { metrics: { ...MOCK_METRICS, workout_type: 'Swimming', elapsed_seconds: 1800 } },
};
