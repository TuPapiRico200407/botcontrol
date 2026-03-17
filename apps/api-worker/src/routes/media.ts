import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';

const mediaRouter = new Hono<{ Bindings: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string } }>();

// Este procesador asíncrono simula la ingesta de Cloudflare o Node
mediaRouter.post('/process/:jobId', async (c) => {
    const jobId = c.req.param('jobId');

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: c.req.header('Authorization') || '' } }
    });

    // Cambiar a RUNNING
    await supabase.from('media_jobs').update({ status: 'RUNNING', updated_at: new Date().toISOString() }).eq('id', jobId);

    // Simular un procesamiento pesado de NLP o OCR
    const mockLatency = Math.floor(Math.random() * 2000) + 1000;
    setTimeout(async () => {
        // Obtenemos un cliente de Service Role para evitar que el job aborte por expiración del token Auth.
        // En un worker productivo se pasa el execution context y waituntil.
        const s = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY); // Usa service_role_key para procesadores
        await s.from('media_jobs').update({
            status: 'DONE',
            result_text: '[TEXT EXTRAÍDO] Documento/Audio procesado exitosamente por Worker.',
            updated_at: new Date().toISOString()
        }).eq('id', jobId);
    }, mockLatency);

    return c.json({ ok: true, message: 'Processing started in background' });
});

export default mediaRouter;
