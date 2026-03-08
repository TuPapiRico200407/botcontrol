# SPRINT02_OBJETIVO.md

## 🎯 Objetivo Sprint 02: WhatsApp Integration

### Visión
Conectar WhatsApp Cloud API a la plataforma BotControl para que:
1. **Registrar números WhatsApp** por empresa
2. **Recibir mensajes** vía webhook
3. **Persistir conversaciones** en base de datos
4. **Ver inbox read-only** con lista de chats y timeline

### Alcance

#### ✅ Incluye
- **Canales WhatsApp**: Register phone number por empresa (con WhatsApp Cloud API)
- **Webhook Setup**: Endpoint para recibir mensajes (POST /webhook/whatsapp)
- **Validación Webhook**: Verificar firma + token de Cloudflare
- **Persistencia**: Guardar números, conversaciones, mensajes
- **Inbox List**: Ver chats por empresa (read-only, ordenado por último mensaje)
- **Chat Timeline**: Ver conversación (orden cronológico, solo mensajes de entrada)
- **Estados Base**: `BOT` (responde bot) / `HUMAN` (pendiente atención) / `PENDING` (esperando)
- **Auditoría**: Log mínimo de webhook errors y cambios de canal

#### ❌ No-alcance
- Auto-respuestas IA (Sprint 04)
- Envío de mensajes desde agents (Sprint 03)
- Override de bot/modelo por chat (Sprint 04)
- Media handling completo (Sprint 04)
- Handoff automático (Sprint 03)

---

## 📊 Casos de Uso (4)

### CU1 - Registrar Número WhatsApp
**Actor**: SUPER_ADMIN / OWNER
**Precondición**: Org existe, usuario autenticado
**Flujo**:
1. Usuario va a Empresa > Canales WhatsApp
2. Click "Conectar Nuevo Número"
3. Ingresa Phone Number ID (obtenido de WhatsApp Cloud API dashboard)
4. Sistema valida token/credenciales contra WhatsApp API
5. Sistema crea `whatsapp_channel` en DB ✅
6. Muestra: "Número +1234567890 conectado"

**Criterios de aceptación**:
- [ ] Validación token contra WhatsApp API
- [ ] Phone number único por empresa
- [ ] Error claro si token inválido
- [ ] Auditoría: log de creación canal

---

### CU2 - Recibir Mensaje WhatsApp
**Actor**: WhatsApp Cloud API (webhook)
**Precondición**: Canal registrado, webhook configurado
**Flujo**:
1. Usuario envía mensaje a número registrado
2. WhatsApp envía POST a `/webhook/whatsapp`
3. Sistema valida firma (X-Hub-Signature)
4. Sistema extrae: `from_phone`, `message_text`, `timestamp`, `message_id`
5. Sistema crea/actualiza `conversation` y `message` en DB ✅
6. Responde 200 OK a webhook
7. Log de mensaje recibido

**Criterios de aceptación**:
- [ ] Validación de firma webhook (HMAC SHA256)
- [ ] Idempotent: no duplicar si mismo message_id
- [ ] Retorna 200 antes de procesamiento completo (async ok)
- [ ] Error log si falla persistencia (no fallar webhook)
- [ ] Rate limit: máx 10 msgs/sec por canal

---

### CU3 - Ver Inbox (List)
**Actor**: AGENT / OWNER
**Precondición**: Autenticado, tiene acceso a org
**Flujo**:
1. Usuario abre Inbox en su org
2. Sistema carga lista de `conversations` ordenada por `last_message_at` DESC
3. Muestra: phone_number, último mensaje, timestamp, estado (BOT/HUMAN/PENDING)
4. Paginación: 20 items por página
5. Filtro básico: estado (todos, BOT, HUMAN, PENDING)

**Criterios de aceptación**:
- [ ] Carga en <1s (índices DB)
- [ ] Paginación funciona
- [ ] Filtro por estado
- [ ] RLS: no ve chats de otras orgs
- [ ] Real-time update (opcional: polling cada 5s)

---

### CU4 - Ver Conversación (Timeline)
**Actor**: AGENT / OWNER
**Precondición**: Inbox abierto, selecciona chat
**Flujo**:
1. Click en uno de la lista de inbox
2. Sistema carga `messages` de esa `conversation` (orden ASC cronológico)
3. Muestra: sender (de/a), type (text), body, timestamp
4. Scroll infinito o paginación (50 msgs)
5. Auto-refresh cada 3s

**Criterios de aceptación**:
- [ ] Carga en <500ms (índice conversation_id, timestamp)
- [ ] Orden correcto (older → newer)
- [ ] RLS: no ve convo de otra org
- [ ] Auto-refresh sin bloqueos
- [ ] Limpia state al cambiar de chat

---

## 🗄️ Entidades Principales

```sql
-- whatsapp_channels
- id (uuid)
- org_id (fk organizations)
- phone_number (string, unique per org)
- phone_number_id (string, from WhatsApp)
- access_token (encrypted)
- verified_at (timestamp)
- created_at, updated_at

-- conversations
- id (uuid)
- org_id (fk)
- channel_id (fk whatsapp_channels)
- phone_number (string, sender)
- state (enum: BOT, HUMAN, PENDING)
- last_message_at (timestamp)
- created_at, updated_at

-- messages
- id (uuid)
- conversation_id (fk)
- org_id (fk)
- message_id (string, from WhatsApp)
- direction (enum: inbound, outbound)
- type (enum: text)
- body (text)
- timestamp (bigint, from WhatsApp)
- created_at
```

---

## 🔧 Endpoints API (Backend)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/orgs/:orgId/whatsapp/channels` | Registrar número | OWNER/SUPER_ADMIN |
| GET | `/orgs/:orgId/whatsapp/channels` | Listar números | OWNER/AGENT |
| POST | `/webhook/whatsapp` | Recibir mensaje | Token público |
| GET | `/orgs/:orgId/inbox` | Listar conversaciones | OWNER/AGENT |
| GET | `/orgs/:orgId/inbox/:convId/messages` | Ver timeline | OWNER/AGENT |

---

## ⚠️ Riesgos

1. **Webhook signature validation**: Si falla, pueden inyectar mensajes falsos
2. **Duplicados de mensaje**: Si no guardamos `message_id`, procesamos 2x
3. **Rate limits WhatsApp**: API puede throttle si enviamos mucho
4. **Credenciales**: Phone number ID + token deben cifrarse en DB
5. **Latencia Webhook**: Si DB tarda, WhatsApp timeout (40s limit)

---

## 📅 Timeline Estimado

- **FASE 1** (Specs): 2h
- **FASE 2** (Plan): 3h
- **FASE 3** (UI Kit): 4h
- **FASE 4** (Impl): 20h
- **FASE 5** (QA): 5h
- **Total**: ~34h (~1 semana a 8h/día)

---

## ✅ DoD (Definition of Done)

- [ ] Todos los CU probados end-to-end
- [ ] Webhook valida signature y es idempotent
- [ ] Inbox carga en <1s
- [ ] RLS previene cross-org data leak
- [ ] Lint 0 errors
- [ ] Tests unitarios + E2E
- [ ] Documentación actualizada
- [ ] Git commit limpio + GitHub PR
