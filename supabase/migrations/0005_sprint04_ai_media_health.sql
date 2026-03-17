-- SPRINT 4: AI Autoreply, Media Support y Auditoría

-- 1. Ampliar configuraciones de BOTs
ALTER TABLE bots
ADD COLUMN IF NOT EXISTS model text DEFAULT 'cerebras-llama3',
ADD COLUMN IF NOT EXISTS temperature numeric DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS max_tokens integer DEFAULT 500,
ADD COLUMN IF NOT EXISTS system_prompt text DEFAULT 'Eres un asistente virtual amable y conciso. Responde siempre considerando el contexto de la conversación.';

-- 2. Ampliar configuraciones de Conversations (Overrides por chat)
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS override_bot_id uuid REFERENCES bots(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS override_model text;

-- 3. Ampliar Messages para soportar Media extraído e IA tokens
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS extracted_text text,
ADD COLUMN IF NOT EXISTS ia_tokens_used integer,
ADD COLUMN IF NOT EXISTS media_url text, -- opcional si ya existía en payload, pero mejor como columna nativa
ADD COLUMN IF NOT EXISTS media_type text;

-- 4. Nueva Tabla: media_jobs
CREATE TABLE media_jobs (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    media_url text NOT NULL,
    media_type text NOT NULL, -- image, audio, document
    status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'DONE', 'FAILED')),
    result_text text,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- RLS para media_jobs
ALTER TABLE media_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org media jobs"
ON media_jobs FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM organization_members WHERE org_id = media_jobs.org_id));

CREATE POLICY "Users can insert their org media jobs"
ON media_jobs FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM organization_members WHERE org_id = media_jobs.org_id));

CREATE POLICY "Users can update their org media jobs"
ON media_jobs FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM organization_members WHERE org_id = media_jobs.org_id));

-- Trigger Updated At para media_jobs
CREATE TRIGGER set_media_jobs_updated_at
BEFORE UPDATE ON media_jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Nueva Tabla: system_health_logs (Auditoría extendida/Errores)
CREATE TABLE system_health_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    component text NOT NULL, -- Ej: 'WEBHOOK', 'CEREBRAS_AI', 'MEDIA_PROCESSOR'
    status text NOT NULL CHECK (status IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    message text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS para system_health_logs
ALTER TABLE system_health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org health logs"
ON system_health_logs FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM organization_members WHERE org_id = system_health_logs.org_id));

CREATE POLICY "Users can insert their org health logs"
ON system_health_logs FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM organization_members WHERE org_id = system_health_logs.org_id));
