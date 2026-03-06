import type { UserContext } from '@botcontrol/domain';

/**
 * Returns true if the user has the super_admin app role.
 */
export function isSuperAdmin(ctx: UserContext): boolean {
    return ctx.user.app_role === 'super_admin';
}

/**
 * Returns true if the user is an active member of the given org.
 */
export function isOrgMember(ctx: UserContext, orgId: string): boolean {
    return ctx.orgMemberships.some(
        (m) => m.org_id === orgId && m.status === 'active',
    );
}

/**
 * Returns true if the user has the 'owner' role in the given org.
 */
export function isOrgOwner(ctx: UserContext, orgId: string): boolean {
    return ctx.orgMemberships.some(
        (m) => m.org_id === orgId && m.role === 'owner' && m.status === 'active',
    );
}

/**
 * Asserts that the user can access resources of the given org.
 * Super admins bypass this check.
 * Throws an error if unauthorized.
 */
export function assertOrgAccess(ctx: UserContext, orgId: string): void {
    if (isSuperAdmin(ctx)) return;
    if (!isOrgMember(ctx, orgId)) {
        throw new Error(`Unauthorized: user ${ctx.user.id} does not belong to org ${orgId}`);
    }
}
