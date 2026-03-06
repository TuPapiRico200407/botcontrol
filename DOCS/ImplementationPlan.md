# ImplementationPlan.md — Sprint 01

## Objetivo
Implementar autenticación RBAC, CRUD de empresas, gestión de usuarios y configuración base de bot/IA con auditoría.

---

## Sync: Estructura de Repo Actual

**Monorepo:** pnpm workspace  
**Web:** apps/web (Vite + React, Cloudflare Pages)  
**API:** apps/api-worker (Cloudflare Workers, Wrangler)  
**Packages:** packages/ui, packages/application, packages/domain, packages/infrastructure  
**DB:** supabase/migrations + seed.sql  
**Tests:** vitest (workspace)  
**Convenciones:** TSConfig strict, ESLint, Playwright e2e  

---

## Pasos de Implementación

### FASE 3: UI Kit Global (Paso 0 — Prerequisito)

**3.1** Revisar UI kit existente en `packages/ui/src/`  
- [ ] Verificar componentes: Button, Input, Select, Modal, DataTable, Tabs, FormField, Badge, Toast, EmptyState, AppShell, Card
- [ ] Aplicar estilo global oscuro + neutro si falta
- [ ] Crear UIKIT.md con documentación mínima
- [ ] Registrar cambios en UI_DIFF.md

**Archivos tocados:**
- `packages/ui/src/*` (siguientes)
- Crear `packages/ui/UIKIT.md`
- Crear `UI_DIFF.md` (en DOCS/)

---

### FASE 4: Implementación (Pasos 1–10)

#### Paso 1: Migraciones y Seed DB

**1.1** Revisar migraciones existentes  
- [ ] Ver `supabase/migrations/` (0000_init.sql, 0001_rls.sql)
- [ ] Confirmar structure de users, organizations, etc.

**1.2** Crear migraciones nuevas  
- [ ] `supabase/migrations/0002_sprint01_auth_rbac.sql`
  - CREATE TABLE organizations (id, name, slug, active, created_at, updated_at, created_by)
  - CREATE TABLE org_members (id, org_id, user_id, role, active, invited_at, activated_at, created_by, created_at, updated_at)
  - CREATE TABLE bots (id, org_id, name, prompt, model, temperature, active, created_at, updated_at, updated_by)
  - CREATE TABLE audit_logs (id, org_id, actor_id, action, entity_type, entity_id, old_value, new_value, timestamp, description)
  - UNIQUE(organizations.slug)
  - UNIQUE(org_members.org_id, org_members.user_id)
  - FK CONSTRAINTS (cascades, soft delete checks)

**1.3** Crear seed data  
- [ ] `supabase/seed.sql` (o `seeding/seed.ts` si se usa script)
  - 1 SUPER_ADMIN user
  - 1 organization demo (acme-inc)
  - 1 bot default con prompt placeholder
  - 1 OWNER user + membresía
  - 1 AGENT user + membresía
  - 2 audit logs ejemplo

**1.4** Implementar RLS policies  
- [ ] `supabase/migrations/0002_rls_policies.sql` (o APPEND a 0002)
  - organizations: visible si SUPER_ADMIN OR miembro activo
  - org_members: scoped por org_id + JOINs
  - bots: scoped por org_id
  - audit_logs: scoped por org_id + actor_id rules
  - Políticas por rol (SELECT, INSERT, UPDATE, DELETE)

**Archivos:**
- `supabase/migrations/0002_sprint01_auth_rbac.sql`
- `supabase/seed.sql` (actualizado)
- `DOCS/MIGRATIONS_NOTES.md` (explicación)

**Comandos de validación:**
```bash
supabase migration list
supabase db push  # Local
# Verificar RLS enable en tablas
supabase db lint
```

---

#### Paso 2: API Worker — Middleware + RBAC

**2.1** Crear middleware de autenticación  
- [ ] `apps/api-worker/src/middleware/auth.ts`
  - Validar JWT (Supabase)
  - Extraer user_id, org_ids, roles
  - Inyectar en request context

**2.2** Crear middleware de autorización (RBAC)  
- [ ] `apps/api-worker/src/middleware/rbac.ts`
  - Validar rol requerido (SUPER_ADMIN, OWNER, AGENT)
  - Validar acceso a org_id (RLS + endpoint validation)
  - Retornar 403 si no tiene permiso

**2.3** Crear utilidades de error estandarizado  
- [ ] `apps/api-worker/src/utils/errors.ts`
  - ApiError class (code, message, details, statusCode)
  - Try-catch wrapper para endpoints

**2.4** Montar handlers en worker  
- [ ] Registrar middleware en router Cloudflare

**Archivos:**
- `apps/api-worker/src/middleware/auth.ts`
- `apps/api-worker/src/middleware/rbac.ts`
- `apps/api-worker/src/utils/errors.ts`
- `apps/api-worker/src/types/context.ts` (extender request context)

**Comandos:**
```bash
cd apps/api-worker
pnpm typecheck
pnpm lint
```

---

#### Paso 3: API Worker — Endpoints Auth

**3.1** POST /auth/login  
- [ ] `apps/api-worker/src/routes/auth/login.ts`
  - Recibir email, crear usuario en Supabase Auth si no existe
  - Enviar magic link (Supabase maneja)
  - Responder 200

**3.2** GET /auth/session  
- [ ] `apps/api-worker/src/routes/auth/session.ts`
  - Validar JWT
  - Query org_members para user
  - Retornar user + roles + orgs

**3.3** POST /auth/logout  
- [ ] `apps/api-worker/src/routes/auth/logout.ts`
  - Simplemente responder 200 (cliente borra JWT)

**3.4** Healthcheck  
- [ ] GET /health (público, 200)
- [ ] GET /openapi.json (mock OpenAPI spec para verificación)

**Archivos:**
- `apps/api-worker/src/routes/auth/login.ts`
- `apps/api-worker/src/routes/auth/session.ts`
- `apps/api-worker/src/routes/auth/logout.ts`
- `apps/api-worker/src/routes/health.ts`

---

#### Paso 4: API Worker — Endpoints Organizaciones

**4.1** GET /api/orgs  
- [ ] Lista empresas (RLS scoping via query WHERE)
- [ ] Si SUPER_ADMIN → todas
- [ ] Si OWNER/AGENT → solo suyas
- [ ] Retornar array de orgs

**4.2** POST /api/orgs  
- [ ] Crear org (SUPER_ADMIN solo)
- [ ] Validar name, slug (checks duplicado)
- [ ] INSERT org + INSERT bot default + INSERT audit log
- [ ] Retornar org + bot

**4.3** GET /api/orgs/{orgId}  
- [ ] Fetch org con RLS
- [ ] Validar acceso via org_members
- [ ] 404 si no existe o no acceso

**4.4** PATCH /api/orgs/{orgId}  
- [ ] Update org (solo SUPER_ADMIN)
- [ ] Validar name, slug, active state
- [ ] INSERT audit log (diff)
- [ ] Retornar updated org

**Archivos:**
- `apps/api-worker/src/routes/orgs/list.ts`
- `apps/api-worker/src/routes/orgs/create.ts`
- `apps/api-worker/src/routes/orgs/detail.ts`
- `apps/api-worker/src/routes/orgs/update.ts`

**Comandos:**
```bash
cd apps/api-worker
pnpm typecheck
pnpm lint
wrangler dev  # Test local
curl http://localhost:8787/health
```

---

#### Paso 5: API Worker — Endpoints Miembros

**5.1** GET /api/orgs/{orgId}/members  
- [ ] Lista miembros (SUPER_ADMIN + OWNER, NO AGENT)
- [ ] Retornar array con email, role, active, invited_at, etc.

**5.2** POST /api/orgs/{orgId}/members  
- [ ] Invitar usuario (solo SUPER_ADMIN)
- [ ] Validar email
- [ ] Si existe user: crear/reactivar membresía
- [ ] Si no existe: crear user + membresía
- [ ] Enviar email (Supabase Auth, solo magic link)
- [ ] INSERT audit log

**5.3** PATCH /api/orgs/{orgId}/members/{memberId}  
- [ ] Cambiar rol o revoke (solo SUPER_ADMIN)
- [ ] Validar no cambiar propio rol (si actor_id = user_id)
- [ ] UPDATE org_members + INSERT audit log
- [ ] Retornar updated member

**Archivos:**
- `apps/api-worker/src/routes/members/list.ts`
- `apps/api-worker/src/routes/members/invite.ts`
- `apps/api-worker/src/routes/members/update.ts`

---

#### Paso 6: API Worker — Endpoints Bot/IA

**6.1** GET /api/orgs/{orgId}/bot  
- [ ] Fetch bot (SUPER_ADMIN, OWNER, AGENT read-only)
- [ ] Incluir updatedBy + updatedAt
- [ ] RLS scoping

**6.2** PATCH /api/orgs/{orgId}/bot  
- [ ] Update bot (SUPER_ADMIN + OWNER, NO AGENT)
- [ ] Validar prompt, model, temperature ranges
- [ ] Compute diff (oldValue vs newValue)
- [ ] UPDATE bots + INSERT audit log
- [ ] Retornar updated bot

**Archivos:**
- `apps/api-worker/src/routes/bot/detail.ts`
- `apps/api-worker/src/routes/bot/update.ts`

---

#### Paso 7: API Worker — Endpoints Auditoría

**7.1** GET /api/orgs/{orgId}/audit  
- [ ] Lista audit logs (SUPER_ADMIN + OWNER, NO AGENT)
- [ ] Query params: limit, offset, action (filtro opcional) 
- [ ] Paginación: LIMIT 50 default
- [ ] Retornar { total, limit, offset, logs }
- [ ] RLS scoping

**Archivos:**
- `apps/api-worker/src/routes/audit/list.ts`

**Comandos:**
```bash
wrangler dev
curl http://localhost:8787/api/orgs \
  -H "Authorization: Bearer {JWT}"
```

---

#### Paso 8: Web — Layout base + Auth Flow

**8.1** Crear AppShell (layout principal)  
- [ ] `apps/web/src/components/AppShell.tsx`
  - Sidebar (nav links)
  - Header (logo, user, logout)
  - Content area
  - Responsive

**8.2** Crear ProtectedRoute + PrivateLayout  
- [ ] `apps/web/src/components/ProtectedRoute.tsx`
  - Validar sesión (JWT)
  - Validar rol (si requiere)
  - Redirige a /login si no autenticado
  - Redirige a /org si OWNER/AGENT intenta /admin

**8.3** Auth context + provider  
- [ ] `apps/web/src/contexts/AuthContext.tsx`
  - GET /auth/session on mount
  - Store user + roles + org list
  - Logout handler

**8.4** Login page  
- [ ] `apps/web/src/pages/LoginPage.tsx`
  - Input email + button
  - POST /auth/login
  - Toast feedback (success/error)
  - Redirige a /org after login (si multiple, mostrar selector)

**Archivos:**
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/ProtectedRoute.tsx`
- `apps/web/src/contexts/AuthContext.tsx`
- `apps/web/src/pages/LoginPage.tsx`
- `apps/web/src/utils/api.ts` (fetch wrapper con JWT)

**Comandos:**
```bash
cd apps/web
pnpm typecheck
pnpm lint
pnpm dev  # http://localhost:5173
```

---

#### Paso 9: Web — Admin Dashboard + Org Management

**9.1** Admin Dashboard  
- [ ] `apps/web/src/pages/AdminDashboard.tsx`
  - GET /api/orgs (listar empresas)
  - Cards stats (placeholder)
  - DataTable empresas
  - Botón "Crear Empresa"

**9.2** Modal Crear Empresa  
- [ ] `apps/web/src/components/CreateOrgModal.tsx`
  - Input name, slug
  - Validación inline
  - POST /api/orgs
  - Actualizar lista + Toast

**9.3** Detalle Empresa (Admin)  
- [ ] `apps/web/src/pages/AdminOrgDetail.tsx`
  - GET /api/orgs/{orgId}
  - 4 Tabs: Resumen, Bot/IA, Usuarios, Auditoría
  - PATCH /api/orgs/{orgId} (editar)

**9.4** Tab Bot/IA  
- [ ] Dentro detalle empresa
  - GET /api/orgs/{orgId}/bot
  - PATCH /api/orgs/{orgId}/bot (solo OWNER+)
  - Inputs: textarea prompt, select model, slider temperature
  - Mostrar updatedBy + updatedAt

**9.5** Tab Usuarios  
- [ ] Dentro detalle empresa
  - GET /api/orgs/{orgId}/members
  - Botón "Invitar"
  - Modal InviteUser (POST /api/orgs/{orgId}/members)
  - Menu acciones: cambiar rol, revocar (PATCH)
  - Badge estado (activo/revocado)

**9.6** Tab Auditoría  
- [ ] Dentro detalle empresa
  - GET /api/orgs/{orgId}/audit
  - DataTable: fecha, actor, acción, entidad
  - Filtro por acción (opcional en Sprint 01)

**Archivos:**
- `apps/web/src/pages/AdminDashboard.tsx`
- `apps/web/src/pages/AdminOrgDetail.tsx`
- `apps/web/src/components/CreateOrgModal.tsx`
- `apps/web/src/components/InviteUserModal.tsx`

---

#### Paso 10: Web — Org Portal (OWNER/AGENT)

**10.1** Org Dashboard (Portal)  
- [ ] `apps/web/src/pages/OrgDashboard.tsx` o rename `OrgHomePage.tsx`
  - GET /api/orgs/{orgId} (destino org)
  - Mostrar nombre org en header
  - 3 Tabs: Inbox (placeholder EmptyState), Settings, Auditoría

**10.2** Tab Settings (OWNER solo)  
- [ ] Same as Admin detail bot/IA tab
- [ ] Si AGENT → EmptyState "No tienes acceso"

**10.3** Tab Auditoría (OWNER solo)  
- [ ] Same as Admin detail audit tab
- [ ] Si AGENT → EmptyState

**10.4** Org selector on first login  
- [ ] Si múltiples orgs → dropdown/list selector
- [ ] Redirige a /org/{first}

**Archivos:**
- `apps/web/src/pages/OrgDashboard.tsx` (rename/create)
- `apps/web/src/pages/OrgSettingsPage.tsx` (si separado)

---

#### Paso 11: Tests Mínimos

**11.1** API Tests  
- [ ] `apps/api-worker/src/__tests__/orgs.test.ts`
  - POST /api/orgs (create org)
  - RLS: OWNER no ve otros orgs
  - RBAC: AGENT no puede editar bot

**11.2** UI Tests (Playwright)  
- [ ] `e2e/login-flow.spec.ts` (existente, mejorar)
  - Login
  - Redirige a /admin o /org según rol
  - Protected route bloques sin auth

**11.3** DB Tests  
- [ ] Verificar RLS policies en Supabase
- [ ] Smoke test: SELECT org WHERE user_id no tiene acceso = 0 rows

**Comandos:**
```bash
pnpm test  # vitest
pnpm test:e2e  # Playwright
```

---

## Archivos a Crear/Modificar

### Supabase (DB)
```
supabase/migrations/
  ├─ 0002_sprint01_auth_rbac.sql       [CREATE]
  └─ 0003_rls_policies_sprint01.sql    [CREATE] (o within 0002)

supabase/seed.sql                       [MODIFY: agregar seed data]
```

### API Worker
```
apps/api-worker/src/
  ├─ middleware/
  │  ├─ auth.ts                        [CREATE]
  │  └─ rbac.ts                        [CREATE]
  ├─ routes/
  │  ├─ auth/
  │  │  ├─ login.ts                    [CREATE]
  │  │  ├─ session.ts                  [CREATE]
  │  │  └─ logout.ts                   [CREATE]
  │  ├─ orgs/
  │  │  ├─ list.ts                     [CREATE]
  │  │  ├─ create.ts                   [CREATE]
  │  │  ├─ detail.ts                   [CREATE]
  │  │  └─ update.ts                   [CREATE]
  │  ├─ members/
  │  │  ├─ list.ts                     [CREATE]
  │  │  ├─ invite.ts                   [CREATE]
  │  │  └─ update.ts                   [CREATE]
  │  ├─ bot/
  │  │  ├─ detail.ts                   [CREATE]
  │  │  └─ update.ts                   [CREATE]
  │  ├─ audit/
  │  │  └─ list.ts                     [CREATE]
  │  └─ health.ts                      [CREATE]
  ├─ utils/
  │  ├─ errors.ts                      [CREATE]
  │  └─ db.ts                          [MODIFY: si existe]
  ├─ types/
  │  └─ context.ts                     [CREATE]
  └─ index.ts                          [MODIFY: mount routes]

apps/api-worker/src/__tests__/
  └─ orgs.test.ts                      [CREATE]
```

### Web (Frontend)
```
apps/web/src/
  ├─ pages/
  │  ├─ LoginPage.tsx                  [CREATE]
  │  ├─ AdminDashboard.tsx             [MODIFY: si existe]
  │  ├─ AdminOrgDetail.tsx             [CREATE]
  │  └─ OrgDashboard.tsx               [MODIFY: rename/create]
  ├─ components/
  │  ├─ AppShell.tsx                   [CREATE]
  │  ├─ ProtectedRoute.tsx             [MODIFY: si existe]
  │  ├─ CreateOrgModal.tsx             [CREATE]
  │  ├─ InviteUserModal.tsx            [CREATE]
  │  └─ BotSettings.tsx                [CREATE]
  ├─ contexts/
  │  └─ AuthContext.tsx                [MODIFY: si existe]
  ├─ utils/
  │  └─ api.ts                         [CREATE: fetch wrapper]
  └─ App.tsx                           [MODIFY: routing]

e2e/
  └─ login-flow.spec.ts                [MODIFY: mejorar]

apps/web/vite.config.ts                [MODIFY: si requiere env vars]
```

### Documentación
```
DOCS/
  ├─ SPRINT01_OBJETIVO.md              [CREATE]
  ├─ SPRINT01_DOMINIO.md               [CREATE]
  ├─ SPRINT01_REGLAS.md                [CREATE]
  ├─ SPRINT01_CONTRATO.md              [CREATE]
  ├─ SPRINT01_UI_SPRINT.md             [CREATE]
  ├─ SPRINT01_PREGUNTAS.md             [CREATE]
  ├─ MIGRATIONS_NOTES.md               [CREATE]
  ├─ UI_DIFF.md                        [CREATE]
  ├─ ImplementationPlan.md             [CREATE]
  ├─ ImplementationNotas.md            [CREATE] (al final)
  ├─ cambios.md                        [CREATE] (al final)
  ├─ QA_Report.md                      [CREATE] (en QA)
  └─ fixLog.md                         [CREATE] (en QA)
```

---

## Comandos de Validación

### Lint & Typecheck
```bash
pnpm lint                          # ESLint all workspaces
pnpm typecheck                     # tsc check all
```

### Tests
```bash
pnpm test                          # vitest (unit + integration)
pnpm test:e2e                      # Playwright e2e
```

### Database
```bash
supabase migration list
supabase db push                   # Aplicar migraciones local
supabase db push --remote          # (si tiene acceso remote)
supabase seed reseed               # Seed local
```

### Build & Deploy
```bash
# API Worker
cd apps/api-worker
wrangler dev                       # Local server
wrangler deploy                    # Deploy a Cloudflare

# Web
cd apps/web
pnpm build                         # Build Vite
pnpm preview                       # Preview local
# Deploy a Cloudflare Pages (manual o CI/CD)
```

### Health Checks
```bash
# After wrangler dev / pnpm dev:
curl http://localhost:8787/health              # API health
curl http://localhost:5173                     # Web (Vite)

# Verify DB:
dsu <org_id> SELECT * FROM organizations       # psql via Supabase CLI
```

---

## Definition of Done (DoD)

- [ ] Migraciones aplicadas sin errores
- [ ] Seed data insertado
- [ ] Todas las tablas y constraints creadas
- [ ] RLS policies activas y verificadas
- [ ] Todos los endpoints implementados
- [ ] Auth flow completo (login → dashboard)
- [ ] RBAC validando en middleware
- [ ] Auditoría registrando eventos
- [ ] UI componentes usando UI kit (sin CSS ad-hoc)
- [ ] Pantallas renderizando datos correctos
- [ ] Tests pasando (unit + e2e)
- [ ] Lint/typecheck pasando
- [ ] Migraciones reversibles (down scripts)
- [ ] Deploy proof: worker + web deployados (o local dev running)
- [ ] Documento ImplementationNotas.md completado
- [ ] QA_Report.md con gate PASS/FAIL completado
- [ ] Criterios de aceptación de Sprint validados

---

## Secuencia Recomendada

**Orden lógico (respetando dependencias):**

1. **FASE 3:** UI Kit global (prerequisito, usado en todo)
2. **FASE 4, Paso 1:** DB migraciones + seed (prerequisito para API)
3. **FASE 4, Pasos 2–7:** API endpoints (pueden ser paralelo + test local)
4. **FASE 4, Pasos 8–10:** Web pages + componentes (usa API)
5. **FASE 4, Paso 11:** Tests finales + validaciones
6. **FASE 5:** QA-FIX + gates

**Paralelización posible:**
- Pasos 3–7 (API) pueden avanzar juntos con mocking
- Pasos 8–10 (Web) pueden avanzar junto a API si hay stub mocks
- Tests (Paso 11) en paralelo a desarrollo, ejecuta iterativamente

---

**Estado:** PLAN DRAFT
