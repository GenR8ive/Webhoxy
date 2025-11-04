#!/bin/bash

# Webhoxy Development Server Script
# Starts both API and Web services concurrently

set -e

echo "🚀 Starting Webhoxy in development mode..."
echo ""

# Check if dependencies are installed
if [ ! -d "api/node_modules" ] || [ ! -d "web/node_modules" ]; then
    echo "⚠️  Dependencies not found. Running setup first..."
    ./scripts/setup.sh
fi

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Start API in background
echo "🔧 Starting API server on http://localhost:8080..."
cd api
npm run dev &
API_PID=$!
cd ..

# Wait a bit for API to start
sleep 2

# Start Web in background
echo "🎨 Starting Web server on http://localhost:5173..."
cd web
npm run dev &
WEB_PID=$!
cd ..

echo ""
echo "✅ Development servers started!"
echo ""
echo "📝 Access points:"
echo "   - Web UI: http://localhost:5173"
echo "   - API:    http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all servers..."
echo ""

# Wait for both processes
wait $API_PID $WEB_PID

