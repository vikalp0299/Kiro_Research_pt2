#!/bin/bash

# Class Registration System - Development Startup Script
# This script starts all development servers with proper initialization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 Starting Class Registration System Development Environment"
echo "============================================================="

# Check if environment files exist
if [ ! -f "BackEnd/.env" ]; then
    print_warning "BackEnd/.env not found. Creating from template..."
    cp BackEnd/.env.example BackEnd/.env
fi

if [ ! -f "Database/.env" ]; then
    print_warning "Database/.env not found. Creating from template..."
    cp Database/.env.example Database/.env
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ] || [ ! -d "BackEnd/node_modules" ] || [ ! -d "FrontEnd/node_modules" ] || [ ! -d "Database/node_modules" ]; then
    print_status "Dependencies not found. Installing..."
    npm run install:all
fi

# Initialize database
print_status "Initializing database..."
npm run dev:database

print_success "Database initialized successfully!"

# Start development servers
print_status "Starting development servers..."
print_status "Backend will run on: http://localhost:3001"
print_status "Frontend will run on: http://localhost:3000"

echo ""
print_warning "Press Ctrl+C to stop all servers"
echo ""

# Start both servers concurrently
npm run dev