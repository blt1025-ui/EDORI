/**
 * HistoricalDataValidator
 *
 * Pure validation functions for a candidate
 * historical-expectation dataset.
 *
 * This file does not import the repository and
 * does not access localStorage.
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


const EXPECTED_RECORD_COUNT =

    DAYS.length * 24;


export interface HistoricalDataValidationResult {

    valid:boolean;

    expectedRecordCount:number;

    actualRecordCount:number;

    missingRecords:string[];

    duplicateRecords:string[];

    invalidRecords:string[];

}


/**
 * Validate one complete candidate dataset.
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
 * Find all missing weekday/hour combinations.
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
 * Find duplicate weekday/hour records.
 */
function findDuplicateRecords(

    dataset:HistoricalExpectation[]

):string[] {

    const counts = new Map<

        string,

        number

    >();


    dataset.forEach(

        record => {

            const key = createRecordKey(

                record.day,

                record.hour

            );


            counts.set(

                key,

                (

                    counts.get(

                        key

                    )

                    ?? 0

                )

                + 1

            );

        }

    );


    return Array.from(

        counts.entries()

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
 * Find invalid historical records.
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


            const label =

                DAYS.includes(

                    record.day

                )

                &&

                Number.isInteger(

                    record.hour

                )

                    ? createRecordKey(

                        record.day,

                        record.hour

                    )

                    : `Record ${index + 1}`;


            invalidRecords.push(

                `${label}: ${errors.join(", ")}`

            );

        }

    );


    return invalidRecords;

}


/**
 * Validate one record.
 */
function validateRecord(

    record:HistoricalExpectation

):string[] {

    const errors:string[] = [];


    if(!DAYS.includes(record.day)){

        errors.push(

            "invalid day"

        );

    }


    if(

        !Number.isInteger(

            record.hour

        )

        ||

        record.hour < 0

        ||

        record.hour > 23

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
 * Validate one numeric value.
 */
function validateNonNegativeNumber(

    value:number,

    field:string,

    errors:string[]

):void {

    if(

        !Number.isFinite(

            value

        )

    ){

        errors.push(

            `${field} must be a finite number`

        );


        return;

    }


    if(value < 0){

        errors.push(

            `${field} must be nonnegative`

        );

    }

}


/**
 * Create a readable record key.
 */
function createRecordKey(

    day:DayOfWeek,

    hour:number

):string {

    return `${day} ${String(hour).padStart(2, "0")}:00`;

}