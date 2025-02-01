#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Build the React frontend
echo "Building frontend..."
cd ui
npm install
npm run build
cd ..

# Install backend Python dependencies
echo "Installing Python dependencies..."
pip install -r api/requirements.txt

echo "Build completed successfully."
