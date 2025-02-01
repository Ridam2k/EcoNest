#!/bin/bash
set -e  # Exit on error

# Build the React frontend
echo "Building frontend..."
cd ui
npm install
npm run build
cd ..

# Set a custom temporary directory for pip
export TMPDIR=$(mktemp -d)

# Install Python dependencies
echo "Installing Python dependencies..."
python3 -m pip install --no-cache-dir --force-reinstall --prefix=$TMPDIR -r api/requirements.txt

echo "Build completed successfully."
