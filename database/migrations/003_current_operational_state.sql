BEGIN;

CREATE TABLE IF NOT EXISTS current_operational_state (
    singleton_key TEXT PRIMARY KEY,

    assessment_timestamp TIMESTAMPTZ,

    schema_version INTEGER NOT NULL,

    updated_by_user_id TEXT,
    updated_by_username TEXT NOT NULL DEFAULT '',
    updated_by_display_name TEXT NOT NULL DEFAULT '',

    assessment JSONB NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT current_operational_state_singleton
        CHECK (singleton_key = 'current'),

    CONSTRAINT current_operational_state_user_fk
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT current_operational_state_schema_positive
        CHECK (schema_version > 0),

    CONSTRAINT current_operational_state_assessment_object
        CHECK (jsonb_typeof(assessment) = 'object')
);

CREATE INDEX IF NOT EXISTS current_operational_state_updated_at_index
    ON current_operational_state (updated_at DESC);

CREATE INDEX IF NOT EXISTS current_operational_state_updated_by_index
    ON current_operational_state (updated_by_user_id);

COMMIT;