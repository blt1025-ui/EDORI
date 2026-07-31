/**
 * ResultService
 *
 * Stores the most recently completed EDORI result.
 *
 * The latest result is persisted in localStorage
 * so dashboard displays can restore after refresh
 * without recalculating EDORI or creating another
 * historical snapshot.
 */

import type { EdoriResult }
from "../types/EdoriResult";


const STORAGE_KEY =

    "edori_latest_result";


let latestResult:EdoriResult | null =

    loadStoredResult();


/**
 * Store and persist the latest EDORI result.
 */
export function setLatestResult(

    result:EdoriResult

):void {

    latestResult = cloneResult(

        result

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
 * Determine whether a stored result exists.
 */
export function hasLatestResult():boolean {

    return latestResult !== null;

}


/**
 * Clear the stored result.
 */
export function clearLatestResult():void {

    latestResult = null;


    localStorage.removeItem(

        STORAGE_KEY

    );

}


/**
 * Persist the current result.
 */
function saveLatestResult():void {

    if(!latestResult){

        localStorage.removeItem(

            STORAGE_KEY

        );

        return;

    }


    try {

        localStorage.setItem(

            STORAGE_KEY,

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

            STORAGE_KEY

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

            STORAGE_KEY

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