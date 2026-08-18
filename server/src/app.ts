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

    modelConfigurationRouter

}

from "./routes/ModelConfigurationRoutes.js";

import {

    triggerConfigurationRouter

}

from "./routes/TriggerConfigurationRoutes.js";


import {

    securityAuditRouter

}

from "./routes/SecurityAuditRoutes.js";

import {

    surgePlanRouter

}

from "./routes/SurgePlanRoutes.js";

import {

    currentResultRouter

}

from "./routes/CurrentResultRoutes.js";


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


/**
 * Railway terminates public HTTPS before forwarding
 * requests to the EDORI Express application.
 *
 * Trust one proxy hop so Express can correctly resolve
 * the original client protocol and IP address.
 */
app.set(

    "trust proxy",

    1

);


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
     * Shared EDORI model configuration override.
     */
    app.use(

        "/api/model-configuration",

        modelConfigurationRouter

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
 * Shared operational-trigger configuration.
 */
app.use(

    "/api/trigger-configuration",

    triggerConfigurationRouter

);

/**
 * Shared Hospital Surge Plan.
 */
app.use(

    "/api/surge-plan",

    surgePlanRouter

);

/**
 * Shared current Hospital Readiness result state.
 */
app.use(

    "/api/result-state",

    currentResultRouter

);

/**
 * Read-only PostgreSQL security audit log.
 */
app.use(

    "/api/security-audit",

    securityAuditRouter

);
    /**
     * Unknown API routes return JSON.
     *
     * IMPORTANT:
     * This must remain after every real /api route.
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