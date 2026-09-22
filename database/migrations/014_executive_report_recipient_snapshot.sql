ALTER TABLE executive_report_distributions
ADD COLUMN recipient_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE executive_report_distributions
ADD CONSTRAINT executive_report_distributions_recipient_snapshot_array_check
CHECK (
    jsonb_typeof(recipient_snapshot) = 'array'
);