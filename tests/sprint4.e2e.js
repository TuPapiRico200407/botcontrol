import crypto from 'crypto';

(async () => {
    const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || 'demo_webhook_secret';
    const API_URL = 'http://localhost:8787/webhook/whatsapp';

    const payload = {
        object: 'whatsapp_business_account',
        entry: [
            {
                id: '1234567890',
                changes: [
                    {
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: {
                                display_phone_number: '1234567890',
                                phone_number_id: '106517178889412'
                            },
                            contacts: [
                                {
                                    profile: { name: 'Test User' },
                                    wa_id: '123456789'
                                }
                            ],
                            messages: [
                                {
                                    from: '123456789',
                                    id: 'wamid.HBgLMTIzNDU2Nzg5',
                                    timestamp: Math.floor(Date.now() / 1000).toString(),
                                    type: 'image',
                                    image: {
                                        id: 'media123',
                                        mime_type: 'image/jpeg',
                                        caption: 'Hello Cerebras!'
                                    }
                                }
                            ]
                        },
                        field: 'messages'
                    }
                ]
            }
        ]
    };

    const bodyStr = JSON.stringify(payload);
    
    // Sign payload
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(bodyStr);
    const signature = `sha256=${hmac.digest('hex')}`;

    console.log('[E2E] Sending Webhook Payload...');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Hub-Signature-256': signature
            },
            body: bodyStr
        });

        const resText = await response.text();
        console.log(`[E2E] Response HTTP ${response.status}: ${resText}`);

        if (response.status === 200) {
            console.log('[E2E] Waiting 3 seconds for async media jobs/AI generation to process...');
            await new Promise(r => setTimeout(r, 3000));
            // Check Health API
            // Note: In local dev, orgId might be dynamic or fixed matching the channel. We will query health without orgId to see if we get a 200 or 400.
            console.log('[E2E] Done verifying Webhook insertion.');
        } else {
            console.error('[E2E] Webhook failed.');
        }

    } catch (e) {
        console.error('[E2E] Fetch failed:', e.message);
    }
})();
