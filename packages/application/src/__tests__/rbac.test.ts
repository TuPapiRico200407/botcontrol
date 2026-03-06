import { describe, it, expect } from 'vitest';
import { isSuperAdmin, isOrgMember, isOrgOwner, assertOrgAccess } from '../rbac';
import type { UserContext } from '@botcontrol/domain';

const superAdminCtx: UserContext = {
    user: { id: 'user-1', email: 'admin@test.com', app_role: 'super_admin' },
    orgMemberships: [],
};

const ownerCtx: UserContext = {
    user: { id: 'user-2', email: 'owner@test.com' },
    orgMemberships: [
        { id: 'mem-1', org_id: 'org-abc', user_id: 'user-2', role: 'owner', status: 'active', created_at: '' },
    ],
};

const agentCtx: UserContext = {
    user: { id: 'user-3', email: 'agent@test.com' },
    orgMemberships: [
        { id: 'mem-2', org_id: 'org-abc', user_id: 'user-3', role: 'agent', status: 'active', created_at: '' },
    ],
};

describe('RBAC Guards', () => {
    it('isSuperAdmin returns true for super_admin role', () => {
        expect(isSuperAdmin(superAdminCtx)).toBe(true);
    });

    it('isSuperAdmin returns false for regular users', () => {
        expect(isSuperAdmin(ownerCtx)).toBe(false);
        expect(isSuperAdmin(agentCtx)).toBe(false);
    });

    it('isOrgMember returns true when user belongs to org', () => {
        expect(isOrgMember(ownerCtx, 'org-abc')).toBe(true);
    });

    it('isOrgMember returns false when user does not belong to org', () => {
        expect(isOrgMember(ownerCtx, 'org-other')).toBe(false);
    });

    it('isOrgOwner returns true for org owner role', () => {
        expect(isOrgOwner(ownerCtx, 'org-abc')).toBe(true);
    });

    it('isOrgOwner returns false for agent role', () => {
        expect(isOrgOwner(agentCtx, 'org-abc')).toBe(false);
    });

    it('assertOrgAccess does not throw for super_admin', () => {
        expect(() => assertOrgAccess(superAdminCtx, 'any-org')).not.toThrow();
    });

    it('assertOrgAccess does not throw for org member', () => {
        expect(() => assertOrgAccess(ownerCtx, 'org-abc')).not.toThrow();
    });

    it('assertOrgAccess throws for non-member', () => {
        expect(() => assertOrgAccess(ownerCtx, 'org-other')).toThrow(/Unauthorized/);
    });
});
