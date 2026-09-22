CREATE TABLE IF NOT EXISTS executive_report_recipients (
    id BIGSERIAL PRIMARY KEY,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id TEXT NOT NULL,
    created_by_username TEXT NOT NULL,
    created_by_display_name TEXT NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id TEXT NOT NULL,
    updated_by_username TEXT NOT NULL,
    updated_by_display_name TEXT NOT NULL,

    CONSTRAINT executive_report_recipients_display_name_not_blank
        CHECK (BTRIM(display_name) <> ''),

    CONSTRAINT executive_report_recipients_email_not_blank
        CHECK (BTRIM(email) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS executive_report_recipients_email_unique
    ON executive_report_recipients (
        LOWER(BTRIM(email))
    );

CREATE INDEX IF NOT EXISTS executive_report_recipients_enabled_idx
    ON executive_report_recipients (
        enabled,
        display_name,
        id
    );


CREATE TABLE IF NOT EXISTS executive_report_distributions (
    id BIGSERIAL PRIMARY KEY,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    initiated_by_user_id TEXT NOT NULL,
    initiated_by_username TEXT NOT NULL,
    initiated_by_display_name TEXT NOT NULL,

    assessment_timestamp TIMESTAMPTZ NOT NULL,

    hri_score NUMERIC(6,2) NOT NULL,

    operational_level TEXT NOT NULL,

    subject TEXT NOT NULL,

    recipient_count INTEGER NOT NULL,

    accepted_count INTEGER NOT NULL DEFAULT 0,

    failed_count INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL,

    provider TEXT NOT NULL DEFAULT 'brevo',

    provider_message_ids JSONB NOT NULL DEFAULT '[]'::jsonb,

    failure_message TEXT,

    completed_at TIMESTAMPTZ,

    CONSTRAINT executive_report_distributions_recipient_count_nonnegative
        CHECK (
            recipient_count >= 0
        ),

    CONSTRAINT executive_report_distributions_accepted_count_nonnegative
        CHECK (
            accepted_count >= 0
        ),

    CONSTRAINT executive_report_distributions_failed_count_nonnegative
        CHECK (
            failed_count >= 0
        ),

    CONSTRAINT executive_report_distributions_status_valid
        CHECK (
            status IN (
                'pending',
                'accepted',
                'partial',
                'failed',
                'sandbox'
            )
        )
);

CREATE INDEX IF NOT EXISTS executive_report_distributions_created_at_idx
    ON executive_report_distributions (
        created_at DESC,
        id DESC
    );

CREATE INDEX IF NOT EXISTS executive_report_distributions_status_idx
    ON executive_report_distributions (
        status,
        created_at DESC
    );