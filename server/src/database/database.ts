/**
 * database
 *
 * Central PostgreSQL connection pool for EDORI.
 *
 * node-postgres automatically reads the standard
 * PostgreSQL environment variables:
 *
 * PGHOST
 * PGPORT
 * PGDATABASE
 * PGUSER
 * PGPASSWORD
 */

import {

    Pool

}

from "pg";


/**
 * One shared pool for the entire EDORI API process.
 */
export const databasePool =

    new Pool({

        max:
            10,

        connectionTimeoutMillis:
            5000,

        idleTimeoutMillis:
            30000

    });


/**
 * Log unexpected errors from idle pooled clients.
 */
databasePool.on(

    "error",

    error => {

        console.error(

            "Unexpected EDORI PostgreSQL pool error:",

            error

        );

    }

);


/**
 * Verify that PostgreSQL can execute a simple query.
 */
export async function checkDatabaseConnection():Promise<{

    connected:boolean;

    databaseTime?:string;

    error?:string;

}> {

    try {

        const result =

            await databasePool.query<{

                database_time:Date;

            }>(

                `
                    SELECT
                        NOW() AS database_time
                `

            );


        const databaseTime =

            result.rows[0]?.database_time;


        return {

            connected:
                true,

            databaseTime:
                databaseTime
                    ? new Date(
                        databaseTime
                    ).toISOString()
                    : undefined

        };

    }
    catch(error){

        console.error(

            "EDORI PostgreSQL health check failed:",

            error

        );


        return {

            connected:
                false,

            error:
                error instanceof Error
                    ? error.message
                    : "Unknown PostgreSQL connection error."

        };

    }

}


/**
 * Drain the pool during process shutdown.
 */
export async function closeDatabasePool():Promise<void> {

    await databasePool.end();

}