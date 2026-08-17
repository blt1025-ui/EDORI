/**
 * EdoriEngine
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Central orchestration layer for one completed
 * Hospital Readiness assessment.
 *
 * Responsibilities:
 *
 * - Validate current user-entered values
 * - Capture one authoritative assessment timestamp
 * - Determine weekday and hour
 * - Load current-hour ED historical expectations
 * - Load rolling four-hour hospital-flow expectations
 * - Build the completed SituationAssessment
 * - Validate the completed assessment
 * - Calculate Hospital Readiness exactly once
 * - Persist state and result
 * - Save one eligible Version 2.1 snapshot
 * - Emit RESULT_CHANGED
 *
 * The historical EdoriEngine name is temporarily
 * retained during the Version 2 migration.
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

    hasHistoricalExpectation,

    HOSPITAL_FORECAST_HOURS

}

from "../services/HistoricalDataService";


import {

    setLatestResult

}

from "../services/ResultService";


import {

    getCurrentUser

}

from "../services/UserService";


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


import {

    EDORI_SNAPSHOT_SCHEMA_VERSION

}

from "../types/EdoriSnapshot";


import type {

    EdoriSnapshot

}

from "../types/EdoriSnapshot";


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
 * Complete one authoritative Hospital Readiness
 * assessment.
 */
export function runEdoriAssessment(

    input:EdoriAssessmentInput,

    calculationTime:Date = new Date()

):EdoriEngineResult {

    /*
     * =================================================
     * Validate assessment timestamp
     * =================================================
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
     * =================================================
     * Validate user-entered current values
     * =================================================
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
     * =================================================
     * Determine historical assessment period
     * =================================================
     */

    const period =

        getAssessmentPeriod(

            calculationTime

        );


    /*
     * =================================================
     * Confirm complete four-hour historical coverage
     * =================================================
     *
     * Hospital Readiness requires the current hourly
     * ED baseline plus a complete rolling four-hour
     * hospital-flow window.
     */

    if(

        !hasHistoricalExpectation(

            period.day,

            period.hour,

            HOSPITAL_FORECAST_HOURS

        )

    ){

        return createFailure([

            `Complete historical expectations are not available for the ${HOSPITAL_FORECAST_HOURS}-hour forecast beginning ${period.day} at ${formatHour(period.hour)}.`,

            "Import or add all required hourly historical records before calculating Hospital Readiness."

        ]);

    }


    /*
     * =================================================
     * Load historical expectations
     * =================================================
     */

    const expectedValues =

        getExpectedOperationalValues(

            period.day,

            period.hour

        );


    /*
     * =================================================
     * Build completed SituationAssessment
     * =================================================
     */

    const assessment:SituationAssessment = {

        assessmentTime:
            calculationTime.toISOString(),

        day:
            period.day,

        hour:
            period.hour,

        forecastHours:
            HOSPITAL_FORECAST_HOURS,


        /*
         * Current ED conditions
         */

        totalEDVolume:
            input.totalEDVolume,

        boardedPatients:
            input.boardedPatients,

        esi1:
            input.esi1,

        esi2:
            input.esi2,


        /*
         * Current acute-care capacity
         */

        staffedAcuteCareBeds:
            input.staffedAcuteCareBeds,

        occupiedAcuteCareBeds:
            input.occupiedAcuteCareBeds,


        /*
         * Current critical-care capacity
         */

        staffedCriticalCareBeds:
            input.staffedCriticalCareBeds,

        occupiedCriticalCareBeds:
            input.occupiedCriticalCareBeds,


        /*
         * Known non-ED inflow
         */

        currentDirectAdmissions:
            input.currentDirectAdmissions,

        currentSurgicalAdmissions:
            input.currentSurgicalAdmissions,


        /*
         * Compatibility field only.
         *
         * Version 2.1 never uses a user-entered current
         * ED admissions value.
         */

        currentEDAdmissions:
            0,


        /*
         * Current-hour ED historical expectations
         */

        expectedEDVolume:
            expectedValues.expectedEDVolume,

        expectedEDBoarders:
            expectedValues.expectedEDBoarders,


        /*
         * Historical acute-care baseline
         */

        expectedStaffedAcuteCareBeds:
            expectedValues.expectedStaffedAcuteCareBeds,

        expectedOccupiedAcuteCareBeds:
            expectedValues.expectedOccupiedAcuteCareBeds,

        expectedAvailableAcuteCareBeds:
            expectedValues.expectedAvailableAcuteCareBeds,


        /*
         * Rolling four-hour historical flow
         */

        expectedEDAdmissions4h:
            expectedValues.expectedEDAdmissions4h,

        expectedDirectAdmissions4h:
            expectedValues.expectedDirectAdmissions4h,

        expectedSurgicalAdmissions4h:
            expectedValues.expectedSurgicalAdmissions4h,

        expectedHospitalInflow4h:
            expectedValues.expectedHospitalInflow4h,

        expectedInpatientDepartures4h:
            expectedValues.expectedInpatientDepartures4h,


        /*
         * Historical projected capacity baseline
         */

        historicalProjectedBedDemand4h:
            expectedValues.historicalProjectedBedDemand4h,

        historicalProjectedBedBalance4h:
            expectedValues.historicalProjectedBedBalance4h

    };


    /*
     * =================================================
     * Validate completed assessment
     * =================================================
     */

    const stateValidation =

        validateState(

            assessment

        );


    if(!stateValidation.valid){

        return createFailure(

            stateValidation.errors

        );

    }


    /*
     * =================================================
     * Calculate Hospital Readiness exactly once
     * =================================================
     */

    const result =

        calculateEdori(

            assessment

        );


    /*
     * =================================================
     * Persist authoritative assessment state
     * =================================================
     */

    setState(

        assessment

    );


    /*
     * =================================================
     * Persist authoritative result
     * =================================================
     */

    setLatestResult(

        result

    );


    /*
     * =================================================
     * Create Version 2 historical snapshot
     * =================================================
     */

    const currentUser =

        getCurrentUser();


    const snapshot:EdoriSnapshot = {

        id:
            createSnapshotId(),

        schemaVersion:
            EDORI_SNAPSHOT_SCHEMA_VERSION,

        enteredByUserId:
            currentUser?.id
            ?? "",

        enteredByDisplayName:
            currentUser?.displayName
            ?? "Unknown",

        enteredByUsername:
            currentUser?.username
            ?? "",

        timestamp:
            new Date(
                result.timestamp
            ),

        score:
            result.score,

        status:
            result.operationalState.title,

        operationalState:{
            ...result.operationalState
        },

        day:
            assessment.day,

        hour:
            assessment.hour,

        forecastHours:
            assessment.forecastHours,

        totalEDVolume:
            assessment.totalEDVolume,

        boardedPatients:
            assessment.boardedPatients,

        esi1:
            assessment.esi1,

        esi2:
            assessment.esi2,

        staffedAcuteCareBeds:
            assessment.staffedAcuteCareBeds,

        occupiedAcuteCareBeds:
            assessment.occupiedAcuteCareBeds,

        staffedCriticalCareBeds:
            assessment.staffedCriticalCareBeds,

        occupiedCriticalCareBeds:
            assessment.occupiedCriticalCareBeds,

        currentDirectAdmissions:
            assessment.currentDirectAdmissions,

        currentSurgicalAdmissions:
            assessment.currentSurgicalAdmissions,

        knownNonEDInflow:
            result.knownNonEDInflow,

        expectedNonEDInflow:
            result.expectedNonEDInflow,

        expectedEDVolume:
            assessment.expectedEDVolume,

        expectedEDBoarders:
            assessment.expectedEDBoarders,

        expectedStaffedAcuteCareBeds:
            assessment.expectedStaffedAcuteCareBeds,

        expectedOccupiedAcuteCareBeds:
            assessment.expectedOccupiedAcuteCareBeds,

        expectedAvailableAcuteCareBeds:
            assessment.expectedAvailableAcuteCareBeds,

        expectedEDAdmissions4h:
            assessment.expectedEDAdmissions4h,

        expectedDirectAdmissions4h:
            assessment.expectedDirectAdmissions4h,

        expectedSurgicalAdmissions4h:
            assessment.expectedSurgicalAdmissions4h,

        expectedHospitalInflow4h:
            assessment.expectedHospitalInflow4h,

        expectedInpatientDepartures4h:
            assessment.expectedInpatientDepartures4h,

        projectedDirectAdmissions:
            result.projectedDirectAdmissions,

        projectedSurgicalAdmissions:
            result.projectedSurgicalAdmissions,

        projectedNewAdmissions:
            result.projectedNewAdmissions,

        projectedTotalBedDemand:
            result.projectedTotalBedDemand,

        historicalProjectedBedDemand4h:
            assessment.historicalProjectedBedDemand4h,

        currentAvailableAcuteCareBeds:
            result.currentAvailableAcuteCareBeds,

        projectedAvailableAcuteCareBeds:
            result.projectedAvailableAcuteCareBeds,

        historicalProjectedBedBalance4h:
            assessment.historicalProjectedBedBalance4h,

        projectedCapacityVariance:
            result.projectedCapacityVariance,

        edPressureScore:
            result.edPressureScore,

        acuteCapacityScore:
            result.acuteCapacityScore,

        criticalCapacityScore:
            result.criticalCapacityScore,

        inflowScore:
            result.inflowScore,

        projectedCapacityScore:
            result.projectedCapacityScore,

        edVolumeScore:
            result.edVolumeScore,

        edBoardingScore:
            result.edBoardingScore,

        edAcuityScore:
            result.edAcuityScore,


        /*
         * Temporary compatibility fields.
         */

        currentEDAdmissions:
            0,

        currentHospitalInflow:
            result.currentHospitalInflow,

        projectedHospitalInflow:
            result.projectedHospitalInflow

    };


    /*
     * =================================================
     * Save snapshot when eligible
     * =================================================
     */

    let snapshotSaved = false;


    if(

        shouldCreateSnapshot(

            snapshot

        )

    ){

        snapshotSaved =

            saveSnapshot(

                snapshot

            );

    }


    /*
     * =================================================
     * Publish completed calculation
     * =================================================
     *
     * Components subscribed to RESULT_CHANGED can
     * refresh only after the entire workflow has
     * completed successfully.
     */

    emit(

        APP_EVENTS.RESULT_CHANGED

    );


    /*
     * =================================================
     * Return defensive copies
     * =================================================
     */

    return {

        success:true,

        assessment:
            cloneAssessment(

                assessment

            ),

        result:
            cloneResult(

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

        errors:
            Array.from(

                new Set(

                    errors

                )

            )

    };

}


/**
 * Return a defensive SituationAssessment copy.
 */
function cloneAssessment(

    assessment:SituationAssessment

):SituationAssessment {

    return {

        ...assessment

    };

}


/**
 * Return a defensive Hospital Readiness result copy.
 */
function cloneResult(

    result:EdoriResult

):EdoriResult {

    return {

        ...result,

        operationalState:{

            ...result.operationalState

        },

        drivers:
            result.drivers.map(

                driver => ({

                    ...driver

                })

            ),

        recommendations:[

            ...result.recommendations

        ],

        timestamp:
            new Date(

                result.timestamp

            )

    };

}


/**
 * Create one browser-safe snapshot identifier.
 */
function createSnapshotId():

string {

    if(

        typeof crypto !== "undefined"

        &&

        typeof crypto.randomUUID === "function"

    ){

        return crypto.randomUUID();

    }


    return `snapshot-${Date.now()}-${Math.random()

        .toString(

            36

        )

        .slice(

            2,

            10

        )}`;

}


/**
 * Format an hourly historical bucket.
 */
function formatHour(

    hour:number

):string {

    const safeHour =

        Math.min(

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