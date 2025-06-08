#!/bin/bash

set -e  # Stop on error
set -u  # Treat unset variables as errors

# Make all build scripts executable
chmod +x ./identity-generator/build.sh
chmod +x ./password-generator/build.sh
chmod +x ./models/build.sh

# Run all build scripts
echo "🚀 Starting build process for all modules..."
cd ./identity-generator
./build.sh

cd ../password-generator
./build.sh

cd ../models
./build.sh

echo "✅ All builds completed successfully."
