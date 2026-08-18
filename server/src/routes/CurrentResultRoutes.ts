/**
 * CurrentResultRoutes
 *
 * Authenticated API for EDORI's shared current HRI result
 * and recalculation-required state.
 */

import {

    Router

}

from "express";


import {

    requireAuthentication

}

from "../middleware/AuthMiddleware.js";


import type {

    AuthenticatedRequest

}

from "../middleware/AuthMiddleware.js";


import {

    requirePermission

}

from "../middleware/AuthorizationMiddleware.js";


import {

    clearCurrentResultState,
    getCurrentResultState,
    saveCurrentResultState

}

from "../repositories/CurrentResultRepository.js";


export const currentResultRouter =

    Router();


const RESULT_SCHEMA_VERSION = 3;


currentResultRouter.use(
    requireAuthentication
);


currentResultRouter.get(

    "/",

    requirePermission(
        "operational.view"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                state:
                    await getCurrentResultState()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


currentResultRouter.put(

    "/",

    requirePermission(
        "assessment.submit"
    ),

    async (
        request:AuthenticatedRequest,
        response,
        next
    ) => {

        try {

            const user =
                request.edoriUser;


            if(!user){

                response.status(401).json({
                    error:"unauthorized"
                });

                return;

            }


            const result =
                normalizeResult(
                    request.body?.result
                );


            const invalidationReason =
                normalizeInvalidationReason(
                    request.body?.invalidationReason
                );


            if(
                result
                &&
                invalidationReason
            ){

                response.status(400).json({

                    error:
                        "invalid_result_state",

                    message:
                        "A current result and recalculation-required reason cannot both be active."

                });

                return;

            }


            if(
                request.body?.result !== null
                &&
                !result
            ){

                response.status(400).json({

                    error:
                        "invalid_result_state",

                    message:
                        "The current Hospital Readiness result is invalid."

                });

                return;

            }


            await saveCurrentResultState({

                schemaVersion:
                    RESULT_SCHEMA_VERSION,

                result,

                invalidationReason,

                updatedByUserId:
                    user.id,

                updatedByUsername:
                    user.username,

                updatedByDisplayName:
                    user.displayName

            });


            response.status(200).json({

                saved:
                    true,

                state:
                    await getCurrentResultState()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


currentResultRouter.delete(

    "/",

    requirePermission(
        "assessment.submit"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                cleared:
                    await clearCurrentResultState()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


function normalizeResult(

    value:unknown

):Record<string,unknown> | null {

    if(value === null){

        return null;

    }


    if(
        typeof value !== "object"
        ||
        value === null
        ||
        Array.isArray(
            value
        )
    ){

        return null;

    }


    const candidate =
        value as Record<string,unknown>;


    if(
        typeof candidate.score !== "number"
        ||
        !Number.isFinite(
            candidate.score
        )
        ||
        candidate.score < 0
        ||
        candidate.score > 100
        ||
        typeof candidate.status !== "string"
        ||
        !candidate.status.trim()
        ||
        (
            typeof candidate.timestamp !== "string"
            &&
            !(candidate.timestamp instanceof Date)
        )
    ){

        return null;

    }


    return {
        ...candidate
    };

}


function normalizeInvalidationReason(

    value:unknown

):string | null {

    if(value === null || value === undefined){

        return null;

    }


    if(typeof value !== "string"){

        return null;

    }


    const trimmed =
        value.trim();


    return trimmed
        ? trimmed
        : null;

}