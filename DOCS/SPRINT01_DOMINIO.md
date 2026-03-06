# DOMINIO.md — Sprint 01

## Entidades y Estados

### 1. `organizations` (Empresas)
**Tabla principal:** `organizations`

```
id (uuid) — PK
name (text) — nombre de la empresa
slug (text) — URL-safe identifier (único)
active (boolean) — soft delete o disable (default: true)
created_at (timestamp)
updated_at (timestamp)
created_by (uuid FK → users) — SUPER_ADMIN que la creó
```

**Estados:**
- `active = true` — empresa operativa
- `active = false` — empresa desactivada (bloquea login a cualquier miembro)

**Reglas:**
- `name` requerido, máx 100 caracteres
- `slug` requerido, único, mínimo 3 caracteres, solo alphanumeric + dash
- Cuando se crea una org, se crea automáticamente 1 bot default

**Link Portal:**
- Formato: `https://app.botcontrol.local/org/{slug}` o `/org/{id}`
- Si usuario no autenticado: redirige a login, luego a `/org/{slug}`
- Si usuario autenticado + no tiene acceso a esa org: 403

---

### 2. `users` (Usuarios)
**Tabla principal:** `users`

```
id (uuid) — PK
email (text) — único, requerido
auth_id (uuid FK → supabase auth) — referencia interna
created_at (timestamp)
updated_at (timestamp)
```

**Roles globales:**
- No hay rol global en `users`. El rol está en `org_members` (por org).
- Excepto SUPER_ADMIN inicial (seed data).

**Reglas:**
- `email` debe ser válido (formato RFC)
- Email único en el sistema
- Si usuario intenta login con email no existente, se le ofrece crear cuenta (magic link/password)

---

### 3. `org_members` (Membresías)
**Tabla principal:** `org_members`

```
id (uuid) — PK
org_id (uuid FK → organizations)
user_id (uuid FK → users)
role (enum: 'OWNER', 'AGENT') — no está SUPER_ADMIN aquí
active (boolean) — default true
invited_at (timestamp)
activated_at (timestamp nullable) — cuando aceptó la invitación
created_by (uuid FK → users) — quién la invitó
created_at (timestamp)
updated_at (timestamp)

UNIQUE(org_id, user_id)
RLS: org_members visible solo para miembros de esa org
```

**Roles admitidos:**
- `OWNER` — puede ver/editar config bot, usuarios (invitar/revocar)
- `AGENT` — puede ver config bot (read-only), no puede invitar usuarios

**Estados:**
- `active = true` — membresía válida, usuario tiene acceso
- `active = false` — membresía revocada, usuario no puede login a esa org

**Transiciones:**
- Invitar (created) → activated_at = null (si es magic link, se llena al aceptar)
- Cambio de rol: AGENT → OWNER (update)
- Revocación: active = false

---

### 4. `bots` (Configuración Bot/IA por Empresa)
**Tabla principal:** `bots`

```
id (uuid) — PK
org_id (uuid FK → organizations) — 1 bot default por org
name (text) — default: "{org.name} Bot"
prompt (text) — prompt base del bot (requerido)
model (text) — modelo Cerebras (default: 'cerebras/gpt-3.5-turbo', almacenado como string)
temperature (float) — temperature del modelo (default: 0.7, rango: 0.0–2.0)
active (boolean) — default true
created_at (timestamp)
updated_at (timestamp)
updated_by (uuid FK → users) — quién actualizó por última vez

RLS: owner-scoped (solo miembros de org_id ven su bot)
```

**Reglas:**
- Cuando se crea org, seed incluye bot default automático
- `prompt` no puede estar vacío
- `model` se valida contra lista de modelos conocidos (Cerebras) pero se guarda igual si es inválido (+ warning)
- `temperature` debe estar entre 0.0 y 2.0
- No se permite borrar el bot default; solo desactivar (active = false)

---

### 5. `audit_logs` (Auditoría)
**Tabla principal:** `audit_logs`

```
id (uuid) — PK
org_id (uuid FK → organizations) — para scoping
actor_id (uuid FK → users) — quién hizo la acción
action (text) — qué pasó (ej: 'update_bot_settings', 'invite_member', etc.)
entity_type (text) — qué se modificó (ej: 'bot', 'org_member', 'organization')
entity_id (uuid) — referencia a la entidad modificada
old_value (jsonb nullable) — estado anterior (diff mínimo)
new_value (jsonb nullable) — estado nuevo (diff mínimo)
timestamp (timestamp) — cuándo pasó
description (text nullable) — descripción legible (ej: "Updated prompt")

RLS: org-scoped (solo miembros ven logs de su org)
```

**Eventos registrados (mínimo):**
- `invite_member` — org_members creado
- `update_member_role` — rol de miembro cambiado
- `revoke_member` — membresía desactivada
- `update_bot_settings` — cambios en bots (prompt, model, temp)
- `create_organization` — org creada
- `disable_organization` — org desactivada

**Reglas:**
- Se registra automáticamente en trigger / hook (no requerimiento UI)
- `old_value` y `new_value` solo campos modificados (no todo)
- `timestamp` es `now()` en UTC

---

## Diagramas de Transición de Estado

### Membresía (org_members)
```
[INVITED]
  ↓ (usuario acepta magic link)
[ACTIVE] ← → [REVOKED]
          ↓ (admin desactiva)
```

### Organización (organizations)
```
[ACTIVE] → [INACTIVE] (soft delete / disable)
  ↓         ↑
  └─────────┘ (reactivar manualmente)
```

### Bot (bots)
```
[ACTIVE] → [INACTIVE] (desactivar, no borrar)
  ↓
  (No volver a activar en Sprint 01; será en mantenimiento)
```

---

## Reglas de Relaciones

1. **Una org → muchos members** (org_members)
   - Si borras org (soft delete), los members siguen en DB pero bloqueados

2. **Una org → 1 bot default**
   - Si borras org, bot se borra en cascada (cascade delete OR marcar como inactive)

3. **Un user → muchos org_members**
   - Un usuario puede ser OWNER/AGENT en múltiples orgs
   - Pero su acceso por org está definido en org_members

4. **audit_logs**
   - No se borran (append-only)
   - Scoped por org_id para RLS

---

**Estado:** SPEC DRAFT
