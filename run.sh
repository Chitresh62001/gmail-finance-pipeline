#!/bin/bash

echo "Starting Gmail Finance Dashboard..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Start the FastAPI Backend Server
echo -e "${BLUE}Starting FastAPI Backend on port 8000...${NC}"
source .venv/bin/activate
cd dashboard
# Run uvicorn in the background using the venv's python
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for the backend to initialize
sleep 2

# 2. Start the React Frontend Development Server
echo -e "${GREEN}Starting Vite Frontend on port 5173...${NC}"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20

cd frontend
# Run Vite in the background
npm run dev -- --port 5173 > frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "========================================================"
echo -e "${GREEN}Dashboard is now running!${NC}"
echo "Frontend UI: http://localhost:5173"
echo "Backend API: http://localhost:8000/docs"
echo ""
echo "To stop the servers, press CTRL+C"
echo "========================================================"

# Catch CTRL+C (SIGINT) to clean up background processes
trap "echo -e '\nStopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait indefinitely until interrupted
wait
