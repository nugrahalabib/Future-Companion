This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:2970](http://localhost:2970) with your browser to see the result.

## Deployment — `companion.agentbuff.id`

- App listens on port **2970** (set in `package.json`, `Dockerfile`, `docker-compose.yml`).
- Container binds to `0.0.0.0:2970` via `HOSTNAME=0.0.0.0` so a reverse proxy (Caddy / nginx / Traefik) can forward `https://companion.agentbuff.id` → container port 2970.
- Set `NEXT_PUBLIC_APP_URL=https://companion.agentbuff.id` in the production env before building (it is baked into client bundles — rebuild on domain change).
- Gemini Live uses a browser-direct WebSocket to `wss://generativelanguage.googleapis.com`, so no server-side proxy / CORS rule is required. Keep `NEXT_PUBLIC_GEMINI_API_KEY` rotated — it is public.
- Prisma migrations run automatically on container start via `docker-entrypoint.sh`. Provide a Postgres `DATABASE_URL` for prod (the dev SQLite file will not survive redeploys).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
