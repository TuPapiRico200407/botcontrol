# SPRINT02_CONTRATO.md

## 📋 API Contracts - Sprint 02

---

## 1. POST /webhook/whatsapp
**Recibir mensajes de WhatsApp**

### Request
```
POST /webhook/whatsapp
Content-Type: application/json
X-Hub-Signature: sha256={computed_hash}

Body:
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "16505551234",
              "phone_number_id": "102226435123456"
            },
            "messages": [
              {
                "from": "554899999999",
                "id": "wamid.HBEUGBZBCkFBAFBIgQJHJXcVOXc3MWYB",
                "timestamp": "1709000000",
                "text": {
                  "body": "Hola, necesito ayuda"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Response (Success)
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message_id": "wamid.HBEUGBZBCkFBAFBIgQJHJXcVOXc3MWYB"
}
```

### Response (Errors)
```
403 Forbidden (Invalid signature)
{
  "error": "Invalid signature"
}

429 Too Many Requests
{
  "error": "Rate limit exceeded"
}

500 Internal Server Error
{
  "error": "Processing error",
  "message_id": "wamid.xxx"  // optional, for debugging
}
```

### Logic
```
1. Extract X-Hub-Signature header
2. HMAC_SHA256 validate (token from env.WHATSAPP_WEBHOOK_TOKEN)
3. Extract messages from body
4. For each message:
   a. Check phone_number_id → get channel
   b. Check message_id idempotency
   c. Create/update conversation
   d. Insert message
5. Return 200 OK immediately
6. (Async) Process with rules/AI
```

---

## 2. GET /orgs/:orgId/whatsapp/channels
**Listar canales WhatsApp de una org**

### Request
```
GET /orgs/4c31b8d8-a5f5-45b5-8e5e-d3c8e8e85e5d/whatsapp/channels
Authorization: Bearer {user_token}
```

### Response (Success)
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    {
      "id": "ch_12345",
      "org_id": "4c31b8d8-a5f5-45b5-8e5e-d3c8e8e85e5d",
      "phone_number": "+1234567890",
      "phone_number_id": "Phone:123456789",
      "verified_at": "2026-03-08T10:00:00Z",
      "is_active": true,
      "created_at": "2026-03-07T15:30:00Z",
      "updated_at": "2026-03-08T10:00:00Z"
    }
  ],
  "count": 1
}
```

### Response (Errors)
```
401 Unauthorized
403 Forbidden (not member of org)
```

---

## 3. POST /orgs/:orgId/whatsapp/channels
**Registrar nuevo número WhatsApp**

### Request
```
POST /orgs/4c31b8d8-a5f5-45b5-8e5e-d3c8e8e85e5d/whatsapp/channels
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "phone_number": "+1234567890",
  "phone_number_id": "Phone:123456789",
  "access_token": "sk_live_1234567890abcdef"
}
```

### Response (Success)
```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "data": {
    "id": "ch_12345",
    "org_id": "4c31b8d8-a5f5-45b5-8e5e-d3c8e8e85e5d",
    "phone_number": "+1234567890",
    "phone_number_id": "Phone:123456789",
    "verified_at": "2026-03-08T10:00:00Z",
    "is_active": true,
    "created_at": "2026-03-08T10:00:00Z"
  }
}
```

### Response (Errors)
```
400 Bad Request
{
  "error": "Invalid phone number format"
  // or "Phone number already in use"
  // or "Invalid access token"
}

401 Unauthorized
403 Forbidden (not OWNER)
```

### Logic
```
1. Auth check: user is OWNER in org
2. Validate phone_number (E.164 format)
3. Check uniqueness: UNIQUE(org_id, phone_number_id)
4. Validate token: GET /phone_number_id from WhatsApp
   - If 401: return 400 "Invalid token"
   - If 404: return 400 "Phone ID not found"
5. Encrypt access_token
6. INSERT whatsapp_channel
7. Set verified_at = NOW()
8. AUDIT: log "Channel registered"
9. Return 201
```

---

## 4. GET /orgs/:orgId/inbox
**Listar conversaciones (inbox list)**

### Request
```
GET /orgs/4c31b8d8-a5f5-45b5-8e5e-d3c8e8e85e5d/inbox?state=BOT&page=1&limit=20
Authorization: Bearer {user_token}
```

### Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `state` | enum | all | Filter: `BOT`, `HUMAN`, `PENDING` |
| `page` | int | 1 | Pagination page |
| `limit` | int | 20 | Items per page |
| `search` | string | - | Search in phone_number or contact_name |

### Response (Success)
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    {
      "id": "conv_123",
      "org_id": "4c31b8d8-a5f5-45b5-8e5e-d3c8e8e85e5d",
      "channel_id": "ch_12345",
      "phone_number": "+91987654321",
      "contact_name": "John Doe",
      "state": "BOT",
      "assigned_agent_id": null,
      "message_count": 12,
      "last_message_at": "2026-03-08T14:30:00Z",
      "last_message_text": "Gracias por tu ayuda!",
      "created_at": "2026-03-08T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Response (Errors)
```
401 Unauthorized
403 Forbidden (not member of org)
```

---

## 5. GET /orgs/:orgId/inbox/:convId/messages
**Ver timeline de una conversación**

### Request
```
GET /orgs/4c31b8d8-a5f5-45b5-8e5e-d3c8e8e85e5d/inbox/conv_123/messages?page=1&limit=50
Authorization: Bearer {user_token}
```

### Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Pagination page |
| `limit` | int | 50 | Items per page |

### Response (Success)
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    {
      "id": "msg_456",
      "conversation_id": "conv_123",
      "message_id": "wamid.HBEUGBZBCkFBAFBIgQJHJXcVOXc3MWYB",
      "direction": "inbound",
      "message_type": "text",
      "body": "Hola, necesito ayuda con mi pedido",
      "created_at": "2026-03-08T14:20:00Z",
      "webhook_timestamp": 1709905200000
    },
    {
      "id": "msg_457",
      "conversation_id": "conv_123",
      "message_id": "wamid.HBEUGBZBCkFBAFBIgQJHJXcVOXc3NWYC",
      "direction": "inbound",
      "message_type": "text",
      "body": "¿Cuál es el número de pedido?",
      "created_at": "2026-03-08T14:25:00Z",
      "webhook_timestamp": 1709905500000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "pages": 3
  }
}
```

### Response (Errors)
```
401 Unauthorized
403 Forbidden (not member of org)
404 Not Found (conversation doesn't exist)
```

---

## Error Response Format (Standard)

Todos los errores siguen este formato:

```
HTTP/1.1 {status_code}
Content-Type: application/json

{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }  // optional
  }
}
```

### Error Codes

| Code | HTTP | Message |
|------|------|---------|
| `INVALID_SIGNATURE` | 403 | Webhook signature validation failed |
| `INVALID_TOKEN` | 400 | WhatsApp access token invalid or expired |
| `PHONE_DUPLICATE` | 400 | Phone number already registered in this org |
| `PHONE_FORMAT_INVALID` | 400 | Phone number format invalid (E.164 required) |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User not authorized for this resource |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Authentication

**All endpoints except `/webhook/whatsapp` require**:
```
Authorization: Bearer {jwt_token}
```

JWT contains:
- `sub`: user_id
- `email`: user email
- `role`: SUPER_ADMIN | OWNER | AGENT
- `org_id`: (if OWNER/AGENT)

---

## Validation Schema (Zod)

### WhatsApp Channel Registration
```typescript
z.object({
  phone_number: z.string().regex(/^\+\d{1,15}$/, "E.164 required"),
  phone_number_id: z.string().min(1),
  access_token: z.string().min(10)
})
```

### Inbox Query
```typescript
z.object({
  state: z.enum(['BOT', 'HUMAN', 'PENDING']).optional(),
  page: z.number().int().gte(1).default(1),
  limit: z.number().int().gte(1).lte(100).default(20),
  search: z.string().optional()
})
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `POST /webhook/whatsapp` | 10 req/s per channel |
| `GET /inbox` | 100 req/min per user |
| `GET /inbox/:id/messages` | 100 req/min per user |
| `POST /whatsapp/channels` | 10 req/hour per org |

