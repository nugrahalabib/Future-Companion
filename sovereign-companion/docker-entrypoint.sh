#!/bin/sh
set -e

# The Dockerfile copies node_modules/prisma but not node_modules/.bin,
# so `npx prisma` fails with "prisma: not found". Invoke the prisma CLI
# entry script directly via node — same effect, no PATH gymnastics.
echo "Running database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

echo "Starting application on port ${PORT:-2970} (bound to ${HOSTNAME:-0.0.0.0})..."
exec node server.js
