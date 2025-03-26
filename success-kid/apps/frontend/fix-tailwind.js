// This script updates package.json to ensure correct Tailwind dependencies
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Function to update package.json
function updatePackageJson() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = require(packageJsonPath);

  // Update or add dependencies
  const devDependencies = {
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.2",  // Use Tailwind v3 for better compatibility
    "tailwindcss-animate": "^1.0.6"
  };

  // Remove problematic dependencies
  if (packageJson.devDependencies['@tailwindcss/postcss']) {
    delete packageJson.devDependencies['@tailwindcss/postcss'];
  }

  // Update dependencies
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    ...devDependencies
  };

  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Updated package.json with correct Tailwind dependencies');
}

// Create basic Tailwind config
function createTailwindConfig() {
  const config = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E88E5',
        secondary: '#FFC107',
        accent: '#4CAF50',
        alert: '#F44336',
        background: '#F8FAFC',
        foreground: '#1E293B',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}`;

  fs.writeFileSync(path.join(__dirname, 'tailwind.config.js'), config);
  console.log('Created basic tailwind.config.js');
}

// Create basic PostCSS config
function createPostcssConfig() {
  const config = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

  fs.writeFileSync(path.join(__dirname, 'postcss.config.js'), config);
  console.log('Created basic postcss.config.js');
}

// Function to install dependencies
function installDependencies() {
  console.log('Installing dependencies...');
  exec('npm install', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
    console.log('Dependencies installed successfully');
  });
}

// Run the fix
console.log('Starting Tailwind CSS fix...');
updatePackageJson();
createTailwindConfig();
createPostcssConfig();
installDependencies();
console.log('Fix completed. Please run "npm run dev" to test the changes.');
