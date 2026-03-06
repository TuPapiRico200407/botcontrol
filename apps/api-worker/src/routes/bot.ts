import { createRoute, z } from '@hono/zod-openapi';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../utils/errors';
import { AuthContext } from '../../middleware/auth';

/**
 * GET /api/orgs/:orgId/bot
 * Get bot configuration (all roles can read)
 */
export const getBotRoute = createRoute({
    method: 'get',
    path: '/api/orgs/:orgId/bot',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Bot configuration',
            content: {
                'application/json': {
                    schema: z.object({
                        id: z.string(),
                        orgId: z.string(),
                        name: z.string(),
                        prompt: z.string(),
                        model: z.string(),
                        temperature: z.number(),
                        active: z.boolean(),
                        updatedAt: z.string(),
                        updatedBy: z.object({ id: z.string(), email: z.string() }),
                    }),
                },
            },
        },
    },
});

export const getBotHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');

    // Check membership
    if (!auth.isSuperAdmin && !auth.orgIds.includes(orgId)) {
        throw new ApiError('Forbidden', 403, 'NOT_MEMBER');
    }

    const { data: bot, error } = await supabase
        .from('bots')
        .select('id, org_id, name, prompt, model, temperature, active, updated_at, updated_by')
        .eq('org_id', orgId)
        .eq('active', true)
        .single();

    if (error || !bot) {
        throw new ApiError('Not found', 404, 'BOT_NOT_FOUND');
    }

    return c.json(
        {
            id: bot.id,
            orgId: bot.org_id,
            name: bot.name,
            prompt: bot.prompt,
            model: bot.model,
            temperature: bot.temperature,
            active: bot.active,
            updatedAt: bot.updated_at,
            updatedBy: {
                id: bot.updated_by || 'unknown',
                email: 'admin@botcontrol.com', // TODO: fetch real email
            },
        },
        200
    );
};

/**
 * PATCH /api/orgs/:orgId/bot
 * Update bot configuration (SUPER_ADMIN and OWNER only)
 */
export const updateBotRoute = createRoute({
    method: 'patch',
    path: '/api/orgs/:orgId/bot',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        prompt: z.string().max(5000).optional(),
                        model: z.string().optional(),
                        temperature: z.number().min(0).max(2).optional(),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Updated' },
        400: { description: 'Validation error' },
        403: { description: 'Insufficient role' },
    },
});

export const updateBotHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const updates = await c.req.json();

    // Permission check: SUPER_ADMIN or OWNER
    if (!auth.isSuperAdmin) {
        if (!auth.orgIds.includes(orgId) || auth.roles[orgId] !== 'OWNER') {
            throw new ApiError('Forbidden', 403, 'INSUFFICIENT_ROLE');
        }
    }

    // Validations
    if (updates.prompt !== undefined) {
        if (typeof updates.prompt !== 'string' || updates.prompt.trim() === '') {
            throw new ApiError('Prompt cannot be empty', 400, 'INVALID_PROMPT');
        }
        if (updates.prompt.length > 5000) {
            throw new ApiError('Prompt too long', 400, 'PROMPT_TOO_LONG');
        }
    }

    if (updates.temperature !== undefined) {
        if (typeof updates.temperature !== 'number' || updates.temperature < 0 || updates.temperature > 2) {
            throw new ApiError('Temperature must be between 0 and 2', 400, 'INVALID_TEMPERATURE');
        }
    }

    // Get current bot for audit diff
    const { data: oldBot } = await supabase
        .from('bots')
        .select('*')
        .eq('org_id', orgId)
        .eq('active', true)
        .single();

    // Update
    const { data: bot, error } = await supabase
        .from('bots')
        .update({
            ...updates,
            updated_at: new Date(),
            updated_by: auth.userId,
        })
        .eq('org_id', orgId)
        .eq('active', true)
        .select()
        .single();

    if (error) {
        throw new ApiError('Failed to update', 500, 'DB_ERROR', { error });
    }

    // Audit log with diff
    const diff: any = {};
    if (updates.prompt !== undefined) diff.prompt = updates.prompt;
    if (updates.model !== undefined) diff.model = updates.model;
    if (updates.temperature !== undefined) diff.temperature = updates.temperature;

    await supabase.from('audit_logs').insert({
        org_id: orgId,
        actor_user_id: auth.userId,
        action: 'update_bot_settings',
        entity_type: 'bot',
        entity_id: bot?.id,
        old_value: oldBot ? { prompt: oldBot.prompt, model: oldBot.model, temperature: oldBot.temperature } : null,
        new_value: diff,
        description: 'Updated bot settings',
    });

    return c.json(
        {
            id: bot.id,
            orgId: bot.org_id,
            name: bot.name,
            prompt: bot.prompt,
            model: bot.model,
            temperature: bot.temperature,
            active: bot.active,
            updatedAt: bot.updated_at,
            updatedBy: {
                id: bot.updated_by || auth.userId,
                email: auth.email,
            },
        },
        200
    );
};
