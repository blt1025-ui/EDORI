/**
 * HistoricalDataRepository
 *
 * Persistent storage for the active EDORI
 * historical-expectation dataset.
 *
 * Data-source priority:
 *
 * 1. Valid imported dataset from localStorage
 * 2. Built-in HistoricalExpectations.ts dataset
 *
 * This repository:
 *
 * - Validates imported datasets before saving
 * - Validates restored datasets before use
 * - Uses versioned browser storage
 * - Returns defensive copies
 * - Falls back safely to built-in data
 *
 * This repository does not parse CSV files.
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


const STORAGE_KEY =

    "edori_historical_expectations";


/**
 * Increase when the persisted historical-data
 * structure changes incompatibly.
 */
const STORAGE_VERSION = 1;


const EXPECTED_RECORD_COUNT = 168;


/**
 * Stored browser-data wrapper.
 */
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

    const normalizedDataset =

        normalizeDataset(

            dataset

        );


    const validation =

        validateHistoricalDataset(

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

            "Unable to save the historical expectation dataset:",

            error

        );


        throw new Error(

            "The historical expectation dataset could not be saved to browser storage."

        );

    }

}


/**
 * Return the active historical dataset.
 *
 * Imported data are used only when the complete
 * stored dataset passes validation.
 */
export function getHistoricalDataset():

HistoricalExpectation[] {

    const importedDataset =

        loadImportedDataset();


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
 *
 * An empty array is returned when no valid imported
 * dataset exists.
 */
export function getImportedHistoricalDataset():

HistoricalExpectation[] {

    const importedDataset =

        loadImportedDataset();


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
 * Remove imported historical expectations.
 *
 * The built-in dataset becomes active immediately.
 */
export function clearImportedHistoricalDataset():

void {

    localStorage.removeItem(

        STORAGE_KEY

    );

}


/**
 * Return the active dataset source.
 */
export function getHistoricalDataSource():

    | "imported"

    | "built-in" {

    return hasImportedHistoricalDataset()

        ? "imported"

        : "built-in";

}


/**
 * Return the number of active records.
 */
export function getHistoricalRecordCount():

number {

    return getHistoricalDataset().length;

}


/**
 * Return detailed repository diagnostics.
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

    const importedDataset =

        loadImportedDataset();


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
 * Load and validate imported data.
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


        const normalizedDataset =

            normalizeDataset(

                envelope.records

            );


        const validation =

            validateHistoricalDataset(

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

            "Unable to restore the imported historical dataset:",

            error

        );


        localStorage.removeItem(

            STORAGE_KEY

        );


        return null;

    }

}


/**
 * Extract the current or legacy storage format.
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


    /*
     * Current versioned format.
     */

    if(

        typeof candidate.version === "number"

        &&

        candidate.records !== undefined

    ){

        if(

            candidate.version

            !==

            STORAGE_VERSION

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


    /*
     * Legacy format stored the array directly.
     */

    if(Array.isArray(value)){

        return {

            importedAt:
                new Date().toISOString(),

            records:
                value

        };

    }


    return null;

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


    const normalizedRecords = value

        .map(

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
 * Normalize one historical record.
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

        expectedVolume?:unknown;

        expectedBoarders?:unknown;

        expectedArrivals?:unknown;

        expectedDepartures?:unknown;

    };


    const day = normalizeDay(

        candidate.day

    );


    const hour = normalizeHour(

        candidate.hour

    );


    const expectedVolume =

        normalizeHistoricalNumber(

            candidate.expectedVolume

        );


    const expectedBoarders =

        normalizeHistoricalNumber(

            candidate.expectedBoarders

        );


    const expectedArrivals =

        normalizeHistoricalNumber(

            candidate.expectedArrivals

        );


    const expectedDepartures =

        normalizeHistoricalNumber(

            candidate.expectedDepartures

        );


    if(

        !day

        ||

        hour === null

        ||

        expectedVolume === null

        ||

        expectedBoarders === null

        ||

        expectedArrivals === null

        ||

        expectedDepartures === null

    ){

        return null;

    }


    if(expectedBoarders > expectedVolume){

        return null;

    }


    return {

        day,

        hour,

        expectedVolume,

        expectedBoarders,

        expectedArrivals,

        expectedDepartures

    };

}


/**
 * Normalize a weekday value.
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
 * Normalize an hour to 0–23.
 */
function normalizeHour(

    value:unknown

):number | null {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(

            value

        )

        ||

        !Number.isInteger(

            value

        )

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
 * Normalize a historical numeric value.
 *
 * Two decimal places are retained.
 */
function normalizeHistoricalNumber(

    value:unknown

):number | null {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(

            value

        )

        ||

        value < 0

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
 * Sort records from Sunday 00:00 through
 * Saturday 23:00.
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


    return first.hour -

        second.hour;

}


/**
 * Return the weekday sort position.
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
 * Return defensive dataset copies.
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