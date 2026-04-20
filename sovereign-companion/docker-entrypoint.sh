#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application on port ${PORT:-2970} (bound to ${HOSTNAME:-0.0.0.0})..."
exec node server.js
