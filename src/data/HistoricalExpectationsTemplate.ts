/**
 * HistoricalExpectationsTemplate
 *
 * Development helper containing all
 * 168 weekday/hour combinations.
 *
 * All expectation values are placeholders.
 */

import type {

    DayOfWeek,

    HistoricalExpectation

}

from "../types/HistoricalExpectation";


const DAYS:DayOfWeek[] = [

    "Sunday",

    "Monday",

    "Tuesday",

    "Wednesday",

    "Thursday",

    "Friday",

    "Saturday"

];


export const HISTORICAL_EXPECTATIONS_TEMPLATE:

HistoricalExpectation[] = DAYS.flatMap(

    day => Array.from(

        {

            length:24

        },

        (

            _,

            hour

        ) => ({

            day,

            hour,

            expectedVolume:0,

            expectedBoarders:0,

            expectedArrivals:0,

            expectedDepartures:0

        })

    )

);