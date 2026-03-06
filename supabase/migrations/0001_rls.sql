-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to determine if user is Super Admin
-- This relies on the JWT having app_role = 'super_admin' 
-- OR an env-driven query (but typical RLS prefers JWT claims)
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb ->> 'app_role') = 'super_admin';
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper to check if user belongs to an org
CREATE OR REPLACE FUNCTION is_org_member(check_org_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_id = check_org_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Organizations Policy: Super admins see all. Members see their own.
CREATE POLICY "Super admins can view all organizations" ON organizations FOR SELECT USING (is_super_admin());
CREATE POLICY "Members can view their own organization" ON organizations FOR SELECT USING (is_org_member(id));

-- Org Members Policy: Super admins view all. Members view members of their own org.
CREATE POLICY "Super admins view all members" ON org_members FOR SELECT USING (is_super_admin());
CREATE POLICY "Members view peers" ON org_members FOR SELECT USING (is_org_member(org_id));

-- Bots Policy
CREATE POLICY "Super admins view all bots" ON bots FOR ALL USING (is_super_admin());
CREATE POLICY "Members view their org bots" ON bots FOR SELECT USING (is_org_member(org_id));
CREATE POLICY "Members can update their org bots" ON bots FOR UPDATE USING (is_org_member(org_id));

-- Configs Policy
CREATE POLICY "Super admins manage configs" ON configs FOR ALL USING (is_super_admin());
CREATE POLICY "Members read org configs" ON configs FOR SELECT USING (is_org_member(org_id));

-- Audit Logs Policy
CREATE POLICY "Super admins read audit logs" ON audit_logs FOR SELECT USING (is_super_admin());
CREATE POLICY "Members read own org logs" ON audit_logs FOR SELECT USING (is_org_member(org_id));
CREATE POLICY "Insert audit logs universally" ON audit_logs FOR INSERT WITH CHECK (is_super_admin() OR is_org_member(org_id));
