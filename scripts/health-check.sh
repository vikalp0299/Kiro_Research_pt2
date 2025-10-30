#!/bin/bash

# Class Registration System - Health Check Script
# This script verifies that the development environment is properly configured

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

echo "🏥 Class Registration System - Health Check"
echo "=========================================="

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not found"
    exit 1
fi

# Check dependencies
print_status "Checking dependencies..."

if [ -d "node_modules" ]; then
    print_success "Root dependencies installed"
else
    print_warning "Root dependencies not installed"
fi

if [ -d "BackEnd/node_modules" ]; then
    print_success "Backend dependencies installed"
else
    print_warning "Backend dependencies not installed"
fi

if [ -d "FrontEnd/node_modules" ]; then
    print_success "Frontend dependencies installed"
else
    print_warning "Frontend dependencies not installed"
fi

if [ -d "Database/node_modules" ]; then
    print_success "Database dependencies installed"
else
    print_warning "Database dependencies not installed"
fi

# Check environment files
print_status "Checking environment configuration..."

if [ -f "BackEnd/.env" ]; then
    print_success "Backend environment file exists"
else
    print_warning "Backend .env file not found"
fi

if [ -f "Database/.env" ]; then
    print_success "Database environment file exists"
    
    # Check if AWS credentials are configured
    if grep -q "your_access_key_here" Database/.env; then
        print_warning "Database .env contains placeholder values - update with real AWS credentials"
    else
        print_success "Database .env appears to be configured"
    fi
else
    print_warning "Database .env file not found"
fi

# Check if servers are running
print_status "Checking running servers..."

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend server is running (port 3001)"
else
    print_warning "Backend server not running (port 3001)"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend server is running (port 3000)"
else
    print_warning "Frontend server not running (port 3000)"
fi

# Check AWS CLI (optional)
if command -v aws &> /dev/null; then
    print_success "AWS CLI installed"
else
    print_warning "AWS CLI not installed (optional)"
fi

echo ""
print_status "Health check completed!"
echo ""
echo "📋 Quick Commands:"
echo "  npm run install:all  - Install all dependencies"
echo "  npm run setup        - Full setup with database initialization"
echo "  npm run dev          - Start development servers"
echo "  ./scripts/start-dev.sh - Start with initialization"
echo ""