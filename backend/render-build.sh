#!/usr/bin/env bash
# Exit on error
set -o errexit

# Clean install dependencies
rm -rf node_modules
rm -f package-lock.json
npm install
