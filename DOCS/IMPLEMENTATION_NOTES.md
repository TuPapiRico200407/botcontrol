# Implementation Notes

This document contains instructions for working with the various moving parts in the BotControl Monorepo.

## 1. Local Development (Web + Worker)
Run `pnpm dev` from the root directory. This uses `pnpm --parallel` to boot:
- The `api-worker` logic (powered by Wrangler / Hono)
- The `web` frontend (powered by Vite / React)

## 2. Setting up Environment Variables
### Worker (`apps/api-worker/.dev.vars`)
Create a `.dev.vars` file for the local Worker with your Supabase secrets and other API keys. Do not commit this.
```
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_SERVICE_ROLE_KEY="your-local-key"
JWT_SECRET="the-jwt-secret-used-in-supabase"
```

### Web (`apps/web/.env.local`)
Create a `.env.local` to point the web app to your backend or local Supabase.
```
VITE_API_URL="http://localhost:8787"
VITE_SUPABASE_URL="http://127.0.0.1:54321"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

## 3. Database (Supabase)
We use Supabase for PostgreSQL + Auth. Run `supabase start` if running locally, or map to a remote instance.
- **Migrations**: Create new schematics with SQL in `supabase/migrations`. Pushed via `pnpm db:migrate`.
- **Seed**: Place seed logic in `supabase/seed.sql`. Runs via `pnpm db:seed`.

## 4. Deployment to Cloudflare
- Ensure you're logged in: `pnpx wrangler login`.
- Run `pnpm deploy:web` manually or let CI/CD handle it to deploy `apps/web` to Cloudflare Pages.
- Run `pnpm deploy:api` to promote `apps/api-worker` to your live Cloudflare Workers boundary.
