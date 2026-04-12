CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    variant_id UUID,
    type VARCHAR(255) NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    opened_by UUID,
    closed_by UUID
);

CREATE INDEX IF NOT EXISTS idx_threads_project_id ON threads (project_id);
CREATE INDEX IF NOT EXISTS idx_threads_variant_id ON threads (variant_id);

CREATE TABLE IF NOT EXISTS thread_messages (
    id UUID PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES threads (id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_thread_messages_thread_id ON thread_messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_messages_created_at ON thread_messages (created_at);
