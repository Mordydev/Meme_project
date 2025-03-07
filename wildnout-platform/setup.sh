#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}  Wild 'n Out Platform Development Setup  ${NC}"
echo -e "${BLUE}==========================================${NC}"
echo

# Check Node version
echo -e "${YELLOW}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | tr -d v)

if [ $NODE_MAJOR_VERSION -lt 18 ]; then
  echo -e "${RED}Error: Node.js version 18+ is required. You have $NODE_VERSION.${NC}"
  echo -e "${YELLOW}Please update your Node.js version and try again.${NC}"
  exit 1
fi
echo -e "${GREEN}Node.js version $NODE_VERSION detected. ✓${NC}"
echo

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}Dependencies installed. ✓${NC}"
echo

# Copy environment files
echo -e "${YELLOW}Setting up environment variables...${NC}"
if [ ! -f apps/frontend/.env.local ]; then
  cp apps/frontend/.env.example apps/frontend/.env.local
  echo -e "${GREEN}Frontend environment file created. ✓${NC}"
else
  echo -e "${YELLOW}Frontend environment file already exists. Skipping.${NC}"
fi

if [ ! -f apps/backend/.env ]; then
  cp apps/backend/.env.example apps/backend/.env
  echo -e "${GREEN}Backend environment file created. ✓${NC}"
else
  echo -e "${YELLOW}Backend environment file already exists. Skipping.${NC}"
fi
echo

# Check if Docker is installed
echo -e "${YELLOW}Checking for Docker...${NC}"
if command -v docker &> /dev/null; then
  echo -e "${GREEN}Docker is installed. ✓${NC}"
  
  echo -e "${YELLOW}Would you like to start local services with Docker Compose? (y/n)${NC}"
  read -r START_DOCKER
  
  if [[ $START_DOCKER =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Starting Docker services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Docker services started. ✓${NC}"
  else
    echo -e "${YELLOW}Skipping Docker services.${NC}"
  fi
else
  echo -e "${YELLOW}Docker not found. Skipping Docker services.${NC}"
  echo -e "${YELLOW}You'll need to set up your own PostgreSQL and Redis instances.${NC}"
fi
echo

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Setup complete! 🚀                  ${NC}"
echo -e "${GREEN}======================================${NC}"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Update environment variables in:"
echo -e "   - apps/frontend/.env.local"
echo -e "   - apps/backend/.env"
echo -e "2. Start the development server with: ${BLUE}npm run dev${NC}"
echo -e "3. For more information, see the docs directory"
echo
