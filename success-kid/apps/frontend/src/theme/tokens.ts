/**
 * Design tokens for the Success Kid Community Platform
 * Based on the Design System & Flow Architecture document
 */

export const tokens = {
  colors: {
    // Primary - Victory Blue
    primary: {
      DEFAULT: '#1E88E5',
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#1E88E5',
      600: '#1976D2',
      700: '#1565C0',
      800: '#0D47A1',
      900: '#0A3880',
    },
    // Secondary - Sand Gold
    secondary: {
      DEFAULT: '#FFC107',
      50: '#FFF8E1',
      100: '#FFECB3',
      200: '#FFE082',
      300: '#FFD54F',
      400: '#FFCA28',
      500: '#FFC107',
      600: '#FFB300',
      700: '#FFA000',
      800: '#FF8F00',
      900: '#FF6F00',
    },
    // Accent - Success Green
    accent: {
      DEFAULT: '#4CAF50',
      50: '#E8F5E9',
      100: '#C8E6C9',
      200: '#A5D6A7',
      300: '#81C784',
      400: '#66BB6A',
      500: '#4CAF50',
      600: '#43A047',
      700: '#388E3C',
      800: '#2E7D32',
      900: '#1B5E20',
    },
    // Alert - Action Red
    alert: {
      DEFAULT: '#F44336',
      50: '#FFEBEE',
      100: '#FFCDD2',
      200: '#EF9A9A',
      300: '#E57373',
      400: '#EF5350',
      500: '#F44336',
      600: '#E53935',
      700: '#D32F2F',
      800: '#C62828',
      900: '#B71C1C',
    },
    // Neutral colors
    neutral: {
      50: '#F5F7FA',
      100: '#E4E7EB',
      200: '#CBD2D9',
      300: '#9AA5B1',
      400: '#7B8794',
      500: '#616E7C',
      600: '#52606D',
      700: '#3E4C59',
      800: '#323F4B',
      900: '#1F2933',
    },
  },
  
  // Typography scale
  typography: {
    fontFamily: {
      display: 'Montserrat, sans-serif',
      body: 'Inter, sans-serif',
      mono: 'Roboto Mono, monospace',
      accent: 'Rubik, sans-serif',
    },
    fontSize: {
      'display-lg': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
      'display-md': ['28px', { lineHeight: '1.3', fontWeight: '700' }],
      'display-sm': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
      'heading': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
      'subheading': ['18px', { lineHeight: '1.5', fontWeight: '600' }],
      'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
      'body': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
      'label': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
      'small': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      'data': ['16px', { lineHeight: '1.4', fontWeight: '500' }],
    },
  },
  
  // Spacing scale
  spacing: {
    '2xs': '4px',   // 0.25rem
    'xs': '8px',    // 0.5rem
    'sm': '12px',   // 0.75rem
    'md': '16px',   // 1rem
    'lg': '24px',   // 1.5rem
    'xl': '32px',   // 2rem
    '2xl': '48px',  // 3rem
    '3xl': '64px',  // 4rem
  },
  
  // Border radius
  borderRadius: {
    'none': '0',
    'sm': '2px',
    'md': '4px',
    'lg': '8px',
    'xl': '12px',
    'full': '9999px',
  },
  
  // Breakpoints
  breakpoints: {
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },
  
  // Animation and transition
  animation: {
    durations: {
      'xs': '100ms',
      'sm': '200ms',
      'md': '300ms',
      'lg': '500ms',
      'xl': '800ms',
    },
    easings: {
      'standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      'enter': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      'exit': 'cubic-bezier(0.4, 0.0, 1, 1)',
      'emphatic': 'cubic-bezier(0.2, 0.9, 0.3, 1.3)',
      'fluid': 'cubic-bezier(0.3, 0, 0, 1)',
      'snappy': 'cubic-bezier(0.2, 0, 0, 1)',
    },
  },
};

export default tokens;