import { createRoute, z } from '@hono/zod-openapi';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../utils/errors';

/**
 * POST /auth/login
 * Request magic link or password login
 */
export const loginRoute = createRoute({
    method: 'post',
    path: '/auth/login',
    request: {
        body: {
            content: { 'application/json': { schema: z.object({ email: z.string().email() }) } },
        },
    },
    responses: {
        200: {
            description: 'Login initiated',
            content: { 'application/json': { schema: z.object({ message: z.string() }) } },
        },
        400: { description: 'Invalid email' },
    },
});

export const loginHandler = async (c: any) => {
    const { email } = await c.req.json();
    if (!email || typeof email !== 'string') {
        throw new ApiError('Invalid email', 400, 'INVALID_EMAIL');
    }

    const supabase = c.get('supabase') as SupabaseClient;

    // Attempt magic link sign-in
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${c.req.header('Origin')}/auth/callback` },
    });

    if (error) {
        throw new ApiError('Failed to send magic link', 400, 'MAGIC_LINK_FAILED', { details: error });
    }

    return c.json({ message: 'Magic link sent to email. Check your inbox.' }, 200);
};

/**
 * GET /auth/session
 * Get current user and their roles
 */
export const sessionRoute = createRoute({
    method: 'get',
    path: '/auth/session',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'User session',
            content: {
                'application/json': {
                    schema: z.object({
                        user: z.object({
                            id: z.string(),
                            email: z.string(),
                            roles: z.array(
                                z.object({
                                    orgId: z.string(),
                                    orgName: z.string(),
                                    role: z.enum(['OWNER', 'AGENT']),
                                })
                            ),
                        }),
                    }),
                },
            },
        },
        401: { description: 'Unauthorized' },
    },
});

export const sessionHandler = async (c: any) => {
    const auth = c.get('auth');
    const supabase = c.get('supabase') as SupabaseClient;

    if (!auth) {
        throw new ApiError('Unauthorized', 401, 'NO_AUTH');
    }

    // Fetch org names
    let roles: any[] = [];
    if (!auth.isSuperAdmin) {
        const { data: memberships } = await supabase
            .from('org_members')
            .select('org_id, role')
            .eq('user_id', auth.userId)
            .eq('active', true);

        if (memberships) {
            const { data: orgs } = await supabase
                .from('organizations')
                .select('id, name')
                .eq('active', true);

            roles = memberships.map((m) => ({
                orgId: m.org_id,
                orgName: orgs?.find((o) => o.id === m.org_id)?.name || 'Unknown',
                role: m.role,
            }));
        }
    }

    return c.json(
        {
            user: {
                id: auth.userId,
                email: auth.email,
                roles,
            },
        },
        200
    );
};

/**
 * POST /auth/logout (stubbed - client clears JWT)
 */
export const logoutRoute = createRoute({
    method: 'post',
    path: '/auth/logout',
    security: [{ bearerAuth: [] }],
    responses: {
        200: { description: 'Logged out', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
    },
});

export const logoutHandler = async (c: any) => {
    return c.json({ message: 'Logged out successfully' }, 200);
};
