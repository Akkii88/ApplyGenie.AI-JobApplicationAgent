#!/bin/bash

echo "Cleaning ports..."

# Kill backend (5001)
lsof -ti:5001 | xargs kill -9 2>/dev/null

# Kill frontend (5173)
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "Starting backend..."
cd server
npm run dev &
sleep 3

echo "Starting frontend (stitch-ui)..."
cd ../stitch-ui

# Install dependencies (pnpm workspace)
pnpm install

# Run frontend with required env variables
PORT=5173 BASE_PATH=/ pnpm --filter applygenie dev &

echo "----------------------------------"
echo "Backend:  http://localhost:5001"
echo "Frontend: http://localhost:5173"
echo "----------------------------------"

# Keep both processes alive
wait