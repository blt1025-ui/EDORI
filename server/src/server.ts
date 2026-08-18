/**
 * server
 *
 * EDORI API + production frontend process entry point.
 */

import "./config/environment.js";


import {

    existsSync

}

from "node:fs";


import {

    resolve

}

from "node:path";


import express from "express";


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


const DEFAULT_HOST =

    "0.0.0.0";


const configuredPort =

    Number(

        process.env.PORT

        ??

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


const host =

    typeof process.env.EDORI_API_HOST === "string"

    &&

    process.env.EDORI_API_HOST.trim()

        ? process.env.EDORI_API_HOST.trim()

        : DEFAULT_HOST;


const app =

    createApp();


validateBackendEnvironment();


console.info(

    "EDORI backend environment:",

    getBackendEnvironmentSummary()

);


/**
 * Production/static frontend.
 *
 * Vite writes the compiled frontend to repository-root
 * /dist. If that directory exists, the same Express
 * process serves both the browser application and /api.
 *
 * This keeps EDORI on one origin:
 *
 *   http(s)://host/
 *   http(s)://host/api/...
 *
 * Development remains compatible because the backend can
 * still start without /dist while Vite is running
 * separately.
 */
const frontendDirectory =

    resolve(
        process.cwd(),
        "dist"
    );


const frontendIndex =

    resolve(
        frontendDirectory,
        "index.html"
    );


const frontendAvailable =

    existsSync(
        frontendIndex
    );


if(frontendAvailable){

    app.use(

        express.static(

            frontendDirectory,

            {
                index:
                    false,

                fallthrough:
                    true
            }

        )

    );


    /**
     * SPA fallback for browser routes.
     *
     * API requests are deliberately excluded. Existing API
     * 404/error behavior remains authoritative.
     */
    app.use(

        (
            request,
            response,
            next
        ) => {

            if(

                request.method !== "GET"

                ||

                request.path.startsWith(
                    "/api/"
                )

                ||

                request.path === "/api"

            ){

                next();

                return;

            }


            response.sendFile(

                frontendIndex,

                error => {

                    if(error){

                        next(
                            error
                        );

                    }

                }

            );

        }

    );


    console.info(

        `EDORI compiled frontend enabled: ${frontendDirectory}`

    );

}
else {

    console.warn(

        [
            "EDORI compiled frontend was not found.",
            `Expected: ${frontendIndex}`,
            "API-only mode will continue.",
            "Run npm run build before server:start to serve the browser application from this process."
        ].join(
            "\n"
        )

    );

}


/**
 * Verify PostgreSQL before opening the HTTP port.
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
            "EDORI server could not connect to PostgreSQL.",
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

        host,

        () => {

            console.info(

                [
                    "EDORI server started successfully.",
                    `Host: ${host}`,
                    `Port: ${port}`,
                    "PostgreSQL: connected",
                    `Local application: http://localhost:${port}`,
                    `Local health: http://localhost:${port}/api/health`,
                    frontendAvailable
                        ? "Frontend: compiled Vite application served by Express"
                        : "Frontend: API-only mode"
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

        `EDORI server received ${signal}. Shutting down.`

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