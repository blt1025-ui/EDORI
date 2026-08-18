/**
 * CredentialRepository
 *
 * PostgreSQL persistence for EDORI password credentials.
 */

import {

    databasePool

}

from "../database/database.js";


export interface DatabaseCredential {

    userId:string;

    passwordHash:string;

    passwordSalt:string;

    passwordAlgorithm:string;

    passwordIterations:number | null;

    mustChangePassword:boolean;

    passwordChangedAt:string;

    createdAt:string;

    updatedAt:string;

}


interface CredentialRow {

    user_id:string;

    password_hash:string;

    password_salt:string;

    password_algorithm:string;

    password_iterations:number | null;

    must_change_password:boolean;

    password_changed_at:Date;

    created_at:Date;

    updated_at:Date;

}


/**
 * Find credential material for one user.
 */
export async function findCredentialByUserId(

    userId:string

):Promise<DatabaseCredential | null> {

    const result =

        await databasePool.query<CredentialRow>(

            `
                SELECT
                    user_id,
                    password_hash,
                    password_salt,
                    password_algorithm,
                    password_iterations,
                    must_change_password,
                    password_changed_at,
                    created_at,
                    updated_at
                FROM user_credentials
                WHERE user_id = $1
                LIMIT 1
            `,

            [
                userId
            ]

        );


    return result.rows[0]

        ? mapCredentialRow(
            result.rows[0]
        )

        : null;

}


/**
 * Create or replace one user's password credential.
 */
export async function upsertCredential(

    input:{

        userId:string;

        passwordHash:string;

        passwordSalt:string;

        passwordAlgorithm:string;

        passwordIterations:number | null;

        mustChangePassword:boolean;

    }

):Promise<DatabaseCredential> {

    const result =

        await databasePool.query<CredentialRow>(

            `
                INSERT INTO user_credentials (
                    user_id,
                    password_hash,
                    password_salt,
                    password_algorithm,
                    password_iterations,
                    must_change_password,
                    password_changed_at,
                    created_at,
                    updated_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    NOW(),
                    NOW(),
                    NOW()
                )
                ON CONFLICT (user_id)
                DO UPDATE SET
                    password_hash = EXCLUDED.password_hash,
                    password_salt = EXCLUDED.password_salt,
                    password_algorithm = EXCLUDED.password_algorithm,
                    password_iterations = EXCLUDED.password_iterations,
                    must_change_password = EXCLUDED.must_change_password,
                    password_changed_at = NOW(),
                    updated_at = NOW()
                RETURNING
                    user_id,
                    password_hash,
                    password_salt,
                    password_algorithm,
                    password_iterations,
                    must_change_password,
                    password_changed_at,
                    created_at,
                    updated_at
            `,

            [
                input.userId,
                input.passwordHash,
                input.passwordSalt,
                input.passwordAlgorithm,
                input.passwordIterations,
                input.mustChangePassword
            ]

        );


    const row =
        result.rows[0];


    if(!row){

        throw new Error(

            "EDORI credential persistence did not return a record."

        );

    }


    return mapCredentialRow(
        row
    );

}


function mapCredentialRow(

    row:CredentialRow

):DatabaseCredential {

    return {

        userId:
            row.user_id,

        passwordHash:
            row.password_hash,

        passwordSalt:
            row.password_salt,

        passwordAlgorithm:
            row.password_algorithm,

        passwordIterations:
            row.password_iterations,

        mustChangePassword:
            row.must_change_password,

        passwordChangedAt:
            new Date(
                row.password_changed_at
            ).toISOString(),

        createdAt:
            new Date(
                row.created_at
            ).toISOString(),

        updatedAt:
            new Date(
                row.updated_at
            ).toISOString()

    };

}