# SPRINT02_REGLAS.md

## 📏 Business Rules - WhatsApp Integration

### 1. Webhook Handling Rules

#### R1.1 - Signature Validation (CRITICAL)
**Rule**: Todos los webhooks de WhatsApp deben validar firma HMAC-SHA256.

**Implementación**:
```
Header: X-Hub-Signature = sha256={hash}
Body: raw JSON
Token: webhook_verify_token (from env)

hash = HMAC_SHA256(token, body)
if header_hash != hash:
    return 403 Forbidden
```

**Violación**: Rechazar sin procesar, log error.

---

#### R1.2 - Idempotency (CRITICAL)
**Rule**: No procesar 2x el mismo mensaje (mismo `message_id`).

**Implementación**:
```
1. Check: SELECT * FROM messages WHERE message_id = ?
2. If exists: return 200 OK (idempotent success)
3. If not: INSERT + process
```

**Violación**: Silenciar, no duplicar en DB.

---

#### R1.3 - Webhook Response Timeout
**Rule**: Retornar 200 OK en <2s (WhatsApp espera <40s).

**Implementación**:
```
1. Validate signature (10ms)
2. Check idempotency (50ms)
3. INSERT message + create conversation (100ms)
4. Return 200 immediately
5. Process async (AI, handoff, etc.) en background
```

**Trigger**: Si toma >2s, WhatsApp retry, aplicación logs warning.

---

#### R1.4 - Webhook Error Handling
**Rule**: Si insert falla, log error pero NO fallar respuesta (200 OK mismo).

**Implementación**:
```
try:
    INSERT message + update conversation
    return 200 OK
catch Exception e:
    LOG.error("Webhook DB error", {message_id, error: e.msg})
    AUDIT.log({type: 'WEBHOOK_ERROR', org_id, reason: e.msg})
    return 200 OK  // Important: still 200
```

**Razón**: WhatsApp reenviará si 5xx. Nosotros detectamos en logs.

---

### 2. Channel Registration Rules

#### R2.1 - Phone Number Uniqueness
**Rule**: Un número WhatsApp = 1 org (no compartir entre orgs).

**Constraint**:
```sql
UNIQUE(org_id, phone_number)
UNIQUE(org_id, phone_number_id)
```

**Violación**: Error "Phone number already in use by another organization".

---

#### R2.2 - Token Encryption
**Rule**: Access tokens NUNCA se guardan en plaintext.

**Implementación**:
```
1. Receive token from user/API
2. Encrypt con pgcrypto o argon2
3. Store encrypted_token in DB
4. In RAM: decrypt solo cuando llamar WhatsApp API
5. NEVER log token
```

**Violación**: Error + audit log si alguien intenta leer token directo.

---

#### R2.3 - Token Validation
**Rule**: Validar token contra WhatsApp API antes de guardar.

**Implementación**:
```
POST /orgs/:orgId/whatsapp/channels
Body: { phone_number_id, access_token, ... }

→ Call WhatsApp GET /phone_number_id?fields=phone_number
  with access_token
→ If 401: return 401 "Invalid token"
→ If 200: save channel + verified_at = NOW()
→ If error: return 400 "Failed to validate"
```

**Violación**: Rechazar sin guardar.

---

### 3. Conversation State Rules

#### R3.1 - Initial State = BOT
**Rule**: Conversación nueva siempre inicia en estado `BOT`.

**Implementación**:
```sql
INSERT INTO conversations (state, ...)
VALUES ('BOT', ...)
```

**Excepción**: Sprint 03 puede cambiar a HUMAN/PENDING.

---

#### R3.2 - Read-Only Inbox (Sprint 02)
**Rule**: En Sprint 02, agents NO pueden cambiar estado o editar conversaciones desde UI.

**Implementación**:
```
- GET /inbox: OK
- GET /inbox/:id/messages: OK
- POST /inbox/:id/reply: NOT AVAILABLE (403)
- PUT /inbox/:id: NOT AVAILABLE (403)
```

**Nota**: Sprint 03 agrega estos endpoints.

---

#### R3.3 - Last Message Denormalization
**Rule**: `conversations.last_message_text` + `last_message_at` SIEMPRE actualizados.

**Implementación**:
```sql
CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();
```

**Violación**: Inconsistencia en inbox preview (data stale). Fix: rebuild trigger.

---

### 4. Message Persistence Rules

#### R4.1 - Message Direction
**Rule**: Todos los mensajes inbound de webhook = `direction = 'inbound'`.

**Futuro (Sprint 03+)**: `direction = 'outbound'` cuando agent/bot responda.

---

#### R4.2 - Message Ordering
**Rule**: Mensajes ordenados por `timestamp` (from WhatsApp), no `created_at` (server).

**Implementación**:
```sql
SELECT * FROM messages 
WHERE conversation_id = ?
ORDER BY webhook_timestamp ASC
```

**Razón**: WhatsApp timestamp es source of truth en caso de clock skew.

---

#### R4.3 - Message Type Support (Sprint 02)
**Rule**: Solo `message_type = 'text'` soportado en Sprint 02.

**Implementación**:
```
if webhook.message.type != 'text':
    LOG.warn("Unsupported message type", {type, org_id})
    return 200 OK  // accept pero no procesar
```

**Sprint 04**: Agregar 'image', 'audio', 'document'.

---

### 5. Data Isolation Rules

#### R5.1 - Cross-Org Data Leak Prevention
**Rule**: Un OWNER/AGENT NUNCA puede ver datos de otra org.

**RLS Enforcement**:
```sql
WHERE org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
)
```

**Violación**: Error 403 + audit log si detectable.

---

#### R5.2 - AGENT Inbox Access
**Rule**: AGENT ≥ OWNER: ambos ven inbox + timeline.

**Futuro (Sprint 03)**: AGENT solo ve chats asignados.

---

### 6. Rate Limiting Rules

#### R6.1 - Webhook Rate Limit
**Rule**: Max 10 mensajes/segundo por canal (burst 50/min).

**Implementación** (Cloudflare Workers):
```
Use Durable Objects o Redis para contar
If rate_exceeded: return 429 Too Many Requests
(pero WhatsApp puede reintentar)
```

---

#### R6.2 - API Rate Limit
**Rule**: Max 100 requests/min por usuario + org.

---

### 7. Audit Rules

#### R7.1 - Webhook Error Logging
**Rule**: Cada webhook error → audit log.

**Campos**:
```json
{
  "type": "WEBHOOK_ERROR",
  "org_id": "...",
  "channel_id": "...",
  "reason": "Invalid signature|DB error|Rate limit",
  "timestamp": NOW(),
  "details": {...}
}
```

---

#### R7.2 - Channel Registration Audit
**Rule**: Crear/deletar canal → audit log.

---

### 8. Constraint Summary

| Rule | Type | Enforcement |
|------|------|-------------|
| Signature validation | Critical | 403 if invalid |
| Idempotency | Critical | 200 OK if duplicate |
| Phone unique/org | Data | UNIQUE constraint |
| Token encrypted | Security | pgcrypto |
| RLS isolation | Security | Supabase RLS |
| Direction in schema | Data | CHECK constraint |
| Webhook timeout | Performance | <2s or async |
| Audit logging | Compliance | Trigger + log |

---

## 🚨 Error Scenarios & Handling

| Scenario | HTTP | Message | Action |
|----------|------|---------|--------|
| Invalid signature | 403 | "Unauthorized" | Log + ignore |
| Duplicate message_id | 200 | (idempotent) | Skip processing |
| DB insert fails | 200 | (async ok) | Log + retry later |
| Invalid token | 400 | "Invalid token" | Reject channel |
| Rate limited | 429 | "Too many requests" | Backoff + retry |
| Missing phone_id | 400 | "Phone ID required" | Reject request |
| Cross-org access | 403 | "Forbidden" | RLS block |

