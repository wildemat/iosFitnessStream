import type { Meta, StoryObj } from '@storybook/react';
import { CaloriesOverlay } from './CaloriesOverlay';
import { MOCK_METRICS } from '../../types/metrics';

const meta = {
  title: 'Overlays/CaloriesOverlay',
  component: CaloriesOverlay,
  tags: ['autodocs'],
} satisfies Meta<typeof CaloriesOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { metrics: null },
};

export const Low: Story = {
  args: { metrics: { ...MOCK_METRICS, active_energy_kcal: 42 } },
};

export const Active: Story = {
  args: { metrics: MOCK_METRICS },
};

export const HighBurn: Story = {
  args: { metrics: { ...MOCK_METRICS, active_energy_kcal: 820 } },
};
