/**
 * verifyUsers
 *
 * Development helper for confirming PostgreSQL user and
 * credential records without revealing password hashes.
 */

import "../config/environment.js";


import {

    databasePool,
    closeDatabasePool

}

from "../database/database.js";


interface VerificationRow {

    username:string;

    display_name:string;

    role:string;

    active:boolean;

    credential_configured:boolean;

    password_algorithm:string | null;

    must_change_password:boolean | null;

    password_changed_at:Date | null;

}


try {

    const result =

        await databasePool.query<VerificationRow>(

            `
                SELECT
                    u.username,
                    u.display_name,
                    u.role,
                    u.active,
                    (c.user_id IS NOT NULL) AS credential_configured,
                    c.password_algorithm,
                    c.must_change_password,
                    c.password_changed_at
                FROM users u
                LEFT JOIN user_credentials c
                    ON c.user_id = u.id
                ORDER BY
                    u.username
            `

        );


    console.table(

        result.rows.map(

            row => ({

                username:
                    row.username,

                displayName:
                    row.display_name,

                role:
                    row.role,

                active:
                    row.active,

                credentialConfigured:
                    row.credential_configured,

                passwordAlgorithm:
                    row.password_algorithm,

                mustChangePassword:
                    row.must_change_password,

                passwordChangedAt:
                    row.password_changed_at
                        ? new Date(
                            row.password_changed_at
                        ).toISOString()
                        : null

            })

        )

    );

}
finally {

    await closeDatabasePool();

}