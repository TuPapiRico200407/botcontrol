import { createMiddleware } from 'hono/factory';
import { ApiError } from '../utils/errors';
import { AuthContext } from './auth';

export type RoleRequirement = 'SUPER_ADMIN' | 'OWNER_OR_SUPER_ADMIN' | 'ANY_MEMBER';

/**
 * RBAC middleware: Check role-based access
 * Must be used AFTER auth middleware
 */
export const rbacMiddleware = (requiredRole: RoleRequirement, orgIdParam: string = 'orgId') =>
    createMiddleware(async (c, next) => {
        const auth = c.get('auth') as AuthContext;
        if (!auth) {
            throw new ApiError('Forbidden', 403, 'NO_AUTH_CONTEXT');
        }

        // Super admin bypasses most checks
        if (auth.isSuperAdmin && requiredRole !== 'OWNER_OR_SUPER_ADMIN') {
            await next();
            return;
        }

        // Extract orgId from params
        const orgId = c.req.param(orgIdParam);
        if (!orgId && requiredRole !== 'SUPER_ADMIN') {
            throw new ApiError('Bad Request', 400, 'MISSING_ORG_ID');
        }

        // Check membership
        if (!auth.isSuperAdmin) {
            if (!auth.orgIds.includes(orgId)) {
                throw new ApiError('Forbidden', 403, 'NOT_MEMBER_OF_ORG');
            }

            const userRole = auth.roles[orgId];

            // Role-based checks
            if (requiredRole === 'OWNER_OR_SUPER_ADMIN' && userRole !== 'OWNER') {
                throw new ApiError('Forbidden', 403, 'INSUFFICIENT_ROLE');
            }
        }

        await next();
    });
