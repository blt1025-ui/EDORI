/**
 * TimeService
 *
 * Handles changes to the selected day and hour.
 *
 * Responsibilities:
 * 1. Update the current selected time
 * 2. Retrieve historical expectations
 * 3. Populate expected operational values
 */


import { getHistoricalRecord } 
from "./HistoricalService";


import { updateState } 
from "./StateService";



/**
 * Updates the selected operational time.
 *
 * Example:
 *
 * setOperationalTime(
 *     "Monday",
 *     14
 * );
 *
 * This will update:
 *
 * day = Monday
 * hour = 14
 *
 * and populate the expected baseline values.
 */

export function setOperationalTime(

    day: string,

    hour: number

): void {



    /*
     * Update current selected time
     */

    updateState({

        day,

        hour

    });



    /*
     * Retrieve historical expectation
     */

    const historical =
        getHistoricalRecord(
            day,
            hour
        );



    /*
     * If no historical data exists,
     * leave expected values unchanged.
     */

    if (!historical) {

        console.warn(
            `No historical data found for ${day} ${hour}:00`
        );

        return;

    }



    /*
     * Populate expected operational values
     */

    updateState({

        expectedVolume:
            historical.expectedVolume,


        expectedBoarders:
            historical.expectedBoarders,


        expectedRN:
            historical.expectedRN,


        expectedMD:
            historical.expectedMD,


        expectedArrivals:
            historical.expectedArrivals,


        expectedDepartures:
            historical.expectedDepartures

    });


}