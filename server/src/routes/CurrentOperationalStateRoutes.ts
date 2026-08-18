/**
 * CurrentOperationalStateRoutes
 *
 * Authenticated API for EDORI's single current committed
 * Hospital Readiness assessment.
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

    clearCurrentOperationalState,
    getCurrentOperationalState,
    saveCurrentOperationalState

}

from "../repositories/CurrentOperationalStateRepository.js";


import type {

    StoredCurrentOperationalState

}

from "../repositories/CurrentOperationalStateRepository.js";


export const currentOperationalStateRouter =

    Router();


currentOperationalStateRouter.use(
    requireAuthentication
);


/**
 * Read the authoritative current state.
 */
currentOperationalStateRouter.get(

    "/",

    requirePermission(
        "operational.view"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                state:
                    await getCurrentOperationalState()

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
 * Replace the authoritative current state.
 */
currentOperationalStateRouter.put(

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


            const assessment =

                validateAssessment(
                    request.body?.assessment
                );


            const schemaVersion =

                request.body?.schemaVersion;


            if(

                !assessment

                ||

                typeof schemaVersion !== "number"

                ||

                !Number.isInteger(
                    schemaVersion
                )

                ||

                schemaVersion <= 0

            ){

                response.status(400).json({

                    error:
                        "invalid_state",

                    message:
                        "The current EDORI operational state is invalid."

                });


                return;

            }


            await saveCurrentOperationalState({

                assessment,

                schemaVersion,

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
                    await getCurrentOperationalState()

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
 * Clear the current operational state.
 *
 * Kept Administrator-only because clearing the shared
 * current state affects every connected workstation.
 */
currentOperationalStateRouter.delete(

    "/",

    requirePermission(
        "history.restore"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                cleared:
                    await clearCurrentOperationalState()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


function validateAssessment(

    value:unknown

):StoredCurrentOperationalState | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate =

        value as Partial<StoredCurrentOperationalState>;


    if(

        typeof candidate.assessmentTime !== "string"

        ||

        (
            candidate.assessmentTime

            &&

            Number.isNaN(
                new Date(
                    candidate.assessmentTime
                ).getTime()
            )
        )

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

        candidate.forecastHours !== 4

        ||

        !isNonNegativeNumber(
            candidate.totalEDVolume
        )

        ||

        !isNonNegativeNumber(
            candidate.boardedPatients
        )

        ||

        !isNonNegativeNumber(
            candidate.esi1
        )

        ||

        !isNonNegativeNumber(
            candidate.esi2
        )

        ||

        !isNonNegativeNumber(
            candidate.staffedAcuteCareBeds
        )

        ||

        !isNonNegativeNumber(
            candidate.occupiedAcuteCareBeds
        )

        ||

        !isNonNegativeNumber(
            candidate.staffedCriticalCareBeds
        )

        ||

        !isNonNegativeNumber(
            candidate.occupiedCriticalCareBeds
        )

        ||

        !isNonNegativeNumber(
            candidate.currentEDAdmissions
        )

        ||

        !isNonNegativeNumber(
            candidate.currentDirectAdmissions
        )

        ||

        !isNonNegativeNumber(
            candidate.currentSurgicalAdmissions
        )

        ||

        !isNonNegativeNumber(
            candidate.expectedEDVolume
        )

        ||

        !isNonNegativeNumber(
            candidate.expectedEDBoarders
        )

        ||

        !isNonNegativeNumber(
            candidate.expectedStaffedAcuteCareBeds
        )

        ||

        !isNonNegativeNumber(
            candidate.expectedOccupiedAcuteCareBeds
        )

        ||

        !isNonNegativeNumber(
            candidate.expectedAvailableAcuteCareBeds
        )

        ||

        !isNonNegativeNumber(
            candidate.expectedEDAdmissions4h
        )

        ||

        !isNonNegativeNumber(
            candidate.expectedDirectAdmissions4h
        )

        ||

        !isNonNegativeNumber(
            candidate.expectedSurgicalAdmissions4h
        )

        ||

        !isNonNegativeNumber(
            candidate.expectedHospitalInflow4h
        )

        ||

        !isNonNegativeNumber(
            candidate.expectedInpatientDepartures4h
        )

        ||

        !isNonNegativeNumber(
            candidate.historicalProjectedBedDemand4h
        )

        ||

        !isFiniteNumber(
            candidate.historicalProjectedBedBalance4h
        )

    ){

        return null;

    }


    return candidate as StoredCurrentOperationalState;

}


function isNonNegativeNumber(

    value:unknown

):value is number {

    return (

        typeof value === "number"

        &&

        Number.isFinite(
            value
        )

        &&

        value >= 0

    );

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