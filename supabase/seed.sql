-- SPRINT 01 SEED DATA
-- Populate demo organization, users, roles, bots, and audit logs

-- Super Admin user (reference)
-- NOTE: For auth.users, use Supabase CLI or Auth API outside this script
-- This is the UID used by super_admin JWTs
-- Example UID: 00000000-0000-0000-0000-000000000001 (placeholder)

-- 1. Create demo organization
INSERT INTO organizations (id, name, slug, active, created_by, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Acme Inc',
  'acme-inc',
  true,
  '00000000-0000-0000-0000-000000000001'::uuid,  -- super_admin UID
  now(),
  now()
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Create default bot for organization
INSERT INTO bots (id, org_id, name, prompt, model, temperature, active, created_at, updated_at, updated_by)
SELECT 
  '660e8400-e29b-41d4-a716-446655440000'::uuid,
  organizations.id,
  'Acme Inc Bot',
  'You are a helpful customer support assistant for Acme Inc. Answer questions about our products and services. Be polite and professional. If you don''t know, offer to escalate to a human agent.',
  'cerebras/gpt-3.5-turbo',
  0.7,
  true,
  now(),
  now(),
  '00000000-0000-0000-0000-000000000001'::uuid
FROM organizations
WHERE slug = 'acme-inc'
ON CONFLICT DO NOTHING;

-- 3. Create OWNER user membership
INSERT INTO org_members (id, org_id, user_id, role, active, invited_at, activated_at, created_by, created_at, updated_at)
SELECT 
  '770e8400-e29b-41d4-a716-446655440000'::uuid,
  organizations.id,
  '00000000-0000-0000-0000-000000000002'::uuid,  -- demo owner UID
  'OWNER',
  true,
  now(),
  now(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  now(),
  now()
FROM organizations
WHERE slug = 'acme-inc'
ON CONFLICT (org_id, user_id) DO NOTHING;

-- 4. Create AGENT user membership
INSERT INTO org_members (id, org_id, user_id, role, active, invited_at, activated_at, created_by, created_at, updated_at)
SELECT 
  '880e8400-e29b-41d4-a716-446655440000'::uuid,
  organizations.id,
  '00000000-0000-0000-0000-000000000003'::uuid,  -- demo agent UID
  'AGENT',
  true,
  now(),
  now(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  now(),
  now()
FROM organizations
WHERE slug = 'acme-inc'
ON CONFLICT (org_id, user_id) DO NOTHING;

-- 5. Create sample audit logs
INSERT INTO audit_logs (org_id, actor_user_id, action, entity_type, entity_id, new_value, description, created_at)
SELECT 
  organizations.id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'create_organization',
  'organization',
  organizations.id::text,
  row_to_json(organizations),
  'Created organization: Acme Inc',
  now() - interval '2 days'
FROM organizations
WHERE slug = 'acme-inc'
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (org_id, actor_user_id, action, entity_type, entity_id, new_value, description, created_at)
SELECT 
  organizations.id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'create_org_member',
  'org_member',
  '770e8400-e29b-41d4-a716-446655440000'::uuid::text,
  json_build_object('role', 'OWNER', 'email', 'owner@acme.com'),
  'Invited OWNER: owner@acme.com',
  now() - interval '1.5 days'
FROM organizations
WHERE slug = 'acme-inc'
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (org_id, actor_user_id, action, entity_type, entity_id, new_value, description, created_at)
SELECT 
  organizations.id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'create_org_member',
  'org_member',
  '880e8400-e29b-41d4-a716-446655440000'::uuid::text,
  json_build_object('role', 'AGENT', 'email', 'agent@acme.com'),
  'Invited AGENT: agent@acme.com',
  now() - interval '1 day'
FROM organizations
WHERE slug = 'acme-inc'
ON CONFLICT DO NOTHING;
