#!/bin/bash
set -e

echo "🚀 Starting MV42 deployment..."

# Navigate to project directory
cd /srv/mv42

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from main..."
git fetch origin
git reset --hard origin/main

# Install dependencies (production only)
echo "📦 Installing dependencies..."
npm install --omit=dev

# Reload PM2 application
echo "🔄 Reloading PM2 application..."
pm2 reload deploy/ecosystem.config.js

echo "✅ Deployment complete!"
