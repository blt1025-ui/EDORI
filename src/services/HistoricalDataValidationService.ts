/**
 * HistoricalDataValidationService
 *
 * Validates the active weekly historical
 * expectation dataset used by EDORI.
 *
 * The active dataset may come from:
 *
 * 1. An imported CSV dataset stored in localStorage
 * 2. The built-in HistoricalExpectations.ts dataset
 *
 * A complete weekly dataset requires:
 *
 * 7 days × 24 hours = 168 records
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


/**
 * Valid weekday values in display and sort order.
 */
const DAYS:DayOfWeek[] = [

    "Sunday",

    "Monday",

    "Tuesday",

    "Wednesday",

    "Thursday",

    "Friday",

    "Saturday"

];


/**
 * Required number of weekday/hour records.
 */
const EXPECTED_RECORD_COUNT =

    DAYS.length * 24;


/**
 * Result returned by historical-data validation.
 */
export interface HistoricalDataValidationResult {

    /**
     * True only when the dataset is complete,
     * contains no duplicates, and all records
     * contain valid values.
     */
    valid:boolean;


    /**
     * Required number of records.
     */
    expectedRecordCount:number;


    /**
     * Number of records in the active dataset.
     */
    actualRecordCount:number;


    /**
     * Missing weekday/hour combinations.
     */
    missingRecords:string[];


    /**
     * Repeated weekday/hour combinations.
     */
    duplicateRecords:string[];


    /**
     * Records containing invalid values.
     */
    invalidRecords:string[];

}


/**
 * Validate the active historical dataset.
 */
export function validateHistoricalData():

HistoricalDataValidationResult {

    const dataset = getHistoricalDataset();


    const missingRecords =

        findMissingRecords(

            dataset

        );


    const duplicateRecords =

        findDuplicateRecords(

            dataset

        );


    const invalidRecords =

        findInvalidRecords(

            dataset

        );


    return {

        valid:

            missingRecords.length === 0

            &&

            duplicateRecords.length === 0

            &&

            invalidRecords.length === 0,

        expectedRecordCount:
            EXPECTED_RECORD_COUNT,

        actualRecordCount:
            dataset.length,

        missingRecords,

        duplicateRecords,

        invalidRecords

    };

}


/**
 * Validate one candidate dataset without
 * saving it to the repository.
 *
 * This will be used by the CSV import workflow
 * before imported data is persisted.
 */
export function validateHistoricalDataset(

    dataset:HistoricalExpectation[]

):HistoricalDataValidationResult {

    const copiedDataset = dataset.map(

        record => ({

            ...record

        })

    );


    const missingRecords =

        findMissingRecords(

            copiedDataset

        );


    const duplicateRecords =

        findDuplicateRecords(

            copiedDataset

        );


    const invalidRecords =

        findInvalidRecords(

            copiedDataset

        );


    return {

        valid:

            missingRecords.length === 0

            &&

            duplicateRecords.length === 0

            &&

            invalidRecords.length === 0,

        expectedRecordCount:
            EXPECTED_RECORD_COUNT,

        actualRecordCount:
            copiedDataset.length,

        missingRecords,

        duplicateRecords,

        invalidRecords

    };

}


/**
 * Return every missing weekday/hour combination.
 */
function findMissingRecords(

    dataset:HistoricalExpectation[]

):string[] {

    const missingRecords:string[] = [];


    DAYS.forEach(

        day => {

            for(

                let hour = 0;

                hour < 24;

                hour += 1

            ){

                const exists = dataset.some(

                    record =>

                        record.day === day

                        &&

                        record.hour === hour

                );


                if(!exists){

                    missingRecords.push(

                        createRecordKey(

                            day,

                            hour

                        )

                    );

                }

            }

        }

    );


    return missingRecords;

}


/**
 * Find repeated weekday/hour combinations.
 */
function findDuplicateRecords(

    dataset:HistoricalExpectation[]

):string[] {

    const recordCounts = new Map<

        string,

        number

    >();


    dataset.forEach(

        record => {

            const key = createRecordKey(

                record.day,

                record.hour

            );


            const currentCount =

                recordCounts.get(

                    key

                )

                ?? 0;


            recordCounts.set(

                key,

                currentCount + 1

            );

        }

    );


    return Array.from(

        recordCounts.entries()

    )

        .filter(

            (

                [,

                count]

            ) => count > 1

        )

        .map(

            (

                [key]

            ) => key

        )

        .sort();

}


/**
 * Find records containing invalid values.
 */
function findInvalidRecords(

    dataset:HistoricalExpectation[]

):string[] {

    const invalidRecords:string[] = [];


    dataset.forEach(

        (

            record,

            index

        ) => {

            const errors = validateRecord(

                record

            );


            if(errors.length === 0){

                return;

            }


            const recordLabel =

                isDayOfWeek(

                    record.day

                )

                &&

                isValidHour(

                    record.hour

                )

                    ? createRecordKey(

                        record.day,

                        record.hour

                    )

                    : `Record ${index + 1}`;


            invalidRecords.push(

                `${recordLabel}: ${errors.join(", ")}`

            );

        }

    );


    return invalidRecords;

}


/**
 * Validate one historical expectation record.
 */
function validateRecord(

    record:HistoricalExpectation

):string[] {

    const errors:string[] = [];


    if(

        !isDayOfWeek(

            record.day

        )

    ){

        errors.push(

            "day must be a valid weekday"

        );

    }


    if(

        !isValidHour(

            record.hour

        )

    ){

        errors.push(

            "hour must be an integer from 0 through 23"

        );

    }


    validateNonNegativeNumber(

        record.expectedVolume,

        "expectedVolume",

        errors

    );


    validateNonNegativeNumber(

        record.expectedBoarders,

        "expectedBoarders",

        errors

    );


    validateNonNegativeNumber(

        record.expectedArrivals,

        "expectedArrivals",

        errors

    );


    validateNonNegativeNumber(

        record.expectedDepartures,

        "expectedDepartures",

        errors

    );


    if(

        Number.isFinite(

            record.expectedBoarders

        )

        &&

        Number.isFinite(

            record.expectedVolume

        )

        &&

        record.expectedBoarders

        >

        record.expectedVolume

    ){

        errors.push(

            "expectedBoarders cannot exceed expectedVolume"

        );

    }


    return errors;

}


/**
 * Validate a nonnegative historical value.
 */
function validateNonNegativeNumber(

    value:number,

    fieldName:string,

    errors:string[]

):void {

    if(

        !Number.isFinite(

            value

        )

    ){

        errors.push(

            `${fieldName} must be a finite number`

        );


        return;

    }


    if(value < 0){

        errors.push(

            `${fieldName} must be nonnegative`

        );

    }

}


/**
 * Determine whether a value is a valid weekday.
 */
function isDayOfWeek(

    value:unknown

):value is DayOfWeek {

    return typeof value === "string"

        &&

        DAYS.includes(

            value as DayOfWeek

        );

}


/**
 * Determine whether a value is a valid
 * hourly bucket.
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
 * Create a readable weekday/hour key.
 */
function createRecordKey(

    day:DayOfWeek,

    hour:number

):string {

    return `${day} ${formatHour(hour)}`;

}


/**
 * Format an hourly bucket.
 */
function formatHour(

    hour:number

):string {

    return `${String(hour).padStart(2, "0")}:00`;

}