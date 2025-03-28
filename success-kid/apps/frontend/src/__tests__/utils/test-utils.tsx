import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Create a custom renderer that includes commonly used providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {/* Add providers here as needed (e.g., theme, auth, etc.) */}
      {children}
    </>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };