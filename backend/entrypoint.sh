#!/bin/bash
set -e

echo "Waiting for database..."
sleep 3
echo "Initializing admin user..."
python scripts/init_admin.py || echo "Warning: Admin init failed, continuing..."
echo "Starting the application..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload