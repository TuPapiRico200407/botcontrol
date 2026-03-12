import { createRoute, z } from '@hono/zod-openapi';
import { ApiError } from '../utils/errors';
import { AuthContext } from '../middleware/auth';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// SCHEMAS
// ============================================================

const ChannelSchema = z.object({
    id: z.string(),
    org_id: z.string(),
    phone_number: z.string(),
    phone_number_id: z.string(),
    business_account_id: z.string().nullable(),
    verified_at: z.string().nullable(),
    is_active: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
});

const CreateChannelBodySchema = z.object({
    phone_number: z.string().min(7, 'Phone number required'),
    phone_number_id: z.string().min(1, 'Phone Number ID required'),
    business_account_id: z.string().optional(),
    access_token: z.string().min(10, 'Access token required'),
    webhook_verify_token: z.string().optional(),
});

// ============================================================
// ROUTES
// ============================================================

// GET /api/orgs/:orgId/whatsapp/channels
export const listChannelsRoute = createRoute({
    method: 'get',
    path: '/api/orgs/{orgId}/whatsapp/channels',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'List of WhatsApp channels',
            content: {
                'application/json': {
                    schema: z.object({ data: z.array(ChannelSchema) }),
                },
            },
        },
    },
});

// POST /api/orgs/:orgId/whatsapp/channels
export const createChannelRoute = createRoute({
    method: 'post',
    path: '/api/orgs/{orgId}/whatsapp/channels',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': { schema: CreateChannelBodySchema },
            },
        },
    },
    responses: {
        201: {
            description: 'Channel created',
            content: {
                'application/json': { schema: z.object({ data: ChannelSchema }) },
            },
        },
        400: { description: 'Validation error' },
        403: { description: 'Forbidden' },
        409: { description: 'Duplicate phone number' },
    },
});

// DELETE /api/orgs/:orgId/whatsapp/channels/:channelId
export const deleteChannelRoute = createRoute({
    method: 'delete',
    path: '/api/orgs/{orgId}/whatsapp/channels/{channelId}',
    security: [{ bearerAuth: [] }],
    responses: {
        200: { description: 'Channel deactivated' },
        403: { description: 'Forbidden' },
        404: { description: 'Not found' },
    },
});

// ============================================================
// HANDLERS
// ============================================================

export const listChannelsHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');

    if (!auth.isSuperAdmin && !auth.orgIds.includes(orgId)) {
        throw new ApiError('Forbidden', 403, 'NOT_MEMBER_OF_ORG');
    }

    const { data, error } = await supabase
        .from('whatsapp_channels')
        .select('id, org_id, phone_number, phone_number_id, business_account_id, verified_at, is_active, created_at, updated_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    if (error) throw new ApiError('Database error', 500, 'DB_ERROR', { error });

    return c.json({ data: data || [] }, 200);
};

export const createChannelHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');

    // Only OWNER or super_admin can create channels
    if (!auth.isSuperAdmin) {
        if (!auth.orgIds.includes(orgId)) throw new ApiError('Forbidden', 403, 'NOT_MEMBER_OF_ORG');
        if (auth.roles[orgId] !== 'OWNER') throw new ApiError('Forbidden', 403, 'OWNER_ONLY');
    }

    const body = await c.req.json();
    const parsed = CreateChannelBodySchema.safeParse(body);
    if (!parsed.success) {
        throw new ApiError('Validation error', 400, 'VALIDATION_ERROR', { issues: parsed.error.issues });
    }

    const { phone_number, phone_number_id, business_account_id, access_token, webhook_verify_token } = parsed.data;

    // Check for duplicate phone_number_id in this org
    const { data: existing } = await supabase
        .from('whatsapp_channels')
        .select('id')
        .eq('org_id', orgId)
        .eq('phone_number_id', phone_number_id)
        .single();

    if (existing) {
        throw new ApiError('Phone Number ID already registered for this org', 409, 'PHONE_DUPLICATE');
    }

    // Encrypt token (base64 for now; in prod use pgcrypto or Vault)
    const tokenEncrypted = btoa(access_token);

    const { data, error } = await supabase
        .from('whatsapp_channels')
        .insert({
            org_id: orgId,
            phone_number,
            phone_number_id,
            business_account_id: business_account_id || null,
            access_token_encrypted: tokenEncrypted,
            webhook_verify_token: webhook_verify_token || null,
            verified_at: new Date().toISOString(),
            is_active: true,
        })
        .select('id, org_id, phone_number, phone_number_id, business_account_id, verified_at, is_active, created_at, updated_at')
        .single();

    if (error) {
        if (error.code === '23505') throw new ApiError('Duplicate channel', 409, 'PHONE_DUPLICATE');
        throw new ApiError('Database error', 500, 'DB_ERROR', { error });
    }

    return c.json({ data }, 201);
};

export const deleteChannelHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const channelId = c.req.param('channelId');

    // Only OWNER or super_admin can delete channels
    if (!auth.isSuperAdmin) {
        if (!auth.orgIds.includes(orgId)) throw new ApiError('Forbidden', 403, 'NOT_MEMBER_OF_ORG');
        if (auth.roles[orgId] !== 'OWNER') throw new ApiError('Forbidden', 403, 'OWNER_ONLY');
    }

    // Verify channel belongs to org
    const { data: channel } = await supabase
        .from('whatsapp_channels')
        .select('id')
        .eq('id', channelId)
        .eq('org_id', orgId)
        .single();

    if (!channel) throw new ApiError('Channel not found', 404, 'CHANNEL_NOT_FOUND');

    // Soft delete: deactivate instead of delete
    const { error } = await supabase
        .from('whatsapp_channels')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', channelId);

    if (error) throw new ApiError('Database error', 500, 'DB_ERROR', { error });

    return c.json({ ok: true, message: 'Channel deactivated' }, 200);
};
