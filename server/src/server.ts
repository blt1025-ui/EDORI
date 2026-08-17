/**
 * server
 *
 * EDORI API process entry point.
 */

import "./config/environment.js";

import {

    getBackendEnvironmentSummary,
    validateBackendEnvironment

}

from "./config/environment.js";


import {

    createApp

}

from "./app.js";


import {

    checkDatabaseConnection,
    closeDatabasePool

}

from "./database/database.js";


const DEFAULT_PORT =

    3001;


const configuredPort =

    Number(
        process.env.EDORI_API_PORT
    );


const port =

    Number.isInteger(
        configuredPort
    )

    &&

    configuredPort > 0

        ? configuredPort

        : DEFAULT_PORT;


const app =

    createApp();


validateBackendEnvironment();


console.info(

    "EDORI backend environment:",

    getBackendEnvironmentSummary()

);

/**
 * Verify PostgreSQL before opening the API port.
 *
 * This gives us a clear startup failure during setup
 * rather than allowing EDORI to appear healthy while
 * its authoritative database is unavailable.
 */
const databaseStatus =

    await checkDatabaseConnection();


if(!databaseStatus.connected){

    console.error(

        [
            "EDORI API could not connect to PostgreSQL.",
            "Check PGHOST, PGPORT, PGDATABASE, PGUSER, and PGPASSWORD.",
            databaseStatus.error
                ? `Database error: ${databaseStatus.error}`
                : ""
        ]
            .filter(Boolean)
            .join("\n")

    );


    await closeDatabasePool();


    process.exit(1);

}


const server =

    app.listen(

        port,

        () => {

            console.info(

                [
                    "EDORI API started successfully.",
                    `Port: ${port}`,
                    "PostgreSQL: connected",
                    `Health: http://localhost:${port}/api/health`
                ].join(
                    "\n"
                )

            );

        }

    );


let shuttingDown = false;


/**
 * Shut down HTTP and PostgreSQL cleanly.
 */
function shutdown(

    signal:string

):void {

    if(shuttingDown){

        return;

    }


    shuttingDown =
        true;


    console.info(

        `EDORI API received ${signal}. Shutting down.`

    );


    server.close(

        async error => {

            if(error){

                console.error(

                    "EDORI HTTP server could not shut down cleanly.",

                    error

                );


                process.exitCode =
                    1;

            }


            try {

                await closeDatabasePool();

            }
            catch(databaseError){

                console.error(

                    "EDORI PostgreSQL pool could not shut down cleanly.",

                    databaseError

                );


                process.exitCode =
                    1;

            }


            process.exit();

        }

    );

}


process.on(

    "SIGINT",

    () => {

        shutdown(
            "SIGINT"
        );

    }

);


process.on(

    "SIGTERM",

    () => {

        shutdown(
            "SIGTERM"
        );

    }

);