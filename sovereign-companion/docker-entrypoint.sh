#!/bin/sh
set -e

# Prisma CLI is installed globally in the Dockerfile's runner stage so
# we can call it directly here. The schema + migrations folder come
# from the builder via COPY --from=builder /app/prisma ./prisma.
echo "Running database migrations..."
prisma migrate deploy

echo "Starting application on port ${PORT:-2970} (bound to ${HOSTNAME:-0.0.0.0})..."
exec node server.js
