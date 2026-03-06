import { createRoute, z } from '@hono/zod-openapi';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../utils/errors';
import { AuthContext } from '../../middleware/auth';

/**
 * GET /api/orgs/:orgId/audit
 * List audit logs (SUPER_ADMIN and OWNER only)
 */
export const auditLogsRoute = createRoute({
    method: 'get',
    path: '/api/orgs/:orgId/audit',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Audit logs',
            content: {
                'application/json': {
                    schema: z.object({
                        total: z.number(),
                        limit: z.number(),
                        offset: z.number(),
                        logs: z.array(
                            z.object({
                                id: z.string(),
                                actor: z.object({ id: z.string(), email: z.string() }),
                                action: z.string(),
                                entityType: z.string(),
                                entityId: z.string(),
                                oldValue: z.any().optional(),
                                newValue: z.any().optional(),
                                description: z.string().optional(),
                                timestamp: z.string(),
                            })
                        ),
                    }),
                },
            },
        },
    },
});

export const auditLogsHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');

    // Permission: SUPER_ADMIN or OWNER
    if (!auth.isSuperAdmin) {
        if (!auth.orgIds.includes(orgId) || auth.roles[orgId] !== 'OWNER') {
            throw new ApiError('Forbidden', 403, 'INSUFFICIENT_ROLE');
        }
    }

    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 500);
    const offset = parseInt(c.req.query('offset') || '0');

    // Get total count
    const { count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);

    // Get logs
    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('id, actor_user_id, action, entity_type, entity_id, old_value, new_value, description, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new ApiError('Failed to fetch logs', 500, 'DB_ERROR', { error });
    }

    return c.json(
        {
            total: count || 0,
            limit,
            offset,
            logs: logs?.map((log) => ({
                id: log.id,
                actor: {
                    id: log.actor_user_id,
                    email: `user_${log.actor_user_id.substring(0, 8)}@botcontrol.com`, // TODO: fetch real
                },
                action: log.action,
                entityType: log.entity_type,
                entityId: log.entity_id,
                oldValue: log.old_value,
                newValue: log.new_value,
                description: log.description,
                timestamp: log.created_at,
            })) || [],
        },
        200
    );
};
