/**
 * ResultService
 *
 * Stores the most recently completed EDORI result.
 *
 * The latest result is persisted so the dashboard
 * can restore after a page refresh.
 *
 * A result may be invalidated when a dependency,
 * such as the historical-expectation dataset,
 * changes.
 */

import type { EdoriResult }
from "../types/EdoriResult";


const RESULT_STORAGE_KEY =

    "edori_latest_result";


const INVALIDATION_STORAGE_KEY =

    "edori_result_invalidation";


let latestResult:EdoriResult | null =

    loadStoredResult();


let invalidationReason:string | null =

    loadInvalidationReason();


/**
 * Store and persist the latest valid EDORI result.
 */
export function setLatestResult(

    result:EdoriResult

):void {

    latestResult = cloneResult(

        result

    );


    invalidationReason = null;


    localStorage.removeItem(

        INVALIDATION_STORAGE_KEY

    );


    saveLatestResult();

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
 * Determine whether a valid stored result exists.
 */
export function hasLatestResult():boolean {

    return latestResult !== null;

}


/**
 * Invalidate the latest result without deleting
 * the assessment or historical snapshots.
 *
 * This is used when the historical expectation
 * dataset changes.
 */
export function invalidateLatestResult(

    reason:string

):void {

    latestResult = null;


    invalidationReason = reason;


    localStorage.removeItem(

        RESULT_STORAGE_KEY

    );


    try {

        localStorage.setItem(

            INVALIDATION_STORAGE_KEY,

            reason

        );

    }
    catch(error){

        console.error(

            "Unable to persist the EDORI invalidation reason:",

            error

        );

    }

}


/**
 * Return the reason the result was invalidated.
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
 * Clear the stored result and any invalidation.
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
 * Persist the current result.
 */
function saveLatestResult():void {

    if(!latestResult){

        localStorage.removeItem(

            RESULT_STORAGE_KEY

        );

        return;

    }


    try {

        localStorage.setItem(

            RESULT_STORAGE_KEY,

            JSON.stringify(

                latestResult

            )

        );

    }
    catch(error){

        console.error(

            "Unable to save the latest EDORI result:",

            error

        );

    }

}


/**
 * Restore the latest EDORI result.
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

        ) as EdoriResult;


        if(

            !Number.isFinite(

                parsed.score

            )

            ||

            !parsed.operationalState

            ||

            !Array.isArray(

                parsed.drivers

            )

            ||

            !Array.isArray(

                parsed.recommendations

            )

        ){

            throw new Error(

                "Stored EDORI result is invalid."

            );

        }


        return cloneResult({

            ...parsed,

            timestamp:new Date(

                parsed.timestamp

            )

        });

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
 * Restore a persisted invalidation reason.
 */
function loadInvalidationReason():

string | null {

    try {

        const stored = localStorage.getItem(

            INVALIDATION_STORAGE_KEY

        );


        if(

            typeof stored !== "string"

            ||

            stored.trim().length === 0

        ){

            return null;

        }


        return stored;

    }
    catch(error){

        console.error(

            "Unable to restore the EDORI invalidation reason:",

            error

        );


        return null;

    }

}


/**
 * Create a defensive result copy.
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