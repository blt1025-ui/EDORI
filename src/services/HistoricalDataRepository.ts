/**
 * HistoricalDataRepository
 *
 * Provides persistent storage for the EDORI
 * weekly historical-expectation dataset.
 *
 * Data priority:
 *
 * 1. Imported dataset stored in localStorage
 * 2. Built-in HistoricalExpectations.ts dataset
 *
 * This repository does not parse CSV files.
 * CSV parsing will be added in the next step.
 */

import {

    HISTORICAL_EXPECTATIONS

}

from "../data/HistoricalExpectations";


import type {

    HistoricalExpectation

}

from "../types/HistoricalExpectation";


const STORAGE_KEY =

    "edori_historical_expectations";


/**
 * Return the active historical dataset.
 *
 * Imported data takes priority over the
 * built-in TypeScript dataset.
 */
export function getHistoricalDataset():

HistoricalExpectation[] {

    const importedDataset =

        loadImportedDataset();


    if(importedDataset.length > 0){

        return cloneDataset(

            importedDataset

        );

    }


    return cloneDataset(

        HISTORICAL_EXPECTATIONS

    );

}


/**
 * Save a validated imported dataset.
 *
 * Validation should occur before calling
 * this function.
 */
export function saveHistoricalDataset(

    dataset:HistoricalExpectation[]

):void {

    const normalizedDataset = dataset

        .map(

            normalizeRecord

        )

        .sort(

            compareRecords

        );


    try {

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(

                normalizedDataset

            )

        );

    }
    catch(error){

        console.error(

            "Unable to save the historical expectation dataset:",

            error

        );


        throw new Error(

            "The historical dataset could not be saved."

        );

    }

}


/**
 * Determine whether an imported dataset exists.
 */
export function hasImportedHistoricalDataset():

boolean {

    return loadImportedDataset().length > 0;

}


/**
 * Return the imported dataset only.
 *
 * Returns an empty array when no imported
 * dataset exists.
 */
export function getImportedHistoricalDataset():

HistoricalExpectation[] {

    return cloneDataset(

        loadImportedDataset()

    );

}


/**
 * Remove the imported dataset.
 *
 * The application will then return to the
 * built-in dataset.
 */
export function clearImportedHistoricalDataset():

void {

    localStorage.removeItem(

        STORAGE_KEY

    );

}


/**
 * Return the number of active records.
 */
export function getHistoricalRecordCount():

number {

    return getHistoricalDataset().length;

}


/**
 * Identify the active data source.
 */
export function getHistoricalDataSource():

    | "imported"

    | "built-in" {

    return hasImportedHistoricalDataset()

        ? "imported"

        : "built-in";

}


/**
 * Load imported records from localStorage.
 */
function loadImportedDataset():

HistoricalExpectation[] {

    try {

        const stored = localStorage.getItem(

            STORAGE_KEY

        );


        if(!stored){

            return [];

        }


        const parsed = JSON.parse(

            stored

        ) as unknown;


        if(!Array.isArray(parsed)){

            throw new Error(

                "Stored historical data is not an array."

            );

        }


        const records = parsed

            .map(

                parseStoredRecord

            )

            .filter(

                (

                    record

                ):record is HistoricalExpectation =>

                    record !== null

            );


        /*
         * If any stored rows are invalid, reject the
         * entire imported dataset rather than using a
         * partially corrupted weekly profile.
         */

        if(records.length !== parsed.length){

            throw new Error(

                "One or more stored historical records are invalid."

            );

        }


        return records.sort(

            compareRecords

        );

    }
    catch(error){

        console.error(

            "Unable to restore the imported historical dataset:",

            error

        );


        localStorage.removeItem(

            STORAGE_KEY

        );


        return [];

    }

}


/**
 * Convert one unknown stored value into a
 * HistoricalExpectation.
 */
function parseStoredRecord(

    value:unknown

):HistoricalExpectation | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const record = value as {

        day?:unknown;

        hour?:unknown;

        expectedVolume?:unknown;

        expectedBoarders?:unknown;

        expectedArrivals?:unknown;

        expectedDepartures?:unknown;

    };


    if(

        !isDayOfWeek(

            record.day

        )

        ||

        !isValidHour(

            record.hour

        )

        ||

        !isNonNegativeNumber(

            record.expectedVolume

        )

        ||

        !isNonNegativeNumber(

            record.expectedBoarders

        )

        ||

        !isNonNegativeNumber(

            record.expectedArrivals

        )

        ||

        !isNonNegativeNumber(

            record.expectedDepartures

        )

    ){

        return null;

    }


    return {

        day:
            record.day,

        hour:
            record.hour,

        expectedVolume:
            record.expectedVolume,

        expectedBoarders:
            record.expectedBoarders,

        expectedArrivals:
            record.expectedArrivals,

        expectedDepartures:
            record.expectedDepartures

    };

}


/**
 * Normalize a validated historical record.
 */
function normalizeRecord(

    record:HistoricalExpectation

):HistoricalExpectation {

    return {

        day:
            record.day,

        hour:
            Math.floor(

                record.hour

            ),

        expectedVolume:
            normalizeHistoricalNumber(

                record.expectedVolume

            ),

        expectedBoarders:
            normalizeHistoricalNumber(

                record.expectedBoarders

            ),

        expectedArrivals:
            normalizeHistoricalNumber(

                record.expectedArrivals

            ),

        expectedDepartures:
            normalizeHistoricalNumber(

                record.expectedDepartures

            )

    };

}


/**
 * Normalize a valid historical number.
 *
 * Two decimal places are retained so either
 * means or medians can be imported.
 */
function normalizeHistoricalNumber(

    value:number

):number {

    return Math.round(

        value * 100

    ) / 100;

}


/**
 * Sort records by weekday and hour.
 */
function compareRecords(

    first:HistoricalExpectation,

    second:HistoricalExpectation

):number {

    const dayDifference =

        getDayIndex(

            first.day

        )

        -

        getDayIndex(

            second.day

        );


    if(dayDifference !== 0){

        return dayDifference;

    }


    return first.hour - second.hour;

}


/**
 * Return the weekday's sort position.
 */
function getDayIndex(

    day:HistoricalExpectation["day"]

):number {

    const days:HistoricalExpectation["day"][] = [

        "Sunday",

        "Monday",

        "Tuesday",

        "Wednesday",

        "Thursday",

        "Friday",

        "Saturday"

    ];


    return days.indexOf(

        day

    );

}


/**
 * Validate a weekday value.
 */
function isDayOfWeek(

    value:unknown

):value is HistoricalExpectation["day"] {

    return [

        "Sunday",

        "Monday",

        "Tuesday",

        "Wednesday",

        "Thursday",

        "Friday",

        "Saturday"

    ].includes(

        value as string

    );

}


/**
 * Validate an hourly bucket.
 */
function isValidHour(

    value:unknown

):value is number {

    return typeof value === "number"

        &&

        Number.isInteger(

            value

        )

        &&

        value >= 0

        &&

        value <= 23;

}


/**
 * Validate a historical numeric value.
 */
function isNonNegativeNumber(

    value:unknown

):value is number {

    return typeof value === "number"

        &&

        Number.isFinite(

            value

        )

        &&

        value >= 0;

}


/**
 * Return defensive record copies.
 */
function cloneDataset(

    dataset:HistoricalExpectation[]

):HistoricalExpectation[] {

    return dataset.map(

        record => ({

            ...record

        })

    );

}