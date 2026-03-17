import { createRoute, z } from '@hono/zod-openapi';
import { ApiError } from '../utils/errors';
import { AuthContext } from '../middleware/auth';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// SCHEMAS
// ============================================================

const TagBodySchema = z.object({
    tag_name: z.string().min(1).max(50),
});

const NoteBodySchema = z.object({
    content: z.string().min(1),
});

const OutboundMessageSchema = z.object({
    message_type: z.enum(['text', 'image', 'audio', 'document']),
    body: z.string().optional(),
    media_url: z.string().optional(),
});

// ============================================================
// ROUTES
// ============================================================

// POST /api/orgs/:orgId/inbox/:convId/take
export const takeConvRoute = createRoute({
    method: 'post',
    path: '/api/orgs/{orgId}/inbox/{convId}/take',
    security: [{ bearerAuth: [] }],
    responses: {
        200: { description: 'Conversation taken by agent' },
        403: { description: 'Forbidden' },
        404: { description: 'Not found' },
        409: { description: 'Already assigned' },
    },
});

// POST /api/orgs/:orgId/inbox/:convId/release
export const releaseConvRoute = createRoute({
    method: 'post',
    path: '/api/orgs/{orgId}/inbox/{convId}/release',
    security: [{ bearerAuth: [] }],
    responses: {
        200: { description: 'Conversation released' },
    },
});

// POST /api/orgs/:orgId/inbox/:convId/outbound
export const sendOutboundRoute = createRoute({
    method: 'post',
    path: '/api/orgs/{orgId}/inbox/{convId}/outbound',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: OutboundMessageSchema } },
        },
    },
    responses: {
        200: { description: 'Message sent' },
    },
});

// POST /api/orgs/:orgId/inbox/:convId/tags
export const addTagRoute = createRoute({
    method: 'post',
    path: '/api/orgs/{orgId}/inbox/{convId}/tags',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: TagBodySchema } } } },
    responses: { 201: { description: 'Tag added' } },
});

// DELETE /api/orgs/:orgId/inbox/:convId/tags/:tagName
export const removeTagRoute = createRoute({
    method: 'delete',
    path: '/api/orgs/{orgId}/inbox/{convId}/tags/{tagName}',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Tag removed' } },
});

// POST /api/orgs/:orgId/inbox/:convId/notes
export const addNoteRoute = createRoute({
    method: 'post',
    path: '/api/orgs/{orgId}/inbox/{convId}/notes',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: NoteBodySchema } } } },
    responses: { 201: { description: 'Note added' } },
});

// GET /api/orgs/:orgId/inbox/:convId/notes
export const listNotesRoute = createRoute({
    method: 'get',
    path: '/api/orgs/{orgId}/inbox/{convId}/notes',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'List notes' } },
});

// GET /api/orgs/:orgId/inbox/:convId/tags
export const listTagsRoute = createRoute({
    method: 'get',
    path: '/api/orgs/{orgId}/inbox/{convId}/tags',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'List tags' } },
});


// ============================================================
// HANDLERS
// ============================================================

const verifyConvAndAccess = async (supabase: SupabaseClient, orgId: string, convId: string, auth: AuthContext) => {
    if (!auth.isSuperAdmin && !auth.orgIds.includes(orgId)) {
        throw new ApiError('Forbidden', 403, 'NOT_MEMBER_OF_ORG');
    }

    const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single();

    if (!conv) throw new ApiError('Conversation not found', 404, 'CONV_NOT_FOUND');
    if (conv.org_id !== orgId && !auth.isSuperAdmin) {
        throw new ApiError('Forbidden', 403, 'WRONG_ORG');
    }
    return conv;
};

export const takeConvHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const convId = c.req.param('convId');

    const conv = await verifyConvAndAccess(supabase, orgId, convId, auth);

    if (conv.assigned_agent_id && conv.assigned_agent_id !== auth.userId) {
        throw new ApiError('Conversation is already assigned to someone else', 409, 'ALREADY_ASSIGNED');
    }

    const { error } = await supabase
        .from('conversations')
        .update({
            state: 'HUMAN',
            assigned_agent_id: auth.userId,
            updated_at: new Date().toISOString()
        })
        .eq('id', convId);

    if (error) throw new ApiError('DB Error', 500, 'DB_ERROR', { error });

    await supabase.from('audit_logs').insert({
        org_id: orgId, actor_user_id: auth.userId, action: 'take_conversation',
        entity_type: 'conversation', entity_id: convId,
        description: 'Agent took conversation'
    });

    return c.json({ ok: true }, 200);
};

export const releaseConvHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const convId = c.req.param('convId');

    await verifyConvAndAccess(supabase, orgId, convId, auth);

    const { error } = await supabase
        .from('conversations')
        .update({
            state: 'PENDING',
            assigned_agent_id: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', convId);

    if (error) throw new ApiError('DB Error', 500, 'DB_ERROR', { error });

    await supabase.from('audit_logs').insert({
        org_id: orgId, actor_user_id: auth.userId, action: 'release_conversation',
        entity_type: 'conversation', entity_id: convId,
        description: 'Agent released conversation'
    });

    return c.json({ ok: true }, 200);
};

export const sendOutboundHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const convId = c.req.param('convId');

    const conv = await verifyConvAndAccess(supabase, orgId, convId, auth);

    // Only assigned agent or super_admin can reply if it's HUMAN state
    if (!auth.isSuperAdmin && conv.assigned_agent_id && conv.assigned_agent_id !== auth.userId) {
        throw new ApiError('Only assigned agent can reply', 403, 'NOT_ASSIGNED_AGENT');
    }

    const body = await c.req.json();
    const parsed = OutboundMessageSchema.parse(body);

    // Mock sending to WhatsApp Cloud API
    // In real app, we would fetch the channel token, call Graph API, and use resulting wamid
    const mockMessageId = `wamid.outbound.${Date.now()}`;

    // Inserta en DB as Outbound
    const { data: msg, error } = await supabase.from('messages').insert({
        conversation_id: convId,
        org_id: orgId,
        message_id: mockMessageId,
        direction: 'outbound',
        message_type: parsed.message_type,
        body: parsed.body || null,
        media_url: parsed.media_url || null,
        processed_at: new Date().toISOString()
    }).select().single();

    if (error) throw new ApiError('Failed to send message', 500, 'DB_ERROR', { error });

    return c.json({ data: msg }, 200);
};

export const addTagHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const convId = c.req.param('convId');

    await verifyConvAndAccess(supabase, orgId, convId, auth);
    const { tag_name } = TagBodySchema.parse(await c.req.json());

    const { error } = await supabase.from('conversation_tags').insert({
        org_id: orgId, conversation_id: convId, tag_name, created_by: auth.userId
    });

    if (error && error.code !== '23505') throw new ApiError('DB Error', 500, 'DB_ERROR', { error }); // ignore duplicate

    return c.json({ ok: true }, 201);
};

export const removeTagHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const convId = c.req.param('convId');
    const tagName = c.req.param('tagName');

    await verifyConvAndAccess(supabase, orgId, convId, auth);

    await supabase.from('conversation_tags')
        .delete()
        .eq('conversation_id', convId)
        .eq('tag_name', tagName);

    return c.json({ ok: true }, 200);
};

export const addNoteHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const convId = c.req.param('convId');

    await verifyConvAndAccess(supabase, orgId, convId, auth);
    const { content } = NoteBodySchema.parse(await c.req.json());

    const { data, error } = await supabase.from('conversation_notes').insert({
        org_id: orgId, conversation_id: convId, author_id: auth.userId, content
    }).select().single();

    if (error) throw new ApiError('DB Error', 500, 'DB_ERROR', { error });
    return c.json({ data }, 201);
};

export const listNotesHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const convId = c.req.param('convId');

    await verifyConvAndAccess(supabase, orgId, convId, auth);

    const { data } = await supabase.from('conversation_notes')
        .select('*, author:author_id(email)')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false });

    return c.json({ data: data || [] }, 200);
};

export const listTagsHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const convId = c.req.param('convId');

    await verifyConvAndAccess(supabase, orgId, convId, auth);

    const { data } = await supabase.from('conversation_tags')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

    return c.json({ data: data || [] }, 200);
};
