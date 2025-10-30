#!/bin/bash

# Class Registration System - End-to-End Test Runner
# This script runs comprehensive end-to-end tests for the complete system

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

echo "🧪 Class Registration System - End-to-End Test Runner"
echo "====================================================="

# Check if servers are running
print_status "Checking if servers are running..."

BACKEND_RUNNING=false
FRONTEND_RUNNING=false

if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    BACKEND_RUNNING=true
    print_success "Backend server is running (port 3001)"
else
    print_warning "Backend server not running (port 3001)"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    FRONTEND_RUNNING=true
    print_success "Frontend server is running (port 3000)"
else
    print_warning "Frontend server not running (port 3000)"
fi

# Start servers if not running
if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
    print_status "Starting required servers..."
    
    if [ "$BACKEND_RUNNING" = false ]; then
        print_status "Starting backend server..."
        npm run dev:backend > /dev/null 2>&1 &
        BACKEND_PID=$!
        sleep 5
        
        if curl -f http://localhost:3001/health > /dev/null 2>&1; then
            print_success "Backend server started successfully"
        else
            print_error "Failed to start backend server"
            exit 1
        fi
    fi
    
    if [ "$FRONTEND_RUNNING" = false ]; then
        print_status "Starting frontend server..."
        npm run dev:frontend > /dev/null 2>&1 &
        FRONTEND_PID=$!
        sleep 5
        
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            print_success "Frontend server started successfully"
        else
            print_error "Failed to start frontend server"
            exit 1
        fi
    fi
fi

# Wait a moment for servers to be fully ready
print_status "Waiting for servers to be fully ready..."
sleep 3

# Run the end-to-end tests
print_status "Running end-to-end tests..."
echo ""

cd e2e-tests
npm test

TEST_EXIT_CODE=$?

cd ..

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "All end-to-end tests passed! 🎉"
else
    print_error "Some tests failed. Check the output above for details."
fi

# Clean up started processes
if [ ! -z "$BACKEND_PID" ]; then
    print_status "Stopping backend server..."
    kill $BACKEND_PID > /dev/null 2>&1 || true
fi

if [ ! -z "$FRONTEND_PID" ]; then
    print_status "Stopping frontend server..."
    kill $FRONTEND_PID > /dev/null 2>&1 || true
fi

echo ""
print_status "End-to-end test run completed!"

exit $TEST_EXIT_CODE