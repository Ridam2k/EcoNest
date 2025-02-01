#!/bin/bash
set -e  # Exit on error

# Build the React frontend
echo "Building frontend..."
cd ui
npm install
npm run build
cd ..

# Set up a virtual environment
echo "Setting up virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --no-cache-dir -r api/requirements.txt

echo "Build completed successfully."
