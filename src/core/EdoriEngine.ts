/**
 * EdoriEngine
 *
 * Central orchestration layer for one completed
 * EDORI operational assessment.
 *
 * Responsibilities:
 *
 * - Validate current inputs
 * - Capture one assessment timestamp
 * - Determine weekday and hour
 * - Load historical expectations
 * - Build the completed assessment
 * - Validate the completed assessment
 * - Calculate EDORI exactly once
 * - Persist state and result
 * - Save one eligible snapshot
 * - Emit RESULT_CHANGED
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    calculateEdori

}

from "../services/EdoriService";


import {

    emit

}

from "../services/EventService";


import {

    getAssessmentPeriod,

    getExpectedOperationalValues,

    hasHistoricalExpectation

}

from "../services/HistoricalDataService";


import {

    setLatestResult

}

from "../services/ResultService";


import {

    saveSnapshot,

    shouldCreateSnapshot

}

from "../services/SnapshotService";


import {

    setState

}

from "../services/StateService";


import {

    validateAssessmentInput,

    validateState

}

from "../services/ValidationService";


import type {

    EdoriAssessmentInput

}

from "../types/EdoriAssessmentInput";


import type {

    EdoriEngineResult

}

from "../types/EdoriEngineResult";


import type {

    EdoriResult

}

from "../types/EdoriResult";


import type {

    SituationAssessment

}

from "../types/SituationAssessment";


/**
 * Complete one authoritative EDORI assessment.
 */
export function runEdoriAssessment(

    input:EdoriAssessmentInput,

    calculationTime:Date = new Date()

):EdoriEngineResult {

    /*
     * Validate the supplied timestamp.
     */

    if(

        !(calculationTime instanceof Date)

        ||

        Number.isNaN(

            calculationTime.getTime()

        )

    ){

        return createFailure([

            "The assessment time is invalid."

        ]);

    }


    /*
     * Validate all user-entered current values
     * through ValidationService.
     */

    const inputValidation =

        validateAssessmentInput(

            input

        );


    if(!inputValidation.valid){

        return createFailure(

            inputValidation.errors

        );

    }


    /*
     * Determine the automatic historical period.
     */

    const period = getAssessmentPeriod(

        calculationTime

    );


    /*
     * Do not calculate against zero fallback values.
     */

    if(

        !hasHistoricalExpectation(

            period.day,

            period.hour

        )

    ){

        return createFailure([

            `Historical expectations are not available for ${period.day} at ${formatHour(period.hour)}.`,

            "Import or add the missing historical record before calculating EDORI."

        ]);

    }


    const expectedValues =

        getExpectedOperationalValues(

            period.day,

            period.hour

        );


    const assessment:SituationAssessment = {

        assessmentTime:
            calculationTime.toISOString(),

        day:
            period.day,

        hour:
            period.hour,

        totalEDVolume:
            input.totalEDVolume,

        boardedPatients:
            input.boardedPatients,

        occupiedMedicalBeds:
            input.occupiedMedicalBeds,

        esi1:
            input.esi1,

        esi2:
            input.esi2,

        esi3:
            input.esi3,

        esi4:
            input.esi4,

        esi5:
            input.esi5,

        expectedVolume:
            expectedValues.expectedVolume,

        expectedBoarders:
            expectedValues.expectedBoarders,

        expectedArrivals:
            expectedValues.expectedArrivals,

        expectedDepartures:
            expectedValues.expectedDepartures

    };


    /*
     * Validate the completed assessment, including
     * metadata and historical expectations.
     */

    const stateValidation = validateState(

        assessment

    );


    if(!stateValidation.valid){

        return createFailure(

            stateValidation.errors

        );

    }


    /*
     * Calculate exactly once before persistence.
     */

    const result = calculateEdori(

        assessment

    );


    /*
     * Persist the committed assessment.
     */

    setState(

        assessment

    );


    /*
     * Persist the current authoritative result.
     */

    setLatestResult(

        result

    );


    /*
     * Create one eligible historical snapshot.
     */

    const snapshot = {

        score:
            result.score,

        status:
            result.status,

        operationalState:
            result.operationalState,

        timestamp:
            calculationTime

    };


    let snapshotSaved = false;


    if(

        shouldCreateSnapshot(

            snapshot

        )

    ){

        saveSnapshot(

            snapshot

        );


        snapshotSaved = true;

    }


    /*
     * Publish only after the complete workflow
     * succeeds.
     */

    emit(

        APP_EVENTS.RESULT_CHANGED

    );


    return {

        success:true,

        assessment:cloneAssessment(

            assessment

        ),

        result:cloneResult(

            result

        ),

        snapshotSaved

    };

}


/**
 * Create a standardized engine failure.
 */
function createFailure(

    errors:string[]

):EdoriEngineResult {

    return {

        success:false,

        errors:Array.from(

            new Set(

                errors

            )

        )

    };

}


/**
 * Return a defensive assessment copy.
 */
function cloneAssessment(

    assessment:SituationAssessment

):SituationAssessment {

    return {

        ...assessment

    };

}


/**
 * Return a defensive result copy.
 */
function cloneResult(

    result:EdoriResult

):EdoriResult {

    return {

        ...result,

        operationalState:{

            ...result.operationalState

        },

        drivers:result.drivers.map(

            driver => ({

                ...driver

            })

        ),

        recommendations:[

            ...result.recommendations

        ],

        timestamp:new Date(

            result.timestamp

        )

    };

}


/**
 * Format an hourly historical bucket.
 */
function formatHour(

    hour:number

):string {

    const safeHour = Math.min(

        23,

        Math.max(

            0,

            Math.floor(

                hour

            )

        )

    );


    const meridiem =

        safeHour >= 12

            ? "PM"

            : "AM";


    const twelveHour =

        safeHour % 12 === 0

            ? 12

            : safeHour % 12;


    return `${String(safeHour).padStart(2, "0")}:00 (${twelveHour}:00 ${meridiem})`;

}