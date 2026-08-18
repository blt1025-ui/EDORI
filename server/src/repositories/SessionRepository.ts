/**
 * SessionRepository
 *
 * PostgreSQL persistence for EDORI authenticated sessions.
 */

import {

    createHash,
    randomBytes,
    randomUUID

}

from "node:crypto";


import {

    databasePool

}

from "../database/database.js";


export interface CreatedSession {

    sessionId:string;

    sessionToken:string;

    inactivityExpiresAt:string | null;

    absoluteExpiresAt:string | null;

}


export interface DatabaseSession {

    id:string;

    userId:string;

    lastActivityAt:string;

    inactivityExpiresAt:string | null;

    absoluteExpiresAt:string | null;

    revokedAt:string | null;

}


interface SessionRow {

    id:string;

    user_id:string;

    last_activity_at:Date;

    inactivity_expires_at:Date | null;

    absolute_expires_at:Date | null;

    revoked_at:Date | null;

}


export async function createSession(

    input:{

        userId:string;

        inactivityTimeoutMinutes:number | null;

        absoluteTimeoutHours:number;

        userAgent?:string;

        remoteAddress?:string;

    }

):Promise<CreatedSession> {

    const sessionId =

        randomUUID();


    const sessionToken =

        randomBytes(
            32
        ).toString(
            "base64url"
        );


    const tokenHash =

        hashSessionToken(
            sessionToken
        );


    const inactivityExpiresAt =

        input.inactivityTimeoutMinutes === null

            ? null

            : new Date(

                Date.now()

                +

                input.inactivityTimeoutMinutes
                *
                60_000

            );


    const absoluteExpiresAt =

        new Date(

            Date.now()

            +

            input.absoluteTimeoutHours
            *
            60
            *
            60_000

        );


    await databasePool.query(

        `
            INSERT INTO user_sessions (
                id,
                user_id,
                session_token_hash,
                inactivity_expires_at,
                absolute_expires_at,
                user_agent,
                remote_address
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )
        `,

        [
            sessionId,
            input.userId,
            tokenHash,
            inactivityExpiresAt,
            absoluteExpiresAt,
            input.userAgent ?? null,
            input.remoteAddress ?? null
        ]

    );


    return {

        sessionId,

        sessionToken,

        inactivityExpiresAt:
            inactivityExpiresAt
                ? inactivityExpiresAt.toISOString()
                : null,

        absoluteExpiresAt:
            absoluteExpiresAt.toISOString()

    };

}


export async function findActiveSessionByToken(

    sessionToken:string

):Promise<DatabaseSession | null> {

    const tokenHash =

        hashSessionToken(
            sessionToken
        );


    const result =

        await databasePool.query<SessionRow>(

            `
                SELECT
                    id,
                    user_id,
                    last_activity_at,
                    inactivity_expires_at,
                    absolute_expires_at,
                    revoked_at
                FROM user_sessions
                WHERE
                    session_token_hash = $1
                    AND revoked_at IS NULL
                    AND (
                        inactivity_expires_at IS NULL
                        OR inactivity_expires_at > NOW()
                    )
                    AND absolute_expires_at > NOW()
                LIMIT 1
            `,

            [
                tokenHash
            ]

        );


    const row =
        result.rows[0];


    if(!row){

        return null;

    }


    return {

        id:
            row.id,

        userId:
            row.user_id,

        lastActivityAt:
            new Date(
                row.last_activity_at
            ).toISOString(),

        inactivityExpiresAt:
            row.inactivity_expires_at
                ? new Date(
                    row.inactivity_expires_at
                ).toISOString()
                : null,

        absoluteExpiresAt:
            row.absolute_expires_at
                ? new Date(
                    row.absolute_expires_at
                ).toISOString()
                : null,

        revokedAt:
            row.revoked_at
                ? new Date(
                    row.revoked_at
                ).toISOString()
                : null

    };

}


export async function refreshSessionActivity(

    sessionId:string,

    inactivityTimeoutMinutes:number | null

):Promise<void> {

    await databasePool.query(

        `
            UPDATE user_sessions
            SET
                last_activity_at = NOW(),
                inactivity_expires_at =
                    CASE
                        WHEN $2::integer IS NULL
                            THEN NULL
                        ELSE
                            NOW()
                            +
                            ($2::integer * INTERVAL '1 minute')
                    END
            WHERE
                id = $1
                AND revoked_at IS NULL
                AND absolute_expires_at > NOW()
        `,

        [
            sessionId,
            inactivityTimeoutMinutes
        ]

    );

}


export async function revokeSessionByToken(

    sessionToken:string,

    reason:string

):Promise<void> {

    await databasePool.query(

        `
            UPDATE user_sessions
            SET
                revoked_at = NOW(),
                revoked_reason = $2
            WHERE
                session_token_hash = $1
                AND revoked_at IS NULL
        `,

        [
            hashSessionToken(
                sessionToken
            ),
            reason
        ]

    );

}


export async function revokeSessionsForUser(

    userId:string,

    reason:string

):Promise<void> {

    await databasePool.query(

        `
            UPDATE user_sessions
            SET
                revoked_at = NOW(),
                revoked_reason = $2
            WHERE
                user_id = $1
                AND revoked_at IS NULL
        `,

        [
            userId,
            reason
        ]

    );

}


export async function deleteStaleSessions(

    retentionHours:number

):Promise<number> {

    const result =

        await databasePool.query(

            `
                DELETE FROM user_sessions
                WHERE
                    (
                        revoked_at IS NOT NULL
                        AND revoked_at
                            <
                            NOW()
                            -
                            ($1::integer * INTERVAL '1 hour')
                    )
                    OR
                    (
                        revoked_at IS NULL
                        AND absolute_expires_at
                            <
                            NOW()
                            -
                            ($1::integer * INTERVAL '1 hour')
                    )
                    OR
                    (
                        revoked_at IS NULL
                        AND inactivity_expires_at IS NOT NULL
                        AND inactivity_expires_at
                            <
                            NOW()
                            -
                            ($1::integer * INTERVAL '1 hour')
                    )
            `,

            [
                retentionHours
            ]

        );


    return result.rowCount

        ?? 0;

}


function hashSessionToken(

    sessionToken:string

):string {

    return createHash(
        "sha256"
    )
        .update(
            sessionToken
        )
        .digest(
            "hex"
        );

}