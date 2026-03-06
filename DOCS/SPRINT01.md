# SPRINT_01.md

## 1) Objetivo del sprint
Tener la plataforma base operativa en cloud (Pages + Workers + Supabase) con:
- Login y control de acceso por rol (RBAC).
- CRUD de empresas.
- Gestión de usuarios (OWNER/AGENT) por empresa.
- Config base de bot/IA por empresa con auditoría mínima.

## 2) Casos de Uso (máx 4)

### CU1 — Login y RBAC
- Actor: SUPER_ADMIN / OWNER / AGENT
- Precondiciones:
  - Usuario existe en Supabase Auth
  - Existe membresía en `org_members` (excepto SUPER_ADMIN global)
- Flujo principal:
  1) Usuario ingresa email (magic link o password, según configuración Supabase).
  2) Sistema valida sesión.
  3) Sistema carga rol y org(s) permitidas.
  4) Redirige a panel según rol:
     - SUPER_ADMIN: /admin
     - OWNER/AGENT: /org/:orgId
- Casos borde (mín 5):
  - Email no registrado.
  - Usuario sin membresía de org (denegar acceso).
  - Sesión expirada (redirigir a login).
  - OWNER intenta acceder a /admin (403).
  - AGENT intenta abrir settings (403).
- Criterios de aceptación:
  - [ ] Login funciona y crea sesión válida
  - [ ] Redirección por rol
  - [ ] Rutas protegidas por middleware
  - [ ] OWNER/AGENT no acceden a recursos de otras org
  - [ ] Logs mínimos de auth (opcional)

### CU2 — CRUD Empresas + link al portal de empresa
- Actor: SUPER_ADMIN
- Precondiciones: SUPER_ADMIN autenticado
- Flujo principal:
  1) SUPER_ADMIN crea empresa (nombre, alias/slug).
  2) Sistema crea `organization`.
  3) Sistema genera “link portal” (URL con org slug/id) para compartir.
- Casos borde:
  - Nombre duplicado/slug duplicado.
  - Empresa desactivada (bloquea accesos).
  - Borrar empresa con datos (soft delete).
  - Link portal sin usuario autenticado → pide login.
  - Acceso a org no permitida (403).
- Criterios de aceptación:
  - [ ] Crear/editar/desactivar empresa
  - [ ] Link portal existe y apunta a contexto org
  - [ ] Soft delete o disable definido
  - [ ] Validaciones básicas (required, slug unique)

### CU3 — Gestión de usuarios por empresa (OWNER/AGENT)
- Actor: SUPER_ADMIN
- Precondiciones: org creada
- Flujo principal:
  1) SUPER_ADMIN invita/crea usuario por email.
  2) Asigna rol (OWNER o AGENT) y org.
  3) Usuario recibe acceso (login) y entra a su portal.
- Casos borde:
  - Email ya existe (solo reasignar membresía).
  - Cambiar rol de AGENT→OWNER.
  - Revocar acceso (deshabilitar membresía).
  - OWNER no puede invitar usuarios (por defecto).
  - Usuario intenta ver otra org (403/RLS).
- Criterios de aceptación:
  - [ ] Crear membresía `org_members`
  - [ ] Roles aplican restricciones UI/API
  - [ ] Revocar acceso bloquea login a esa org

### CU4 — Config base Bot/IA por empresa + auditoría mínima
- Actor: SUPER_ADMIN (y OWNER si permitido)
- Precondiciones: org creada
- Flujo principal:
  1) Abrir “Bot/IA Settings” de la empresa.
  2) Configurar: prompt base, modelo Cerebras (string), temperatura (default).
  3) Guardar cambios.
  4) Sistema registra evento en `audit_logs`.
- Casos borde:
  - Prompt vacío (validación).
  - Modelo inválido (guardar igual como string, pero marcar warning).
  - OWNER sin permiso intenta editar (403).
  - Conflicto de edición simultánea (último gana + log).
  - Auditoría no disponible (no bloquear guardado, pero registrar error).
- Criterios de aceptación:
  - [ ] Guardar settings en tabla `bots` (1 bot default por org)
  - [ ] Audit log registra: actor, acción, diff mínimo, timestamp
  - [ ] UI muestra “último cambio por…”

## 3) Entidades/Estados tocados
- organizations (active/disabled)
- users
- org_members (role)
- bots (default por org)
- audit_logs

## 4) Endpoints sugeridos (alto nivel)
- GET/POST /api/orgs
- GET/PATCH /api/orgs/:orgId
- POST /api/orgs/:orgId/members (invite/add)
- PATCH /api/orgs/:orgId/members/:memberId (role/disable)
- GET/PATCH /api/orgs/:orgId/bot
- GET /api/orgs/:orgId/audit

## 5) Pantallas UI exactas del sprint
1) **Login** (form)
   - Email input, botón enviar magic link / password
2) **Admin Dashboard** (lista)
   - Cards: empresas, bots, pendientes (placeholder)
3) **Empresas** (lista + detalle)
   - Tabla, buscador, botón crear
   - Detalle: tabs (Resumen, Bot/IA, Usuarios, Auditoría)
4) **Bot/IA Settings** (form)
   - Textarea prompt, select modelo (texto), slider/input temperatura
5) **Usuarios** (lista + modal)
   - Tabla miembros, botón invitar, select rol
6) **Auditoría** (lista)
   - Tabla: fecha, actor, acción, entidad

## 6) Datos seed mínimos
- 1 SUPER_ADMIN
- 1 organization demo
- 1 bot default con prompt placeholder
- 1 OWNER demo + 1 AGENT demo
- 2 audit logs de ejemplo

## 7) Tests mínimos sugeridos
- Unit: middleware RBAC (role routing)
- Integration: RLS org scoping (OWNER ve solo su org)
- API: create org + create member + update bot settings
- UI: protected route redirects