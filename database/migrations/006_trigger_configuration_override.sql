BEGIN;

CREATE TABLE IF NOT EXISTS trigger_configuration_override (
    singleton_key TEXT PRIMARY KEY,

    schema_version INTEGER NOT NULL,

    saved_at TIMESTAMPTZ NOT NULL,

    saved_by_user_id TEXT,
    saved_by_username TEXT NOT NULL DEFAULT '',
    saved_by_display_name TEXT NOT NULL DEFAULT '',

    configuration JSONB NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT trigger_configuration_override_singleton
        CHECK (singleton_key = 'active'),

    CONSTRAINT trigger_configuration_override_user_fk
        FOREIGN KEY (saved_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT trigger_configuration_override_schema_positive
        CHECK (schema_version > 0),

    CONSTRAINT trigger_configuration_override_configuration_object
        CHECK (jsonb_typeof(configuration) = 'object')
);

CREATE INDEX IF NOT EXISTS trigger_configuration_override_saved_at_index
    ON trigger_configuration_override (saved_at DESC);

CREATE INDEX IF NOT EXISTS trigger_configuration_override_saved_by_index
    ON trigger_configuration_override (saved_by_user_id);

COMMIT;