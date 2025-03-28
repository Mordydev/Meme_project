// Export all UI components

// Core UI
export * from './button';
export * from './card';
export * from './input';
export * from './label'; // Re-enabled
export * from './Textarea'; // Fixed casing
export * from './select'; 
// export * from './checkbox'; // Commented out until implemented
// export * from './radio'; // Commented out until implemented
export * from './Switch'; // Fixed casing
export * from './Avatar'; // Fixed casing
export * from './badge';
export * from './progress'; 
export { default as Logo } from './Logo';

// Dialog exports
export * from './dialog'; // Export all dialog primitives
export { Dialog } from './dialog-wrapper'; // Export the wrapper with isOpen/onClose API
// export * from './dialog-simple'; // Commented out as we're using Radix UI dialog

export * from './tabs'; 
export * from './tooltip'; 

// Enhanced UI with Animation
export * from './typewriter-effect';
export * from './glowing-effect';
export * from './particle-effect';
export * from './gradient-border';
export * from './ClientParticles';
export * from './AnimateOnMount';
export * from './ClientMotion';
export * from './EnhancedButton';
export * from './AdvancedGlass';
export * from './loading-spinner';
export * from './animated-badge';
export * from './skeleton-loader';

// Add more exports as needed
