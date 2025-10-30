#!/bin/bash

# Class Registration System - Development Setup Script
# This script sets up the development environment for all components

set -e  # Exit on any error

echo "🚀 Setting up Class Registration System Development Environment"
echo "============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

NPM_VERSION=$(npm --version)
print_status "npm version: $NPM_VERSION"

# Install root dependencies
print_status "Installing root dependencies..."
npm install
print_success "Root dependencies installed"

# Install Backend dependencies
print_status "Installing Backend dependencies..."
cd BackEnd
npm install
cd ..
print_success "Backend dependencies installed"

# Install Frontend dependencies
print_status "Installing Frontend dependencies..."
cd FrontEnd
npm install
cd ..
print_success "Frontend dependencies installed"

# Install Database dependencies
print_status "Installing Database dependencies..."
cd Database
npm install
cd ..
print_success "Database dependencies installed"

# Create environment files if they don't exist
print_status "Setting up environment files..."

if [ ! -f "BackEnd/.env" ]; then
    cp BackEnd/.env.example BackEnd/.env
    print_warning "Created BackEnd/.env from template. Please update with your configuration."
fi

if [ ! -f "Database/.env" ]; then
    cp Database/.env.example Database/.env
    print_warning "Created Database/.env from template. Please update with your AWS configuration."
fi

# Create logs directory
mkdir -p BackEnd/Logs
print_status "Created logs directory"

print_success "Development environment setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Update BackEnd/.env with your JWT secret"
echo "2. Update Database/.env with your AWS credentials"
echo "3. Run 'npm run setup' to initialize the database"
echo "4. Run 'npm run dev' to start development servers"
echo ""
echo "🔧 Available Commands:"
echo "  npm run dev          - Start both frontend and backend in development mode"
echo "  npm run dev:backend  - Start only backend server"
echo "  npm run dev:frontend - Start only frontend server"
echo "  npm run dev:database - Initialize database with sample data"
echo "  npm run test         - Run all tests"
echo "  npm run health       - Check if servers are running"
echo ""