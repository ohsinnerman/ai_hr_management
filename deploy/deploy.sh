#!/bin/bash
# Deployment script for NexusHR Backend on EC2
# Run this on the EC2 instance

set -e

APP_DIR="/home/ubuntu/ai_hr_management"

echo "Deploying NexusHR Backend..."

if [ ! -d "$APP_DIR" ]; then
  echo "Error: Directory $APP_DIR does not exist. Please clone the repository first."
  exit 1
fi

cd $APP_DIR

echo "Pulling latest code..."
git pull origin main

echo "Building and restarting Docker containers..."
docker compose -f docker-compose.prod.yml up -d --build

echo "Deployment completed successfully!"
docker ps
