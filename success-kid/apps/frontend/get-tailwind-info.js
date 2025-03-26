// Get Tailwind package versions
console.log('Checking @tailwindcss/postcss version:');
try {
  const postcssVersion = require('@tailwindcss/postcss/package.json').version;
  console.log(`@tailwindcss/postcss: ${postcssVersion}`);
} catch (e) {
  console.log('Error loading @tailwindcss/postcss:', e.message);
}

console.log('\nChecking tailwindcss version:');
try {
  const tailwindVersion = require('tailwindcss/package.json').version;
  console.log(`tailwindcss: ${tailwindVersion}`);
} catch (e) {
  console.log('Error loading tailwindcss:', e.message);
}

console.log('\nChecking tailwindcss-animate version:');
try {
  const animateVersion = require('tailwindcss-animate/package.json').version;
  console.log(`tailwindcss-animate: ${animateVersion}`);
} catch (e) {
  console.log('Error loading tailwindcss-animate:', e.message);
}
