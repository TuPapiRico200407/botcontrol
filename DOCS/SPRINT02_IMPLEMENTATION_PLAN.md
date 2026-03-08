# SPRINT02_IMPLEMENTATION_PLAN.md

## 🎯 FASE 2: Plan de Implementación

### Timeline Estimado
- **Pasos 1-3** (Database): 3h
- **Pasos 4-7** (API Backend): 8h
- **Pasos 8-10** (Web Frontend): 6h
- **Paso 11** (Integration): 3h
- **Total**: 20h (~2.5 días a 8h/día)

---

## 📋 Pasos Secuenciales

### Paso 1: Database Migration - Crear Tablas
**Duración**: 1h  
**Dependencia**: Sprint 01 BD (organizations, org_members)

**Archivos**:
- `supabase/migrations/0003_sprint02_whatsapp.sql`

**Contenido**:
```sql
-- Extension pgcrypto (si no existe)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla whatsapp_channels
CREATE TABLE whatsapp_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    phone_number_id TEXT NOT NULL,
    business_account_id TEXT,
    access_token_encrypted BYTEA NOT NULL,
    verified_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(org_id, phone_number),
    UNIQUE(org_id, phone_number_id)
);

-- Tabla conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES whatsapp_channels(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    contact_name TEXT,
    state TEXT NOT NULL DEFAULT 'BOT',
    assigned_agent_id UUID,
    message_count INT DEFAULT 0,
    last_message_at TIMESTAMP,
    last_message_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(channel_id, phone_number)
);

-- Tabla messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL UNIQUE,
    webhook_timestamp BIGINT,
    direction TEXT NOT NULL,
    message_type TEXT NOT NULL,
    body TEXT,
    media_url TEXT,
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_whatsapp_channels_org_id ON whatsapp_channels(org_id);
CREATE INDEX idx_whatsapp_channels_active ON whatsapp_channels(org_id, is_active);
CREATE INDEX idx_conversations_org_id ON conversations(org_id);
CREATE INDEX idx_conversations_channel_id ON conversations(channel_id);
CREATE INDEX idx_conversations_last_message ON conversations(org_id, last_message_at DESC);
CREATE INDEX idx_conversations_state ON conversations(org_id, state);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_org_id ON messages(org_id);
CREATE INDEX idx_messages_created_at ON messages(conversation_id, created_at);

-- Trigger para auto-update conversation
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at,
        last_message_text = SUBSTRING(NEW.body, 1, 100),
        message_count = message_count + 1,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_message();

-- RLS
ALTER TABLE whatsapp_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_channels" ON whatsapp_channels
FOR SELECT USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
));

CREATE POLICY "write_own_channels" ON whatsapp_channels
FOR INSERT WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role = 'OWNER'
));

CREATE POLICY "delete_own_channels" ON whatsapp_channels
FOR DELETE USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role = 'OWNER'
));

CREATE POLICY "read_own_conversations" ON conversations
FOR SELECT USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
));

CREATE POLICY "read_own_messages" ON messages
FOR SELECT USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
));
```

**Validation**:
- `psql` check: `\dt` → ver 3 tablas nuevas
- Índices: `\di` → ver 9 índices
- RLS: `SELECT * FROM pg_policies` → ver 5 policies

---

### Paso 2: Seed Data - Pruebas
**Duración**: 30min  
**Dependencia**: Paso 1

**Archivos**:
- `supabase/seed.sql` (agregar)

**Contenido**:
```sql
-- Get test org (from Sprint 01)
WITH test_org AS (
    SELECT id FROM organizations WHERE slug = 'acme-inc' LIMIT 1
),
test_channel AS (
    INSERT INTO whatsapp_channels (org_id, phone_number, phone_number_id, 
                                    access_token_encrypted, verified_at)
    SELECT id, '+1234567890', 'Phone:123456789',
           pgp_sym_encrypt('test_token_123', 'test_secret'),
           NOW()
    FROM test_org
    RETURNING id, org_id
)
INSERT INTO conversations (org_id, channel_id, phone_number, contact_name, state)
SELECT org_id, id, '+1987654321', 'Test User', 'BOT'
FROM test_channel;

-- Seed messages
WITH conv AS (
    SELECT id, org_id FROM conversations LIMIT 1
)
INSERT INTO messages (conversation_id, org_id, message_id, webhook_timestamp, 
                      direction, message_type, body)
SELECT id, org_id, 'wamid.test123', 1709000000000, 'inbound', 'text', 
       'Hola, necesito ayuda'
FROM conv;
```

**Validation**:
- `SELECT COUNT(*) FROM whatsapp_channels;` → 1
- `SELECT COUNT(*) FROM conversations;` → 1
- `SELECT COUNT(*) FROM messages;` → 1

---

### Paso 3: Audit Table Updates
**Duración**: 30min  
**Dependencia**: Paso 1

**Archivos**:
- `supabase/migrations/0003_sprint02_whatsapp.sql` (extend)

**Contenido**:
```sql
-- Add audit log entries for whatsapp_channels
CREATE OR REPLACE FUNCTION audit_whatsapp_channel_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (org_id, action, table_name, record_id, user_id, details)
        VALUES (NEW.org_id, 'INSERT', 'whatsapp_channels', NEW.id, auth.uid(), 
                jsonb_build_object('phone_number', NEW.phone_number));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (org_id, action, table_name, record_id, user_id, details)
        VALUES (OLD.org_id, 'DELETE', 'whatsapp_channels', OLD.id, auth.uid(), 
                jsonb_build_object('phone_number', OLD.phone_number));
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_whatsapp_channels
AFTER INSERT OR DELETE ON whatsapp_channels
FOR EACH ROW
EXECUTE FUNCTION audit_whatsapp_channel_changes();
```

---

### Paso 4: API - Webhook Endpoint (Backend)
**Duración**: 2.5h  
**Dependencia**: Sprint 01 API + Paso 1

**Archivos**:
- `apps/api-worker/src/routes/webhook.ts` (nuevo)

**Contenido**:
```typescript
import { Router } from 'hono';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const router = new Router();

// Webhook schema (minimal)
const WebhookSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(z.object({
    changes: z.array(z.object({
      value: z.object({
        messages: z.array(z.object({
          from: z.string(),
          id: z.string(),
          timestamp: z.string(),
          text: z.object({ body: z.string() }),
          type: z.literal('text')
        })).optional()
      })
    }))
  }))
});

// Signature validation
function validateSignature(signature: string, body: string, token: string): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', token)
    .update(body)
    .digest('hex');
  return signature === `sha256=${hash}`;
}

// POST /webhook/whatsapp
router.post('/webhook/whatsapp', async (ctx) => {
  try {
    const signature = ctx.req.header('x-hub-signature') || '';
    const body = await ctx.req.text();
    
    // Validate signature
    if (!validateSignature(signature, body, env.WHATSAPP_WEBHOOK_TOKEN)) {
      return ctx.json({ error: 'Invalid signature' }, 403);
    }
    
    const data = JSON.parse(body);
    const parsed = WebhookSchema.parse(data);
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    for (const entry of parsed.entry) {
      for (const change of entry.changes) {
        if (!change.value.messages) continue;
        
        for (const msg of change.value.messages) {
          // Check idempotency
          const existing = await supabase
            .from('messages')
            .select('id')
            .eq('message_id', msg.id)
            .single();
          
          if (existing.data) {
            console.log('Duplicate message:', msg.id);
            continue; // Already processed
          }
          
          // Find channel
          const channel = await supabase
            .from('whatsapp_channels')
            .select('id, org_id')
            .eq('phone_number_id', 'Phone:123')  // TODO: extract from webhook
            .single();
          
          if (!channel.data) {
            console.error('Channel not found');
            continue;
          }
          
          // Find or create conversation
          let conv = await supabase
            .from('conversations')
            .select('id')
            .eq('channel_id', channel.data.id)
            .eq('phone_number', msg.from)
            .single();
          
          if (!conv.data) {
            conv = await supabase
              .from('conversations')
              .insert({
                org_id: channel.data.org_id,
                channel_id: channel.data.id,
                phone_number: msg.from,
                state: 'BOT'
              })
              .select()
              .single();
          }
          
          // Insert message
          await supabase.from('messages').insert({
            conversation_id: conv.data?.id || conv.data.id,
            org_id: channel.data.org_id,
            message_id: msg.id,
            webhook_timestamp: parseInt(msg.timestamp) * 1000,
            direction: 'inbound',
            message_type: 'text',
            body: msg.text.body
          });
        }
      }
    }
    
    return ctx.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    // Still return 200 to not retry
    return ctx.json({ error: 'Processing error' }, 200);
  }
});

export { router as webhookRouter };
```

**Integration** (`index.ts`):
```typescript
import { webhookRouter } from './routes/webhook';

app.route('/webhook', webhookRouter);
```

**Tests**:
- Mock webhook signature
- Validate idempotency (send 2x, check 1 message)
- Validate RLS (no cross-org access)

---

### Paso 5: API - WhatsApp Channels Endpoint (Backend)
**Duración**: 1.5h  
**Dependencia**: Paso 1, Paso 4

**Archivos**:
- `apps/api-worker/src/routes/whatsapp.ts` (nuevo)

**Contenido**:
```typescript
import { Router } from 'hono';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { getOrgId, requireRole, apiError } from '../middleware';

const router = new Router();

const ChannelSchema = z.object({
  phone_number_id: z.string().min(1),
  access_token: z.string().min(10)
});

// GET /orgs/:orgId/whatsapp/channels
router.get('/orgs/:orgId/whatsapp/channels', getOrgId, requireRole(['OWNER', 'AGENT']), async (ctx) => {
  const orgId = ctx.get('orgId');
  const supabase = ctx.get('supabase');
  
  const { data, error } = await supabase
    .from('whatsapp_channels')
    .select('id, phone_number, phone_number_id, verified_at, is_active, created_at')
    .eq('org_id', orgId);
  
  if (error) return apiError(ctx, 500, 'DB_ERROR');
  
  return ctx.json({ data: data || [] });
});

// POST /orgs/:orgId/whatsapp/channels
router.post('/orgs/:orgId/whatsapp/channels', getOrgId, requireRole(['OWNER']), async (ctx) => {
  const orgId = ctx.get('orgId');
  const supabase = ctx.get('supabase');
  
  const body = await ctx.req.json();
  const parsed = ChannelSchema.parse(body);
  
  // TODO: Validate token + phone_number_id against WhatsApp API
  
  // Check uniqueness
  const existing = await supabase
    .from('whatsapp_channels')
    .select('id')
    .eq('org_id', orgId)
    .eq('phone_number_id', parsed.phone_number_id)
    .single();
  
  if (existing.data) {
    return apiError(ctx, 400, 'PHONE_DUPLICATE', 'Phone number already registered');
  }
  
  // Encrypt token (or use pgcrypto server-side)
  const encrypted = Buffer.from(parsed.access_token).toString('base64'); // TODO: proper encryption
  
  const { data, error } = await supabase
    .from('whatsapp_channels')
    .insert({
      org_id: orgId,
      phone_number: '+1234567890', // TODO: extract from WhatsApp
      phone_number_id: parsed.phone_number_id,
      access_token_encrypted: encrypted,
      verified_at: new Date()
    })
    .select()
    .single();
  
  if (error) return apiError(ctx, 500, 'DB_ERROR');
  
  // Audit log
  await supabase.from('audit_logs').insert({
    org_id: orgId,
    action: 'INSERT',
    table_name: 'whatsapp_channels',
    record_id: data.id
  });
  
  return ctx.json({ data }, 201);
});

export { router as whatsappRouter };
```

**Integration** (`index.ts`):
```typescript
import { whatsappRouter } from './routes/whatsapp';

app.route('/', whatsappRouter);
```

---

### Paso 6: API - Inbox Endpoints (Backend)
**Duración**: 2h  
**Dependencia**: Paso 1, Sprint 01 API

**Archivos**:
- `apps/api-worker/src/routes/inbox.ts` (nuevo)

**Contenido**:
```typescript
import { Router } from 'hono';
import { z } from 'zod';
import { getOrgId, requireRole, apiError } from '../middleware';

const router = new Router();

const InboxQuerySchema = z.object({
  state: z.enum(['BOT', 'HUMAN', 'PENDING']).optional(),
  page: z.number().int().gte(1).default(1),
  limit: z.number().int().gte(1).lte(100).default(20)
});

// GET /orgs/:orgId/inbox
router.get('/orgs/:orgId/inbox', getOrgId, requireRole(['OWNER', 'AGENT']), async (ctx) => {
  const orgId = ctx.get('orgId');
  const supabase = ctx.get('supabase');
  
  const qs = InboxQuerySchema.parse(ctx.req.query());
  const offset = (qs.page - 1) * qs.limit;
  
  let query = supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId);
  
  if (qs.state) {
    query = query.eq('state', qs.state);
  }
  
  const { data, count, error } = await query
    .order('last_message_at', { ascending: false })
    .range(offset, offset + qs.limit - 1);
  
  if (error) return apiError(ctx, 500, 'DB_ERROR');
  
  return ctx.json({
    data: data || [],
    pagination: {
      page: qs.page,
      limit: qs.limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / qs.limit)
    }
  });
});

// GET /orgs/:orgId/inbox/:convId/messages
router.get('/orgs/:orgId/inbox/:convId/messages', getOrgId, requireRole(['OWNER', 'AGENT']), async (ctx) => {
  const orgId = ctx.get('orgId');
  const convId = ctx.req.param('convId');
  const supabase = ctx.get('supabase');
  
  const qs = z.object({ page: z.number().default(1), limit: z.number().default(50) }).parse({
    page: parseInt(ctx.req.query('page') || '1'),
    limit: parseInt(ctx.req.query('limit') || '50')
  });
  
  const offset = (qs.page - 1) * qs.limit;
  
  // Verify org access
  const conv = await supabase
    .from('conversations')
    .select('org_id')
    .eq('id', convId)
    .single();
  
  if (!conv.data || conv.data.org_id !== orgId) {
    return apiError(ctx, 403, 'FORBIDDEN');
  }
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('webhook_timestamp', { ascending: true })
    .range(offset, offset + qs.limit - 1);
  
  if (error) return apiError(ctx, 500, 'DB_ERROR');
  
  return ctx.json({ data: data || [] });
});

export { router as inboxRouter };
```

**Integration** (`index.ts`):
```typescript
import { inboxRouter } from './routes/inbox';

app.route('/', inboxRouter);
```

---

### Paso 7: API - Middleware + Error Handling
**Duración**: 1h  
**Dependencia**: Sprint 01 middleware

**Archivos**:
- `apps/api-worker/src/middleware/auth.ts` (update)

**Contenido** (already exists, ensure no changes needed)

---

### Paso 8: Web - Components UI (Frontend)
**Duración**: 2h  
**Dependencia**: Sprint 01 UI + Paso 6

**Archivos**:
- `packages/ui/src/ConversationList.tsx` (nuevo)
- `packages/ui/src/ChatTimeline.tsx` (nuevo)
- `packages/ui/src/ChannelForm.tsx` (nuevo)

**ConversationList.tsx**:
```tsx
import React from 'react';
import { Card, Badge } from './index';

interface Conversation {
  id: string;
  phone_number: string;
  contact_name?: string;
  state: 'BOT' | 'HUMAN' | 'PENDING';
  last_message_text?: string;
  last_message_at?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onFilter?: (state: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onFilter
}: ConversationListProps) {
  return (
    <div className="divide-y divide-gray-700">
      {conversations.map(conv => (
        <div
          key={conv.id}
          onClick={() => onSelect?.(conv.id)}
          className={`p-3 cursor-pointer hover:bg-gray-700 transition ${
            selectedId === conv.id ? 'bg-gray-700' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="font-semibold text-sm">{conv.phone_number}</p>
            <Badge variant={conv.state === 'BOT' ? 'primary' : 'destructive'}>
              {conv.state}
            </Badge>
          </div>
          {conv.contact_name && (
            <p className="text-xs text-gray-400 mt-1">{conv.contact_name}</p>
          )}
          {conv.last_message_text && (
            <p className="text-sm text-gray-300 truncate mt-2">{conv.last_message_text}</p>
          )}
          {conv.last_message_at && (
            <p className="text-xs text-gray-500 mt-1">{new Date(conv.last_message_at).toLocaleTimeString()}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### Paso 9: Web - Pages (Frontend)
**Duración**: 2h  
**Dependencia**: Paso 8 + Paso 6

**Archivos**:
- `apps/web/src/pages/ChannelsPage.tsx` (nuevo)
- `apps/web/src/pages/InboxPage.tsx` (nuevo)

---

### Paso 10: Web - API Client (Frontend)
**Duración**: 1h  
**Dependencia**: Sprint 01 API client + Paso 6

**Archivos**:
- `apps/web/src/utils/api.ts` (update)

**Métodos nuevos**:
```typescript
async getChannels(orgId: string) { }
async createChannel(orgId: string, data: {phone_number_id, access_token}) { }
async getInbox(orgId: string, filters?: {state, page, limit}) { }
async getMessages(orgId: string, convId: string, page?: number) { }
```

---

### Paso 11: Integration E2E + Testing
**Duración**: 2h  
**Dependencia**: Pasos 1-10

**Pasos**:
1. Deploy migration a Supabase
2. Run seed data
3. Manual test: POST webhook (signature + idempotency)
4. Manual test: GET /inbox (RLS)
5. Manual test: Web UI (load inbox, seleccionar chat)
6. E2E test: login → inbox → chat flow

---

## 🔄 Sequence Diagram: Webhook Flow

```
User (WhatsApp)
       │
       │ sends message
       ▼
WhatsApp Cloud API
       │
       │ POST /webhook/whatsapp
       ▼
Cloudflare Worker
       │
       ├─1. Validate signature (HMAC-SHA256)
       │
       ├─2. Check idempotency (message_id EXISTS?)
       │   └─ YES: return 200 OK
       │   └─ NO: continue
       │
       ├─3. Find channel (by phone_number_id)
       │   └─ NOT FOUND: log error, return 200 OK
       │
       ├─4. Find or create conversation
       │   └─ CREATE if new (state='BOT')
       │
       ├─5. INSERT message ────┐
       │                        ▼
       │                    Supabase PostgreSQL
       │                        │
       │                        ├─ INSERT message
       │                        │
       │                        ├─ TRIGGER: update_conversation_on_message
       │                        │  (update last_message_at, message_count)
       │                        │
       │                        └─ TRIGGER: audit_whatsapp_channel_changes
       │                           (log INSERT to audit_logs)
       │
       ├─6. Return 200 OK ────────────────────────────┐
       │                                               ▼
       └─────────────────────────► WhatsApp (retries if 5xx)
     (async processing in background)

[Meanwhile] Agent opens web app
       │
       ├─ GET /orgs/:id/inbox
       │  └─ Supabase: SELECT conversations WHERE org_id = $1
       │     └─ RLS checks: user in org_members
       │
       └─ React renders ConversationList
          └─ Message appears in real-time (polling or WebSocket)
```

---

## ✅ Dependency Graph

```
Migration (Paso 1)
    ↓
Seed (Paso 2)
    ↓
Audit (Paso 3)
    ├─ Webhook Endpoint (Paso 4) ◄─ Middleware (Paso 7)
    ├─ Channels API (Paso 5)
    └─ Inbox API (Paso 6) ◄─ RLS (from Paso 1)
            ↓
    UI Components (Paso 8)
            ↓
    Web Pages (Paso 9)
            ↓
    API Client (Paso 10)
            ↓
    E2E Tests (Paso 11)
```

---

## 📋 Validation Checklist

### Database
- [ ] Tables created (whatsapp_channels, conversations, messages)
- [ ] Indices created (9 total)
- [ ] RLS policies enabled + tested
- [ ] Triggers working (update_conversation, audit)
- [ ] Seed data inserted (1 channel, 1 conversation, 1 message)

### API
- [ ] Webhook endpoint validates signature
- [ ] Webhook endpoint is idempotent (send 2x, 1 message saved)
- [ ] Webhook routes message to correct org (RLS)
- [ ] GET /channels returns only org's channels
- [ ] POST /channels validates token before saving
- [ ] GET /inbox filters by state + pagination
- [ ] GET /inbox/:id/messages returns ordered messages
- [ ] All endpoints have proper error handling (4xx, 5xx)
- [ ] All endpoints return 200 OK for webhook (async)

### Web
- [ ] ChannelsPage is available (route exists)
- [ ] ConversationList renders items
- [ ] ChatTimeline renders messages in order
- [ ] Navigate: Inbox → Chat works
- [ ] Filter by state works
- [ ] RLS prevents cross-org access

### Tests
- [ ] Lint passes (0 errors)
- [ ] TypeScript strict mode (0 errors)
- [ ] Unit tests: signature validation
- [ ] Unit tests: idempotency
- [ ] E2E test: login → inbox → chat
- [ ] Build succeeds

---

## 📊 Files Count

| Category | Count | Status |
|----------|-------|--------|
| Migrations | 1 file | Paso 1 |
| API Routes | 4 files | Pasos 4-7 |
| UI Components | 3 files | Paso 8 |
| Web Pages | 2 files | Paso 9 |
| Tests | 5+ files | Paso 11 |
| **Total** | **~15+ files** | Plan |

---

## 🚀 Post-Implementation

### Deployment Sequence
1. Push migration to Supabase (`pnpm db:migrate`)
2. Run seed (`supabase seed reseed`)
3. Deploy API worker (`pnpm deploy:api`)
4. Deploy web app (`pnpm deploy:web`)
5. Test webhook (curl mock request)

### Production Checklist
- [ ] WHATSAPP_WEBHOOK_TOKEN = generated secret (GitHub secret)
- [ ] Access token encryption keys rotated
- [ ] Rate limiting enabled (10 req/s)
- [ ] Monitoring + alerting on webhook errors
- [ ] Backups enabled for PostgreSQL
- [ ] RLS policies reviewed + tested

