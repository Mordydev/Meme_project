/**
 * Custom color configuration for the Success Kid platform
 * This helps maintain consistency between Tailwind and CSS variables
 */
export const colors = {
  // Primary colors
  primary: {
    DEFAULT: '#1E88E5', // Victory Blue
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  
  // Secondary colors
  secondary: {
    DEFAULT: '#FFC107', // Sand Gold
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
  
  // Accent colors
  accent: {
    DEFAULT: '#4CAF50', // Success Green
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
  
  // Alert colors
  alert: {
    DEFAULT: '#F44336', // Action Red
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
  
  // Interface colors
  interface: {
    background: '#F8FAFC',
    foreground: '#1E293B',
    card: '#FFFFFF',
    popover: '#FFFFFF',
    muted: '#F1F5F9',
    border: '#E2E8F0',
    input: '#E2E8F0',
    ring: '#94A3B8',
  },
};

// For dark mode
export const darkColors = {
  interface: {
    background: '#0F172A',
    foreground: '#F8FAFC',
    card: '#1E293B',
    popover: '#1E293B',
    muted: '#334155',
    border: '#475569',
    input: '#475569',
    ring: '#94A3B8',
  },
};
