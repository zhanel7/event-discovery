#!/bin/sh
set -e
python scripts/init_admin.py
exec uvicorn main:app --host 0.0.0.0 --port 8000
