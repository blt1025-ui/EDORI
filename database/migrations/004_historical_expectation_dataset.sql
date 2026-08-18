BEGIN;

CREATE TABLE IF NOT EXISTS historical_expectation_dataset (
    singleton_key TEXT PRIMARY KEY,

    schema_version INTEGER NOT NULL,

    imported_at TIMESTAMPTZ NOT NULL,

    imported_by_user_id TEXT,
    imported_by_username TEXT NOT NULL DEFAULT '',
    imported_by_display_name TEXT NOT NULL DEFAULT '',

    record_count INTEGER NOT NULL,

    records JSONB NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT historical_expectation_dataset_singleton
        CHECK (singleton_key = 'active'),

    CONSTRAINT historical_expectation_dataset_user_fk
        FOREIGN KEY (imported_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT historical_expectation_dataset_schema_positive
        CHECK (schema_version > 0),

    CONSTRAINT historical_expectation_dataset_record_count
        CHECK (record_count = 168),

    CONSTRAINT historical_expectation_dataset_records_array
        CHECK (jsonb_typeof(records) = 'array'),

    CONSTRAINT historical_expectation_dataset_records_length
        CHECK (jsonb_array_length(records) = 168)
);

CREATE INDEX IF NOT EXISTS historical_expectation_dataset_imported_at_index
    ON historical_expectation_dataset (imported_at DESC);

CREATE INDEX IF NOT EXISTS historical_expectation_dataset_imported_by_index
    ON historical_expectation_dataset (imported_by_user_id);

COMMIT;