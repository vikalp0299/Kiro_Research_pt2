#!/bin/bash

# Class Registration System - Environment Test Script
# This script tests the complete development environment setup

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

echo "🧪 Class Registration System - Environment Test"
echo "==============================================="

# Test database initialization
print_status "Testing database initialization..."
if npm run dev:database > /dev/null 2>&1; then
    print_success "Database initialization successful"
else
    print_error "Database initialization failed"
    exit 1
fi

# Wait a moment for servers to be ready
sleep 2

# Test backend health
print_status "Testing backend server health..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend server is healthy (port 3001)"
else
    print_warning "Backend server not responding on port 3001"
fi

# Test frontend
print_status "Testing frontend server..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend server is healthy (port 3000)"
else
    print_warning "Frontend server not responding on port 3000"
fi

# Test API endpoints
print_status "Testing API endpoints..."

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
if echo "$HEALTH_RESPONSE" | grep -q "success.*true"; then
    print_success "Health endpoint working"
else
    print_warning "Health endpoint not working properly"
fi

# Test class endpoint (should work without authentication for GET)
if curl -f http://localhost:3001/api/classFunc/displayAllAvailableClasses > /dev/null 2>&1; then
    print_success "Class API endpoint accessible"
else
    print_warning "Class API endpoint not accessible"
fi

echo ""
print_success "Environment test completed!"
echo ""
echo "🌐 Application URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  Health:   http://localhost:3001/health"
echo ""
echo "📋 Available Commands:"
echo "  npm run dev          - Start both servers"
echo "  npm run test         - Run all tests"
echo "  npm run health       - Quick health check"
echo ""