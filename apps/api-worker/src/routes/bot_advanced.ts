import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';

const advancedBotLogs = new Hono<{ Bindings: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string }; Variables: { user?: { id: string } } }>();

advancedBotLogs.use('*', async (c, next) => {
    // Re-use auth middleware logic here if not mounted at root
    // For this example, assuming mounted under /api/orgs/:orgId/bot
    await next();
});

// GET /api/orgs/:orgId/bot/advanced
advancedBotLogs.get('/advanced', async (c) => {
    const orgId = c.req.param('orgId');
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: c.req.header('Authorization') || '' } }
    });

    const { data, error } = await supabase
        .from('bots')
        .select('id, name, model, temperature, max_tokens, system_prompt')
        .eq('org_id', orgId)
        .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
});

// PATCH /api/orgs/:orgId/bot/advanced/:botId
advancedBotLogs.patch('/advanced/:botId', async (c) => {
    const orgId = c.req.param('orgId');
    const botId = c.req.param('botId');
    const body = await c.req.json();

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: c.req.header('Authorization') || '' } }
    });

    const { data, error } = await supabase
        .from('bots')
        .update({
            model: body.model,
            temperature: body.temperature,
            max_tokens: body.max_tokens,
            system_prompt: body.system_prompt,
            updated_at: new Date().toISOString()
        })
        .eq('id', botId)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    // Log Audit
    await supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: c.get('user')?.id,
        action: 'UPDATE_BOT_ADVANCED',
        entity_name: 'bot',
        entity_id: botId,
        details: { changes: body }
    });

    return c.json({ data });
});

// PATCH /api/orgs/:orgId/conversations/:convId/override
advancedBotLogs.patch('/conversations/:convId/override', async (c) => {
    const orgId = c.req.param('orgId');
    const convId = c.req.param('convId');
    const body = await c.req.json();

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: c.req.header('Authorization') || '' } }
    });

    const { data, error } = await supabase
        .from('conversations')
        .update({ override_model: body.override_model, updated_at: new Date().toISOString() })
        .eq('id', convId)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data });
});

export default advancedBotLogs;
