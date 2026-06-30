#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Build the React Frontend
echo "Building the React frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Install Backend Dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..
