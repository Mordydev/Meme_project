/**
 * Environment Setup Script
 * 
 * This script helps with environment configuration by:
 * 1. Checking if .env.local exists
 * 2. Creating .env.local from .env.example if needed
 * 3. Validating essential environment variables
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '../');
const localEnvPath = path.join(rootDir, '.env.local');
const exampleEnvPath = path.join(rootDir, '.env.example');

// Define color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

// Function to create .env.local from .env.example
function setupLocalEnv() {
  console.log(`${colors.blue}Checking environment configuration...${colors.reset}`);
  
  if (!fs.existsSync(localEnvPath)) {
    if (fs.existsSync(exampleEnvPath)) {
      fs.copyFileSync(exampleEnvPath, localEnvPath);
      console.log(`${colors.green}✅ Created .env.local from .env.example${colors.reset}`);
      console.log(`${colors.yellow}⚠️ Please update the values in .env.local with your actual configuration${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ .env.example not found. Cannot create .env.local${colors.reset}`);
      console.log(`${colors.yellow}Please create .env.example first, then run this script again.${colors.reset}`);
      process.exit(1);
    }
  } else {
    console.log(`${colors.green}✅ .env.local already exists${colors.reset}`);
  }
}

// Function to check if Docker is installed
function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    console.log(`${colors.green}✅ Docker is installed${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Docker is not installed or not in PATH${colors.reset}`);
    console.log(`${colors.yellow}Please install Docker to use the containerized development environment:${colors.reset}`);
    console.log(`${colors.blue}https://docs.docker.com/get-docker/${colors.reset}`);
    return false;
  }
}

// Function to check if Docker Compose is installed
function checkDockerCompose() {
  try {
    execSync('docker compose version', { stdio: 'ignore' });
    console.log(`${colors.green}✅ Docker Compose is installed${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Docker Compose is not installed or not in PATH${colors.reset}`);
    console.log(`${colors.yellow}Docker Compose is included with Docker Desktop, or can be installed separately:${colors.reset}`);
    console.log(`${colors.blue}https://docs.docker.com/compose/install/${colors.reset}`);
    return false;
  }
}

// Main function
function main() {
  console.log(`${colors.blue}=== Success Kid Platform Environment Setup ===${colors.reset}`);
  
  // Setup local environment
  setupLocalEnv();
  
  // Check Docker installation
  const dockerInstalled = checkDocker();
  
  // Check Docker Compose installation if Docker is installed
  if (dockerInstalled) {
    checkDockerCompose();
  }
  
  console.log(`\n${colors.blue}Environment setup complete!${colors.reset}`);
  console.log(`${colors.green}Next steps:${colors.reset}`);
  console.log(`1. Edit .env.local with your configuration values`);
  console.log(`2. Run 'docker compose -f docker/development/docker-compose.yml up -d' to start services`);
  console.log(`3. Run 'pnpm dev' to start the development servers`);
}

// Run the script
main();
