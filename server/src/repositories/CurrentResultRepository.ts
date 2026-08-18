/**
 * CurrentResultRepository
 *
 * PostgreSQL persistence for EDORI's single authoritative
 * current HRI result / recalculation-required state.
 */

import {

    databasePool

}

from "../database/database.js";


export interface StoredCurrentResultState {

    schemaVersion:number;

    result:Record<string,unknown> | null;

    invalidationReason:string | null;

    updatedAt:string;

    updatedByUserId:string;

    updatedByUsername:string;

    updatedByDisplayName:string;

}


interface CurrentResultRow {

    schema_version:number;

    result:Record<string,unknown> | null;

    invalidation_reason:string | null;

    updated_at:Date;

    updated_by_user_id:string | null;

    updated_by_username:string;

    updated_by_display_name:string;

}


export async function getCurrentResultState():

Promise<StoredCurrentResultState | null> {

    const result =

        await databasePool.query<CurrentResultRow>(

            `
                SELECT
                    schema_version,
                    result,
                    invalidation_reason,
                    updated_at,
                    updated_by_user_id,
                    updated_by_username,
                    updated_by_display_name
                FROM current_result_state
                WHERE singleton_key = 'current'
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

        result:
            row.result
                ? {
                    ...row.result
                }
                : null,

        invalidationReason:
            row.invalidation_reason,

        updatedAt:
            new Date(
                row.updated_at
            ).toISOString(),

        updatedByUserId:
            row.updated_by_user_id
            ?? "",

        updatedByUsername:
            row.updated_by_username,

        updatedByDisplayName:
            row.updated_by_display_name

    };

}


export async function saveCurrentResultState(

    input:{

        schemaVersion:number;

        result:Record<string,unknown> | null;

        invalidationReason:string | null;

        updatedByUserId:string;

        updatedByUsername:string;

        updatedByDisplayName:string;

    }

):Promise<void> {

    const resultTimestamp =

        input.result
        &&
        typeof input.result.timestamp === "string"

            ? input.result.timestamp

            : input.result
            &&
            input.result.timestamp instanceof Date

                ? input.result.timestamp

                : null;


    await databasePool.query(

        `
            INSERT INTO current_result_state (
                singleton_key,
                schema_version,
                result,
                result_timestamp,
                invalidation_reason,
                updated_by_user_id,
                updated_by_username,
                updated_by_display_name,
                updated_at
            )
            VALUES (
                'current',
                $1,
                $2::jsonb,
                $3,
                $4,
                $5,
                $6,
                $7,
                NOW()
            )
            ON CONFLICT (singleton_key)
            DO UPDATE SET
                schema_version =
                    EXCLUDED.schema_version,
                result =
                    EXCLUDED.result,
                result_timestamp =
                    EXCLUDED.result_timestamp,
                invalidation_reason =
                    EXCLUDED.invalidation_reason,
                updated_by_user_id =
                    EXCLUDED.updated_by_user_id,
                updated_by_username =
                    EXCLUDED.updated_by_username,
                updated_by_display_name =
                    EXCLUDED.updated_by_display_name,
                updated_at =
                    NOW()
        `,

        [
            input.schemaVersion,
            input.result
                ? JSON.stringify(
                    input.result
                )
                : null,
            resultTimestamp,
            input.invalidationReason,
            input.updatedByUserId,
            input.updatedByUsername,
            input.updatedByDisplayName
        ]

    );

}


export async function clearCurrentResultState():

Promise<boolean> {

    const result =

        await databasePool.query(

            `
                DELETE FROM current_result_state
                WHERE singleton_key = 'current'
            `

        );


    return result.rowCount === 1;

}