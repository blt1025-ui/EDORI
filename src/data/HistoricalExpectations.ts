/**
 * HistoricalExpectations
 *
 * Temporary sample historical data.
 *
 * Replace these sample records with the
 * completed 168-record weekly dataset.
 */

import type {

    HistoricalExpectation

}

from "../types/HistoricalExpectation";


export const HISTORICAL_EXPECTATIONS:

HistoricalExpectation[] = [

    {

        day:
            "Monday",

        hour:
            0,

        expectedVolume:
            42,

        expectedBoarders:
            28,

        expectedArrivals:
            4,

        expectedDepartures:
            3

    },


    {

        day:
            "Monday",

        hour:
            1,

        expectedVolume:
            39,

        expectedBoarders:
            27,

        expectedArrivals:
            3,

        expectedDepartures:
            4

    },


    {

        day:
            "Tuesday",

        hour:
            12,

        expectedVolume:
            70,

        expectedBoarders:
            31,

        expectedArrivals:
            8,

        expectedDepartures:
            7

    }

];