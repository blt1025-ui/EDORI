/**
 * HistoricalExpectationRoutes
 *
 * Server API for EDORI's optional imported 168-record
 * historical expectation dataset.
 */

import {

    Router

}

from "express";


import {

    requireAuthentication

}

from "../middleware/AuthMiddleware.js";


import type {

    AuthenticatedRequest

}

from "../middleware/AuthMiddleware.js";


import {

    requirePermission

}

from "../middleware/AuthorizationMiddleware.js";


import {

    clearImportedHistoricalDataset,
    getImportedHistoricalDataset,
    saveImportedHistoricalDataset

}

from "../repositories/HistoricalExpectationRepository.js";


import type {

    HistoricalDayOfWeek,
    StoredHistoricalExpectation

}

from "../repositories/HistoricalExpectationRepository.js";


export const historicalExpectationRouter =

    Router();


const HISTORICAL_DATA_SCHEMA_VERSION = 3;

const EXPECTED_RECORD_COUNT = 168;


historicalExpectationRouter.use(
    requireAuthentication
);


/**
 * Read the optional imported dataset.
 *
 * A null dataset means the frontend should use the
 * built-in HistoricalExpectations.ts baseline.
 */
historicalExpectationRouter.get(

    "/",

    requirePermission(
        "operational.view"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                dataset:
                    await getImportedHistoricalDataset()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Replace the active imported dataset.
 */
historicalExpectationRouter.put(

    "/",

    requirePermission(
        "historicalData.manage"
    ),

    async (
        request:AuthenticatedRequest,
        response,
        next
    ) => {

        try {

            const user =
                request.edoriUser;


            if(!user){

                response.status(401).json({

                    error:
                        "unauthorized"

                });


                return;

            }


            const records =

                normalizeDataset(
                    request.body?.records
                );


            if(

                records.length

                !==

                EXPECTED_RECORD_COUNT

            ){

                response.status(400).json({

                    error:
                        "invalid_historical_dataset",

                    message:
                        "A complete 168-record historical expectation dataset is required."

                });


                return;

            }


            const importedAt =

                new Date().toISOString();


            await saveImportedHistoricalDataset({

                schemaVersion:
                    HISTORICAL_DATA_SCHEMA_VERSION,

                importedAt,

                importedByUserId:
                    user.id,

                importedByUsername:
                    user.username,

                importedByDisplayName:
                    user.displayName,

                records

            });


            response.status(200).json({

                saved:
                    true,

                dataset:
                    await getImportedHistoricalDataset()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Remove imported data and restore built-in fallback.
 */
historicalExpectationRouter.delete(

    "/",

    requirePermission(
        "historicalData.manage"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                cleared:
                    await clearImportedHistoricalDataset()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


function normalizeDataset(

    value:unknown

):StoredHistoricalExpectation[] {

    if(!Array.isArray(value)){

        return [];

    }


    const records =

        value.map(
            normalizeRecord
        );


    if(

        records.some(
            record =>
                record === null
        )

    ){

        return [];

    }


    const normalized =

        records as StoredHistoricalExpectation[];


    if(!hasCompleteUniqueCoverage(normalized)){

        return [];

    }


    return normalized.sort(
        compareRecords
    );

}


function normalizeRecord(

    value:unknown

):StoredHistoricalExpectation | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate =

        value as Partial<StoredHistoricalExpectation>;


    const day =
        normalizeDay(
            candidate.day
        );


    const hour =
        normalizeHour(
            candidate.hour
        );


    const expectedEDVolume =
        normalizeNumber(
            candidate.expectedEDVolume
        );


    const expectedEDBoarders =
        normalizeNumber(
            candidate.expectedEDBoarders
        );


    const expectedStaffedAcuteCareBeds =
        normalizeNumber(
            candidate.expectedStaffedAcuteCareBeds,
            true
        );


    const expectedOccupiedAcuteCareBeds =
        normalizeNumber(
            candidate.expectedOccupiedAcuteCareBeds
        );


    const expectedEDAdmissions =
        normalizeNumber(
            candidate.expectedEDAdmissions
        );


    const expectedDirectAdmissions =
        normalizeNumber(
            candidate.expectedDirectAdmissions
        );


    const expectedSurgicalAdmissions =
        normalizeNumber(
            candidate.expectedSurgicalAdmissions
        );


    const expectedInpatientDepartures =
        normalizeNumber(
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

        ||

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


function hasCompleteUniqueCoverage(

    records:StoredHistoricalExpectation[]

):boolean {

    if(records.length !== EXPECTED_RECORD_COUNT){

        return false;

    }


    const keys =

        new Set(

            records.map(
                record =>
                    `${record.day}:${record.hour}`
            )

        );


    if(keys.size !== EXPECTED_RECORD_COUNT){

        return false;

    }


    for(const day of DAYS){

        for(let hour = 0; hour < 24; hour += 1){

            if(

                !keys.has(
                    `${day}:${hour}`
                )

            ){

                return false;

            }

        }

    }


    return true;

}


const DAYS:HistoricalDayOfWeek[] = [

    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"

];


function normalizeDay(

    value:unknown

):HistoricalDayOfWeek | null {

    if(typeof value !== "string"){

        return null;

    }


    const normalized =

        DAYS.find(
            day =>
                day.toLowerCase()
                ===
                value.trim().toLowerCase()
        );


    return normalized

        ?? null;

}


function normalizeHour(

    value:unknown

):number | null {

    if(

        typeof value !== "number"

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


function normalizeNumber(

    value:unknown,

    strictlyPositive = false

):number | null {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(
            value
        )

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


function compareRecords(

    first:StoredHistoricalExpectation,

    second:StoredHistoricalExpectation

):number {

    const dayDifference =

        DAYS.indexOf(
            first.day
        )

        -

        DAYS.indexOf(
            second.day
        );


    return dayDifference !== 0

        ? dayDifference

        : first.hour - second.hour;

}