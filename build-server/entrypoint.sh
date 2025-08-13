#!/bin/bash

set -e

echo "Starting build process..."

# Validate env variables
if [ -z "$REPO_URL" ]; then
  echo "Error: REPO_URL is not set"
  exit 1
fi

if [ -z "$SLUG" ]; then
  echo "Error: SLUG is not set"
  exit 1
fi

# Clone the repo
echo "Cloning $REPO_URL..."
git clone "$REPO_URL" repo
cd repo

# Execute JavaScript build script
echo "Running build script..."
node ../build-script.js



