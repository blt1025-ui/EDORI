/**
 * ResultService
 *
 * Stores the most recently completed EDORI result.
 *
 * EDORI should be calculated once when the user
 * submits an assessment. Dashboard components then
 * read the stored result instead of independently
 * recalculating it.
 */

import type { EdoriResult }
from "../types/EdoriResult";


let latestResult:EdoriResult | null = null;


/**
 * Store the result from the most recently
 * submitted assessment.
 */
export function setLatestResult(

    result:EdoriResult

):void {

    latestResult = {

        ...result,

        drivers:[

            ...result.drivers

        ],

        recommendations:[

            ...result.recommendations

        ],

        operationalState:{

            ...result.operationalState

        },

        timestamp:new Date(

            result.timestamp

        )

    };

}


/**
 * Return the most recently submitted result.
 *
 * Returns null before the first assessment
 * has been calculated.
 */
export function getLatestResult():

EdoriResult | null {

    if(!latestResult){

        return null;

    }


    return {

        ...latestResult,

        drivers:[

            ...latestResult.drivers

        ],

        recommendations:[

            ...latestResult.recommendations

        ],

        operationalState:{

            ...latestResult.operationalState

        },

        timestamp:new Date(

            latestResult.timestamp

        )

    };

}


/**
 * Remove the current result.
 *
 * Primarily useful for testing and future
 * dashboard reset functionality.
 */
export function clearLatestResult():void {

    latestResult = null;

}