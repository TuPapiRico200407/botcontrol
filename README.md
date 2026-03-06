# BotControl

Welcome to the BotControl Monorepo.

## Quickstart

### Prerequisites
- Node.js LTS (>=20)
- pnpm (>=9)
- Supabase CLI (optional, but recommended for DB migrations)
- Wrangler (for Cloudflare Workers)

### Setup
1. Clone the repository.
2. Run `pnpm install` in the root directory.
3. Configure your environmental variables (`apps/api-worker/.dev.vars`, `apps/web/.env`).
4. Run Supabase locally or link to a remote instance.

### Development
- `pnpm dev`: Starts both the Worker and the Web app in parallel.
- `pnpm build`: Builds all packages.
- `pnpm lint`: Runs ESLint on all projects.
- `pnpm test`: Runs Unit tests.
- `pnpm e2e`: Runs E2E Playwright tests.

### Deployment
- `pnpm deploy:web`: Deploys the UI to Cloudflare Pages.
- `pnpm deploy:api`: Deploys the worker to Cloudflare Workers.
- `pnpm db:migrate` and `pnpm db:seed`: Migrates and seeds your Supabase DB.
