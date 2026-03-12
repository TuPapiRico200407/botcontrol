-- SPRINT 02: WhatsApp Integration Schema
-- Creates: whatsapp_channels, conversations, messages
-- Requires: organizations, org_members (Sprint 01)

-- Extension pgcrypto (para token encryption)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLES
-- ============================================================

-- Tabla whatsapp_channels
CREATE TABLE IF NOT EXISTS whatsapp_channels (
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

-- Tabla conversations
CREATE TABLE IF NOT EXISTS conversations (
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, phone_number)
);

-- Tabla messages
CREATE TABLE IF NOT EXISTS messages (
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
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_whatsapp_channels_org_id ON whatsapp_channels(org_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_channels_active ON whatsapp_channels(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_conversations_channel_id ON conversations(channel_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(org_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_state ON conversations(org_id, state);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON messages(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update conversation when message is inserted
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = COALESCE(
            to_timestamp(NEW.webhook_timestamp / 1000.0),
            NOW()
        ),
        last_message_text = SUBSTRING(NEW.body, 1, 100),
        message_count = message_count + 1,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
CREATE TRIGGER trigger_update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Audit log for whatsapp_channel changes
CREATE OR REPLACE FUNCTION audit_whatsapp_channel_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (org_id, actor_user_id, action, entity_type, entity_id, new_value, description, created_at)
        VALUES (
            NEW.org_id,
            auth.uid(),
            'create_whatsapp_channel',
            'whatsapp_channel',
            NEW.id::TEXT,
            jsonb_build_object('phone_number', NEW.phone_number, 'phone_number_id', NEW.phone_number_id),
            'Created WhatsApp channel: ' || NEW.phone_number,
            NOW()
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (org_id, actor_user_id, action, entity_type, entity_id, old_value, new_value, description, created_at)
        VALUES (
            NEW.org_id,
            auth.uid(),
            'update_whatsapp_channel',
            'whatsapp_channel',
            NEW.id::TEXT,
            jsonb_build_object('is_active', OLD.is_active, 'phone_number', OLD.phone_number),
            jsonb_build_object('is_active', NEW.is_active, 'phone_number', NEW.phone_number),
            'Updated WhatsApp channel: ' || NEW.phone_number,
            NOW()
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (org_id, actor_user_id, action, entity_type, entity_id, old_value, description, created_at)
        VALUES (
            OLD.org_id,
            auth.uid(),
            'delete_whatsapp_channel',
            'whatsapp_channel',
            OLD.id::TEXT,
            jsonb_build_object('phone_number', OLD.phone_number),
            'Deleted WhatsApp channel: ' || OLD.phone_number,
            NOW()
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_whatsapp_channels ON whatsapp_channels;
CREATE TRIGGER audit_whatsapp_channels
AFTER INSERT OR UPDATE OR DELETE ON whatsapp_channels
FOR EACH ROW EXECUTE FUNCTION audit_whatsapp_channel_changes();

-- Auto-update updated_at on conversations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_channels_updated_at ON whatsapp_channels;
CREATE TRIGGER update_whatsapp_channels_updated_at
BEFORE UPDATE ON whatsapp_channels
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE whatsapp_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- whatsapp_channels: super_admin full access
CREATE POLICY "wc_super_admin" ON whatsapp_channels FOR ALL
  USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'app_role') = 'super_admin');

-- whatsapp_channels: members can read their org's channels
CREATE POLICY "wc_member_select" ON whatsapp_channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = whatsapp_channels.org_id
        AND user_id = auth.uid()
        AND active = true
    )
  );

-- whatsapp_channels: only OWNER can insert/update/delete
CREATE POLICY "wc_owner_write" ON whatsapp_channels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = whatsapp_channels.org_id
        AND user_id = auth.uid()
        AND role = 'OWNER'
        AND active = true
    )
  );

CREATE POLICY "wc_owner_update" ON whatsapp_channels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = whatsapp_channels.org_id
        AND user_id = auth.uid()
        AND role = 'OWNER'
        AND active = true
    )
  );

CREATE POLICY "wc_owner_delete" ON whatsapp_channels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = whatsapp_channels.org_id
        AND user_id = auth.uid()
        AND role = 'OWNER'
        AND active = true
    )
  );

-- conversations: super_admin full access
CREATE POLICY "conv_super_admin" ON conversations FOR ALL
  USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'app_role') = 'super_admin');

-- conversations: members can read their org's conversations
CREATE POLICY "conv_member_select" ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = conversations.org_id
        AND user_id = auth.uid()
        AND active = true
    )
  );

-- conversations: members can update (for state changes, assignment)
CREATE POLICY "conv_member_update" ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = conversations.org_id
        AND user_id = auth.uid()
        AND active = true
    )
  );

-- conversations: service role can insert (webhook)
CREATE POLICY "conv_service_insert" ON conversations FOR INSERT
  WITH CHECK (true); -- controlled by service_role key in Cloudflare Worker

-- messages: super_admin full access
CREATE POLICY "msg_super_admin" ON messages FOR ALL
  USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'app_role') = 'super_admin');

-- messages: members can read their org's messages
CREATE POLICY "msg_member_select" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = messages.org_id
        AND user_id = auth.uid()
        AND active = true
    )
  );

-- messages: service role can insert (webhook + outbound)
CREATE POLICY "msg_service_insert" ON messages FOR INSERT
  WITH CHECK (true); -- controlled by service_role key

-- Done
