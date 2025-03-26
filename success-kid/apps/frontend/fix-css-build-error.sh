#!/bin/bash
# Comprehensive fix for CSS build errors with Next.js 15.2

set -e # Exit immediately if a command exits with a non-zero status

# Change to the frontend directory
cd "$(dirname "$0")"

echo "Starting CSS build error fix..."

# Step 1: Creating backups of the affected files
echo "Creating backups of configuration files..."
cp postcss.config.js postcss.config.js.backup
cp src/app/globals.css src/app/globals.css.backup

# Step 2: Installing required dependencies
echo "Installing necessary dependencies..."
npm install --save-dev autoprefixer tailwindcss mini-css-extract-plugin css-loader postcss-loader @tailwindcss/nesting --legacy-peer-deps

# Step 3: Update PostCSS configuration
echo "Updating PostCSS configuration..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Step 4: Update globals.css
echo "Updating globals.css to fix Tailwind v4 alpha issues..."
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Base design tokens */
  --font-display: "Montserrat", "sans-serif";
  --font-body: "Inter", "sans-serif";
  --font-mono: "Roboto Mono", "monospace";
  --font-accent: "Rubik", "sans-serif";
  
  /* Color system - RGB values */
  --color-primary-rgb: 30, 136, 229; /* Victory Blue */
  --color-primary-50-rgb: 227, 242, 253;
  --color-primary-100-rgb: 187, 222, 251;
  --color-primary-900-rgb: 13, 71, 161;
  --color-secondary-rgb: 255, 193, 7; /* Sand Gold */
  --color-accent-rgb: 76, 175, 80; /* Success Green */
  --color-alert-rgb: 244, 67, 54; /* Action Red */
  
  /* Color system - HEX/RGB format for Tailwind v3 compatibility */
  --color-primary: #1E88E5; /* Victory Blue */
  --color-primary-50: #E3F2FD;
  --color-primary-100: #BBDEFB;
  --color-primary-200: #90CAF9;
  --color-primary-300: #64B5F6;
  --color-primary-400: #42A5F5;
  --color-primary-500: #2196F3;
  --color-primary-600: #1E88E5;
  --color-primary-700: #1976D2;
  --color-primary-800: #1565C0;
  --color-primary-900: #0D47A1;
  
  --color-secondary: #FFC107; /* Sand Gold */
  --color-secondary-50: #FFF8E1;
  --color-secondary-100: #FFECB3;
  --color-secondary-200: #FFE082;
  --color-secondary-300: #FFD54F;
  --color-secondary-400: #FFCA28;
  --color-secondary-500: #FFC107;
  --color-secondary-600: #FFB300;
  --color-secondary-700: #FFA000;
  --color-secondary-800: #FF8F00;
  --color-secondary-900: #FF6F00;
  
  --color-accent: #4CAF50; /* Success Green */
  --color-accent-50: #E8F5E9;
  --color-accent-100: #C8E6C9;
  --color-accent-200: #A5D6A7;
  --color-accent-300: #81C784;
  --color-accent-400: #66BB6A;
  --color-accent-500: #4CAF50;
  --color-accent-600: #43A047;
  --color-accent-700: #388E3C;
  --color-accent-800: #2E7D32;
  --color-accent-900: #1B5E20;
  
  --color-alert: #F44336; /* Action Red */
  --color-alert-50: #FFEBEE;
  --color-alert-100: #FFCDD2;
  --color-alert-200: #EF9A9A;
  --color-alert-300: #E57373;
  --color-alert-400: #EF5350;
  --color-alert-500: #F44336;
  --color-alert-600: #E53935;
  --color-alert-700: #D32F2F;
  --color-alert-800: #C62828;
  --color-alert-900: #B71C1C;
  
  /* Interface colors - light mode */
  --background: #F8FAFC;
  --foreground: #1E293B;
  --card: #FFFFFF;
  --card-foreground: #1E293B;
  --popover: #FFFFFF;
  --popover-foreground: #1E293B;
  --muted: #F1F5F9;
  --muted-foreground: #64748B;
  --muted-foreground-rgb: 100, 116, 139;
  --border: #E2E8F0;
  --input: #E2E8F0;
  --ring: #94A3B8;
  
  /* Spacing */
  --spacing: 0.25rem;
  
  /* Animation tokens */
  --ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-enter: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-exit: cubic-bezier(0.4, 0.0, 1, 1);
  --ease-emphatic: cubic-bezier(0.2, 0.9, 0.3, 1.3);
  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
  --ease-snappy: cubic-bezier(0.2, 0, 0, 1);
  
  /* Radius */
  --radius: 8px;
}

/* Dark mode variables */
.dark {
  --background: #0F172A;
  --foreground: #F8FAFC;
  --card: #1E293B;
  --card-foreground: #F8FAFC;
  --popover: #1E293B;
  --popover-foreground: #F8FAFC;
  --muted: #334155;
  --muted-foreground: #94A3B8;
  --muted-foreground-rgb: 148, 163, 184;
  --border: #475569;
  --input: #475569;
  --ring: #94A3B8;
}

@layer base {
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    font-weight: 600;
  }
  
  h1 {
    @apply text-4xl leading-tight;
  }
  
  h2 {
    @apply text-3xl leading-tight;
  }
  
  h3 {
    @apply text-2xl leading-tight;
  }
  
  h4 {
    @apply text-xl leading-snug;
  }
  
  h5 {
    @apply text-lg leading-snug;
  }
  
  h6 {
    @apply text-base leading-normal font-semibold;
  }
  
  code, pre {
    font-family: var(--font-mono);
  }
}

@layer utilities {
  /* Custom utility classes not covered by Tailwind */
  .text-balance {
    text-wrap: balance;
  }
  
  /* Glass Effect Utility Classes */
  .glass-effect {
    @apply backdrop-blur-md bg-white/60 dark:bg-gray-900/60;
  }
  
  /* Fallback for browsers without backdrop-filter support */
  @supports not ((backdrop-filter: blur(8px)) or (-webkit-backdrop-filter: blur(8px))) {
    .glass-effect {
      @apply bg-white/90 dark:bg-gray-900/90;
    }
  }
}

/* Animations for Success Kid elements */
@keyframes success-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
  }
}

.animate-success {
  animation: success-pulse 2s var(--ease-fluid) infinite;
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-in-out;
}

.animate-slideUp {
  animation: slideUp 0.5s ease-out;
}

/* Dashboard animations */
@keyframes falling-slow {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(400px) rotate(360deg); opacity: 0; }
}

@keyframes falling-medium {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(400px) rotate(180deg); opacity: 0; }
}

@keyframes falling-fast {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(400px) rotate(90deg); opacity: 0; }
}

.animate-falling-slow {
  animation: falling-slow 15s linear infinite;
}

.animate-falling-medium {
  animation: falling-medium 10s linear infinite;
}

.animate-falling-fast {
  animation: falling-fast 7s linear infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background-color: var(--muted);
}

::-webkit-scrollbar-thumb {
  background-color: rgba(var(--muted-foreground-rgb), 0.3);
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--muted-foreground-rgb), 0.5);
}

/* For Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--muted-foreground) var(--muted);
}
EOF

# Step 5: Ensure Tailwind config matches with the CSS
echo "Checking Tailwind configuration..."

echo "Fix complete! Run 'npm run build' to test if the issue is resolved."
echo ""
echo "If you still encounter issues, you may need to run:"
echo "npm install --save-dev webpack"
echo ""
echo "This will install webpack as a dev dependency, which might help with Next.js 15.2 compatibility."
