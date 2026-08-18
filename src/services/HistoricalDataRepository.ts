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

    requirePermission

}

from "./AuthorizationService";

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


import {

    clearServerHistoricalDataset,
    loadServerHistoricalDataset,
    saveServerHistoricalDataset

}

from "./HistoricalExpectationApiService";


import {

    subscribe

}

from "./EventService";


import {

    APP_EVENTS

}

from "../config/appEvents";


/**
 * Previous Version 2.1 browser-storage key.
 *
 * Retained only so Phase 14C can remove obsolete
 * workstation-local historical data.
 */
const LEGACY_STORAGE_KEY =
    "edori_historical_expectations_v3";


const EXPECTED_RECORD_COUNT = 168;


interface ImportedHistoricalDataset {

    importedAt:string;

    records:HistoricalExpectation[];

}


let importedDataset:ImportedHistoricalDataset | null = null;

let serverDatasetInitialized = false;

let serverDatasetInitializationInProgress = false;


clearLegacyHistoricalStorage();


subscribe(

    APP_EVENTS.USERS_CHANGED,

    () => {

        void initializeServerHistoricalDataset();

    }

);


/**
 * Save a fully validated imported dataset.
 */
export function saveHistoricalDataset(

    dataset:HistoricalExpectation[]

):void {

    requirePermission(
        "historicalData.manage"
    );


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


    importedDataset = {

        importedAt:
            new Date().toISOString(),

        records:
            cloneDataset(
                normalizedDataset
            )

    };


    void persistHistoricalDatasetToServer(
        normalizedDataset
    );

}


/**
 * Return the active historical dataset.
 */
export function getHistoricalDataset():

HistoricalExpectation[] {

    const activeImportedDataset = importedDataset;


    if(activeImportedDataset){

        return cloneDataset(

            activeImportedDataset.records

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

    const activeImportedDataset = importedDataset;


    if(!activeImportedDataset){

        return [];

    }


    return cloneDataset(

        activeImportedDataset.records

    );

}


/**
 * Determine whether a valid imported dataset exists.
 */
export function hasImportedHistoricalDataset():

boolean {

    return importedDataset !== null;

}


/**
 * Remove imported Version 2.1 historical data.
 */
export function clearImportedHistoricalDataset():

void {

    requirePermission(
        "historicalData.manage"
    );


    importedDataset = null;


    void clearServerHistoricalDataset()
        .catch(
            error => {

                console.error(
                    "Unable to clear the PostgreSQL historical expectation dataset:",
                    error
                );

            }
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

    const activeImportedDataset = importedDataset;


    if(activeImportedDataset){

        return {

            source:
                "imported",

            recordCount:
                activeImportedDataset.records.length,

            expectedRecordCount:
                EXPECTED_RECORD_COUNT,

            importedAt:
                new Date(
                    activeImportedDataset.importedAt
                ),

            complete:
                activeImportedDataset.records.length
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
 * Load the authoritative optional imported dataset from
 * PostgreSQL after authentication has been established.
 */
export async function initializeServerHistoricalDataset():

Promise<void> {

    if(
        serverDatasetInitialized
        ||
        serverDatasetInitializationInProgress
    ){

        return;

    }


    serverDatasetInitializationInProgress = true;


    try {

        const serverDataset =
            await loadServerHistoricalDataset();


        if(!serverDataset){

            importedDataset = null;

            serverDatasetInitialized = true;

            return;

        }


        const normalizedDataset =
            normalizeDataset(
                serverDataset.records
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


        const importedAt =
            normalizeTimestamp(
                serverDataset.importedAt
            );


        if(!importedAt){

            throw new Error(
                "The PostgreSQL historical dataset contains an invalid import timestamp."
            );

        }


        importedDataset = {

            importedAt:
                importedAt.toISOString(),

            records:
                cloneDataset(
                    normalizedDataset
                )

        };


        serverDatasetInitialized = true;

    }
    catch(error){

        console.warn(
            "Unable to load the PostgreSQL historical expectation dataset:",
            error
        );

    }
    finally {

        serverDatasetInitializationInProgress = false;

    }

}


/**
 * Persist one validated imported dataset.
 */
async function persistHistoricalDatasetToServer(

    dataset:HistoricalExpectation[]

):Promise<void> {

    try {

        const serverDataset =
            await saveServerHistoricalDataset(
                cloneDataset(
                    dataset
                )
            );


        const normalizedDataset =
            normalizeDataset(
                serverDataset.records
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


        importedDataset = {

            importedAt:
                serverDataset.importedAt,

            records:
                cloneDataset(
                    normalizedDataset
                )

        };


        serverDatasetInitialized = true;

    }
    catch(error){

        console.error(
            "Unable to save the historical expectation dataset to PostgreSQL:",
            error
        );

    }

}


/**
 * Remove obsolete browser-persistent historical data.
 */
function clearLegacyHistoricalStorage():

void {

    try {

        localStorage.removeItem(
            LEGACY_STORAGE_KEY
        );

    }
    catch(error){

        console.warn(
            "Unable to remove legacy historical expectation browser data:",
            error
        );

    }

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