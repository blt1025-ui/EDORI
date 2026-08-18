/**
 * AssessmentSnapshotRoutes
 *
 * Authenticated EDORI assessment-history API.
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


import type {

    AuthenticatedRequest

}

from "../middleware/AuthMiddleware.js";


import {

    clearAssessmentSnapshots,
    getLatestAssessmentSnapshot,
    listAssessmentSnapshots,
    saveAssessmentSnapshot

}

from "../repositories/AssessmentSnapshotRepository.js";


import type {

    StoredAssessmentSnapshot

}

from "../repositories/AssessmentSnapshotRepository.js";


export const assessmentSnapshotRouter =

    Router();


assessmentSnapshotRouter.use(
    requireAuthentication
);


/**
 * List completed assessment history.
 */
assessmentSnapshotRouter.get(

    "/",

    requirePermission(
        "operational.view"
    ),

    async (request, response, next) => {

        try {

            const requestedLimit =

                Number(
                    request.query.limit
                );


            const limit =

                Number.isFinite(
                    requestedLimit
                )

                    ? requestedLimit

                    : 500;


            response.status(200).json({

                snapshots:
                    await listAssessmentSnapshots(
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


/**
 * Return the latest completed snapshot.
 */
assessmentSnapshotRouter.get(

    "/latest",

    requirePermission(
        "operational.view"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                snapshot:
                    await getLatestAssessmentSnapshot()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Persist one completed assessment.
 *
 * Attribution is server-enforced from the authenticated
 * session, so browser-supplied entered-by values cannot
 * impersonate another EDORI user.
 */
assessmentSnapshotRouter.post(

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

                    error:
                        "unauthorized"

                });


                return;

            }


            const snapshot =

                validateSnapshotPayload(
                    request.body
                );


            if(!snapshot){

                response.status(400).json({

                    error:
                        "invalid_snapshot",

                    message:
                        "The completed EDORI assessment snapshot is invalid."

                });


                return;

            }


            const authoritativeSnapshot:StoredAssessmentSnapshot = {

                ...snapshot,

                enteredByUserId:
                    user.id,

                enteredByDisplayName:
                    user.displayName,

                enteredByUsername:
                    user.username

            };


            const result =

                await saveAssessmentSnapshot(
                    authoritativeSnapshot
                );


            response.status(
                result.inserted
                    ? 201
                    : 200
            ).json({

                saved:
                    true,

                inserted:
                    result.inserted,

                snapshot:
                    authoritativeSnapshot

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Clear assessment history.
 *
 * This is intentionally Administrator-only through the
 * existing history.restore permission.
 */
assessmentSnapshotRouter.delete(

    "/",

    requirePermission(
        "history.restore"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                deleted:
                    await clearAssessmentSnapshots()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


function validateSnapshotPayload(

    value:unknown

):StoredAssessmentSnapshot | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate =

        value as Partial<StoredAssessmentSnapshot>;


    if(

        typeof candidate.id !== "string"

        ||

        !candidate.id.trim()

        ||

        typeof candidate.timestamp !== "string"

        ||

        Number.isNaN(
            new Date(
                candidate.timestamp
            ).getTime()
        )

        ||

        typeof candidate.schemaVersion !== "number"

        ||

        !Number.isInteger(
            candidate.schemaVersion
        )

        ||

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

        !candidate.operationalState

        ||

        typeof candidate.operationalState.title !== "string"

        ||

        typeof candidate.day !== "string"

        ||

        typeof candidate.hour !== "number"

        ||

        !Number.isInteger(
            candidate.hour
        )

        ||

        candidate.hour < 0

        ||

        candidate.hour > 23

        ||

        typeof candidate.forecastHours !== "number"

        ||

        !Number.isInteger(
            candidate.forecastHours
        )

        ||

        !isFiniteNumber(
            candidate.totalEDVolume
        )

        ||

        !isFiniteNumber(
            candidate.boardedPatients
        )

        ||

        !isFiniteNumber(
            candidate.staffedAcuteCareBeds
        )

        ||

        !isFiniteNumber(
            candidate.occupiedAcuteCareBeds
        )

        ||

        !isFiniteNumber(
            candidate.staffedCriticalCareBeds
        )

        ||

        !isFiniteNumber(
            candidate.occupiedCriticalCareBeds
        )

        ||

        !isFiniteNumber(
            candidate.projectedTotalBedDemand
        )

        ||

        !isFiniteNumber(
            candidate.projectedCapacityVariance
        )

    ){

        return null;

    }


    return candidate as StoredAssessmentSnapshot;

}


function isFiniteNumber(

    value:unknown

):value is number {

    return (

        typeof value === "number"

        &&

        Number.isFinite(
            value
        )

    );

}