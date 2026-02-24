import type { Preview } from '@storybook/react';
import '../src/styles/lofi-theme.css';
import '../src/styles/animations.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'stream-dark',
      values: [
        { name: 'stream-dark', value: '#0d0b18' },
        { name: 'stream-purple', value: '#1a0f2e' },
        { name: 'bright', value: '#e8e4f0' },
        { name: 'transparent', value: 'transparent' },
      ],
    },
    layout: 'centered',
  },
};

export default preview;
