/**
 * UserRepository
 *
 * PostgreSQL persistence for EDORI application users.
 */

import {

    randomUUID

}

from "node:crypto";


import {

    databasePool

}

from "../database/database.js";


export type RoleId =

    | "viewer"
    | "operator"
    | "administrator";


export interface DatabaseUser {

    id:string;

    username:string;

    displayName:string;

    email:string;

    role:RoleId;

    active:boolean;

    createdAt:string;

    updatedAt:string;

}


interface UserRow {

    id:string;

    username:string;

    display_name:string;

    email:string;

    role:RoleId;

    active:boolean;

    created_at:Date;

    updated_at:Date;

}


/**
 * Return every EDORI user.
 */
export async function listUsers():Promise<DatabaseUser[]> {

    const result =

        await databasePool.query<UserRow>(

            `
                SELECT
                    id,
                    username,
                    display_name,
                    email,
                    role,
                    active,
                    created_at,
                    updated_at
                FROM users
                ORDER BY
                    LOWER(display_name),
                    LOWER(username)
            `

        );


    return result.rows.map(
        mapUserRow
    );

}


/**
 * Find one user by case-insensitive username.
 */
export async function findUserByUsername(

    username:string

):Promise<DatabaseUser | null> {

    const result =

        await databasePool.query<UserRow>(

            `
                SELECT
                    id,
                    username,
                    display_name,
                    email,
                    role,
                    active,
                    created_at,
                    updated_at
                FROM users
                WHERE LOWER(username) = LOWER($1)
                LIMIT 1
            `,

            [
                username.trim()
            ]

        );


    return result.rows[0]

        ? mapUserRow(
            result.rows[0]
        )

        : null;

}


/**
 * Find one user by ID.
 */
export async function findUserById(

    userId:string

):Promise<DatabaseUser | null> {

    const result =

        await databasePool.query<UserRow>(

            `
                SELECT
                    id,
                    username,
                    display_name,
                    email,
                    role,
                    active,
                    created_at,
                    updated_at
                FROM users
                WHERE id = $1
                LIMIT 1
            `,

            [
                userId
            ]

        );


    return result.rows[0]

        ? mapUserRow(
            result.rows[0]
        )

        : null;

}


/**
 * Create one EDORI user.
 */
export async function createUser(

    input:{

        username:string;

        displayName:string;

        email?:string;

        role:RoleId;

        active?:boolean;

    }

):Promise<DatabaseUser> {

    const username =

        normalizeRequiredText(

            input.username,

            "Username"

        );


    const displayName =

        normalizeRequiredText(

            input.displayName,

            "Display name"

        );


    const id =

        randomUUID();


    try {

        const result =

            await databasePool.query<UserRow>(

                `
                    INSERT INTO users (
                        id,
                        username,
                        display_name,
                        email,
                        role,
                        active
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6
                    )
                    RETURNING
                        id,
                        username,
                        display_name,
                        email,
                        role,
                        active,
                        created_at,
                        updated_at
                `,

                [
                    id,
                    username,
                    displayName,
                    input.email?.trim() ?? "",
                    input.role,
                    input.active ?? true
                ]

            );


        const row =
            result.rows[0];


        if(!row){

            throw new Error(

                "EDORI user creation did not return a user."

            );

        }


        return mapUserRow(
            row
        );

    }
    catch(error){

        if(

            isPostgreSqlUniqueViolation(
                error
            )

        ){

            throw new Error(

                "An EDORI user with that username already exists."

            );

        }


        throw error;

    }

}


/**
 * Update one EDORI user while preserving at least one
 * active Administrator.
 */
export async function updateUser(

    userId:string,

    changes:{

        username?:string;

        displayName?:string;

        email?:string;

        role?:RoleId;

        active?:boolean;

    }

):Promise<DatabaseUser> {

    const client =

        await databasePool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        const existingResult =

            await client.query<UserRow>(

                `
                    SELECT
                        id,
                        username,
                        display_name,
                        email,
                        role,
                        active,
                        created_at,
                        updated_at
                    FROM users
                    WHERE id = $1
                    FOR UPDATE
                `,

                [
                    userId
                ]

            );


        const existing =
            existingResult.rows[0];


        if(!existing){

            throw new Error(
                "User not found."
            );

        }


        const username =

            changes.username === undefined

                ? existing.username

                : normalizeRequiredText(
                    changes.username,
                    "Username"
                );


        const displayName =

            changes.displayName === undefined

                ? existing.display_name

                : normalizeRequiredText(
                    changes.displayName,
                    "Display name"
                );


        const email =

            changes.email === undefined

                ? existing.email

                : changes.email.trim();


        const role =

            changes.role
            ?? existing.role;


        const active =

            changes.active
            ?? existing.active;


        const removesActiveAdministrator =

            existing.active

            &&

            existing.role === "administrator"

            &&

            (
                !active

                ||

                role !== "administrator"
            );


        if(removesActiveAdministrator){

            const countResult =

                await client.query<{

                    count:string;

                }>(

                    `
                        SELECT COUNT(*)::text AS count
                        FROM users
                        WHERE
                            id <> $1
                            AND active = TRUE
                            AND role = 'administrator'
                    `,

                    [
                        userId
                    ]

                );


            if(

                Number(
                    countResult.rows[0]?.count
                    ?? "0"
                )

                < 1

            ){

                throw new Error(

                    "EDORI must retain at least one active Administrator."

                );

            }

        }


        const result =

            await client.query<UserRow>(

                `
                    UPDATE users
                    SET
                        username = $2,
                        display_name = $3,
                        email = $4,
                        role = $5,
                        active = $6,
                        updated_at = NOW()
                    WHERE id = $1
                    RETURNING
                        id,
                        username,
                        display_name,
                        email,
                        role,
                        active,
                        created_at,
                        updated_at
                `,

                [
                    userId,
                    username,
                    displayName,
                    email,
                    role,
                    active
                ]

            );


        await client.query(
            "COMMIT"
        );


        const row =
            result.rows[0];


        if(!row){

            throw new Error(
                "User not found."
            );

        }


        return mapUserRow(
            row
        );

    }
    catch(error){

        await client.query(
            "ROLLBACK"
        );


        if(

            isPostgreSqlUniqueViolation(
                error
            )

        ){

            throw new Error(

                "An EDORI user with that username already exists."

            );

        }


        throw error;

    }
    finally {

        client.release();

    }

}


/**
 * Count active Administrators.
 */
export async function countActiveAdministrators():Promise<number> {

    const result =

        await databasePool.query<{

            count:string;

        }>(

            `
                SELECT COUNT(*)::text AS count
                FROM users
                WHERE
                    active = TRUE
                    AND role = 'administrator'
            `

        );


    return Number(
        result.rows[0]?.count
        ?? "0"
    );

}


function mapUserRow(

    row:UserRow

):DatabaseUser {

    return {

        id:
            row.id,

        username:
            row.username,

        displayName:
            row.display_name,

        email:
            row.email,

        role:
            row.role,

        active:
            row.active,

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


function normalizeRequiredText(

    value:string,

    label:string

):string {

    const normalized =
        value.trim();


    if(!normalized){

        throw new Error(

            `${label} is required.`

        );

    }


    return normalized;

}


function isPostgreSqlUniqueViolation(

    error:unknown

):boolean {

    return (

        typeof error === "object"

        &&

        error !== null

        &&

        "code" in error

        &&

        (
            error as {
                code?:unknown;
            }
        ).code === "23505"

    );

}