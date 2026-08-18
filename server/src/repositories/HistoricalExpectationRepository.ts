/**
 * HistoricalExpectationRepository
 *
 * PostgreSQL persistence for the optional imported EDORI
 * historical expectation dataset.
 *
 * The built-in dataset remains in the frontend bundle and
 * is used whenever this table has no active imported row.
 */

import {

    databasePool

}

from "../database/database.js";


export type HistoricalDayOfWeek =

    | "Sunday"
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday";


export interface StoredHistoricalExpectation {

    day:HistoricalDayOfWeek;

    hour:number;

    expectedEDVolume:number;

    expectedEDBoarders:number;

    expectedStaffedAcuteCareBeds:number;

    expectedOccupiedAcuteCareBeds:number;

    expectedEDAdmissions:number;

    expectedDirectAdmissions:number;

    expectedSurgicalAdmissions:number;

    expectedInpatientDepartures:number;

}


interface HistoricalDatasetRow {

    schema_version:number;

    imported_at:Date;

    imported_by_user_id:string | null;

    imported_by_username:string;

    imported_by_display_name:string;

    record_count:number;

    records:StoredHistoricalExpectation[];

}


export interface StoredHistoricalDataset {

    schemaVersion:number;

    importedAt:string;

    importedByUserId:string;

    importedByUsername:string;

    importedByDisplayName:string;

    recordCount:number;

    records:StoredHistoricalExpectation[];

}


/**
 * Return the active imported historical dataset.
 */
export async function getImportedHistoricalDataset():

Promise<StoredHistoricalDataset | null> {

    const result =

        await databasePool.query<HistoricalDatasetRow>(

            `
                SELECT
                    schema_version,
                    imported_at,
                    imported_by_user_id,
                    imported_by_username,
                    imported_by_display_name,
                    record_count,
                    records
                FROM historical_expectation_dataset
                WHERE singleton_key = 'active'
                LIMIT 1
            `

        );


    const row =
        result.rows[0];


    if(!row){

        return null;

    }


    return {

        schemaVersion:
            row.schema_version,

        importedAt:
            new Date(
                row.imported_at
            ).toISOString(),

        importedByUserId:
            row.imported_by_user_id
            ?? "",

        importedByUsername:
            row.imported_by_username,

        importedByDisplayName:
            row.imported_by_display_name,

        recordCount:
            row.record_count,

        records:
            row.records.map(
                record => ({
                    ...record
                })
            )

    };

}


/**
 * Insert or replace the single active imported dataset.
 */
export async function saveImportedHistoricalDataset(

    input:{

        schemaVersion:number;

        importedAt:string;

        importedByUserId:string;

        importedByUsername:string;

        importedByDisplayName:string;

        records:StoredHistoricalExpectation[];

    }

):Promise<void> {

    await databasePool.query(

        `
            INSERT INTO historical_expectation_dataset (
                singleton_key,
                schema_version,
                imported_at,
                imported_by_user_id,
                imported_by_username,
                imported_by_display_name,
                record_count,
                records,
                updated_at
            )
            VALUES (
                'active',
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7::jsonb,
                NOW()
            )
            ON CONFLICT (singleton_key)
            DO UPDATE SET
                schema_version =
                    EXCLUDED.schema_version,
                imported_at =
                    EXCLUDED.imported_at,
                imported_by_user_id =
                    EXCLUDED.imported_by_user_id,
                imported_by_username =
                    EXCLUDED.imported_by_username,
                imported_by_display_name =
                    EXCLUDED.imported_by_display_name,
                record_count =
                    EXCLUDED.record_count,
                records =
                    EXCLUDED.records,
                updated_at =
                    NOW()
        `,

        [
            input.schemaVersion,
            input.importedAt,
            input.importedByUserId,
            input.importedByUsername,
            input.importedByDisplayName,
            input.records.length,
            JSON.stringify(
                input.records
            )
        ]

    );

}


/**
 * Remove the imported dataset so EDORI falls back to the
 * built-in historical expectations.
 */
export async function clearImportedHistoricalDataset():

Promise<boolean> {

    const result =

        await databasePool.query(

            `
                DELETE FROM historical_expectation_dataset
                WHERE singleton_key = 'active'
            `

        );


    return result.rowCount === 1;

}