/**
 * HistoricalDataValidator
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Pure validation functions for a candidate
 * historical-expectation dataset.
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


const EXPECTED_RECORD_COUNT = DAYS.length * 24;


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


    const missingRecords = findMissingRecords(

        copiedDataset

    );


    const duplicateRecords = findDuplicateRecords(

        copiedDataset

    );


    const invalidRecords = findInvalidRecords(

        copiedDataset

    );


    return {

        valid:
            copiedDataset.length === EXPECTED_RECORD_COUNT
            &&
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

    const counts = new Map<string, number>();


    dataset.forEach(

        record => {

            const key = createRecordKey(

                record.day,
                record.hour

            );


            counts.set(

                key,

                (
                    counts.get(key)
                    ?? 0
                )
                +
                1

            );

        }

    );


    return Array.from(
        counts.entries()
    )
        .filter(
            ([, count]) => count > 1
        )
        .map(
            ([key]) => key
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
                DAYS.includes(record.day)
                &&
                Number.isInteger(record.hour)

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
 * Validate one Version 2.1 historical record.
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
        !Number.isInteger(record.hour)
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
        record.expectedEDVolume,
        "expectedEDVolume",
        errors
    );


    validateNonNegativeNumber(
        record.expectedEDBoarders,
        "expectedEDBoarders",
        errors
    );


    validatePositiveNumber(
        record.expectedStaffedAcuteCareBeds,
        "expectedStaffedAcuteCareBeds",
        errors
    );


    validateNonNegativeNumber(
        record.expectedOccupiedAcuteCareBeds,
        "expectedOccupiedAcuteCareBeds",
        errors
    );


    validateNonNegativeNumber(
        record.expectedEDAdmissions,
        "expectedEDAdmissions",
        errors
    );


    validateNonNegativeNumber(
        record.expectedDirectAdmissions,
        "expectedDirectAdmissions",
        errors
    );


    validateNonNegativeNumber(
        record.expectedSurgicalAdmissions,
        "expectedSurgicalAdmissions",
        errors
    );


    validateNonNegativeNumber(
        record.expectedInpatientDepartures,
        "expectedInpatientDepartures",
        errors
    );


    if(
        Number.isFinite(record.expectedEDBoarders)
        &&
        Number.isFinite(record.expectedEDVolume)
        &&
        record.expectedEDBoarders > record.expectedEDVolume
    ){

        errors.push(
            "expectedEDBoarders cannot exceed expectedEDVolume"
        );

    }


    if(
        Number.isFinite(record.expectedOccupiedAcuteCareBeds)
        &&
        Number.isFinite(record.expectedStaffedAcuteCareBeds)
        &&
        record.expectedOccupiedAcuteCareBeds
            >
        record.expectedStaffedAcuteCareBeds
    ){

        errors.push(
            "expectedOccupiedAcuteCareBeds cannot exceed expectedStaffedAcuteCareBeds"
        );

    }


    return errors;

}


/**
 * Validate a nonnegative historical value.
 */
function validateNonNegativeNumber(

    value:number,

    field:string,

    errors:string[]

):void {

    if(!Number.isFinite(value)){

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
 * Validate a strictly positive historical value.
 */
function validatePositiveNumber(

    value:number,

    field:string,

    errors:string[]

):void {

    if(!Number.isFinite(value)){

        errors.push(
            `${field} must be a finite number`
        );

        return;

    }


    if(value <= 0){

        errors.push(
            `${field} must be greater than zero`
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