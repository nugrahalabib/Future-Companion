# Builder needs the FULL dependency tree (Tailwind v4 + postcss live in
# devDependencies and the Next.js production build cannot compile
# globals.css without them). The runner stage stays slim because it
# uses Next's standalone output, which bundles only what the server
# actually needs at runtime.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# prisma/ holds dev.db (SQLite) which the app must read AND write at runtime,
# plus the journal/wal/shm sidecar files SQLite creates during transactions.
# Without --chown the dir lands as root:root and nextjs gets read-only access,
# so writes throw and silently 500 (admin settings toggle was the symptom).
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Install prisma CLI globally so the entrypoint can run
# `prisma migrate deploy` at container startup. Trying to copy
# /app/node_modules/prisma alone fails because the CLI pulls in
# transitive deps (`effect`, `@prisma/config`, ...) that the slim
# standalone tree omits. A global install sidesteps the missing-
# module dance and adds ~25MB to the image, which is fine.
RUN npm install -g prisma@6.19.3
COPY docker-entrypoint.sh ./
USER nextjs
EXPOSE 2970
# Next.js standalone defaults HOSTNAME to "localhost" which would refuse
# connections from outside the container — bind to 0.0.0.0 so the reverse
# proxy fronting companion.agentbuff.id can reach it.
ENV PORT=2970
ENV HOSTNAME=0.0.0.0
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
