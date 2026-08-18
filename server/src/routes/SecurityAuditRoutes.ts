/**
 * SecurityAuditRoutes
 *
 * Read-only Administrator API for EDORI security and
 * account-management audit events.
 */

import {

    Router

}

from "express";


import {

    requireAuthentication

}

from "../middleware/AuthMiddleware.js";


import {

    requirePermission

}

from "../middleware/AuthorizationMiddleware.js";


import {

    listSecurityAuditRecords

}

from "../repositories/SecurityAuditRepository.js";


export const securityAuditRouter =

    Router();


securityAuditRouter.use(
    requireAuthentication
);


/**
 * Return newest audit records first.
 */
securityAuditRouter.get(

    "/",

    requirePermission(
        "administration.view"
    ),

    async (request, response, next) => {

        try {

            const requestedLimit =

                typeof request.query.limit === "string"

                    ? Number(
                        request.query.limit
                    )

                    : 1000;


            const limit =

                Number.isFinite(
                    requestedLimit
                )

                    ? requestedLimit

                    : 1000;


            response.status(200).json({

                records:
                    await listSecurityAuditRecords(
                        limit
                    )

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);