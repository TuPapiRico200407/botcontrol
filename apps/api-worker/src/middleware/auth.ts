import { createMiddleware } from 'hono/factory';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../utils/errors';

export interface AuthContext {
    userId: string;
    email: string;
    isSuperAdmin: boolean;
    orgIds: string[];
    roles: Record<string, string>; // orgId -> role mapping
}

export interface ContextWithAuth {
    Variables: {
        auth: AuthContext;
        supabase: SupabaseClient;
    };
}

/**
 * Auth middleware: Validate JWT and extract user info, roles, and org memberships
 */
export const authMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError('Unauthorized', 401, 'NO_AUTH_HEADER');
    }

    const supabase = c.get('supabase') as SupabaseClient;
    if (!supabase) {
        throw new ApiError('Internal Server Error', 500, 'SUPABASE_NOT_AVAILABLE');
    }

    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (error || !user) {
        throw new ApiError('Unauthorized', 401, 'INVALID_TOKEN');
    }

    // Check if super admin (from JWT claims or user metadata)
    const jwtClaims = user.user_metadata?.app_role;
    const isSuperAdmin = jwtClaims === 'super_admin' || user.app_metadata?.app_role === 'super_admin';

    // Query org memberships
    let orgIds: string[] = [];
    let roles: Record<string, string> = {};

    if (!isSuperAdmin) {
        const { data: memberships, error: membError } = await supabase
            .from('org_members')
            .select('org_id, role')
            .eq('user_id', user.id)
            .eq('active', true);

        if (!membError && memberships) {
            orgIds = memberships.map((m) => m.org_id);
            memberships.forEach((m) => {
                roles[m.org_id] = m.role;
            });
        }
    }

    const authContext: AuthContext = {
        userId: user.id,
        email: user.email || 'unknown@example.com',
        isSuperAdmin,
        orgIds,
        roles,
    };

    c.set('auth', authContext);
    await next();
});
