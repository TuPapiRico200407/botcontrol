-- CLEAR OLD TABLES
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS bots CASCADE;
DROP TABLE IF EXISTS configs CASCADE;
DROP TABLE IF EXISTS org_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS whatsapp_channels CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_tags CASCADE;
DROP TABLE IF EXISTS conversation_notes CASCADE;
DROP TABLE IF EXISTS media_jobs CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CORE SPRINT 01
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'AGENT',
  active BOOLEAN DEFAULT true,
  invited_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE TABLE bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Default Bot',
  prompt TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'cerebras-llama3',
  temperature NUMERIC NOT NULL DEFAULT 0.7,
  active BOOLEAN DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  value_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WHATSAPP SPRINT 02
CREATE TABLE whatsapp_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    phone_number_id TEXT NOT NULL,
    business_account_id TEXT,
    access_token_encrypted TEXT NOT NULL DEFAULT '',
    webhook_verify_token TEXT,
    verified_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, phone_number),
    UNIQUE(org_id, phone_number_id)
);

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES whatsapp_channels(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    contact_name TEXT,
    state TEXT NOT NULL DEFAULT 'BOT' CHECK (state IN ('BOT', 'HUMAN', 'PENDING')),
    assigned_agent_id UUID,
    message_count INT DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    last_message_text TEXT,
    override_bot_id UUID REFERENCES bots(id) ON DELETE SET NULL,
    override_model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, phone_number)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL UNIQUE,
    webhook_timestamp BIGINT,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type TEXT NOT NULL DEFAULT 'text',
    body TEXT,
    media_url TEXT,
    media_mime_type TEXT,
    media_storage_path TEXT,
    extracted_text TEXT,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    ia_tokens_used INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SPRINT 03 HUMAN OPS
CREATE TABLE conversation_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    UNIQUE(conversation_id, tag_name)
);

CREATE TABLE conversation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SPRINT 04 MEDIA & HEALTH
CREATE TABLE media_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'DONE', 'FAILED')),
    error_message TEXT,
    storage_path TEXT,
    extracted_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    severity TEXT NOT NULL DEFAULT 'ERROR' CHECK (severity IN ('WARNING', 'ERROR', 'CRITICAL')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB,
    processed_successfully BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_org_members_org_user ON org_members(org_id, user_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(org_id);
CREATE INDEX idx_whatsapp_channels_org ON whatsapp_channels(org_id);
CREATE INDEX idx_conversations_org ON conversations(org_id);
CREATE INDEX idx_messages_conv ON messages(conversation_id);
CREATE INDEX idx_conversation_tags_conv ON conversation_tags(conversation_id);
CREATE INDEX idx_media_jobs_status ON media_jobs(status);
CREATE INDEX idx_error_logs_org ON error_logs(org_id);

-- TRIGGER updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_members_updated_at BEFORE UPDATE ON org_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON bots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_channels_updated_at BEFORE UPDATE ON whatsapp_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SEED THE USER
INSERT INTO public.organizations (name, slug) VALUES ('Mi Empresa', 'mi-empresa') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.org_members (user_id, org_id, role, active, activated_at) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'maironcamilovargascastellon@gmail.com' LIMIT 1),
  (SELECT id FROM public.organizations WHERE slug = 'mi-empresa' LIMIT 1),
  'OWNER',
  true,
  NOW()
)
ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'OWNER', active = true, activated_at = NOW();
