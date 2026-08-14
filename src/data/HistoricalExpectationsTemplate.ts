/**
 * HistoricalExpectationsTemplate
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Development helper containing all 168
 * weekday/hour combinations.
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
        ):HistoricalExpectation => ({

            day,

            hour,

            expectedEDVolume:
                0,

            expectedEDBoarders:
                0,

            expectedStaffedAcuteCareBeds:
                1,

            expectedOccupiedAcuteCareBeds:
                0,

            expectedEDAdmissions:
                0,

            expectedDirectAdmissions:
                0,

            expectedSurgicalAdmissions:
                0,

            expectedInpatientDepartures:
                0

        })

    )

);