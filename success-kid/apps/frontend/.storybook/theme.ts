import { create } from '@storybook/theming/create';

export default create({
  base: 'light',
  brandTitle: 'Success Kid UI',
  brandUrl: 'https://github.com/your-org/success-kid-platform',
  brandImage: '/logo.png',
  brandTarget: '_self',
  
  // UI
  appBg: '#F5F7FA',
  appContentBg: '#FFFFFF',
  appBorderColor: '#E0E0E0',
  appBorderRadius: 8,
  
  // Typography
  fontBase: '"Inter", sans-serif',
  fontCode: '"Roboto Mono", monospace',
  
  // Text colors
  textColor: '#212121',
  textInverseColor: '#FFFFFF',
  
  // Toolbar default and active colors
  barTextColor: '#757575',
  barSelectedColor: '#1E88E5',
  barBg: '#FFFFFF',
  
  // Form colors
  inputBg: '#FFFFFF',
  inputBorder: '#E0E0E0',
  inputTextColor: '#212121',
  inputBorderRadius: 4,
  
  // Brand colors
  colorPrimary: '#1E88E5',
  colorSecondary: '#FFC107',
});
