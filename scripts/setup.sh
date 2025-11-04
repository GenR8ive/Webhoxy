#!/bin/bash

# Webhoxy Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Webhoxy..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js is not installed. Please install Node.js 20+ first.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Node.js version: $(node --version)${NC}"
echo ""

# Setup API
echo -e "${BLUE}🔧 Setting up API...${NC}"
cd api

if [ ! -f .env ]; then
    echo "Creating .env file from env.example..."
    cp env.example .env
    echo -e "${GREEN}✓ Created api/.env${NC}"
else
    echo -e "${YELLOW}⚠️  api/.env already exists, skipping...${NC}"
fi

echo "Installing API dependencies..."
npm install
echo -e "${GREEN}✓ API dependencies installed${NC}"
echo ""

cd ..

# Setup Web
echo -e "${BLUE}🎨 Setting up Web...${NC}"
cd web

if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓ Created web/.env${NC}"
else
    echo -e "${YELLOW}⚠️  web/.env already exists, skipping...${NC}"
fi

echo "Installing Web dependencies..."
npm install
echo -e "${GREEN}✓ Web dependencies installed${NC}"
echo ""

cd ..

# Create data directory
echo -e "${BLUE}📁 Creating data directory...${NC}"
mkdir -p api/data
echo -e "${GREEN}✓ Data directory created${NC}"
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}To start development servers:${NC}"
echo "  ${YELLOW}npm run dev${NC}  (from root directory)"
echo ""
echo "Or start services individually:"
echo "  ${YELLOW}cd api && npm run dev${NC}  (API server on http://localhost:8080)"
echo "  ${YELLOW}cd web && npm run dev${NC}  (Web UI on http://localhost:5173)"
echo ""
echo -e "${BLUE}To start with Docker:${NC}"
echo "  ${YELLOW}docker-compose up -d${NC}"
echo ""
echo "Happy coding! 🎉"

