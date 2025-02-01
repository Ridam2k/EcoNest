#!/bin/bash
# Install frontend dependencies and build
cd ui
npm install
npm run build
cd ..

# Install Python dependencies
pip install -r api/requirements.txt
