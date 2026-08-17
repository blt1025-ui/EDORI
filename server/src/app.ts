/**
 * app
 *
 * Creates the EDORI Express application.
 */

import express from "express";


import {

    checkDatabaseConnection

}

from "./database/database.js";


/**
 * Create and configure the EDORI API.
 */
export function createApp() {

    const app =

        express();


    app.disable(
        "x-powered-by"
    );


    app.use(

        express.json({

            limit:
                "1mb"

        })

    );


    /**
     * API + PostgreSQL health endpoint.
     */
    app.get(

        "/api/health",

        async (_request, response) => {

            const database =

                await checkDatabaseConnection();


            const responseBody = {

                status:
                    database.connected
                        ? "ok"
                        : "degraded",

                service:
                    "edori-api",

                database:
                    database.connected
                        ? "connected"
                        : "disconnected",

                timestamp:
                    new Date().toISOString(),

                databaseTime:
                    database.databaseTime
                    ?? null

            };


            response.status(

                database.connected
                    ? 200
                    : 503

            ).json(

                responseBody

            );

        }

    );


    /**
     * Unknown API routes return JSON rather than HTML.
     */
    app.use(

        "/api",

        (_request, response) => {

            response.status(404).json({

                error:
                    "not_found",

                message:
                    "The requested EDORI API endpoint does not exist."

            });

        }

    );


    return app;

}