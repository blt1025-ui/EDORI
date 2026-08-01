/**
 * ResultService
 *
 * Persistent storage for the latest authoritative
 * EDORI calculation result.
 *
 * ResultService is the single source of truth for
 * all current-result dashboard components.
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
 * This service does not calculate EDORI.
 */

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


const RESULT_STORAGE_KEY =

    "edori_latest_result";


const INVALIDATION_STORAGE_KEY =

    "edori_result_invalidation";


/**
 * Version attached to persisted result data.
 *
 * Increase this value if the stored result shape
 * changes incompatibly in a future release.
 */
const RESULT_STORAGE_VERSION = 1;


/**
 * Wrapper stored in localStorage.
 */
interface StoredResultEnvelope {

    version:number;

    result:EdoriResult;

}


/**
 * Current in-memory result.
 */
let latestResult:EdoriResult | null = null;


/**
 * Current recalculation-required reason.
 */
let invalidationReason:string | null = null;


/**
 * Restore persisted state when the module loads.
 */
restoreResultState();


/**
 * Store and persist the latest valid EDORI result.
 *
 * Saving a new valid result clears any previous
 * recalculation-required state.
 */
export function setLatestResult(

    result:EdoriResult

):void {

    const normalizedResult = normalizeResult(

        result

    );


    if(!normalizedResult){

        throw new Error(

            "The EDORI result is invalid and could not be stored."

        );

    }


    latestResult = cloneResult(

        normalizedResult

    );


    invalidationReason = null;


    localStorage.removeItem(

        INVALIDATION_STORAGE_KEY

    );


    persistLatestResult();

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
export function hasLatestResult():boolean {

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


    localStorage.removeItem(

        RESULT_STORAGE_KEY

    );


    invalidationReason =

        normalizedReason

        ??

        "The previous EDORI result is no longer current.";


    persistInvalidationReason();

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
export function isResultInvalidated():boolean {

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
export function clearLatestResult():void {

    latestResult = null;

    invalidationReason = null;


    localStorage.removeItem(

        RESULT_STORAGE_KEY

    );


    localStorage.removeItem(

        INVALIDATION_STORAGE_KEY

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


/**
 * Restore the result and invalidation state.
 */
function restoreResultState():void {

    const restoredInvalidationReason =

        loadInvalidationReason();


    /*
     * An invalidation state takes priority.
     *
     * If both a result and invalidation reason are
     * present because of an interrupted browser write,
     * the result must not be trusted.
     */

    if(restoredInvalidationReason){

        latestResult = null;

        invalidationReason =

            restoredInvalidationReason;


        localStorage.removeItem(

            RESULT_STORAGE_KEY

        );


        return;

    }


    latestResult = loadStoredResult();

    invalidationReason = null;

}


/**
 * Persist the latest result.
 */
function persistLatestResult():void {

    if(!latestResult){

        localStorage.removeItem(

            RESULT_STORAGE_KEY

        );


        return;

    }


    const envelope:StoredResultEnvelope = {

        version:
            RESULT_STORAGE_VERSION,

        result:
            cloneResult(

                latestResult

            )

    };


    try {

        localStorage.setItem(

            RESULT_STORAGE_KEY,

            JSON.stringify(

                envelope

            )

        );

    }
    catch(error){

        console.error(

            "Unable to save the latest EDORI result:",

            error

        );


        throw new Error(

            "The latest EDORI result could not be saved to browser storage."

        );

    }

}


/**
 * Persist the recalculation-required reason.
 */
function persistInvalidationReason():void {

    if(!invalidationReason){

        localStorage.removeItem(

            INVALIDATION_STORAGE_KEY

        );


        return;

    }


    try {

        localStorage.setItem(

            INVALIDATION_STORAGE_KEY,

            invalidationReason

        );

    }
    catch(error){

        console.error(

            "Unable to save the EDORI invalidation reason:",

            error

        );


        /*
         * The in-memory invalidation remains active
         * even if browser persistence fails.
         */

    }

}


/**
 * Load and validate the stored result.
 */
function loadStoredResult():

EdoriResult | null {

    try {

        const stored = localStorage.getItem(

            RESULT_STORAGE_KEY

        );


        if(!stored){

            return null;

        }


        const parsed = JSON.parse(

            stored

        ) as unknown;


        const storedResult =

            extractStoredResult(

                parsed

            );


        if(!storedResult){

            throw new Error(

                "Stored EDORI result has an unsupported format."

            );

        }


        const normalizedResult = normalizeResult(

            storedResult

        );


        if(!normalizedResult){

            throw new Error(

                "Stored EDORI result contains invalid values."

            );

        }


        return cloneResult(

            normalizedResult

        );

    }
    catch(error){

        console.error(

            "Unable to restore the latest EDORI result:",

            error

        );


        localStorage.removeItem(

            RESULT_STORAGE_KEY

        );


        return null;

    }

}


/**
 * Extract an EdoriResult from persisted data.
 *
 * Supports:
 *
 * - Current versioned envelope
 * - Legacy unwrapped EdoriResult objects
 *
 * Legacy support prevents existing development
 * browser data from breaking after this upgrade.
 */
function extractStoredResult(

    value:unknown

):unknown {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate = value as {

        version?:unknown;

        result?:unknown;

        score?:unknown;

    };


    /*
     * Current versioned format.
     */

    if(

        typeof candidate.version === "number"

        &&

        candidate.result !== undefined

    ){

        if(

            candidate.version

            !==

            RESULT_STORAGE_VERSION

        ){

            return null;

        }


        return candidate.result;

    }


    /*
     * Legacy format where the result itself was
     * stored directly.
     */

    if(

        typeof candidate.score === "number"

    ){

        return candidate;

    }


    return null;

}


/**
 * Load the persisted invalidation reason.
 */
function loadInvalidationReason():

string | null {

    try {

        const stored = localStorage.getItem(

            INVALIDATION_STORAGE_KEY

        );


        return normalizeInvalidationReason(

            stored

        );

    }
    catch(error){

        console.error(

            "Unable to restore the EDORI invalidation reason:",

            error

        );


        localStorage.removeItem(

            INVALIDATION_STORAGE_KEY

        );


        return null;

    }

}


/**
 * Validate and normalize one unknown result.
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

        score?:unknown;

        status?:unknown;

        operationalState?:unknown;

        demandScore?:unknown;

        boardingScore?:unknown;

        hospitalScore?:unknown;

        acuityScore?:unknown;

        forecastScore?:unknown;

        drivers?:unknown;

        recommendations?:unknown;

        timestamp?:unknown;

    };


    const score = normalizeScore(

        candidate.score

    );


    const demandScore = normalizeScore(

        candidate.demandScore

    );


    const boardingScore = normalizeScore(

        candidate.boardingScore

    );


    const hospitalScore = normalizeScore(

        candidate.hospitalScore

    );


    const acuityScore = normalizeScore(

        candidate.acuityScore

    );


    const forecastScore = normalizeScore(

        candidate.forecastScore

    );


    if(

        score === null

        ||

        demandScore === null

        ||

        boardingScore === null

        ||

        hospitalScore === null

        ||

        acuityScore === null

        ||

        forecastScore === null

    ){

        return null;

    }


    if(

        typeof candidate.status !== "string"

        ||

        candidate.status.trim().length === 0

    ){

        return null;

    }


    const operationalState =

        normalizeOperationalState(

            candidate.operationalState

        );


    if(!operationalState){

        return null;

    }


    const drivers = normalizeDrivers(

        candidate.drivers

    );


    if(!drivers){

        return null;

    }


    const recommendations =

        normalizeRecommendations(

            candidate.recommendations

        );


    if(!recommendations){

        return null;

    }


    const timestamp = normalizeTimestamp(

        candidate.timestamp

    );


    if(!timestamp){

        return null;

    }


    return {

        score,

        status:
            candidate.status.trim(),

        operationalState,

        demandScore,

        boardingScore,

        hospitalScore,

        acuityScore,

        forecastScore,

        drivers,

        recommendations,

        timestamp

    };

}


/**
 * Normalize a score to a whole number from 0–100.
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

        value

    );

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

        typeof candidate.title !== "string"

        ||

        candidate.title.trim().length === 0

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
            candidate.title.trim(),

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


    const normalizedDrivers = value

        .map(

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


    const severity = normalizeScore(

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

    const timestamp = value instanceof Date

        ? new Date(

            value.getTime()

        )

        : typeof value === "string"

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


/**
 * Return a defensive result copy.
 */
function cloneResult(

    result:EdoriResult

):EdoriResult {

    return {

        score:
            result.score,

        status:
            result.status,

        operationalState:{

            ...result.operationalState

        },

        demandScore:
            result.demandScore,

        boardingScore:
            result.boardingScore,

        hospitalScore:
            result.hospitalScore,

        acuityScore:
            result.acuityScore,

        forecastScore:
            result.forecastScore,

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