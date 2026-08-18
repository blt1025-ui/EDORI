BEGIN;

CREATE TABLE IF NOT EXISTS current_result_state (
    singleton_key TEXT PRIMARY KEY,

    schema_version INTEGER NOT NULL,

    result JSONB,
    result_timestamp TIMESTAMPTZ,

    invalidation_reason TEXT,

    updated_by_user_id TEXT,
    updated_by_username TEXT NOT NULL DEFAULT '',
    updated_by_display_name TEXT NOT NULL DEFAULT '',

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT current_result_state_singleton
        CHECK (singleton_key = 'current'),

    CONSTRAINT current_result_state_user_fk
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT current_result_state_schema_positive
        CHECK (schema_version > 0),

    CONSTRAINT current_result_state_result_object
        CHECK (
            result IS NULL
            OR jsonb_typeof(result) = 'object'
        ),

    CONSTRAINT current_result_state_not_both
        CHECK (
            result IS NULL
            OR invalidation_reason IS NULL
        ),

    CONSTRAINT current_result_state_invalidation_not_blank
        CHECK (
            invalidation_reason IS NULL
            OR BTRIM(invalidation_reason) <> ''
        )
);

CREATE INDEX IF NOT EXISTS current_result_state_updated_at_index
    ON current_result_state (updated_at DESC);

CREATE INDEX IF NOT EXISTS current_result_state_updated_by_index
    ON current_result_state (updated_by_user_id);

COMMIT;