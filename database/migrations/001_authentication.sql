BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_username_not_blank CHECK (BTRIM(username) <> ''),
    CONSTRAINT users_display_name_not_blank CHECK (BTRIM(display_name) <> ''),
    CONSTRAINT users_role_valid CHECK (role IN ('viewer','operator','administrator'))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique
    ON users (LOWER(username));

CREATE INDEX IF NOT EXISTS users_active_role_index
    ON users (active, role);

CREATE TABLE IF NOT EXISTS user_credentials (
    user_id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_algorithm TEXT NOT NULL,
    password_iterations INTEGER,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_credentials_user_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT user_credentials_algorithm_not_blank
        CHECK (BTRIM(password_algorithm) <> ''),
    CONSTRAINT user_credentials_iterations_positive
        CHECK (password_iterations IS NULL OR password_iterations > 0)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    inactivity_expires_at TIMESTAMPTZ,
    absolute_expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    user_agent TEXT,
    remote_address TEXT,
    CONSTRAINT user_sessions_user_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_token_hash_unique
    ON user_sessions (session_token_hash);

CREATE INDEX IF NOT EXISTS user_sessions_active_user_index
    ON user_sessions (user_id, revoked_at);

CREATE INDEX IF NOT EXISTS user_sessions_expiration_index
    ON user_sessions (inactivity_expires_at, absolute_expires_at);

CREATE TABLE IF NOT EXISTS login_security (
    username_key TEXT PRIMARY KEY,
    failed_attempt_count INTEGER NOT NULL DEFAULT 0,
    first_failed_attempt_at TIMESTAMPTZ,
    last_failed_attempt_at TIMESTAMPTZ,
    locked_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT login_security_username_not_blank
        CHECK (BTRIM(username_key) <> ''),
    CONSTRAINT login_security_failed_attempts_nonnegative
        CHECK (failed_attempt_count >= 0)
);

CREATE INDEX IF NOT EXISTS login_security_locked_until_index
    ON login_security (locked_until);

CREATE TABLE IF NOT EXISTS security_audit_log (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type TEXT NOT NULL,
    actor_user_id TEXT,
    actor_username TEXT NOT NULL DEFAULT '',
    actor_display_name TEXT NOT NULL DEFAULT '',
    target_user_id TEXT,
    target_username TEXT NOT NULL DEFAULT '',
    target_display_name TEXT NOT NULL DEFAULT '',
    success BOOLEAN NOT NULL,
    summary TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    remote_address TEXT,
    user_agent TEXT,
    CONSTRAINT security_audit_event_type_not_blank CHECK (BTRIM(event_type) <> ''),
    CONSTRAINT security_audit_summary_not_blank CHECK (BTRIM(summary) <> ''),
    CONSTRAINT security_audit_actor_user_fk
        FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT security_audit_target_user_fk
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS security_audit_timestamp_index
    ON security_audit_log (timestamp DESC);

CREATE INDEX IF NOT EXISTS security_audit_event_type_index
    ON security_audit_log (event_type);

CREATE INDEX IF NOT EXISTS security_audit_actor_index
    ON security_audit_log (actor_user_id);

CREATE INDEX IF NOT EXISTS security_audit_target_index
    ON security_audit_log (target_user_id);

COMMIT;