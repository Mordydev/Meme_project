/**
 * Make the setup-env.js script executable
 */
const fs = require('fs');
const path = require('path');

const setupEnvPath = path.join(__dirname, 'setup-env.js');

try {
  // Add execute permissions (chmod +x)
  fs.chmodSync(setupEnvPath, '755');
  console.log('Made setup-env.js executable');
} catch (error) {
  console.error('Error making setup-env.js executable:', error);
}
