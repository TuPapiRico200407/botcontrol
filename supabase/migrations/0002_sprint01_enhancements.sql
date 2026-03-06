-- SPRINT 01: Enhancement of Auth & RBAC Schema
-- This migration updates tables to support full Sprint 01 requirements

-- 1. Update organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Rename status to active (if status still exists, migrate and drop)
UPDATE organizations SET active = (status = 'active') WHERE status IS NOT NULL;
ALTER TABLE organizations DROP COLUMN IF EXISTS status;

-- 2. Update org_members table
ALTER TABLE org_members
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Rename status/role fields to match Sprint 01 spec
ALTER TABLE org_members
RENAME COLUMN status TO active;

UPDATE org_members 
SET active = (active::TEXT = 'active' OR active IS NULL) 
WHERE active IS NOT NULL;

-- Ensure role is OWNER or AGENT
UPDATE org_members SET role = 'OWNER' WHERE role = 'owner';
UPDATE org_members SET role = 'AGENT' WHERE role = 'agent' OR role = 'member' OR role NOT IN ('OWNER', 'AGENT');

-- 3. Update bots table
ALTER TABLE bots
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Rename prompt_base to prompt
ALTER TABLE bots RENAME COLUMN prompt_base TO prompt;

-- Set default names
UPDATE bots SET name = 'Default Bot' WHERE name IS NULL;

-- 4. Ensure audit_logs has all required fields (already mostly there)
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS entity_type TEXT,
ADD COLUMN IF NOT EXISTS old_value JSONB,
ADD COLUMN IF NOT EXISTS new_value JSONB,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Migrate action → action + entity_type
UPDATE audit_logs 
SET entity_type = 
  CASE 
    WHEN action LIKE 'org_%' THEN 'organization'
    WHEN action LIKE 'member_%' THEN 'org_member'
    WHEN action LIKE 'bot_%' THEN 'bot'
    ELSE 'unknown'
  END
WHERE entity_type IS NULL;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bots_org_id ON bots(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(created_at DESC);

-- 6. Create audit_log trigger function
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      org_id, actor_user_id, action, entity_type, entity_id, 
      new_value, description, created_at
    ) VALUES (
      NEW.org_id,
      auth.uid(),
      'create_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      NEW.id::TEXT,
      row_to_json(NEW),
      'Created ' || TG_TABLE_NAME,
      now()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      org_id, actor_user_id, action, entity_type, entity_id,
      old_value, new_value, description, created_at
    ) VALUES (
      NEW.org_id,
      auth.uid(),
      'update_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      NEW.id::TEXT,
      row_to_json(OLD),
      row_to_json(NEW),
      'Updated ' || TG_TABLE_NAME,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Refresh RLS policies
DROP POLICY IF EXISTS "Super admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Members can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Super admins view all members" ON org_members;
DROP POLICY IF EXISTS "Members view peers" ON org_members;

-- New policies for Sprint 01
CREATE POLICY "orgs_super_admin_select" ON organizations FOR SELECT 
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'app_role') = 'super_admin'
  );

CREATE POLICY "orgs_member_select" ON organizations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_id = organizations.id 
        AND user_id = auth.uid()
        AND active = true
    )
  );

CREATE POLICY "members_super_admin" ON org_members FOR ALL 
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'app_role') = 'super_admin'
  );

CREATE POLICY "members_org_peer" ON org_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_members.org_id 
        AND m.user_id = auth.uid()
        AND m.active = true
    )
  );

-- 8. Ensure bots and audit_logs have up-to-date policies
DROP POLICY IF EXISTS "Super admins view all bots" ON bots;
DROP POLICY IF EXISTS "Members view their org bots" ON bots;
DROP POLICY IF EXISTS "Members can update their org bots" ON bots;

CREATE POLICY "bots_super_admin" ON bots FOR ALL 
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'app_role') = 'super_admin'
  );

CREATE POLICY "bots_member_select" ON bots FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_id = bots.org_id 
        AND user_id = auth.uid()
        AND active = true
    )
  );

CREATE POLICY "bots_member_update" ON bots FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = bots.org_id 
        AND m.user_id = auth.uid()
        AND m.active = true
    )
  );

DROP POLICY IF EXISTS "Super admins read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Members read own org logs" ON audit_logs;
DROP POLICY IF EXISTS "Insert audit logs universally" ON audit_logs;

CREATE POLICY "audit_super_admin" ON audit_logs FOR SELECT 
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'app_role') = 'super_admin'
  );

CREATE POLICY "audit_member" ON audit_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_id = audit_logs.org_id 
        AND user_id = auth.uid()
        AND active = true
    )
  );

CREATE POLICY "audit_insert" ON audit_logs FOR INSERT 
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'app_role') = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_id = audit_logs.org_id 
        AND user_id = auth.uid()
    )
  );

-- Done
