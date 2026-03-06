# REGLAS.md — Sprint 01

## Validaciones de Negocio

### Empresas (organizations)

| Regla | Validación | Mensaje de Error |
|-------|-----------|-----------------|
| Nombre requerido | `name` no vacío | "El nombre de la empresa es requerido" |
| Nombre máximo | `name.length ≤ 100` | "El nombre no puede exceder 100 caracteres" |
| Slug único | `slug` no existe en otra org | "El slug ya existe; elige otro" |
| Slug válido | `slug` matches `/^[a-z0-9-]{3,}$/` | "El slug debe tener 3+ caracteres, solo minúsculas, números y guiones" |
| Slug requerido | `slug` no vacío | "El slug es requerido" |
| Duplicado bloqueado | No crear org si name + slug ya existen | "Esta empresa ya existe" |

### Usuarios (users)

| Regla | Validación | Mensaje de Error |
|-------|-----------|-----------------|
| Email válido | `email` matches RFC 5322 | "Email no válido" |
| Email único | No duplicar email en `users` | "Este email ya está registrado" |
| Email requerido | `email` no vacío | "El email es requerido" |

### Membresías (org_members)

| Regla | Validación | Mensaje de Error |
|-------|-----------|-----------------|
| Usuario + Org único | UNIQUE(org_id, user_id) | "Este usuario ya tiene membresía en esta empresa" |
| Rol válido | `role` IN ('OWNER', 'AGENT') | "Rol no válido; debe ser OWNER o AGENT" |
| Rol requerido | `role` no nulo | "El rol es requerido" |
| Revocación: solo desactivar | `active = false` no borra registro | N/A (operación exitosa) |
| No autopermiso OWNER→SUPER_ADMIN | No permitir cambio de rol a SUPER_ADMIN (que solo existe en seed) | "No se puede asignar rol SUPER_ADMIN" |

### Bot (bots)

| Regla | Validación | Mensaje de Error |
|-------|-----------|-----------------|
| Prompt no vacío | `prompt.length > 0` | "El prompt del bot no puede estar vacío" |
| Prompt máximo | `prompt.length ≤ 5000` | "El prompt es muy largo (máx 5000 caracteres)" |
| Modelo string | `model` es string (no validar contra lista fija en v1) | N/A (siempre string) |
| Temperatura rango | `temperature` entre 0.0 y 2.0 | "La temperatura debe estar entre 0.0 y 2.0" |
| Temperatura tipo | `temperature` es number | "La temperatura debe ser un número" |
| Un bot default por org | Al crear org, automáticamente crear bot default | N/A (automático en seed) |
| No borrar bot default | Si es único bot de org, desactivar en lugar de borrar | "No se puede borrar el único bot de la empresa; desactívalo en su lugar" |

### Auditoría (audit_logs)

| Regla | Validación | Mensaje de Error |
|-------|-----------|-----------------|
| Actor existe | `actor_id` referencia usuario válido | N/A (FK constraint) |
| Entity_id requerido | `entity_id` no nulo para cambios | N/A (requiere en lógica) |
| Timestamp UTC | `timestamp` siempre UTC | N/A (servidor) |
| Append-only | Nunca borrar audit logs | N/A (política DB) |

---

## Casos Borde y Flujos Excepcionales

### CU1: Login y RBAC

**Caso 1: Email no registrado**
- Usuario ingresa email que NO existe
- Sistema valida en Supabase Auth
- Opción: enviar magic link (Supabase crea usuario) o decir que no existe
- Decisión: **Permitir magic link** (Supabase Auth maneja signup)

**Caso 2: Usuario sin membresía**
- Usuario autenticado, pero NO tiene registro en `org_members`
- No es SUPER_ADMIN (checkeado en seed/rol global)
- Si intenta `/org/:id`: RLS bloquea acceso → 403
- Mensaje: "No tienes acceso a esta empresa"

**Caso 3: Sesión expirada**
- Token JWT expiró
- Sistema redirige a `/login`
- Mensjaem opcional: "Tu sesión expiró; inicia sesión de nuevo"

**Caso 4: OWNER intenta acceder a /admin**
- OWNER tiene rol en `org_members` (no global)
- RLS bloquea acceso a `organizations` (tabla protegida)
- Respuesta: 403 Forbidden
- UI redirige a `/org/:orgId` automáticamente

**Caso 5: AGENT intenta abrir Bot/IA Settings**
- AGENT tiene `role = 'AGENT'` en `org_members`
- Lógica de frontend: deshabilitaría botón "Editar"
- Si accede directo a API: PATCH /api/orgs/:orgId/bot bloquea (RBAC middleware)
- Respuesta: 403 Forbidden
- Mensaje: "Permiso denegado; solo OWNER puede editar configuración"

**Caso 6: Intenta cambiar rol a sí mismo**
- Un OWNER intenta cambiar su propio rol
- Lógica: permitido si la API lo permite (ambiguo)
- Decisión Sprint 01: **NO permitir cambiar tu propio rol** (validar actor_id ≠ target_member_id)
- Mensaje: "No puedes cambiar tu propio rol"

---

### CU2: CRUD Empresas

**Caso 1: Slug duplicado**
- Usuario intenta crear org con slug que ya existe
- Validación antes de INSERT
- Mensaje: "Este slug ya está en uso"

**Caso 2: Empresa desactivada, usuario intenta login**
- `organizations.active = false`
- RLS en `org_members` incluye `org_id` → `organizations.active = true`
- Usuario no ve esa org en `/org` → redirige a login o 403
- Mensaje: "La empresa no está disponible"

**Caso 3: Borrar empresa con datos**
- Sprint 01: **Soft delete** (active = false)
- No se borra nada, solo se marca como inactivo
- Auditoría registra: `action: 'disable_organization'`

**Caso 4: Link portal sin usuario autenticado**
- Anónimo accede a `https://app.../org/acme`
- Sistema valida que org existe (público, cualquiera puede descubrir)
- Si org activa → redirige a login
- Después de login → redirige a /org/acme si tiene membresía

**Caso 5: Acceso a org no permitida**
- Usuario autenticado, pero org_id no encontrado en `org_members`
- RLS bloquea join
- Respuesta API: 403 (datos no retornados)
- UI redirige a /org (lista de orgs del usuario)

---

### CU3: Gestión de Usuarios

**Caso 1: Email ya existe**
- SUPER_ADMIN intenta invitar usuario con email que ya existe en `users`
- Sistema busca en `users`, encuentra
- En lugar de crear user, verifica si existe `org_members` para esa org
  - Si existe + activo: "Usuario ya es miembro de esta empresa"
  - Si existe + inactivo: Opción de reactivar
  - Si no existe en `org_members`: Crear nueva membresía

**Caso 2: Cambiar rol AGENT → OWNER**
- UPDATE `org_members` SET `role = 'OWNER'` WHERE id = ...
- Auditoría: `action: 'update_member_role'`, old_value: {role: 'AGENT'}, new_value: {role: 'OWNER'}
- Usuario puede usar funcionalidad OWNER desde siguiente login

**Caso 3: Revocar acceso**
- SUPER_ADMIN ejecuta PATCH `org_members/{id}` con `active = false`
- Usuario intenta login a esa org → RLS bloquea
- Sesión existente sigue válida (revocación no expulsa active sessions)
- En siguiente refresh/login → denegar

**Caso 4: OWNER intenta invitar usuarios**
- Decidir por Sprint 01: **Dato del requerimiento: NO permitir** (excepto SUPER_ADMIN)
- Validación: Si user.role SUPER_ADMIN: permitir. Si OWNER: denegar (403)
- Mensaje: "Solo Super Admin puede invitar usuarios"

**Caso 5: Usuario ve otra org (RLS)**
- OWNER/AGENT intenta GET /api/orgs/:otherId
- RLS en `organizations` JOIN `org_members` filtra
- Si no tiene membresía en `:otherId` → 0 rows retornadas
- API retorna 404 o lista vacía
- Decisión Sprint 01: **404 Not Found** (simular que no existe)

---

### CU4: Config Bot/IA + Auditoría

**Caso 1: Prompt vacío**
- Usuario intenta guardar con prompt = ""
- Validación frontend (disabled button)
- Validación backend: 400 Bad Request
- Mensaje: "El prompt no puede estar vacío"

**Caso 2: Modelo inválido**
- Usuario ingresa modelo = "invalid/model"
- No existe en lista conocida de Cerebras (validación soft)
- Sistema lo guarda igual pero:
  - Muestra warning: "Modelo no reconocido; verifica antes de usar"
  - Auditoría registra normalmente

**Caso 3: OWNER sin permiso intenta editar**
- En Sprint 01, ¿OWNER puede editar? Revisar requerimiento.
- Requerimiento dice: "Actor: SUPER_ADMIN (y OWNER si permitido)"
- Decisión: **OWNER SÍ puede editar bot settings de su org**
- AGENT: NO (403)

**Caso 4: Conflicto de edición simultánea**
- Dos usuarios SUPER_ADMIN editan bot al mismo tiempo
- Sin lock pessimista; último UPDATE gana
- Auditoría registra ambos cambios con timestamps
- UI: botón "Recargar" si detecta cambio externo (realtime o polling)
- Mensaje: "Config fue actualizada por otro usuario; recarga para ver cambios"

**Caso 5: Auditoría no disponible**
- INSERT a `audit_logs` falla (DB error)
- No bloquear guardado de bot settings
- Log: error en servidor (no exponer usuario)
- UI: guardado exitoso, nota silenciosa en logs
- Siguiente Sprint: mejorar confiabilidad

---

## Permutaciones de Rol

| Acción | SUPER_ADMIN | OWNER | AGENT |
|--------|------------|-------|-------|
| Ver lista de orgs | Todas | Solo suya | Solo suya |
| Crear org | ✅ | ❌ | ❌ |
| Editar org (nombre, slug) | ✅ | ❌ | ❌ |
| Desactivar org | ✅ | ❌ | ❌ |
| Invitar usuario | ✅ | ❌ | ❌ |
| Cambiar rol usuario | ✅ | ❌ | ❌ |
| Revocar usuario | ✅ | ❌ | ❌ |
| Ver config bot | ✅ | ✅ (read+write) | ✅ (read-only) |
| Editar config bot | ✅ | ✅ | ❌ |
| Ver audit log | ✅ | ✅ | ❌ |

---

**Estado:** SPEC DRAFT
