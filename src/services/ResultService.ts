/**
 * ResultService
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Persistent storage for the latest authoritative
 * Hospital Readiness calculation result.
 *
 * ResultService is the single source of truth for
 * current-result dashboard components.
 *
 * Responsibilities:
 *
 * - Store the latest valid EdoriResult
 * - Restore the result after browser refresh
 * - Validate restored browser data
 * - Protect stored results from mutation
 * - Invalidate results when dependencies change
 * - Persist recalculation-required reasons
 *
 * This service does not calculate Hospital Readiness.
 */

import type {

    OperationalStateTitle

}

from "../types/OperationalStateTitle";


import type {

    OperationalState

}

from "../config/operationalStates";


import type {

    Driver

}

from "../types/Driver";


import type {

    EdoriResult

}

from "../types/EdoriResult";


import {

    clearServerCurrentResultState,
    loadServerCurrentResultState,
    saveServerCurrentResultState

}

from "./CurrentResultApiService";


import {

    emit,
    subscribe

}

from "./EventService";


import {

    APP_EVENTS

}

from "../config/appEvents";


/*
 * =====================================================
 * Server persistence configuration
 * =====================================================
 */


/**
 * Previous workstation-local storage keys.
 *
 * Retained only so Phase 18B can remove obsolete browser
 * result persistence.
 */
const LEGACY_RESULT_STORAGE_KEY =

    "edori_latest_result";


const LEGACY_INVALIDATION_STORAGE_KEY =

    "edori_result_invalidation";


let serverResultInitialized = false;

let serverResultInitializationInProgress = false;

let serverResultWriteInProgress = false;

let lastServerResultUpdatedAtMilliseconds = 0;


/*
 * =====================================================
 * In-memory state
 * =====================================================
 */


/**
 * Current authoritative result.
 */
let latestResult:EdoriResult | null = null;


/**
 * Current recalculation-required reason.
 */
let invalidationReason:string | null = null;


/**
 * Remove obsolete browser-persistent result state.
 */
clearLegacyResultStorage();


/**
 * Refresh shared result state whenever authenticated
 * identity/session changes.
 */
subscribe(

    APP_EVENTS.USERS_CHANGED,

    () => {

        serverResultInitialized = false;


        void initializeServerResultState();

    }

);


/*
 * =====================================================
 * Public API
 * =====================================================
 */


/**
 * Store and persist the latest valid Hospital
 * Readiness result.
 *
 * Saving a new valid result clears any previous
 * recalculation-required state.
 */
export function setLatestResult(

    result:EdoriResult

):void {

    const normalizedResult =

        normalizeResult(
            result
        );


    if(!normalizedResult){

        throw new Error(
            "The Hospital Readiness result is invalid and could not be stored."
        );

    }


    latestResult =

        cloneResult(
            normalizedResult
        );


    invalidationReason = null;


    serverResultInitialized = true;


    void persistCurrentResultStateToServer();


    emit(
        APP_EVENTS.RESULT_CHANGED
    );

}


/**
 * Return a defensive copy of the latest result.
 */
export function getLatestResult():

EdoriResult | null {

    if(!latestResult){

        return null;

    }


    return cloneResult(

        latestResult

    );

}


/**
 * Determine whether a valid result exists.
 */
export function hasLatestResult():

boolean {

    return latestResult !== null;

}


/**
 * Invalidate the current result.
 *
 * The result is removed because dashboard displays
 * must not continue showing a score based on an
 * outdated dependency.
 *
 * Examples:
 *
 * - Historical expectations changed
 * - Scoring weights changed
 * - Threshold configuration changed
 */
export function invalidateLatestResult(

    reason:string

):void {

    const normalizedReason =

        normalizeInvalidationReason(
            reason
        );


    latestResult = null;


    invalidationReason =

        normalizedReason

        ??

        "The previous Hospital Readiness result is no longer current.";


    serverResultInitialized = true;


    void persistCurrentResultStateToServer();


    emit(
        APP_EVENTS.RESULT_CHANGED
    );

}


/**
 * Return the current invalidation reason.
 */
export function getResultInvalidationReason():

string | null {

    return invalidationReason;

}


/**
 * Determine whether recalculation is required.
 */
export function isResultInvalidated():

boolean {

    return invalidationReason !== null;

}


/**
 * Clear both the result and invalidation state.
 *
 * This is different from invalidateLatestResult():
 *
 * - invalidateLatestResult() requires recalculation
 * - clearLatestResult() returns the application to
 *   its initial awaiting-assessment state
 */
export function clearLatestResult():

void {

    latestResult = null;

    invalidationReason = null;

    serverResultInitialized = true;


    void clearServerCurrentResultState()
        .catch(
            error => {

                console.error(
                    "Unable to clear the PostgreSQL Hospital Readiness result state:",
                    error
                );

            }
        );


    emit(
        APP_EVENTS.RESULT_CHANGED
    );

}


/**
 * Return diagnostic information about the current
 * ResultService state.
 */
export function getResultServiceStatus():{

    hasResult:boolean;

    invalidated:boolean;

    invalidationReason:string | null;

    resultTimestamp:Date | null;

} {

    return {

        hasResult:
            latestResult !== null,

        invalidated:
            invalidationReason !== null,

        invalidationReason,

        resultTimestamp:
            latestResult

                ? new Date(

                    latestResult.timestamp

                )

                : null

    };

}


/*
 * =====================================================
 * PostgreSQL persistence
 * =====================================================
 */


/**
 * Load the authoritative shared current-result state from
 * PostgreSQL after authentication has been established.
 */
export async function initializeServerResultState():

Promise<void> {

    if(
        serverResultInitialized
        ||
        serverResultInitializationInProgress
    ){

        return;

    }


    serverResultInitializationInProgress = true;


    try {

        const serverState =

            await loadServerCurrentResultState();


        if(serverState){

            lastServerResultUpdatedAtMilliseconds =
                normalizeServerTimestampMilliseconds(
                    serverState.updatedAt
                );

        }


        if(!serverState){

            latestResult = null;

            invalidationReason = null;

            serverResultInitialized = true;

            return;

        }


        const normalizedInvalidationReason =

            normalizeInvalidationReason(
                serverState.invalidationReason
            );


        if(normalizedInvalidationReason){

            latestResult = null;

            invalidationReason =
                normalizedInvalidationReason;

            serverResultInitialized = true;

            return;

        }


        if(serverState.result){

            const normalizedResult =

                normalizeResult(
                    serverState.result
                );


            if(!normalizedResult){

                throw new Error(
                    "The PostgreSQL Hospital Readiness result contains invalid values."
                );

            }


            latestResult =

                cloneResult(
                    normalizedResult
                );


            invalidationReason = null;

            serverResultInitialized = true;

            return;

        }


        latestResult = null;

        invalidationReason = null;

        serverResultInitialized = true;

    }
    catch(error){

        console.warn(
            "Unable to load the PostgreSQL Hospital Readiness result state:",
            error
        );

    }
    finally {

        serverResultInitializationInProgress = false;

    }

}


/**
 * Refresh the authoritative result/invalidation state
 * from PostgreSQL.
 *
 * Returns true only when effective local state changed.
 */
export async function refreshServerResultState():

Promise<boolean> {

    if(
        serverResultWriteInProgress
        ||
        serverResultInitializationInProgress
    ){

        return false;

    }


    const serverState =

        await loadServerCurrentResultState();


    if(!serverState){

        if(
            latestResult === null
            &&
            invalidationReason === null
        ){

            return false;

        }


        latestResult = null;

        invalidationReason = null;

        lastServerResultUpdatedAtMilliseconds = 0;


        emit(
            APP_EVENTS.RESULT_CHANGED
        );


        return true;

    }


    const serverUpdatedAtMilliseconds =

        normalizeServerTimestampMilliseconds(
            serverState.updatedAt
        );


    if(
        serverUpdatedAtMilliseconds > 0
        &&
        lastServerResultUpdatedAtMilliseconds > 0
        &&
        serverUpdatedAtMilliseconds
        <
        lastServerResultUpdatedAtMilliseconds
    ){

        return false;

    }


    const normalizedInvalidationReason =

        normalizeInvalidationReason(
            serverState.invalidationReason
        );


    let nextResult:EdoriResult | null = null;


    if(
        !normalizedInvalidationReason
        &&
        serverState.result
    ){

        nextResult =

            normalizeResult(
                serverState.result
            );


        if(!nextResult){

            throw new Error(
                "The synchronized PostgreSQL Hospital Readiness result contains invalid values."
            );

        }

    }


    const changed =

        !resultStatesEqual(
            latestResult,
            invalidationReason,
            nextResult,
            normalizedInvalidationReason
        );


    lastServerResultUpdatedAtMilliseconds =
        Math.max(
            lastServerResultUpdatedAtMilliseconds,
            serverUpdatedAtMilliseconds
        );


    if(!changed){

        return false;

    }


    latestResult =

        nextResult
            ? cloneResult(
                nextResult
            )
            : null;


    invalidationReason =
        normalizedInvalidationReason;


    serverResultInitialized = true;


    emit(
        APP_EVENTS.RESULT_CHANGED
    );


    return true;

}


/**
 * Persist the current result/invalidation state.
 */
async function persistCurrentResultStateToServer():

Promise<void> {

    serverResultWriteInProgress = true;


    try {

        const serverState =

            await saveServerCurrentResultState(

                latestResult
                    ? cloneResult(
                        latestResult
                    )
                    : null,

                invalidationReason

            );


        lastServerResultUpdatedAtMilliseconds =
            normalizeServerTimestampMilliseconds(
                serverState.updatedAt
            );


        const normalizedInvalidationReason =

            normalizeInvalidationReason(
                serverState.invalidationReason
            );


        if(normalizedInvalidationReason){

            latestResult = null;

            invalidationReason =
                normalizedInvalidationReason;

            serverResultInitialized = true;

            return;

        }


        if(serverState.result){

            const normalizedResult =

                normalizeResult(
                    serverState.result
                );


            if(!normalizedResult){

                throw new Error(
                    "The server returned an invalid Hospital Readiness result."
                );

            }


            latestResult =

                cloneResult(
                    normalizedResult
                );


            invalidationReason = null;

            serverResultInitialized = true;

            return;

        }


        latestResult = null;

        invalidationReason = null;

        serverResultInitialized = true;

    }
    catch(error){

        console.error(
            "Unable to save the PostgreSQL Hospital Readiness result state:",
            error
        );

    }
    finally {

        serverResultWriteInProgress = false;

    }

}


/**
 * Compare two result/invalidation states.
 */
function resultStatesEqual(

    firstResult:EdoriResult | null,

    firstReason:string | null,

    secondResult:EdoriResult | null,

    secondReason:string | null

):boolean {

    if(firstReason !== secondReason){

        return false;

    }


    if(
        firstResult === null
        ||
        secondResult === null
    ){

        return firstResult === secondResult;

    }


    return JSON.stringify(
        firstResult
    )
    ===
    JSON.stringify(
        secondResult
    );

}


/**
 * Normalize one server updated-at timestamp.
 */
function normalizeServerTimestampMilliseconds(

    value:string

):number {

    const milliseconds =
        new Date(
            value
        ).getTime();


    return Number.isNaN(
        milliseconds
    )

        ? 0

        : milliseconds;

}


/**
 * Remove obsolete workstation-local result persistence.
 */
function clearLegacyResultStorage():

void {

    try {

        localStorage.removeItem(
            LEGACY_RESULT_STORAGE_KEY
        );


        localStorage.removeItem(
            LEGACY_INVALIDATION_STORAGE_KEY
        );

    }
    catch(error){

        console.warn(
            "Unable to remove legacy Hospital Readiness browser result storage:",
            error
        );

    }

}


/*
 * =====================================================
 * Result normalization
 * =====================================================
 */



/**
 * Validate and normalize one unknown Version 2.1
 * Hospital Readiness result.
 */
function normalizeResult(

    value:unknown

):EdoriResult | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate = value as {

        /*
         * Overall result
         */

        score?:unknown;

        status?:unknown;

        operationalState?:unknown;


        /*
         * Primary Hospital Readiness domains
         */

        edPressureScore?:unknown;

        acuteCapacityScore?:unknown;

        criticalCapacityScore?:unknown;

        inflowScore?:unknown;

        projectedCapacityScore?:unknown;


        /*
         * ED Operational Pressure subdomains
         */

        edVolumeScore?:unknown;

        edBoardingScore?:unknown;

        edAcuityScore?:unknown;


        /*
         * Version 2.1 hospital-flow calculations
         */

        knownNonEDInflow?:unknown;

        expectedNonEDInflow?:unknown;

        projectedDirectAdmissions?:unknown;

        projectedSurgicalAdmissions?:unknown;

        projectedNewAdmissions?:unknown;

        projectedTotalBedDemand?:unknown;

        historicalProjectedBedDemand?:unknown;

        expectedInpatientDepartures?:unknown;

        currentAvailableAcuteCareBeds?:unknown;

        projectedAvailableAcuteCareBeds?:unknown;

        historicalProjectedBedBalance?:unknown;

        projectedCapacityVariance?:unknown;


        /*
         * Temporary compatibility aliases
         */

        currentHospitalInflow?:unknown;

        expectedHospitalInflow?:unknown;

        projectedHospitalInflow?:unknown;


        /*
         * Supporting output
         */

        drivers?:unknown;

        recommendations?:unknown;

        timestamp?:unknown;

    };


    /*
     * =================================================
     * Overall score
     * =================================================
     */

    const score =

        normalizeScore(

            candidate.score

        );


    /*
     * =================================================
     * Primary domain scores
     * =================================================
     */

    const edPressureScore =

        normalizeScore(

            candidate.edPressureScore

        );


    const acuteCapacityScore =

        normalizeScore(

            candidate.acuteCapacityScore

        );


    const criticalCapacityScore =

        normalizeScore(

            candidate.criticalCapacityScore

        );


    const inflowScore =

        normalizeScore(

            candidate.inflowScore

        );


    const projectedCapacityScore =

        normalizeScore(

            candidate.projectedCapacityScore

        );


    /*
     * =================================================
     * ED Operational Pressure subdomain scores
     * =================================================
     */

    const edVolumeScore =

        normalizeScore(

            candidate.edVolumeScore

        );


    const edBoardingScore =

        normalizeScore(

            candidate.edBoardingScore

        );


    const edAcuityScore =

        normalizeScore(

            candidate.edAcuityScore

        );


    /*
     * =================================================
     * Version 2.1 hospital-flow calculations
     * =================================================
     */

    const knownNonEDInflow =

        normalizeNonNegativeFiniteNumber(

            candidate.knownNonEDInflow

        );


    const expectedNonEDInflow =

        normalizeNonNegativeFiniteNumber(

            candidate.expectedNonEDInflow

        );


    const projectedDirectAdmissions =

        normalizeNonNegativeFiniteNumber(

            candidate.projectedDirectAdmissions

        );


    const projectedSurgicalAdmissions =

        normalizeNonNegativeFiniteNumber(

            candidate.projectedSurgicalAdmissions

        );


    const projectedNewAdmissions =

        normalizeNonNegativeFiniteNumber(

            candidate.projectedNewAdmissions

        );


    const projectedTotalBedDemand =

        normalizeNonNegativeFiniteNumber(

            candidate.projectedTotalBedDemand

        );


    const historicalProjectedBedDemand =

        normalizeNonNegativeFiniteNumber(

            candidate.historicalProjectedBedDemand

        );


    const expectedInpatientDepartures =

        normalizeNonNegativeFiniteNumber(

            candidate.expectedInpatientDepartures

        );


    /*
     * Bed balances are signed values.
     */
    const currentAvailableAcuteCareBeds =

        normalizeFiniteNumber(

            candidate.currentAvailableAcuteCareBeds

        );


    const projectedAvailableAcuteCareBeds =

        normalizeFiniteNumber(

            candidate.projectedAvailableAcuteCareBeds

        );


    const historicalProjectedBedBalance =

        normalizeFiniteNumber(

            candidate.historicalProjectedBedBalance

        );


    const projectedCapacityVariance =

        normalizeFiniteNumber(

            candidate.projectedCapacityVariance

        );


    /*
     * =================================================
     * Temporary compatibility aliases
     * =================================================
     */

    const currentHospitalInflow =

        normalizeNonNegativeFiniteNumber(

            candidate.currentHospitalInflow

        );


    const expectedHospitalInflow =

        normalizeNonNegativeFiniteNumber(

            candidate.expectedHospitalInflow

        );


    const projectedHospitalInflow =

        normalizeNonNegativeFiniteNumber(

            candidate.projectedHospitalInflow

        );


    /*
     * =================================================
     * Reject invalid numeric output
     * =================================================
     */

    if(

        score === null

        ||

        edPressureScore === null

        ||

        acuteCapacityScore === null

        ||

        criticalCapacityScore === null

        ||

        inflowScore === null

        ||

        projectedCapacityScore === null

        ||

        edVolumeScore === null

        ||

        edBoardingScore === null

        ||

        edAcuityScore === null

        ||

        knownNonEDInflow === null

        ||

        expectedNonEDInflow === null

        ||

        projectedDirectAdmissions === null

        ||

        projectedSurgicalAdmissions === null

        ||

        projectedNewAdmissions === null

        ||

        projectedTotalBedDemand === null

        ||

        historicalProjectedBedDemand === null

        ||

        expectedInpatientDepartures === null

        ||

        currentAvailableAcuteCareBeds === null

        ||

        projectedAvailableAcuteCareBeds === null

        ||

        historicalProjectedBedBalance === null

        ||

        projectedCapacityVariance === null

        ||

        currentHospitalInflow === null

        ||

        expectedHospitalInflow === null

        ||

        projectedHospitalInflow === null

    ){

        return null;

    }


    /*
     * =================================================
     * Cross-field consistency
     * =================================================
     */

    if(

        Math.abs(

            currentHospitalInflow

            -

            knownNonEDInflow

        )

        >

        0.05

    ){

        return null;

    }


    if(

        Math.abs(

            expectedHospitalInflow

            -

            expectedNonEDInflow

        )

        >

        0.05

    ){

        return null;

    }


    if(

        Math.abs(

            projectedHospitalInflow

            -

            projectedNewAdmissions

        )

        >

        0.05

    ){

        return null;

    }


    const calculatedCapacityVariance =

        projectedAvailableAcuteCareBeds

        -

        historicalProjectedBedBalance;


    if(

        Math.abs(

            calculatedCapacityVariance

            -

            projectedCapacityVariance

        )

        >

        0.05

    ){

        return null;

    }


    /*
     * =================================================
     * Status
     * =================================================
     */

    if(

        typeof candidate.status !== "string"

        ||

        candidate.status.trim().length === 0

    ){

        return null;

    }


    /*
     * =================================================
     * Operational state
     * =================================================
     */

    const operationalState =

        normalizeOperationalState(

            candidate.operationalState

        );


    if(!operationalState){

        return null;

    }


    /*
     * The status should describe the same operational
     * state contained in operationalState.
     */
    if(

        candidate.status.trim()

        !==

        operationalState.title

    ){

        return null;

    }


    /*
     * =================================================
     * Drivers
     * =================================================
     */

    const drivers =

        normalizeDrivers(

            candidate.drivers

        );


    if(!drivers){

        return null;

    }


    /*
     * =================================================
     * Recommendations
     * =================================================
     */

    const recommendations =

        normalizeRecommendations(

            candidate.recommendations

        );


    if(!recommendations){

        return null;

    }


    /*
     * =================================================
     * Timestamp
     * =================================================
     */

    const timestamp =

        normalizeTimestamp(

            candidate.timestamp

        );


    if(!timestamp){

        return null;

    }


    /*
     * =================================================
     * Return normalized Version 2.1 result
     * =================================================
     */

    return {

        score,

        status:
            candidate.status.trim(),

        operationalState,

        edPressureScore,

        acuteCapacityScore,

        criticalCapacityScore,

        inflowScore,

        projectedCapacityScore,

        edVolumeScore,

        edBoardingScore,

        edAcuityScore,

        knownNonEDInflow,

        expectedNonEDInflow,

        projectedDirectAdmissions,

        projectedSurgicalAdmissions,

        projectedNewAdmissions,

        projectedTotalBedDemand,

        historicalProjectedBedDemand,

        expectedInpatientDepartures,

        currentAvailableAcuteCareBeds,

        projectedAvailableAcuteCareBeds,

        historicalProjectedBedBalance,

        projectedCapacityVariance,

        /*
         * Temporary compatibility aliases
         */

        currentHospitalInflow,

        expectedHospitalInflow,

        projectedHospitalInflow,

        drivers,

        recommendations,

        timestamp

    };

}


/*
 * =====================================================
 * Primitive normalization
 * =====================================================
 */


/**
 * Normalize a Hospital Readiness score from
 * 0 through 100.
 *
 * Scores are retained to one decimal place.
 */
function normalizeScore(

    value:unknown

):number | null {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(

            value

        )

        ||

        value < 0

        ||

        value > 100

    ){

        return null;

    }


    return Math.round(

        value * 10

    )

    /

    10;

}


/**
 * Normalize a nonnegative finite number.
 */
function normalizeNonNegativeFiniteNumber(

    value:unknown

):number | null {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(

            value

        )

        ||

        value < 0

    ){

        return null;

    }


    return value;

}


/**
 * Normalize any finite signed number.
 */
function normalizeFiniteNumber(

    value:unknown

):number | null {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(

            value

        )

    ){

        return null;

    }


    return value;

}


/**
 * Validate and normalize an operational state.
 */
function normalizeOperationalState(

    value:unknown

):OperationalState | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate = value as {

        title?:unknown;

        icon?:unknown;

        color?:unknown;

        recommendation?:unknown;

    };


    if(

        !isOperationalStateTitle(

            candidate.title

        )

        ||

        typeof candidate.icon !== "string"

        ||

        candidate.icon.trim().length === 0

        ||

        typeof candidate.color !== "string"

        ||

        candidate.color.trim().length === 0

        ||

        typeof candidate.recommendation !== "string"

        ||

        candidate.recommendation.trim().length === 0

    ){

        return null;

    }


    return {

        title:
            candidate.title,

        icon:
            candidate.icon.trim(),

        color:
            candidate.color.trim(),

        recommendation:
            candidate.recommendation.trim()

    };

}


/**
 * Validate and normalize all drivers.
 */
function normalizeDrivers(

    value:unknown

):Driver[] | null {

    if(!Array.isArray(value)){

        return null;

    }


    const normalizedDrivers =

        value.map(

            normalizeDriver

        );


    if(

        normalizedDrivers.some(

            driver => driver === null

        )

    ){

        return null;

    }


    return normalizedDrivers as Driver[];

}


/**
 * Validate and normalize one driver.
 */
function normalizeDriver(

    value:unknown

):Driver | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate = value as {

        title?:unknown;

        description?:unknown;

        severity?:unknown;

        currentValue?:unknown;

        expectedValue?:unknown;

    };


    if(

        typeof candidate.title !== "string"

        ||

        candidate.title.trim().length === 0

        ||

        typeof candidate.description !== "string"

        ||

        candidate.description.trim().length === 0

    ){

        return null;

    }


    const severity =

        normalizeScore(

            candidate.severity

        );


    if(

        severity === null

        ||

        !isFiniteNumber(

            candidate.currentValue

        )

        ||

        !isFiniteNumber(

            candidate.expectedValue

        )

    ){

        return null;

    }


    return {

        title:
            candidate.title.trim(),

        description:
            candidate.description.trim(),

        severity,

        currentValue:
            candidate.currentValue,

        expectedValue:
            candidate.expectedValue

    };

}


/**
 * Validate recommendation strings.
 */
function normalizeRecommendations(

    value:unknown

):string[] | null {

    if(!Array.isArray(value)){

        return null;

    }


    if(

        value.some(

            recommendation =>

                typeof recommendation !== "string"

                ||

                recommendation.trim().length === 0

        )

    ){

        return null;

    }


    return value.map(

        recommendation =>

            recommendation.trim()

    );

}


/**
 * Normalize a persisted timestamp.
 */
function normalizeTimestamp(

    value:unknown

):Date | null {

    const timestamp =

        value instanceof Date

            ? new Date(

                value.getTime()

            )

            :

            typeof value === "string"

            ||

            typeof value === "number"

                ? new Date(

                    value

                )

                : null;


    if(

        !timestamp

        ||

        Number.isNaN(

            timestamp.getTime()

        )

    ){

        return null;

    }


    return timestamp;

}


/**
 * Normalize an invalidation reason.
 */
function normalizeInvalidationReason(

    value:unknown

):string | null {

    if(typeof value !== "string"){

        return null;

    }


    const trimmedValue =

        value.trim();


    if(trimmedValue.length === 0){

        return null;

    }


    return trimmedValue;

}


/**
 * Determine whether an unknown value is a
 * finite number.
 */
function isFiniteNumber(

    value:unknown

):value is number {

    return typeof value === "number"

        &&

        Number.isFinite(

            value

        );

}


/*
 * =====================================================
 * Defensive cloning
 * =====================================================
 */


/**
 * Return a defensive Version 2.1 result copy.
 */
function cloneResult(

    result:EdoriResult

):EdoriResult {

    return {

        /*
         * Overall Hospital Readiness
         */

        score:
            result.score,

        status:
            result.status,

        operationalState:{

            ...result.operationalState

        },


        /*
         * Primary scoring domains
         */

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


        /*
         * ED Operational Pressure subdomains
         */

        edVolumeScore:
            result.edVolumeScore,

        edBoardingScore:
            result.edBoardingScore,

        edAcuityScore:
            result.edAcuityScore,


        /*
         * Version 2.1 hospital-flow detail
         */

        knownNonEDInflow:
            result.knownNonEDInflow,

        expectedNonEDInflow:
            result.expectedNonEDInflow,

        projectedDirectAdmissions:
            result.projectedDirectAdmissions,

        projectedSurgicalAdmissions:
            result.projectedSurgicalAdmissions,

        projectedNewAdmissions:
            result.projectedNewAdmissions,

        projectedTotalBedDemand:
            result.projectedTotalBedDemand,

        historicalProjectedBedDemand:
            result.historicalProjectedBedDemand,

        expectedInpatientDepartures:
            result.expectedInpatientDepartures,

        currentAvailableAcuteCareBeds:
            result.currentAvailableAcuteCareBeds,

        projectedAvailableAcuteCareBeds:
            result.projectedAvailableAcuteCareBeds,

        historicalProjectedBedBalance:
            result.historicalProjectedBedBalance,

        projectedCapacityVariance:
            result.projectedCapacityVariance,


        /*
         * Temporary compatibility aliases
         */

        currentHospitalInflow:
            result.currentHospitalInflow,

        expectedHospitalInflow:
            result.expectedHospitalInflow,

        projectedHospitalInflow:
            result.projectedHospitalInflow,


        /*
         * Supporting output
         */

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


/*
 * =====================================================
 * Shared helpers
 * =====================================================
 */


/**
 * Determine whether a value is a valid
 * Alpha–Echo operational state title.
 */
function isOperationalStateTitle(

    value:unknown

):value is OperationalStateTitle {

    return value === "Alpha"

        ||

        value === "Bravo"

        ||

        value === "Charlie"

        ||

        value === "Delta"

        ||

        value === "Echo";

}