import { createRoute, z } from '@hono/zod-openapi';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../utils/errors';
import { AuthContext } from '../../middleware/auth';

/**
 * GET /api/orgs
 * List organizations (all for super_admin, only user's for others)
 */
export const listOrgsRoute = createRoute({
    method: 'get',
    path: '/api/orgs',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Organizations list',
            content: {
                'application/json': {
                    schema: z.array(
                        z.object({
                            id: z.string(),
                            name: z.string(),
                            slug: z.string(),
                            active: z.boolean(),
                            createdAt: z.string(),
                        })
                    ),
                },
            },
        },
    },
});

export const listOrgsHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;

    let query = supabase.from('organizations').select('id, name, slug, active, created_at').eq('active', true);

    if (!auth.isSuperAdmin) {
        // Filter to only orgs user is member of
        query = query.in('id', auth.orgIds);
    }

    const { data, error } = await query;
    if (error) {
        throw new ApiError('Failed to fetch organizations', 500, 'DB_ERROR', { error });
    }

    return c.json(
        data?.map((o) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            active: o.active,
            createdAt: o.created_at,
        })) || [],
        200
    );
};

/**
 * POST /api/orgs
 * Create organization (super_admin only)
 */
export const createOrgRoute = createRoute({
    method: 'post',
    path: '/api/orgs',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string().min(1).max(100),
                        slug: z.string().regex(/^[a-z0-9-]{3,}$/),
                    }),
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Organization created',
            content: {
                'application/json': {
                    schema: z.object({
                        id: z.string(),
                        name: z.string(),
                        slug: z.string(),
                        active: z.boolean(),
                        bot: z.object({
                            id: z.string(),
                            prompt: z.string(),
                            model: z.string(),
                            temperature: z.number(),
                        }),
                    }),
                },
            },
        },
        403: { description: 'Super admin only' },
    },
});

export const createOrgHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;

    if (!auth.isSuperAdmin) {
        throw new ApiError('Forbidden', 403, 'SUPER_ADMIN_ONLY');
    }

    const { name, slug } = await c.req.json();

    // Create org
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
            name,
            slug,
            active: true,
            created_by: auth.userId,
        })
        .select()
        .single();

    if (orgError) {
        if (orgError.code === '23505') {
            throw new ApiError('Slug already exists', 409, 'SLUG_DUPLICATE');
        }
        throw new ApiError('Failed to create organization', 500, 'DB_ERROR', { error: orgError });
    }

    // Create default bot
    const { data: bot } = await supabase
        .from('bots')
        .insert({
            org_id: org.id,
            name: `${org.name} Bot`,
            prompt: 'You are a helpful assistant. Answer questions professionally and politely. If uncertain, offer to escalate to a human.',
            model: 'cerebras/gpt-3.5-turbo',
            temperature: 0.7,
            active: true,
            updated_by: auth.userId,
        })
        .select()
        .single();

    // Create audit log
    await supabase.from('audit_logs').insert({
        org_id: org.id,
        actor_user_id: auth.userId,
        action: 'create_organization',
        entity_type: 'organization',
        entity_id: org.id,
        new_value: org,
        description: `Created organization: ${org.name}`,
    });

    return c.json(
        {
            id: org.id,
            name: org.name,
            slug: org.slug,
            active: org.active,
            bot: {
                id: bot?.id || '',
                prompt: bot?.prompt || '',
                model: bot?.model || '',
                temperature: bot?.temperature || 0.7,
            },
        },
        201
    );
};

/**
 * GET /api/orgs/:orgId
 * Get organization details
 */
export const getOrgRoute = createRoute({
    method: 'get',
    path: '/api/orgs/:orgId',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Organization details',
            content: {
                'application/json': {
                    schema: z.object({
                        id: z.string(),
                        name: z.string(),
                        slug: z.string(),
                        active: z.boolean(),
                        botId: z.string(),
                        createdAt: z.string(),
                        createdBy: z.object({ id: z.string(), email: z.string() }),
                    }),
                },
            },
        },
        404: { description: 'Not found' },
    },
});

export const getOrgHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');

    // Check membership
    if (!auth.isSuperAdmin && !auth.orgIds.includes(orgId)) {
        throw new ApiError('Not found', 404, 'ORG_NOT_FOUND');
    }

    const { data: org, error } = await supabase
        .from('organizations')
        .select('id, name, slug, active, created_at, created_by')
        .eq('id', orgId)
        .eq('active', true)
        .single();

    if (error || !org) {
        throw new ApiError('Not found', 404, 'ORG_NOT_FOUND');
    }

    // Get bot
    const { data: bot } = await supabase.from('bots').select('id').eq('org_id', orgId).single();

    return c.json(
        {
            id: org.id,
            name: org.name,
            slug: org.slug,
            active: org.active,
            botId: bot?.id || '',
            createdAt: org.created_at,
            createdBy: {
                id: org.created_by || 'unknown',
                email: 'admin@botcontrol.com', // TODO: fetch real email
            },
        },
        200
    );
};

/**
 * PATCH /api/orgs/:orgId
 * Update organization (super_admin only)
 */
export const updateOrgRoute = createRoute({
    method: 'patch',
    path: '/api/orgs/:orgId',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string().min(1).max(100).optional(),
                        active: z.boolean().optional(),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Updated' },
        403: { description: 'Forbidden' },
    },
});

export const updateOrgHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');

    if (!auth.isSuperAdmin) {
        throw new ApiError('Forbidden', 403, 'SUPER_ADMIN_ONLY');
    }

    const updates = await c.req.json();

    const { data: org, error } = await supabase
        .from('organizations')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', orgId)
        .select()
        .single();

    if (error) {
        throw new ApiError('Failed to update', 500, 'DB_ERROR', { error });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
        org_id: orgId,
        actor_user_id: auth.userId,
        action: 'update_organization',
        entity_type: 'organization',
        entity_id: orgId,
        new_value: org,
        description: 'Updated organization',
    });

    return c.json(org, 200);
};
