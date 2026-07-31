/**
 * HistoricalDataService
 *
 * Provides expected operational conditions
 * using weekday and hour of day.
 *
 * The service reads from HistoricalDataRepository,
 * allowing imported CSV data to override the
 * built-in sample dataset.
 */

import {

    getHistoricalDataset

}

from "./HistoricalDataRepository";


import type {

    DayOfWeek,

    HistoricalExpectation

}

from "../types/HistoricalExpectation";


export type {

    DayOfWeek

}

from "../types/HistoricalExpectation";


export interface ExpectedOperationalValues {

    expectedVolume:number;

    expectedBoarders:number;

    expectedArrivals:number;

    expectedDepartures:number;

}


/**
 * Find a historical expectation by weekday
 * and hour.
 */
export function getHistoricalExpectation(

    day:DayOfWeek,

    hour:number

):HistoricalExpectation {

    const safeHour = normalizeHour(

        hour

    );


    const dataset = getHistoricalDataset();


    const match = dataset.find(

        record =>

            record.day === day

            &&

            record.hour === safeHour

    );


    if(match){

        return cloneExpectation(

            match

        );

    }


    return createDefaultExpectation(

        day,

        safeHour

    );

}


/**
 * Return only the expected values required
 * by the assessment workflow.
 */
export function getExpectedOperationalValues(

    day:DayOfWeek,

    hour:number

):ExpectedOperationalValues {

    const expectation = getHistoricalExpectation(

        day,

        hour

    );


    return {

        expectedVolume:
            expectation.expectedVolume,

        expectedBoarders:
            expectation.expectedBoarders,

        expectedArrivals:
            expectation.expectedArrivals,

        expectedDepartures:
            expectation.expectedDepartures

    };

}


/**
 * Determine whether the active dataset contains
 * a record for the requested weekday and hour.
 */
export function hasHistoricalExpectation(

    day:DayOfWeek,

    hour:number

):boolean {

    const safeHour = normalizeHour(

        hour

    );


    return getHistoricalDataset().some(

        record =>

            record.day === day

            &&

            record.hour === safeHour

    );

}


/**
 * Return all records for one weekday.
 */
export function getExpectationsForDay(

    day:DayOfWeek

):HistoricalExpectation[] {

    return getHistoricalDataset()

        .filter(

            record => record.day === day

        )

        .sort(

            (

                first,

                second

            ) => first.hour - second.hour

        )

        .map(

            cloneExpectation

        );

}


/**
 * Return the complete active dataset.
 */
export function getAllHistoricalExpectations():

HistoricalExpectation[] {

    return getHistoricalDataset();

}


/**
 * Convert a Date into a weekday.
 */
export function getDayOfWeekFromDate(

    date:Date

):DayOfWeek {

    const days:DayOfWeek[] = [

        "Sunday",

        "Monday",

        "Tuesday",

        "Wednesday",

        "Thursday",

        "Friday",

        "Saturday"

    ];


    return days[

        date.getDay()

    ];

}


/**
 * Return the weekday and hourly bucket for
 * an assessment timestamp.
 */
export function getAssessmentPeriod(

    date:Date

):{

    day:DayOfWeek;

    hour:number;

} {

    return {

        day:
            getDayOfWeekFromDate(

                date

            ),

        hour:
            normalizeHour(

                date.getHours()

            )

    };

}


/**
 * Normalize an hour to 0–23.
 */
function normalizeHour(

    hour:number

):number {

    if(!Number.isFinite(hour)){

        return 0;

    }


    return Math.min(

        23,

        Math.max(

            0,

            Math.floor(hour)

        )

    );

}


/**
 * Create an empty expectation when no
 * matching record exists.
 */
function createDefaultExpectation(

    day:DayOfWeek,

    hour:number

):HistoricalExpectation {

    return {

        day,

        hour,

        expectedVolume:0,

        expectedBoarders:0,

        expectedArrivals:0,

        expectedDepartures:0

    };

}


/**
 * Return a defensive record copy.
 */
function cloneExpectation(

    expectation:HistoricalExpectation

):HistoricalExpectation {

    return {

        ...expectation

    };

}