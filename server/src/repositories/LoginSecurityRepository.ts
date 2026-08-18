/**
 * LoginSecurityRepository
 *
 * PostgreSQL-backed failed-login and lockout state.
 */

import {

    databasePool

}

from "../database/database.js";


const MAX_FAILED_ATTEMPTS = 5;

const FAILED_ATTEMPT_WINDOW_MINUTES = 15;

const LOCKOUT_MINUTES = 15;


export async function isUsernameLocked(

    username:string

):Promise<boolean> {

    const usernameKey =
        normalizeUsername(
            username
        );


    const result =

        await databasePool.query<{

            locked_until:Date | null;

        }>(

            `
                SELECT locked_until
                FROM login_security
                WHERE username_key = $1
                LIMIT 1
            `,

            [
                usernameKey
            ]

        );


    const lockedUntil =
        result.rows[0]?.locked_until;


    return (

        lockedUntil !== null

        &&

        lockedUntil !== undefined

        &&

        new Date(
            lockedUntil
        ).getTime() > Date.now()

    );

}


export async function recordFailedLogin(

    username:string

):Promise<{

    locked:boolean;

}> {

    const usernameKey =
        normalizeUsername(
            username
        );


    const client =
        await databasePool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        const result =

            await client.query<{

                failed_attempt_count:number;

                first_failed_attempt_at:Date | null;

            }>(

                `
                    SELECT
                        failed_attempt_count,
                        first_failed_attempt_at
                    FROM login_security
                    WHERE username_key = $1
                    FOR UPDATE
                `,

                [
                    usernameKey
                ]

            );


        const row =
            result.rows[0];


        const now =
            new Date();


        let failedAttemptCount = 1;

        let firstFailedAttemptAt =
            now;


        if(

            row

            &&

            row.first_failed_attempt_at

            &&

            (
                now.getTime()

                -

                new Date(
                    row.first_failed_attempt_at
                ).getTime()

            )

            <=

            FAILED_ATTEMPT_WINDOW_MINUTES
            *
            60_000

        ){

            failedAttemptCount =

                row.failed_attempt_count
                +
                1;


            firstFailedAttemptAt =

                new Date(
                    row.first_failed_attempt_at
                );

        }


        const locked =

            failedAttemptCount
            >=
            MAX_FAILED_ATTEMPTS;


        const lockedUntil =

            locked

                ? new Date(

                    now.getTime()

                    +

                    LOCKOUT_MINUTES
                    *
                    60_000

                )

                : null;


        await client.query(

            `
                INSERT INTO login_security (
                    username_key,
                    failed_attempt_count,
                    first_failed_attempt_at,
                    last_failed_attempt_at,
                    locked_until,
                    updated_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    NOW()
                )
                ON CONFLICT (username_key)
                DO UPDATE SET
                    failed_attempt_count = EXCLUDED.failed_attempt_count,
                    first_failed_attempt_at = EXCLUDED.first_failed_attempt_at,
                    last_failed_attempt_at = EXCLUDED.last_failed_attempt_at,
                    locked_until = EXCLUDED.locked_until,
                    updated_at = NOW()
            `,

            [
                usernameKey,
                failedAttemptCount,
                firstFailedAttemptAt,
                now,
                lockedUntil
            ]

        );


        await client.query(
            "COMMIT"
        );


        return {
            locked
        };

    }
    catch(error){

        await client.query(
            "ROLLBACK"
        );


        throw error;

    }
    finally {

        client.release();

    }

}


export async function clearFailedLogins(

    username:string

):Promise<void> {

    await databasePool.query(

        `
            DELETE FROM login_security
            WHERE username_key = $1
        `,

        [
            normalizeUsername(
                username
            )
        ]

    );

}


function normalizeUsername(

    username:string

):string {

    return username
        .trim()
        .toLowerCase();

}