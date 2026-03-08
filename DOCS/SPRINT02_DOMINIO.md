# SPRINT02_DOMINIO.md

## 🗄️ Data Model - WhatsApp Integration

### Overview
Sprint 02 introduce 3 nuevas tablas + RLS para WhatsApp channels, conversations y messages.

---

## 📊 Tablas Nuevas

### 1. `whatsapp_channels`
Registra números WhatsApp conectados por empresa.

```sql
CREATE TABLE whatsapp_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- WhatsApp identifiers
    phone_number TEXT NOT NULL,                    -- e.g. "+1234567890"
    phone_number_id TEXT NOT NULL,                 -- from WhatsApp Cloud API
    business_account_id TEXT,                      -- optional, WABA ID
    access_token_encrypted BYTEA NOT NULL,         -- encrypted with org secret
    
    -- Status
    verified_at TIMESTAMP,                         -- null = not yet verified
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(org_id, phone_number),
    UNIQUE(org_id, phone_number_id)
);

CREATE INDEX idx_whatsapp_channels_org_id ON whatsapp_channels(org_id);
CREATE INDEX idx_whatsapp_channels_active ON whatsapp_channels(org_id, is_active);
```

**Columnas clave**:
- `access_token_encrypted`: Token de WhatsApp (NEVER guardar plaintext)
- `verified_at`: Timestamp de la última validación exitosa
- `is_active`: Soft delete / disable canal

**Seguridad**:
- Cifrar `access_token` con `pgcrypto` o aplicación
- RLS: solo owner/super_admin ven canales de su org

---

### 2. `conversations`
Agrupa mensajes de una conversación (chat) con un usuario por número.

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES whatsapp_channels(id) ON DELETE CASCADE,
    
    -- Sender identifier
    phone_number TEXT NOT NULL,         -- incoming from number
    contact_name TEXT,                  -- name from WhatsApp (if available)
    
    -- Conversation state
    state TEXT NOT NULL DEFAULT 'BOT',  -- 'BOT', 'HUMAN', 'PENDING'
    assigned_agent_id UUID,             -- null = unassigned (Sprint 03)
    
    -- Metadata
    message_count INT DEFAULT 0,
    last_message_at TIMESTAMP,
    last_message_text TEXT,             -- denormalized for quick preview
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(channel_id, phone_number)
);

CREATE INDEX idx_conversations_org_id ON conversations(org_id);
CREATE INDEX idx_conversations_channel_id ON conversations(channel_id);
CREATE INDEX idx_conversations_last_message ON conversations(org_id, last_message_at DESC);
CREATE INDEX idx_conversations_state ON conversations(org_id, state);
```

**Columnas clave**:
- `state`: 'BOT' = respondiendo bot, 'HUMAN' = espera agente, 'PENDING' = transición
- `assigned_agent_id`: null en Sprint 02 (se usa en Sprint 03)
- `last_message_at` + `last_message_text`: para preview rápido en inbox

**Triggers**:
```sql
-- Auto-update updated_at on message insert
CREATE TRIGGER update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Function
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at,
        last_message_text = SUBSTRING(NEW.body, 1, 100),
        message_count = message_count + 1
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 3. `messages`
Almacena cada mensaje individual de una conversación.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- WhatsApp identifiers
    message_id TEXT NOT NULL,            -- from WhatsApp (idempotency)
    webhook_timestamp BIGINT,            -- timestamp from webhook
    
    -- Message content
    direction TEXT NOT NULL,             -- 'inbound', 'outbound'
    message_type TEXT NOT NULL,          -- 'text' (Sprint 02), later 'image', 'audio', etc
    body TEXT,                           -- message text (null for media)
    media_url TEXT,                      -- for future use
    
    -- Processing
    processed_at TIMESTAMP,              -- when we finish handling
    error_message TEXT,                  -- if processing failed
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(message_id)  -- prevent duplicates
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_org_id ON messages(org_id);
CREATE INDEX idx_messages_created_at ON messages(conversation_id, created_at);
```

**Columnas clave**:
- `message_id`: From WhatsApp (unique global), prevents duplicates
- `direction`: 'inbound' = usuario hacia bot, 'outbound' = bot/agent hacia usuario
- `webhook_timestamp`: Timestamp from WhatsApp (not our server time)
- `processed_at`: Null mientras se procesa, set cuando OK

---

## 🔐 RLS (Row Level Security)

### Policy for `whatsapp_channels`

```sql
-- OWNER/AGENT can read channels of their org
CREATE POLICY "read_own_channels" ON whatsapp_channels
FOR SELECT USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
));

-- OWNER can insert/update/delete channels of their org
CREATE POLICY "manage_own_channels" ON whatsapp_channels
FOR ALL USING (
    org_id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid() AND role = 'OWNER'
    )
);

-- SUPER_ADMIN can do anything
CREATE POLICY "admin_channels" ON whatsapp_channels
FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN')
);
```

### Policy for `conversations` + `messages`

```sql
-- AGENT/OWNER read own org
CREATE POLICY "read_own_conversations" ON conversations
FOR SELECT USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
));

CREATE POLICY "read_own_messages" ON messages
FOR SELECT USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
));

-- ADMIN can do anything
CREATE POLICY "admin_conversations" ON conversations
FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN')
);
```

---

## 📈 Data Flow

```
WhatsApp User sends message
       ↓
WhatsApp Cloud API
       ↓
POST /webhook/whatsapp (with signature)
       ↓
Validate signature + auth token
       ↓
Extract: from_phone, message_id, body, timestamp
       ↓
Query: conversation exists?
       ├─ YES: update last_message_at
       └─ NO: create new
       ↓
Insert message into messages table
       ↓
Trigger: update_conversation_timestamp
       ↓
Return 200 OK
       ↓
(Optional) Process with AI / route (Sprint 03+)
```

---

## 🔄 Encryption Strategy

### Access Token Encryption

**Why**: WhatsApp tokens allow reading all messages + sending as bot. Must encrypt.

**How**:
1. Generate encryption key per ORG (or global)
2. Use PostgreSQL `pgcrypto` extension:

```sql
-- Insert with encryption
INSERT INTO whatsapp_channels (org_id, phone_number, phone_number_id, access_token_encrypted)
VALUES (
    'org-id',
    '+1234567890',
    'phone-id',
    pgp_sym_encrypt('sk_live_xxxxx', 'org-secret-key')
);

-- Retrieve + decrypt (APP SIDE)
SELECT 
    pgp_sym_decrypt(access_token_encrypted::bytea, 'org-secret-key') AS access_token
FROM whatsapp_channels
WHERE id = 'channel-id';
```

**Alternative**: Encryption en aplicación (Cloudflare Workers) antes de guardar.

---

## 🧪 Seed Data (Testing)

```sql
-- Test org (from Sprint 01)
INSERT INTO whatsapp_channels (org_id, phone_number, phone_number_id, access_token_encrypted, verified_at)
VALUES (
    (SELECT id FROM organizations WHERE slug = 'acme-inc'),
    '+1234567890',
    'Phone:123456789',
    pgp_sym_encrypt('test_token_123', 'test_org_secret'),
    NOW()
);

-- Test conversations
INSERT INTO conversations (org_id, channel_id, phone_number, contact_name, state)
VALUES (
    (SELECT id FROM organizations WHERE slug = 'acme-inc'),
    (SELECT id FROM whatsapp_channels LIMIT 1),
    '+1987654321',
    'John Doe',
    'BOT'
);

-- Test messages
INSERT INTO messages (conversation_id, org_id, message_id, webhook_timestamp, direction, message_type, body)
VALUES (
    (SELECT id FROM conversations LIMIT 1),
    (SELECT org_id FROM conversations LIMIT 1),
    'wamid.HBEUGBZBCkFBAFBIgQJHJXcVOXc3MWYB',
    1709000000000,
    'inbound',
    'text',
    'Hola, necesito ayuda con mi pedido'
);
```

---

## 📋 Relaciones ER

```
organizations
    ↓ (1:N)
whatsapp_channels
    ↓ (1:N)
conversations
    ↓ (1:N)
messages

+ org_members linked to organizations (1:N)
+ RLS checks org_members.org_id == resource.org_id
```

---

## ✅ Validation Rules

| Field | Rule | Error |
|-------|------|-------|
| `phone_number` | E.164 format + unique/org | "Invalid phone number" |
| `phone_number_id` | Not empty | "Phone ID required" |
| `access_token_encrypted` | Length > 10 | "Invalid token" |
| `direction` | 'inbound' OR 'outbound' | "Invalid direction" |
| `message_type` | 'text' (Sprint 02) | "Unsupported type" |

