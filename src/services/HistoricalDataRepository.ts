/**
 * HistoricalDataRepository
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Persistent storage for the active historical
 * expectation dataset.
 *
 * Data-source priority:
 *
 * 1. Valid imported Version 2.1 dataset
 * 2. Built-in HistoricalExpectations.ts dataset
 *
 * Version 2.1 adds historical acute-care staffed
 * and occupied bed baselines.
 */

import {

    HISTORICAL_EXPECTATIONS

}

from "../data/HistoricalExpectations";


import {

    validateHistoricalDataset

}

from "./HistoricalDataValidator";


import type {

    HistoricalExpectation

}

from "../types/HistoricalExpectation";


/**
 * A new key intentionally prevents Version 2 data,
 * which lacks acute-care baseline fields, from being
 * interpreted as Version 2.1.
 */
const STORAGE_KEY =
    "edori_historical_expectations_v3";


const STORAGE_VERSION = 3;


const EXPECTED_RECORD_COUNT = 168;


interface StoredHistoricalDataEnvelope {

    version:number;

    importedAt:string;

    records:HistoricalExpectation[];

}


/**
 * Save a fully validated imported dataset.
 */
export function saveHistoricalDataset(

    dataset:HistoricalExpectation[]

):void {

    const normalizedDataset = normalizeDataset(

        dataset

    );


    const validation = validateHistoricalDataset(

        normalizedDataset

    );


    if(!validation.valid){

        throw new Error(

            createValidationErrorMessage(
                validation
            )

        );

    }


    const envelope:StoredHistoricalDataEnvelope = {

        version:
            STORAGE_VERSION,

        importedAt:
            new Date().toISOString(),

        records:
            cloneDataset(
                normalizedDataset
            )

    };


    try {

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                envelope
            )

        );

    }
    catch(error){

        console.error(

            "Unable to save the Version 2.1 historical expectation dataset:",

            error

        );


        throw new Error(

            "The historical expectation dataset could not be saved to browser storage."

        );

    }

}


/**
 * Return the active historical dataset.
 */
export function getHistoricalDataset():

HistoricalExpectation[] {

    const importedDataset = loadImportedDataset();


    if(importedDataset){

        return cloneDataset(

            importedDataset.records

        );

    }


    return cloneDataset(

        HISTORICAL_EXPECTATIONS

    );

}


/**
 * Return imported data only.
 */
export function getImportedHistoricalDataset():

HistoricalExpectation[] {

    const importedDataset = loadImportedDataset();


    if(!importedDataset){

        return [];

    }


    return cloneDataset(

        importedDataset.records

    );

}


/**
 * Determine whether a valid imported dataset exists.
 */
export function hasImportedHistoricalDataset():

boolean {

    return loadImportedDataset() !== null;

}


/**
 * Remove imported Version 2.1 historical data.
 */
export function clearImportedHistoricalDataset():

void {

    localStorage.removeItem(

        STORAGE_KEY

    );

}


/**
 * Return the active data source.
 */
export function getHistoricalDataSource():

    | "imported"
    | "built-in" {

    return hasImportedHistoricalDataset()

        ? "imported"
        : "built-in";

}


/**
 * Return the active record count.
 */
export function getHistoricalRecordCount():

number {

    return getHistoricalDataset().length;

}


/**
 * Return repository diagnostics.
 */
export function getHistoricalRepositoryStatus():{

    source:
        | "imported"
        | "built-in";

    recordCount:number;

    expectedRecordCount:number;

    importedAt:Date | null;

    complete:boolean;

} {

    const importedDataset = loadImportedDataset();


    if(importedDataset){

        return {

            source:
                "imported",

            recordCount:
                importedDataset.records.length,

            expectedRecordCount:
                EXPECTED_RECORD_COUNT,

            importedAt:
                new Date(
                    importedDataset.importedAt
                ),

            complete:
                importedDataset.records.length
                ===
                EXPECTED_RECORD_COUNT

        };

    }


    return {

        source:
            "built-in",

        recordCount:
            HISTORICAL_EXPECTATIONS.length,

        expectedRecordCount:
            EXPECTED_RECORD_COUNT,

        importedAt:
            null,

        complete:
            HISTORICAL_EXPECTATIONS.length
            ===
            EXPECTED_RECORD_COUNT

    };

}


/**
 * Load and validate imported Version 2.1 data.
 */
function loadImportedDataset():

StoredHistoricalDataEnvelope | null {

    try {

        const stored = localStorage.getItem(

            STORAGE_KEY

        );


        if(!stored){

            return null;

        }


        const parsed = JSON.parse(

            stored

        ) as unknown;


        const envelope = extractEnvelope(

            parsed

        );


        if(!envelope){

            throw new Error(

                "Stored historical data have an unsupported format."

            );

        }


        const normalizedDataset = normalizeDataset(

            envelope.records

        );


        const validation = validateHistoricalDataset(

            normalizedDataset

        );


        if(!validation.valid){

            throw new Error(

                createValidationErrorMessage(
                    validation
                )

            );

        }


        const importedAt = normalizeTimestamp(

            envelope.importedAt

        );


        if(!importedAt){

            throw new Error(

                "Stored historical data contain an invalid import timestamp."

            );

        }


        return {

            version:
                STORAGE_VERSION,

            importedAt:
                importedAt.toISOString(),

            records:
                cloneDataset(
                    normalizedDataset
                )

        };

    }
    catch(error){

        console.error(

            "Unable to restore the imported Version 2.1 historical dataset:",

            error

        );


        localStorage.removeItem(

            STORAGE_KEY

        );


        return null;

    }

}


/**
 * Extract the Version 2.1 storage envelope.
 */
function extractEnvelope(

    value:unknown

):{

    importedAt:unknown;

    records:unknown;

} | null {

    if(
        typeof value !== "object"
        ||
        value === null
    ){

        return null;

    }


    const candidate = value as {

        version?:unknown;

        importedAt?:unknown;

        records?:unknown;

    };


    if(
        candidate.version !== STORAGE_VERSION
        ||
        candidate.records === undefined
    ){

        return null;

    }


    return {

        importedAt:
            candidate.importedAt,

        records:
            candidate.records

    };

}


/**
 * Normalize a complete unknown dataset.
 */
function normalizeDataset(

    value:unknown

):HistoricalExpectation[] {

    if(!Array.isArray(value)){

        return [];

    }


    const normalizedRecords = value.map(

        normalizeRecord

    );


    if(
        normalizedRecords.some(
            record => record === null
        )
    ){

        return [];

    }


    return (
        normalizedRecords as HistoricalExpectation[]
    )
        .sort(
            compareRecords
        );

}


/**
 * Normalize one Version 2.1 record.
 */
function normalizeRecord(

    value:unknown

):HistoricalExpectation | null {

    if(
        typeof value !== "object"
        ||
        value === null
    ){

        return null;

    }


    const candidate = value as {

        day?:unknown;

        hour?:unknown;

        expectedEDVolume?:unknown;

        expectedEDBoarders?:unknown;

        expectedStaffedAcuteCareBeds?:unknown;

        expectedOccupiedAcuteCareBeds?:unknown;

        expectedEDAdmissions?:unknown;

        expectedDirectAdmissions?:unknown;

        expectedSurgicalAdmissions?:unknown;

        expectedInpatientDepartures?:unknown;

    };


    const day = normalizeDay(
        candidate.day
    );

    const hour = normalizeHour(
        candidate.hour
    );

    const expectedEDVolume = normalizeHistoricalNumber(
        candidate.expectedEDVolume
    );

    const expectedEDBoarders = normalizeHistoricalNumber(
        candidate.expectedEDBoarders
    );

    const expectedStaffedAcuteCareBeds = normalizeHistoricalNumber(
        candidate.expectedStaffedAcuteCareBeds,
        true
    );

    const expectedOccupiedAcuteCareBeds = normalizeHistoricalNumber(
        candidate.expectedOccupiedAcuteCareBeds
    );

    const expectedEDAdmissions = normalizeHistoricalNumber(
        candidate.expectedEDAdmissions
    );

    const expectedDirectAdmissions = normalizeHistoricalNumber(
        candidate.expectedDirectAdmissions
    );

    const expectedSurgicalAdmissions = normalizeHistoricalNumber(
        candidate.expectedSurgicalAdmissions
    );

    const expectedInpatientDepartures = normalizeHistoricalNumber(
        candidate.expectedInpatientDepartures
    );


    if(
        !day
        ||
        hour === null
        ||
        expectedEDVolume === null
        ||
        expectedEDBoarders === null
        ||
        expectedStaffedAcuteCareBeds === null
        ||
        expectedOccupiedAcuteCareBeds === null
        ||
        expectedEDAdmissions === null
        ||
        expectedDirectAdmissions === null
        ||
        expectedSurgicalAdmissions === null
        ||
        expectedInpatientDepartures === null
    ){

        return null;

    }


    if(
        expectedEDBoarders
        >
        expectedEDVolume
    ){

        return null;

    }


    if(
        expectedOccupiedAcuteCareBeds
        >
        expectedStaffedAcuteCareBeds
    ){

        return null;

    }


    return {

        day,

        hour,

        expectedEDVolume,

        expectedEDBoarders,

        expectedStaffedAcuteCareBeds,

        expectedOccupiedAcuteCareBeds,

        expectedEDAdmissions,

        expectedDirectAdmissions,

        expectedSurgicalAdmissions,

        expectedInpatientDepartures

    };

}


/**
 * Normalize a weekday.
 */
function normalizeDay(

    value:unknown

):HistoricalExpectation["day"] | null {

    if(typeof value !== "string"){

        return null;

    }


    const days:HistoricalExpectation["day"][] = [

        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"

    ];


    const match = days.find(

        day =>
            day.toLowerCase()
            ===
            value.trim().toLowerCase()

    );


    return match ?? null;

}


/**
 * Normalize hour 0 through 23.
 */
function normalizeHour(

    value:unknown

):number | null {

    if(
        typeof value !== "number"
        ||
        !Number.isFinite(value)
        ||
        !Number.isInteger(value)
        ||
        value < 0
        ||
        value > 23
    ){

        return null;

    }


    return value;

}


/**
 * Normalize a historical number.
 */
function normalizeHistoricalNumber(

    value:unknown,

    strictlyPositive:boolean = false

):number | null {

    if(
        typeof value !== "number"
        ||
        !Number.isFinite(value)
        ||
        value < 0
        ||
        (
            strictlyPositive
            &&
            value <= 0
        )
    ){

        return null;

    }


    return Math.round(
        value * 100
    ) / 100;

}


/**
 * Normalize a timestamp.
 */
function normalizeTimestamp(

    value:unknown

):Date | null {

    const timestamp = value instanceof Date

        ? new Date(
            value.getTime()
        )

        : typeof value === "string"
            ||
            typeof value === "number"

                ? new Date(
                    value
                )

                : null;


    if(
        !timestamp
        ||
        Number.isNaN(
            timestamp.getTime()
        )
    ){

        return null;

    }


    return timestamp;

}


/**
 * Sort Sunday 00:00 through Saturday 23:00.
 */
function compareRecords(

    first:HistoricalExpectation,

    second:HistoricalExpectation

):number {

    const dayDifference =
        getDayIndex(first.day)
        -
        getDayIndex(second.day);


    if(dayDifference !== 0){

        return dayDifference;

    }


    return first.hour - second.hour;

}


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
 * Build a readable validation failure.
 */
function createValidationErrorMessage(

    validation:{

        actualRecordCount:number;

        missingRecords:string[];

        duplicateRecords:string[];

        invalidRecords:string[];

    }

):string {

    const problems:string[] = [];


    if(
        validation.actualRecordCount
        !==
        EXPECTED_RECORD_COUNT
    ){

        problems.push(

            `${validation.actualRecordCount} records were found; ${EXPECTED_RECORD_COUNT} are required`

        );

    }


    if(validation.missingRecords.length > 0){

        problems.push(

            `${validation.missingRecords.length} weekday/hour records are missing`

        );

    }


    if(validation.duplicateRecords.length > 0){

        problems.push(

            `${validation.duplicateRecords.length} duplicate weekday/hour records were found`

        );

    }


    if(validation.invalidRecords.length > 0){

        problems.push(

            `${validation.invalidRecords.length} invalid records were found`

        );

    }


    return problems.length > 0

        ? `Historical dataset validation failed: ${problems.join("; ")}.`

        : "Historical dataset validation failed.";

}


/**
 * Return defensive copies.
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