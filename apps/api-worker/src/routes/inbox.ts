import { createRoute, z } from '@hono/zod-openapi';
import { ApiError } from '../utils/errors';
import { AuthContext } from '../middleware/auth';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// SCHEMAS
// ============================================================

const ConversationSchema = z.object({
    id: z.string(),
    org_id: z.string(),
    channel_id: z.string(),
    phone_number: z.string(),
    contact_name: z.string().nullable(),
    state: z.enum(['BOT', 'HUMAN', 'PENDING']),
    assigned_agent_id: z.string().nullable(),
    message_count: z.number(),
    last_message_at: z.string().nullable(),
    last_message_text: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

const MessageSchema = z.object({
    id: z.string(),
    conversation_id: z.string(),
    org_id: z.string(),
    message_id: z.string(),
    webhook_timestamp: z.number().nullable(),
    direction: z.enum(['inbound', 'outbound']),
    message_type: z.string(),
    body: z.string().nullable(),
    media_url: z.string().nullable(),
    media_mime_type: z.string().nullable(),
    created_at: z.string(),
});

const PaginationSchema = z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
});

// ============================================================
// ROUTES
// ============================================================

// GET /api/orgs/:orgId/inbox
export const listInboxRoute = createRoute({
    method: 'get',
    path: '/api/orgs/{orgId}/inbox',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Inbox conversations list',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(ConversationSchema),
                        pagination: PaginationSchema,
                    }),
                },
            },
        },
    },
});

// GET /api/orgs/:orgId/inbox/:convId/messages
export const listMessagesRoute = createRoute({
    method: 'get',
    path: '/api/orgs/{orgId}/inbox/{convId}/messages',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Messages in conversation',
            content: {
                'application/json': {
                    schema: z.object({ data: z.array(MessageSchema) }),
                },
            },
        },
        403: { description: 'Forbidden' },
        404: { description: 'Conversation not found' },
    },
});

// PATCH /api/orgs/:orgId/inbox/:convId/state
export const updateConvStateRoute = createRoute({
    method: 'patch',
    path: '/api/orgs/{orgId}/inbox/{convId}/state',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        state: z.enum(['BOT', 'HUMAN', 'PENDING']),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'State updated' },
        403: { description: 'Forbidden' },
        404: { description: 'Not found' },
    },
});

// ============================================================
// HANDLERS
// ============================================================

export const listInboxHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');

    if (!auth.isSuperAdmin && !auth.orgIds.includes(orgId)) {
        throw new ApiError('Forbidden', 403, 'NOT_MEMBER_OF_ORG');
    }

    const stateFilter = c.req.query('state') as string | undefined;
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));
    const offset = (page - 1) * limit;

    let query = supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('org_id', orgId);

    if (stateFilter && ['BOT', 'HUMAN', 'PENDING'].includes(stateFilter)) {
        query = query.eq('state', stateFilter);
    }

    const { data, count, error } = await query
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);

    if (error) throw new ApiError('Database error', 500, 'DB_ERROR', { error });

    return c.json({
        data: data || [],
        pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit),
        },
    }, 200);
};

export const listMessagesHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const convId = c.req.param('convId');

    if (!auth.isSuperAdmin && !auth.orgIds.includes(orgId)) {
        throw new ApiError('Forbidden', 403, 'NOT_MEMBER_OF_ORG');
    }

    // Verify conversation belongs to org
    const { data: conv } = await supabase
        .from('conversations')
        .select('org_id')
        .eq('id', convId)
        .single();

    if (!conv) throw new ApiError('Conversation not found', 404, 'CONV_NOT_FOUND');
    if (conv.org_id !== orgId && !auth.isSuperAdmin) {
        throw new ApiError('Forbidden', 403, 'WRONG_ORG');
    }

    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(c.req.query('limit') || '50')));
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('webhook_timestamp', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) throw new ApiError('Database error', 500, 'DB_ERROR', { error });

    return c.json({ data: data || [] }, 200);
};

export const updateConvStateHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const convId = c.req.param('convId');

    if (!auth.isSuperAdmin && !auth.orgIds.includes(orgId)) {
        throw new ApiError('Forbidden', 403, 'NOT_MEMBER_OF_ORG');
    }

    const body = await c.req.json();
    const { state } = z.object({ state: z.enum(['BOT', 'HUMAN', 'PENDING']) }).parse(body);

    // Verify conversation belongs to org
    const { data: conv } = await supabase
        .from('conversations')
        .select('org_id, state')
        .eq('id', convId)
        .single();

    if (!conv) throw new ApiError('Conversation not found', 404, 'CONV_NOT_FOUND');
    if (conv.org_id !== orgId && !auth.isSuperAdmin) {
        throw new ApiError('Forbidden', 403, 'WRONG_ORG');
    }

    const { error } = await supabase
        .from('conversations')
        .update({ state, updated_at: new Date().toISOString() })
        .eq('id', convId);

    if (error) throw new ApiError('Database error', 500, 'DB_ERROR', { error });

    // Audit log
    await supabase.from('audit_logs').insert({
        org_id: orgId,
        actor_user_id: auth.userId,
        action: 'update_conversation_state',
        entity_type: 'conversation',
        entity_id: convId,
        old_value: { state: conv.state },
        new_value: { state },
        description: `Changed conversation state from ${conv.state} to ${state}`,
    });

    return c.json({ ok: true, state }, 200);
};
