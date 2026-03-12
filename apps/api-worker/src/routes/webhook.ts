import { createRoute, z } from '@hono/zod-openapi';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// WEBHOOK VERIFICATION & MESSAGE SCHEMAS
// ============================================================

const WebhookMessageSchema = z.object({
    from: z.string(),
    id: z.string(),
    timestamp: z.string(),
    type: z.string(),
    text: z.object({ body: z.string() }).optional(),
    image: z.object({ id: z.string(), mime_type: z.string() }).optional(),
    audio: z.object({ id: z.string(), mime_type: z.string() }).optional(),
    document: z.object({ id: z.string(), mime_type: z.string(), filename: z.string().optional() }).optional(),
});

const WebhookPayloadSchema = z.object({
    object: z.literal('whatsapp_business_account'),
    entry: z.array(z.object({
        id: z.string(),
        changes: z.array(z.object({
            value: z.object({
                messaging_product: z.string().optional(),
                metadata: z.object({
                    display_phone_number: z.string().optional(),
                    phone_number_id: z.string(),
                }).optional(),
                messages: z.array(WebhookMessageSchema).optional(),
                statuses: z.array(z.any()).optional(),
            }),
            field: z.string(),
        })),
    })),
});

// ============================================================
// SIGNATURE VALIDATION
// ============================================================

async function validateSignature(
    signature: string,
    body: string,
    secret: string
): Promise<boolean> {
    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
        const hashHex = Array.from(new Uint8Array(signatureBytes))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        const expected = `sha256=${hashHex}`;
        return signature === expected;
    } catch {
        return false;
    }
}

// ============================================================
// ROUTE DEFINITIONS
// ============================================================

// GET /webhook/whatsapp — Hub verification
export const webhookVerifyRoute = createRoute({
    method: 'get',
    path: '/webhook/whatsapp',
    responses: {
        200: { description: 'Hub challenge returned as text' },
        403: { description: 'Token mismatch' },
    },
});

// POST /webhook/whatsapp — Receive messages
export const webhookReceiveRoute = createRoute({
    method: 'post',
    path: '/webhook/whatsapp',
    responses: {
        200: { description: 'Processed' },
    },
});

// ============================================================
// HANDLERS
// ============================================================

export const webhookVerifyHandler = async (c: any) => {
    const mode = c.req.query('hub.mode');
    const token = c.req.query('hub.verify_token');
    const challenge = c.req.query('hub.challenge');

    const verifyToken = c.env?.WHATSAPP_VERIFY_TOKEN || 'demo_verify_token';

    if (mode === 'subscribe' && token === verifyToken) {
        return new Response(challenge || '', { status: 200 });
    }
    return c.json({ error: 'Forbidden' }, 403);
};

export const webhookReceiveHandler = async (c: any) => {
    const rawBody = await c.req.text();

    // Signature validation (optional in dev, required in prod)
    const signature = c.req.header('x-hub-signature-256') || '';
    const webhookSecret = c.env?.WHATSAPP_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
        const valid = await validateSignature(signature, rawBody, webhookSecret);
        if (!valid) {
            // Log but still return 200 to prevent retries
            console.error('Invalid webhook signature');
            return c.json({ ok: true, warning: 'invalid_signature' }, 200);
        }
    }

    // Always return 200 immediately (WhatsApp retries on non-200)
    let parsed: z.infer<typeof WebhookPayloadSchema>;
    try {
        parsed = WebhookPayloadSchema.parse(JSON.parse(rawBody));
    } catch (err) {
        console.error('Webhook parse error:', err);
        return c.json({ ok: true, warning: 'parse_error' }, 200);
    }

    // Use service_role client to bypass RLS (webhook is system actor)
    const supabaseUrl = c.env?.SUPABASE_URL || 'http://127.0.0.1:54321';
    const serviceKey = c.env?.SUPABASE_SERVICE_ROLE_KEY || c.env?.SUPABASE_ANON_KEY || 'dummy';
    const supabase = createClient(supabaseUrl, serviceKey);

    // Process each entry
    for (const entry of parsed.entry) {
        for (const change of entry.changes) {
            if (!change.value.messages) continue;

            const phoneNumberId = change.value.metadata?.phone_number_id;
            if (!phoneNumberId) continue;

            // Find active channel by phone_number_id
            const { data: channel } = await supabase
                .from('whatsapp_channels')
                .select('id, org_id')
                .eq('phone_number_id', phoneNumberId)
                .eq('is_active', true)
                .single();

            if (!channel) {
                console.error('Channel not found for phone_number_id:', phoneNumberId);
                continue;
            }

            for (const msg of change.value.messages) {
                // Idempotency check
                const { data: existing } = await supabase
                    .from('messages')
                    .select('id')
                    .eq('message_id', msg.id)
                    .single();

                if (existing) {
                    console.log('Duplicate message, skipping:', msg.id);
                    continue;
                }

                // Find or create conversation
                let convId: string;
                const { data: existingConv } = await supabase
                    .from('conversations')
                    .select('id')
                    .eq('channel_id', channel.id)
                    .eq('phone_number', msg.from)
                    .single();

                if (existingConv) {
                    convId = existingConv.id;
                } else {
                    const { data: newConv, error: convErr } = await supabase
                        .from('conversations')
                        .insert({
                            org_id: channel.org_id,
                            channel_id: channel.id,
                            phone_number: msg.from,
                            state: 'BOT',
                        })
                        .select('id')
                        .single();

                    if (convErr || !newConv) {
                        console.error('Failed to create conversation:', convErr);
                        continue;
                    }
                    convId = newConv.id;
                }

                // Extract message content
                const body = msg.text?.body ||
                    (msg.image ? '[image]' : null) ||
                    (msg.audio ? '[audio]' : null) ||
                    (msg.document ? `[document: ${msg.document.filename || 'file'}]` : null) ||
                    '[unknown]';

                const mediaUrl = msg.image?.id || msg.audio?.id || msg.document?.id || null;
                const mediaMimeType = msg.image?.mime_type || msg.audio?.mime_type || msg.document?.mime_type || null;

                // Insert message
                const { error: msgErr } = await supabase.from('messages').insert({
                    conversation_id: convId,
                    org_id: channel.org_id,
                    message_id: msg.id,
                    webhook_timestamp: parseInt(msg.timestamp) * 1000,
                    direction: 'inbound',
                    message_type: msg.type,
                    body,
                    media_url: mediaUrl,
                    media_mime_type: mediaMimeType,
                    processed_at: new Date().toISOString(),
                });

                if (msgErr) {
                    console.error('Failed to insert message:', msgErr);
                }
            }
        }
    }

    return c.json({ ok: true }, 200);
};
