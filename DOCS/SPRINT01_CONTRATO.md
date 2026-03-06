# CONTRATO.md — Sprint 01

## API Endpoints (Alto Nivel)

Base URL: `https://api.botcontrol.local` (Cloudflare Workers)

### Auth

#### POST /auth/login
Inicia sesión con magic link o password (manejado por Supabase Auth).

**Request:** `{ email: string }`  
**Response (200):** Supabase redirige a magic link en email  
**Response (400):** Email inválido  
**Response (409):** Ya existe + redirige a /login  

---

#### GET /auth/session
Valida sesión actual y retorna usuario + roles.

**Auth:** Se requiere Bearer token (JWT de Supabase)  
**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "roles": [
      { "orgId": "uuid", "orgName": "Acme Inc", "role": "OWNER" },
      { "orgId": "uuid", "orgName": "Tech Corp", "role": "AGENT" }
    ]
  }
}
```

**Response (401):** Token inválido o expirado  
**Response (403):** No tiene membresías (sin orgs)

---

#### POST /auth/logout
Cierra sesión (Supabase maneja principalmente).

**Response (200):** Sesión terminada  

---

### Organizaciones

#### GET /api/orgs
Obtiene lista de empresas. Si SUPER_ADMIN → todas. Si OWNER/AGENT → solo sus orgs.

**Auth:** Requerido  
**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Acme Inc",
    "slug": "acme-inc",
    "active": true,
    "createdAt": "2026-03-01T10:00:00Z"
  }
]
```

**Response (401):** No autenticado  
**Response (403):** Rol insuficiente

---

#### POST /api/orgs
Crea empresa (solo SUPER_ADMIN).

**Auth:** Requerido + SUPER_ADMIN  
**Request:**
```json
{
  "name": "Acme Inc",
  "slug": "acme-inc"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Acme Inc",
  "slug": "acme-inc",
  "active": true,
  "bot": {
    "id": "uuid",
    "prompt": "[Default prompt]",
    "model": "cerebras/gpt-3.5-turbo",
    "temperature": 0.7
  },
  "createdAt": "2026-03-04T10:00:00Z"
}
```

**Response (400):** Validación fallida (slug duplicado, nombre vacío)  
**Response (403):** No es SUPER_ADMIN

---

#### GET /api/orgs/{orgId}
Obtiene detalles de una empresa (solo si tiene acceso).

**Auth:** Requerido  
**Response (200):**
```json
{
  "id": "uuid",
  "name": "Acme Inc",
  "slug": "acme-inc",
  "active": true,
  "botId": "uuid",
  "createdAt": "2026-03-01T10:00:00Z",
  "createdBy": { "id": "uuid", "email": "admin@..." }
}
```

**Response (401):** No autenticado  
**Response (403):** No tiene acceso a esta org  
**Response (404):** Org no existe

---

#### PATCH /api/orgs/{orgId}
Edita empresa (solo SUPER_ADMIN).

**Auth:** Requerido + SUPER_ADMIN  
**Request:**
```json
{
  "name": "Acme Corp",
  "active": false
}
```

**Response (200):** Updated org (mismo formato GET)  
**Response (400):** Slug duplicado, validación fallida  
**Response (403):** No es SUPER_ADMIN  
**Response (404):** Org no existe

---

### Miembros (org_members)

#### GET /api/orgs/{orgId}/members
Lista miembros de empresa (solo SUPER_ADMIN y OWNER).

**Auth:** Requerido  
**Response (200):**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "email": "owner@acme.com",
    "role": "OWNER",
    "active": true,
    "invitedAt": "2026-03-01T10:00:00Z",
    "activatedAt": "2026-03-02T15:30:00Z",
    "createdBy": { "id": "uuid", "email": "admin@..." }
  }
]
```

**Response (401):** No autenticado  
**Response (403):** No tiene permiso (AGENT está bloqueado)  
**Response (404):** Org no existe

---

#### POST /api/orgs/{orgId}/members
Invita nuevo usuario (solo SUPER_ADMIN).

**Auth:** Requerido + SUPER_ADMIN  
**Request:**
```json
{
  "email": "agent@acme.com",
  "role": "AGENT"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "email": "agent@acme.com",
  "role": "AGENT",
  "active": true,
  "invitedAt": "2026-03-04T10:00:00Z",
  "activatedAt": null
}
```

**Response (400):** Email inválido, rol inválido, usuario ya es miembro  
**Response (403):** Solo SUPER_ADMIN puede invitar  
**Response (404):** Org no existe  
**Response (409):** Usuario ya existe en otra org (reasignar)

---

#### PATCH /api/orgs/{orgId}/members/{memberId}
Cambia rol o revoca acceso (solo SUPER_ADMIN).

**Auth:** Requerido + SUPER_ADMIN  
**Request:**
```json
{
  "role": "OWNER",
  "active": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "email": "agent@acme.com",
  "role": "OWNER",
  "active": true
}
```

**Response (400):** Rol inválido  
**Response (403):** No es SUPER_ADMIN  
**Response (404):** Member no existe  
**Response (409):** No puedes cambiar tu propio rol (si actor_id = user_id)

---

### Bot/IA Settings

#### GET /api/orgs/{orgId}/bot
Obtiene configuración del bot (SUPER_ADMIN, OWNER, AGENT read-only).

**Auth:** Requerido  
**Response (200):**
```json
{
  "id": "uuid",
  "orgId": "uuid",
  "name": "Acme Inc Bot",
  "prompt": "Eres un asistente de atención...",
  "model": "cerebras/gpt-3.5-turbo",
  "temperature": 0.7,
  "active": true,
  "updatedAt": "2026-03-03T14:00:00Z",
  "updatedBy": { "id": "uuid", "email": "owner@acme.com" }
}
```

**Response (401):** No autenticado  
**Response (403):** No tiene acceso a esta org  
**Response (404):** Org o bot no existe

---

#### PATCH /api/orgs/{orgId}/bot
Actualiza configuración (solo SUPER_ADMIN y OWNER).

**Auth:** Requerido + (SUPER_ADMIN OR OWNER)  
**Request:**
```json
{
  "prompt": "Nuevo prompt...",
  "model": "cerebras/gpt-4-turbo",
  "temperature": 0.8
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "orgId": "uuid",
  "name": "Acme Inc Bot",
  "prompt": "Nuevo prompt...",
  "model": "cerebras/gpt-4-turbo",
  "temperature": 0.8,
  "updatedAt": "2026-03-04T10:00:00Z",
  "updatedBy": { "id": "uuid", "email": "owner@acme.com" }
}
```

**Response (400):** Prompt vacío, temperatura fuera de rango  
**Response (403):** Rol insuficiente (AGENT bloqueado)  
**Response (404):** Org o bot no existe

---

### Auditoría

#### GET /api/orgs/{orgId}/audit
Obtiene logs de auditoría (SUPER_ADMIN y OWNER).

**Auth:** Requerido  
**Query Params:** `?limit=50&offset=0&action=update_bot_settings` (filtros opcionales)  
**Response (200):**
```json
{
  "total": 150,
  "limit": 50,
  "offset": 0,
  "logs": [
    {
      "id": "uuid",
      "actor": { "id": "uuid", "email": "owner@acme.com" },
      "action": "update_bot_settings",
      "entityType": "bot",
      "entityId": "uuid",
      "oldValue": { "temperature": 0.7 },
      "newValue": { "temperature": 0.8 },
      "description": "Updated prompt",
      "timestamp": "2026-03-04T10:00:00Z"
    }
  ]
}
```

**Response (401):** No autenticado  
**Response (403):** Rol insuficiente (AGENT bloqueado)  
**Response (404):** Org no existe

---

## Errores Estandarizados

### HTTP Status Codes

| Code | Significado | Ejemplo |
|------|-----------|---------|
| 200 | OK | GET exitoso |
| 201 | Created | POST exitoso |
| 400 | Bad Request | Validación fallida |
| 401 | Unauthorized | Token inválido/expirado |
| 403 | Forbidden | Permisos insuficientes |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Duplicado, conflicto de actualización |
| 500 | Internal Server Error | Error del servidor |

### Estructura de Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El slug ya existe",
    "details": [
      { "field": "slug", "message": "Duplicado en sistema" }
    ]
  }
}
```

---

## Datos Mínimos por Request

### Login
- **Entrada:** email
- **Salida:** JWT (manejado por Supabase)

### Crear Org
- **Requerido:** name, slug
- **Salida:** id, name, slug, active, createdAt, bot default

### Crear Miembro
- **Requerido:** email, orgId, role
- **Salida:** id, userId, role, active, invitedAt

### Actualizar Bot
- **Requerido:** orgId, botId
- **Ópcionbl:** prompt, model, temperature
- **Salida:** bot completo + updatedBy + updatedAt

---

## Flujo de Autenticación (JWT)

1. Usuario POST /auth/login con email
2. Supabase Auth envía magic link o pide password
3. Usuario confirma → Supabase genera JWT
4. Cliente almacena JWT en localStorage/sessionStorage
5. Cada request incluye `Authorization: Bearer {JWT}`
6. Middleware valida + extrae claims (user_id, org_ids, roles)
7. Si JWT expirado → API 401, cliente redirige a /login

---

## RLS (Row-Level Security) — Supabase

### organizations
- SUPER_ADMIN ve todas
- OWNER/AGENT ven solo orgs donde tienen membresía activa

```sql
-- Pseudocódigo
SELECT * FROM organizations
WHERE active = true
  AND (created_by = current_user_id  -- Solo SUPER_ADMIN que creó
       OR EXISTS (
         SELECT 1 FROM org_members
         WHERE org_members.org_id = organizations.id
           AND org_members.user_id = current_user_id
           AND org_members.active = true
       ))
```

### org_members
- Visible solo dentro de su org (RLS filtra por org_id)
- OWNER ve todos los miembros de su org
- AGENT solo ve miembros (sin editar)

### bots
- Visible solo si usuario es miembro de org_id

### audit_logs
- Visible si usuario es miembro de org_id

---

**Estado:** SPEC DRAFT
