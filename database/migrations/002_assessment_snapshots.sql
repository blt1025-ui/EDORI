BEGIN;

CREATE TABLE IF NOT EXISTS assessment_snapshots (
    id TEXT PRIMARY KEY,

    assessment_timestamp TIMESTAMPTZ NOT NULL,
    schema_version INTEGER NOT NULL,

    entered_by_user_id TEXT,
    entered_by_display_name TEXT NOT NULL DEFAULT '',
    entered_by_username TEXT NOT NULL DEFAULT '',

    score DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL,
    operational_state_title TEXT NOT NULL,

    assessment_day TEXT NOT NULL,
    assessment_hour INTEGER NOT NULL,
    forecast_hours INTEGER NOT NULL,

    total_ed_volume DOUBLE PRECISION NOT NULL,
    boarded_patients DOUBLE PRECISION NOT NULL,

    staffed_acute_care_beds DOUBLE PRECISION NOT NULL,
    occupied_acute_care_beds DOUBLE PRECISION NOT NULL,

    staffed_critical_care_beds DOUBLE PRECISION NOT NULL,
    occupied_critical_care_beds DOUBLE PRECISION NOT NULL,

    projected_total_bed_demand DOUBLE PRECISION NOT NULL,
    projected_capacity_variance DOUBLE PRECISION NOT NULL,

    payload JSONB NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT assessment_snapshots_user_fk
        FOREIGN KEY (entered_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT assessment_snapshots_schema_positive
        CHECK (schema_version > 0),

    CONSTRAINT assessment_snapshots_score_range
        CHECK (score >= 0 AND score <= 100),

    CONSTRAINT assessment_snapshots_hour_range
        CHECK (assessment_hour >= 0 AND assessment_hour <= 23),

    CONSTRAINT assessment_snapshots_forecast_positive
        CHECK (forecast_hours > 0),

    CONSTRAINT assessment_snapshots_status_not_blank
        CHECK (BTRIM(status) <> ''),

    CONSTRAINT assessment_snapshots_state_not_blank
        CHECK (BTRIM(operational_state_title) <> ''),

    CONSTRAINT assessment_snapshots_day_not_blank
        CHECK (BTRIM(assessment_day) <> ''),

    CONSTRAINT assessment_snapshots_payload_object
        CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX IF NOT EXISTS assessment_snapshots_timestamp_index
    ON assessment_snapshots (assessment_timestamp DESC);

CREATE INDEX IF NOT EXISTS assessment_snapshots_score_index
    ON assessment_snapshots (score);

CREATE INDEX IF NOT EXISTS assessment_snapshots_state_index
    ON assessment_snapshots (operational_state_title);

CREATE INDEX IF NOT EXISTS assessment_snapshots_entered_by_index
    ON assessment_snapshots (entered_by_user_id);

CREATE INDEX IF NOT EXISTS assessment_snapshots_day_hour_index
    ON assessment_snapshots (assessment_day, assessment_hour);

CREATE INDEX IF NOT EXISTS assessment_snapshots_payload_gin_index
    ON assessment_snapshots
    USING GIN (payload);

COMMIT;