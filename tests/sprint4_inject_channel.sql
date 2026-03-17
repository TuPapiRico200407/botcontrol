-- f:\BotControl\tests\sprint4_inject_channel.sql

-- We assume Org 1 exists from seed.sql
INSERT INTO public.whatsapp_channels (
    org_id,
    phone_number_id,
    waba_id,
    phone_number,
    name,
    whatsapp_business_id,
    api_key,
    api_key_encrypted
) VALUES (
    'org_001',
    '999203256612062',
    '1270887008257762',
    '+1 555 179 2726',
    'Canal Testing Sprint 4',
    '1270887008257762',
    NULL,
    decode('EAAa3ZADw07CQBQ9HW3AZANNoGlDUFtU08vJc3TObxY2SNdHjxj3ZCHyqZBzf1vWczAivUAk2w7ZBPAMiiaXxnNMPZCjeghK8YZAXrdHxeQULDqkFpgII46jr9GNyHOeP2Jq1iQlNdaWVbFQX8eS0zK6MpbawZBZBpMQADO3UNGGw6W963hKIRhkf54hWhVk4X2jBMYffXSGZCKG6yhKZCQI1YRNNKZA6bXsIuUFahAlNNkgq6s2NNYHjNky1it5lR5cIvqPSRZCYHnZB5bZADUjw7pMVwEtDnZAQVoCSyQlxpaUnIh0ZD', 'escape')
) ON CONFLICT (phone_number_id) DO UPDATE
SET 
    api_key_encrypted = EXCLUDED.api_key_encrypted,
    waba_id = EXCLUDED.waba_id,
    phone_number = EXCLUDED.phone_number;
