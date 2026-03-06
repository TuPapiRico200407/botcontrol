# Required Environment Variables

## Web App (`apps/web/.env.local`)
```
VITE_API_URL=http://localhost:8787
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## API Worker (`apps/api-worker/.dev.vars`)
```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret
```

## Cloudflare Pages (production)
Set via the Cloudflare Pages dashboard:
- `VITE_API_URL` → API Worker URL
- `VITE_SUPABASE_URL` → Supabase project URL
- `VITE_SUPABASE_ANON_KEY` → Supabase anon key

## Cloudflare Workers (production)
Set via Wrangler secrets (`wrangler secret put SUPABASE_URL`, etc.) or `wrangler.toml [vars]`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `CEREBRAS_API_KEY` (for LLM integration)

## Setting SUPER_ADMIN Role
The `super_admin` role is assigned by setting `app_role` in the Supabase auth user's `app_metadata`.
Run this via the Supabase dashboard or a service-role SQL migration:
```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"app_role": "super_admin"}'
WHERE email = 'admin@yourcompany.com';
```
This does NOT require any code changes or hardcoding.
