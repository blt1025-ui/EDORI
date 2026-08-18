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


import {

    assessmentSnapshotRouter

}

from "./routes/AssessmentSnapshotRoutes.js";


import {

    historicalExpectationRouter

}

from "./routes/HistoricalExpectationRoutes.js";

import {

    currentOperationalStateRouter

}

from "./routes/CurrentOperationalStateRoutes.js";


import {

    authRouter

}

from "./routes/AuthRoutes.js";


import {

    adminUserRouter

}

from "./routes/AdminUserRoutes.js";


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
     * Authentication API.
     */
    app.use(

        "/api/auth",

        authRouter

    );


    /**
     * Administrator user-management API.
     */
    app.use(

        "/api/admin/users",

        adminUserRouter

    );


    /**
     * Completed Hospital Readiness assessment history.
     */
    app.use(

        "/api/assessments",

        assessmentSnapshotRouter

    );

    /**
 * Shared historical expectation dataset.
 */
app.use(

    "/api/historical-expectations",

    historicalExpectationRouter

);

    /**
     * Shared current Hospital Readiness operational state.
     */
    app.use(

        "/api/state",

        currentOperationalStateRouter

    );


    /**
     * API + PostgreSQL health endpoint.
     */
    app.get(

        "/api/health",

        async (_request, response) => {

            const database =

                await checkDatabaseConnection();


            response.status(

                database.connected
                    ? 200
                    : 503

            ).json({

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

            });

        }

    );


    /**
     * Unknown API routes return JSON.
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


    /**
     * Final API error handler.
     */
    app.use(

        (
            error:unknown,
            _request:express.Request,
            response:express.Response,
            _next:express.NextFunction
        ) => {

            console.error(

                "Unhandled EDORI API error:",

                error

            );


            response.status(500).json({

                error:
                    "internal_server_error",

                message:
                    "EDORI could not complete the request."

            });

        }

    );


    return app;

}