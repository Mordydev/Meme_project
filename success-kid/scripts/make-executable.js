/**
 * A script to make all shell scripts executable
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptsDir = path.join(__dirname);

console.log('Making shell scripts executable...');

try {
  // Get all .sh files in the scripts directory
  const files = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.sh'));

  // Make each file executable
  files.forEach(file => {
    const filePath = path.join(scriptsDir, file);
    console.log(`Making ${filePath} executable...`);
    execSync(`chmod +x ${filePath}`);
  });

  // Make the husky scripts executable if they exist
  const huskyDir = path.join(__dirname, '..', '.husky');
  if (fs.existsSync(huskyDir)) {
    const huskyFiles = fs.readdirSync(huskyDir).filter(file => !file.startsWith('_'));
    huskyFiles.forEach(file => {
      const filePath = path.join(huskyDir, file);
      console.log(`Making ${filePath} executable...`);
      execSync(`chmod +x ${filePath}`);
    });
  }

  console.log('All shell scripts are now executable.');
} catch (error) {
  console.error('Error making scripts executable:', error);
  process.exit(1);
}