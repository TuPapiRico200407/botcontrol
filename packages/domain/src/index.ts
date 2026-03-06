// ---- Domain Types ----

export type OrgStatus = 'active' | 'suspended';
export type MemberRole = 'owner' | 'agent' | 'super_admin';
export type MemberStatus = 'active' | 'invited' | 'disabled';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    status: OrgStatus;
    created_at: string;
}

export interface OrgMember {
    id: string;
    org_id: string;
    user_id: string;
    role: MemberRole;
    status: MemberStatus;
    created_at: string;
}

export interface Bot {
    id: string;
    org_id: string;
    prompt_base: string;
    model: string;
    temperature: number;
    created_at: string;
    updated_at: string;
}

export interface Config {
    id: string;
    org_id: string | null;
    scope: string;
    key: string;
    value_json: unknown;
    updated_at: string;
}

export interface AuditLog {
    id: string;
    org_id: string;
    actor_user_id: string;
    action: string;
    entity: string;
    entity_id: string | null;
    diff_json: unknown | null;
    created_at: string;
}

// ---- RBAC Types ----

export interface AuthUser {
    id: string;
    email?: string;
    app_role?: string; // e.g. 'super_admin'
}

export interface UserContext {
    user: AuthUser;
    orgMemberships: OrgMember[];
}
