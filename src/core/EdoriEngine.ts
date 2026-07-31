/**
 * EdoriEngine
 *
 * Central orchestration layer for one completed
 * EDORI operational assessment.
 *
 * This is the only workflow that should eventually:
 *
 * - Capture the assessment timestamp
 * - Determine weekday and hour
 * - Load historical expectations
 * - Validate the completed assessment
 * - Commit StateService
 * - Calculate EDORI
 * - Store ResultService
 * - Create a snapshot
 * - Emit resultChanged
 *
 * Dashboard components must not perform these
 * responsibilities independently.
 */

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

    updateState

}

from "../services/StateService";


import {

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

    SituationAssessment

}

from "../types/SituationAssessment";


/**
 * Complete one authoritative EDORI assessment.
 *
 * This function should be called only when the
 * user explicitly selects Calculate EDORI.
 */
export function runEdoriAssessment(

    input:EdoriAssessmentInput,

    calculationTime:Date = new Date()

):EdoriEngineResult {

    /*
     * Validate the calculation timestamp before
     * using it for historical lookup.
     */

    if(Number.isNaN(calculationTime.getTime())){

        return createFailure([

            "The assessment time is invalid."

        ]);

    }


    /*
     * Validate the current operational inputs
     * before historical data are loaded.
     */

    const inputErrors =

        validateCurrentInputs(

            input

        );


    if(inputErrors.length > 0){

        return createFailure(

            inputErrors

        );

    }


    /*
     * Determine the automatic weekday and hourly
     * bucket from the submission time.
     */

    const period = getAssessmentPeriod(

        calculationTime

    );


    /*
     * Do not calculate EDORI without a historical
     * expectation for the selected weekday/hour.
     *
     * Using zero defaults would create an
     * operationally misleading score.
     */

    const historicalDataAvailable =

        hasHistoricalExpectation(

            period.day,

            period.hour

        );


    if(!historicalDataAvailable){

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


    /*
     * Build the complete authoritative
     * SituationAssessment.
     */

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
     * Apply the existing centralized assessment
     * validation rules.
     */

    const validation = validateState(

        assessment

    );


    if(!validation.valid){

        return createFailure(

            validation.errors

        );

    }


    /*
     * Calculate EDORI exactly once.
     *
     * EdoriService must remain a pure calculation
     * service with no persistence or event effects.
     */

    const result = calculateEdori(

        assessment

    );


    /*
     * Persist the authoritative assessment.
     */

    updateState(

        assessment

    );


    /*
     * Persist the authoritative result.
     *
     * setLatestResult also clears a previous
     * historical-data invalidation state.
     */

    setLatestResult(

        result

    );


    /*
     * Build one historical snapshot.
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
     * Publish one event after all state,
     * result, and snapshot work is complete.
     */

    emit(

        "resultChanged"

    );


    return {

        success:true,

        assessment:{

            ...assessment

        },

        result:cloneResult(

            result

        ),

        snapshotSaved

    };

}


/**
 * Validate current user-entered values before
 * creating the completed assessment.
 */
function validateCurrentInputs(

    input:EdoriAssessmentInput

):string[] {

    const errors:string[] = [];


    validateNonNegativeInteger(

        input.totalEDVolume,

        "Total ED volume",

        errors

    );


    validateNonNegativeInteger(

        input.boardedPatients,

        "Boarding patients",

        errors

    );


    validateNonNegativeInteger(

        input.occupiedMedicalBeds,

        "Occupied medical beds",

        errors

    );


    validateNonNegativeInteger(

        input.esi1,

        "ESI 1",

        errors

    );


    validateNonNegativeInteger(

        input.esi2,

        "ESI 2",

        errors

    );


    validateNonNegativeInteger(

        input.esi3,

        "ESI 3",

        errors

    );


    validateNonNegativeInteger(

        input.esi4,

        "ESI 4",

        errors

    );


    validateNonNegativeInteger(

        input.esi5,

        "ESI 5",

        errors

    );


    if(input.occupiedMedicalBeds > 273){

        errors.push(

            "Occupied medical beds cannot exceed 273."

        );

    }


    if(

        input.boardedPatients

        >

        input.totalEDVolume

    ){

        errors.push(

            "Boarding patients cannot exceed total ED volume."

        );

    }


    const esiTotal =

        input.esi1

        +

        input.esi2

        +

        input.esi3

        +

        input.esi4

        +

        input.esi5;


    /*
     * We currently warn only by validation error
     * when the ESI total exceeds the ED census.
     *
     * The ESI total is allowed to be lower because
     * some current patients may not yet have an
     * assigned ESI value.
     */

    if(esiTotal > input.totalEDVolume){

        errors.push(

            `The ESI total (${esiTotal}) cannot exceed total ED volume (${input.totalEDVolume}).`

        );

    }


    return errors;

}


/**
 * Validate one nonnegative whole-number input.
 */
function validateNonNegativeInteger(

    value:number,

    label:string,

    errors:string[]

):void {

    if(!Number.isFinite(value)){

        errors.push(

            `${label} must be a valid number.`

        );


        return;

    }


    if(!Number.isInteger(value)){

        errors.push(

            `${label} must be a whole number.`

        );

    }


    if(value < 0){

        errors.push(

            `${label} cannot be negative.`

        );

    }

}


/**
 * Create a standardized engine failure.
 */
function createFailure(

    errors:string[]

):EdoriEngineResult {

    return {

        success:false,

        errors:[

            ...errors

        ]

    };

}


/**
 * Create a defensive EDORI result copy.
 */
function cloneResult(

    result:ReturnType<typeof calculateEdori>

):ReturnType<typeof calculateEdori> {

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