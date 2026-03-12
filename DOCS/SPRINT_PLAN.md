# SPRINT_PLAN.md

| Sprint | Objetivo | Casos de Uso (máx 4) | Pantallas UI | Riesgos |
|---|---|---|---|---|
| 01 | Base: Auth/RBAC + Empresas + Bots + Auditoría mínima | CU1 Login/RBAC; CU2 CRUD Empresas + link portal; CU3 Gestión usuarios (OWNER/AGENT); CU4 Config bot/IA (base) + audit | Login; Admin Dashboard; Empresas (lista/detalle); Usuarios (modal/lista); Bot/IA Settings; Auditoría (lista) | RLS mal configurado puede filtrar datos |
| 02 | WhatsApp: conectar números + webhook + persistencia + inbox read-only | CU1 Registrar número/canal; CU2 Recibir mensajes webhook; CU3 Ver inbox/conversación; CU4 Estados conversación base BOT/HUMAN/PENDING | Empresa > Canales; Inbox (lista); Chat (timeline read-only); Estado conversación | Webhook firma/validación; duplicados; rate limits |
| 03 | Operación humana: responder, asignar, tags/notas, handoff básico y portal empresa | CU1 Tomar chat y responder; CU2 Handoff triggers (keyword/horario/fallback); CU3 Tags/Notas/Filtros; CU4 Portal empresa (OWNER/AGENT) con acceso restringido | Inbox (con filtros); Chat (composer + take/release); Panel lateral tags/notas; Portal empresa (home) | Concurrencia (2 agentes), permisos finos |
| 04 | Auto-respuesta IA + overrides + media (imagen/audio/pdf) + health/auditoría completa | CU1 Auto-reply con Cerebras; CU2 Config IA avanzada + override por chat; CU3 Media storage + extracción (pipeline) + fallback; CU4 Health & auditoría extendida | Bot/IA Settings (avanzado); Chat (override bot/model); Media viewer + transcript; Health/Logs; Auditoría (detalle) | Media processing requiere proveedor/servicio; costos/latencia |

| Sprint | Objetivo | Casos de Uso (máx 4) | Pantallas UI | Riesgos |
|---|---|---|---|---|
| 01 | Base: Auth/RBAC + Empresas + Bots + Auditoría mínima | CU1 Login/RBAC; CU2 CRUD Empresas + link portal; CU3 Gestión usuarios (OWNER/AGENT); CU4 Config bot/IA (base) + audit | Login; Admin Dashboard; Empresas (lista/detalle); Usuarios (modal/lista); Bot/IA Settings; Auditoría (lista) | RLS mal configurado puede filtrar datos |
| 02 | WhatsApp: conectar números + webhook + persistencia + inbox read-only | CU1 Registrar número/canal; CU2 Recibir mensajes webhook; CU3 Ver inbox/conversación; CU4 Estados conversación base BOT/HUMAN/PENDING | Empresa > Canales; Inbox (lista); Chat (timeline read-only); Estado conversación | Webhook firma/validación; duplicados; rate limits |
| 03 | Operación humana: responder, asignar, tags/notas, handoff básico y portal empresa | CU1 Tomar chat y responder; CU2 Handoff triggers (keyword/horario/fallback); CU3 Tags/Notas/Filtros; CU4 Portal empresa (OWNER/AGENT) con acceso restringido | Inbox (con filtros); Chat (composer + take/release); Panel lateral tags/notas; Portal empresa (home) | Concurrencia (2 agentes), permisos finos |
| 04 | Auto-respuesta IA + overrides + media (imagen/audio/pdf) + health/auditoría completa | CU1 Auto-reply con Cerebras; CU2 Config IA avanzada + override por chat; CU3 Media storage + extracción (pipeline) + fallback; CU4 Health & auditoría extendida | Bot/IA Settings (avanzado); Chat (override bot/model); Media viewer + transcript; Health/Logs; Auditoría (detalle) | Media processing requiere proveedor/servicio; costos/latencia |

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
# SPRINT_02.md

## 1) Objetivo del sprint
Integrar WhatsApp Cloud API: registrar números por empresa, recibir mensajes por webhook, persistirlos en BD y mostrarlos en inbox (lectura).

## 2) Casos de Uso (máx 4)

### CU1 — Registrar número/canal WhatsApp para una empresa
- Actor: SUPER_ADMIN
- Precondiciones: org existe
- Flujo principal:
  1) SUPER_ADMIN abre tab “Canales”.
  2) Registra: phone_number_id, display number, waba_id (compartido), token (referencia segura).
  3) Guarda canal activo.
- Casos borde:
  - phone_number_id duplicado en otra org (bloquear).
  - Token inválido (permitir guardar pero marcar “no verificado”).
  - Cambiar token (auditar).
  - Desactivar canal (bot no responde; inbox sigue).
  - Owner/Agent intenta ver token (ocultar).
- Criterios de aceptación:
  - [ ] Canal se guarda y queda asociado a org
  - [ ] Token nunca se muestra en UI a roles no permitidos
  - [ ] Audit log en cambios críticos

### CU2 — Recibir mensajes por webhook y persistir
- Actor: Sistema (Webhook)
- Precondiciones:
  - Webhook configurado en Meta hacia Worker
  - Canal activo asociado a phone_number_id
- Flujo principal:
  1) Worker recibe evento WhatsApp.
  2) Valida firma (si disponible) y parsea payload.
  3) Upsert contacto (por wa_id/teléfono).
  4) Upsert conversación (por org+contact).
  5) Inserta mensaje entrante (tipo: text/image/audio/document).
  6) Actualiza `last_message_at`.
- Casos borde:
  - Evento duplicado (idempotencia por message_id).
  - Canal no encontrado (registrar error).
  - Media con URL expirada (guardar metadata).
  - Payload inválido (400 + log).
  - Rate limit (reintentos controlados).
- Criterios de aceptación:
  - [ ] Mensajes se guardan con message_id único
  - [ ] Conversación se crea automáticamente
  - [ ] Se soporta text + media metadata

### CU3 — Ver Inbox y conversación (read-only)
- Actor: SUPER_ADMIN / OWNER / AGENT
- Precondiciones: existen conversaciones/mensajes
- Flujo principal:
  1) Usuario abre Inbox.
  2) Ve lista de conversaciones con preview.
  3) Abre una conversación y ve timeline (mensajes ordenados).
  4) Media se muestra como link/preview (si disponible).
- Casos borde:
  - Muchas conversaciones (paginación).
  - Mensajes fuera de orden (ordenar por timestamp).
  - Sin permisos (RLS bloquea).
  - Media no descargable (mostrar placeholder).
  - Realtime desactivado (fallback a polling).
- Criterios de aceptación:
  - [ ] Inbox lista + detalle funcionan
  - [ ] Scoping por org correcto
  - [ ] Media se visualiza al menos como item descargable

### CU4 — Estados base de conversación
- Actor: Sistema / SUPER_ADMIN
- Precondiciones: conversación creada
- Flujo principal:
  1) Al crear conversación, estado inicial = BOT.
  2) Si canal desactivado, estado = PENDING (opcional) o BOT pero no responde.
  3) Se muestran badges por estado en Inbox.
- Casos borde:
  - Conversación en HUMAN no cambia por mensajes entrantes (solo updates last_message).
  - Conversación PENDING se destaca.
  - Reapertura de conversación antigua (mantener estado).
  - Cambio manual de estado (se habilita en Sprint 03).
  - Estado inválido (validación DB).
- Criterios de aceptación:
  - [ ] Estados persistidos y visibles
  - [ ] Reglas mínimas aplicadas al crear conversación

## 3) Entidades/Estados tocados
- channels (active/verified)
- contacts
- conversations (status BOT/HUMAN/PENDING)
- messages (inbound + metadata)
- audit_logs (canales)

## 4) Endpoints sugeridos
- POST /api/webhook/whatsapp (GET verify + POST events)
- POST /api/orgs/:orgId/channels/whatsapp
- GET /api/orgs/:orgId/inbox (paginado, filtros básicos)
- GET /api/conversations/:conversationId/messages

## 5) Pantallas UI exactas
1) **Empresa > Canales** (form)
   - inputs: phone_number_id, display number, waba_id
   - token (input ocultable, solo super_admin)
2) **Inbox** (lista)
   - filtros: estado, asignado (placeholder), búsqueda
3) **Chat view (read-only)** (detalle)
   - timeline con tipos: text, image/audio/pdf (cards)

## 6) Datos seed mínimos
- 1 canal demo (sin token real)
- 2 contactos + 2 conversaciones + 5 mensajes dummy

## 7) Tests mínimos
- Webhook: idempotencia por message_id
- DB: constraints únicos (phone_number_id, message_id)
- RLS: OWNER/AGENT ven solo su org
- UI: inbox pagination
# SPRINT_03.md

## 1) Objetivo del sprint
Operación humana completa: tomar chats, responder desde el panel, handoff básico, tags/notas y portal empresa (OWNER/AGENT) funcional.

## 2) Casos de Uso (máx 4)

### CU1 — Tomar conversación y responder (HUMAN)
- Actor: AGENT (o OWNER)
- Precondiciones: conversación existe
- Flujo principal:
  1) AGENT abre chat.
  2) Clic “Tomar” → estado pasa a HUMAN y se asigna a ese agente.
  3) Escribe respuesta y envía.
  4) Worker envía mensaje a WhatsApp y guarda mensaje outbound.
- Casos borde:
  - Dos agentes intentan tomar (lock optimista: “ya asignado”).
  - Envío WhatsApp falla (mostrar error + reintentar).
  - Canal desactivado (bloquear envío).
  - Mensaje muy largo/invalid (validación).
  - AGENT sin permiso (403).
- Criterios de aceptación:
  - [ ] Take/release funciona y se refleja en inbox
  - [ ] Mensajes outbound se guardan
  - [ ] Error handling visible en UI

### CU2 — Handoff triggers básicos
- Actor: Sistema
- Precondiciones: conversación en BOT
- Flujo principal:
  1) Si usuario escribe “humano/asesor” → estado PENDING.
  2) Si fuera de horario → estado PENDING.
  3) Si fallback “no entendí” ocurre 2 veces → estado PENDING.
  4) Se notifica visualmente en Inbox (badge + contador).
- Casos borde:
  - Mensajes repetidos de keyword (no duplicar evento).
  - Horarios no configurados (usar default “siempre abierto”).
  - Cambio de estado manual por SUPER_ADMIN.
  - Conversación en HUMAN ignora triggers.
  - Notificaciones excesivas (debounce).
- Criterios de aceptación:
  - [ ] Triggers funcionan y quedan auditados
  - [ ] PENDING aparece destacado en Inbox

### CU3 — Tags, notas y filtros
- Actor: SUPER_ADMIN / OWNER / AGENT
- Precondiciones: conversación existe
- Flujo principal:
  1) En chat, agregar tags (ej: “VIP”, “Hoy”, “Reclamo”).
  2) Agregar nota interna.
  3) Filtrar inbox por tag/estado/asignado.
- Casos borde:
  - Tags duplicados (normalizar).
  - Notas vacías.
  - AGENT no puede borrar tags críticos (opcional).
  - Alto volumen de tags (autocomplete).
  - RLS: no cruzar org.
- Criterios de aceptación:
  - [ ] CRUD tags por conversación
  - [ ] Notas internas visibles solo en panel
  - [ ] Filtros funcionando

### CU4 — Portal empresa (OWNER/AGENT) con acceso restringido
- Actor: OWNER / AGENT
- Precondiciones: membresía creada y login activo
- Flujo principal:
  1) Usuario entra por link portal.
  2) Login → redirige a su org.
  3) Ve Inbox y puede operar según rol.
  4) OWNER puede ver Bot/IA Settings (si permitido).
- Casos borde:
  - Usuario pertenece a múltiples orgs (si se permite) → selector.
  - OWNER intenta ver empresas ajenas (403).
  - AGENT intenta ver settings (403).
  - Org desactivada (bloquear acceso).
  - Usuario revocado (logout forzado).
- Criterios de aceptación:
  - [ ] Acceso aislado por org (UI + RLS)
  - [ ] Roles aplican en acciones del inbox/settings

## 3) Entidades/Estados tocados
- conversations (status, assigned_user_id)
- messages (outbound)
- conversation_tags, conversation_notes (nuevas)
- audit_logs (handoff, take/release, config changes)

## 4) Endpoints sugeridos
- POST /api/conversations/:id/take
- POST /api/conversations/:id/release
- POST /api/conversations/:id/messages (send outbound)
- POST/DELETE /api/conversations/:id/tags
- POST /api/conversations/:id/notes
- GET /api/orgs/:orgId/inbox?tag=&status=&assigned=

## 5) Pantallas UI exactas
1) **Inbox (operativo)** (lista)
   - filtros: estado, asignado, tags, búsqueda
2) **Chat view (operativo)** (detalle)
   - composer, botón Tomar/Devolver, asignación
   - panel lateral: tags, notas, info contacto
3) **Portal empresa home** (lista)
   - acceso directo a Inbox
4) **Bot/IA Settings (owner)** (form)
   - visible según rol

## 6) Datos seed mínimos
- 1 conversación PENDING, 1 HUMAN, 1 BOT
- 2 tags de ejemplo + 1 nota interna
- 1 agente asignado

## 7) Tests mínimos
- Concurrencia take: un solo asignado
- Envío outbound: mock WhatsApp API
- RLS: AGENT no ve settings, OWNER sí
- Filtros inbox por tags/estado
# SPRINT_04.md

## 1) Objetivo del sprint
Habilitar auto-respuesta con IA (Cerebras), overrides por chat, soporte real de media (guardar + extraer texto/transcripción para IA), y health/auditoría extendida.

## 2) Casos de Uso (máx 4)

### CU1 — Auto-reply BOT con Cerebras
- Actor: Sistema
- Precondiciones:
  - Conversación en estado BOT
  - Bot/IA settings configurados
- Flujo principal:
  1) Llega mensaje inbound.
  2) Worker arma contexto mínimo (últimos N mensajes).
  3) Llama a Cerebras (chat.completions).
  4) Envía respuesta por WhatsApp.
  5) Guarda mensaje outbound y métricas básicas (latencia, tokens si disponible).
- Casos borde:
  - Cerebras down/timeout → pasar a PENDING.
  - Respuesta vacía → fallback “no entendí” + contador.
  - Contenido bloqueado (policy interna) → handoff.
  - Rate limit → reintento limitado o cola.
  - Conversación cambia a HUMAN antes de responder (cancelar).
- Criterios de aceptación:
  - [ ] Bot responde automáticamente en BOT
  - [ ] Fallos críticos derivan a PENDING
  - [ ] Guardado outbound + logs básicos

### CU2 — Config IA avanzada + override por conversación
- Actor: SUPER_ADMIN / OWNER (si permitido)
- Precondiciones: bot default existe
- Flujo principal:
  1) En settings: configurar modelo, temperatura, prompt y límites (N mensajes contexto).
  2) En chat: dropdown override “bot/modelo” para ese chat.
  3) Guardar override y auditar.
- Casos borde:
  - Override inválido → ignorar y usar default.
  - Owner no autorizado a cambiar modelo → ocultar UI.
  - Cambios concurrentes → último gana + log.
  - Reset override → vuelve a default.
  - Chat sin historial → contexto vacío.
- Criterios de aceptación:
  - [ ] Overrides por chat funcionan
  - [ ] Audit log registra cambios

### CU3 — Media: storage + extracción (imagen/audio/pdf) + fallback
- Actor: Sistema
- Precondiciones: llega mensaje con media
- Flujo principal:
  1) Webhook recibe media metadata (id/URL).
  2) Worker descarga media (si permitido por API) y guarda en Supabase Storage.
  3) Crea job en `media_jobs` (status QUEUED).
  4) Procesador (Worker/servicio) extrae:
     - audio → transcript
     - pdf → texto
     - imagen → OCR/summary
  5) Adjunta resultado a `messages.extracted_text`.
  6) Si conversación en BOT: usa extracted_text como input a Cerebras.
  7) Si falla extracción: pasa a PENDING (handoff).
- Casos borde:
  - URL expira/no descargable.
  - Archivo muy grande (limitar tamaño).
  - OCR/transcripción falla.
  - Tiempo de procesamiento alto (responder “recibido, procesando” opcional).
  - Privacidad: storage con acceso firmado (no público).
- Criterios de aceptación:
  - [ ] Media se guarda y se muestra en chat
  - [ ] extracted_text se guarda cuando se procesa
  - [ ] Fallos derivan a PENDING y quedan auditados

> Nota técnica: como Workers no son ideales para procesamiento pesado, este sprint define **interfaz de procesadores**:
> - Opción A (rápida): llamar APIs externas de OCR/transcripción.
> - Opción B (pro): microservicio “media-processor” en VPS barato.
> Se implementa mínimo con “placeholder + hook” y 1 procesador inicial elegido.

### CU4 — Health/Logs + Auditoría extendida
- Actor: SUPER_ADMIN
- Precondiciones: sistema en uso
- Flujo principal:
  1) Ver dashboard de health: eventos webhook, errores, cola media_jobs.
  2) Ver auditoría por empresa y detalle (diff).
- Casos borde:
  - Logs crecen (paginación/retención).
  - Permisos: OWNER ve solo su auditoría.
  - Pérdida de eventos (alerta simple).
  - Error sin stack (mensaje resumido).
  - Métricas incompletas (mostrar “N/A”).
- Criterios de aceptación:
  - [ ] Health muestra estado y últimos errores
  - [ ] Auditoría navegable por entidad/fecha

## 3) Entidades/Estados tocados
- bots (advanced settings)
- conversations (override_bot_id, override_model)
- messages (extracted_text, media_url/storage_path)
- media_jobs (QUEUED/RUNNING/DONE/FAILED)
- logs/events (tabla simple)
- audit_logs (extended)

## 4) Endpoints sugeridos
- POST /api/llm/reply (interno)
- PATCH /api/orgs/:orgId/bot (advanced)
- PATCH /api/conversations/:id/override
- POST /api/media/process/:jobId (interno/processor)
- GET /api/admin/health
- GET /api/orgs/:orgId/audit?entity=&date=

## 5) Pantallas UI exactas
1) **Bot/IA Settings (avanzado)** (form)
   - modelo, temperatura, contexto N, reglas fallback
2) **Chat view (override + media)** (detalle)
   - dropdown override bot/model
   - cards media + transcript/text extraído
3) **Health/Logs** (lista)
   - tablas: errores, jobs, webhooks
4) **Auditoría (detalle)** (detalle/lista)
   - diff mínimo (antes/después)

## 6) Datos seed mínimos
- 1 media_job DONE con transcript dummy
- 1 media_job FAILED
- 3 logs de error simulados
- 2 eventos de auditoría config

## 7) Tests mínimos
- Bot reply: mock Cerebras + timeout → PENDING
- Media job lifecycle: QUEUED→DONE y FAILED
- Storage: URLs firmadas (no públicas)
- Override: usa override si existe, default si no
# PREGUNTAS.md

## Huecos restantes (para cerrar en implementación)
1) **Procesador de media (audio/imagen/pdf):** elegir implementación inicial:
   - A) APIs externas (rápido, puede costar)
   - B) Microservicio propio (más control, requiere VPS)
2) **Auth exacta:** magic link vs password (Supabase permite ambos). Default propuesto: magic link.
3) **Permiso OWNER sobre settings:** se asume que OWNER puede editar bot/IA de su empresa, pero NO credenciales WhatsApp.
4) **Mensajes fuera de ventana (templates WhatsApp):** se asume fuera de alcance por ahora.
5) **Retención de mensajes/logs:** default: indefinida; definir si habrá borrado automático.