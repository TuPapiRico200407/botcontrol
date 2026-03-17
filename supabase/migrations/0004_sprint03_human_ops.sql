-- ============================================================
-- SPRINT 03 - HUMAN OPERATIONS
-- ============================================================
-- 1. Modificar tabla conversations para añadir assigned_agent_id
-- 2. Crear tabla conversation_tags
-- 3. Crear tabla conversation_notes
-- 4. Triggers para actualizar updated_at
-- 5. RLS Policies
-- ============================================================

-- 1. Alterar tabla conversations
ALTER TABLE conversations
ADD COLUMN assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_conversations_assigned_agent ON conversations(assigned_agent_id);

-- 2. Crear tabla conversation_tags
CREATE TABLE conversation_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(conversation_id, tag_name)
);

CREATE INDEX idx_conversation_tags_org ON conversation_tags(org_id);
CREATE INDEX idx_conversation_tags_conv ON conversation_tags(conversation_id);

-- Trigger para updated_at en tags no es necesario (inmutables usualmente o se borran)

-- 3. Crear tabla conversation_notes
CREATE TABLE conversation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversation_notes_org ON conversation_notes(org_id);
CREATE INDEX idx_conversation_notes_conv ON conversation_notes(conversation_id);
CREATE INDEX idx_conversation_notes_author ON conversation_notes(author_id);

-- Trigger para updated_at en notes
CREATE TRIGGER update_conversation_notes_modtime
    BEFORE UPDATE ON conversation_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Policies para conversation_tags
CREATE POLICY "Tags visibles para miembros de la org" ON conversation_tags
    FOR SELECT USING (
        org_id IN (
            SELECT o.org_id FROM org_members o 
            WHERE o.user_id = auth.uid() AND o.active = true
        )
    );

CREATE POLICY "Miembros pueden crear tags" ON conversation_tags
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT o.org_id FROM org_members o 
            WHERE o.user_id = auth.uid() AND o.active = true
        )
    );

CREATE POLICY "Miembros pueden borrar tags" ON conversation_tags
    FOR DELETE USING (
        org_id IN (
            SELECT o.org_id FROM org_members o 
            WHERE o.user_id = auth.uid() AND o.active = true
        )
    );

-- Policies para conversation_notes
CREATE POLICY "Notas visibles para miembros de la org" ON conversation_notes
    FOR SELECT USING (
        org_id IN (
            SELECT o.org_id FROM org_members o 
            WHERE o.user_id = auth.uid() AND o.active = true
        )
    );

CREATE POLICY "Miembros pueden crear notas" ON conversation_notes
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT o.org_id FROM org_members o 
            WHERE o.user_id = auth.uid() AND o.active = true
        )
    );

CREATE POLICY "Solo autor o admin/owner pueden editar notas" ON conversation_notes
    FOR UPDATE USING (
        author_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM org_members o 
            WHERE o.org_id = conversation_notes.org_id 
              AND o.user_id = auth.uid() 
              AND o.role IN ('OWNER')
              AND o.active = true
        )
    );

CREATE POLICY "Solo autor o admin/owner pueden borrar notas" ON conversation_notes
    FOR DELETE USING (
        author_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM org_members o 
            WHERE o.org_id = conversation_notes.org_id 
              AND o.user_id = auth.uid() 
              AND o.role IN ('OWNER')
              AND o.active = true
        )
    );
