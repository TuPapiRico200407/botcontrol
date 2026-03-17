import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';

const healthRouter = new Hono<{ Bindings: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string } }>();

healthRouter.get('/admin', async (c) => {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: c.req.header('Authorization') || '' } }
    });

    const orgId = c.req.query('org_id');
    if (!orgId) return c.json({ error: 'Missing org_id parameter' }, 400);

    const { data: logs, error: logsErr } = await supabase
        .from('system_health_logs')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);

    const { data: jobs, error: jobsErr } = await supabase
        .from('media_jobs')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (logsErr || jobsErr) return c.json({ error: 'Unable to fetch health metrics' }, 500);

    return c.json({
        ok: true,
        data: {
            status: logs?.some(l => l.status === 'ERROR' || l.status === 'CRITICAL') ? 'WARNING' : 'HEALTHY',
            recent_logs: logs || [],
            media_jobs: jobs || []
        }
    });
});

export default healthRouter;
