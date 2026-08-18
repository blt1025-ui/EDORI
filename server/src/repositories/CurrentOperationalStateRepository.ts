/**
 * CurrentOperationalStateRepository
 *
 * PostgreSQL persistence for the single authoritative
 * current EDORI Hospital Readiness assessment.
 */

import {

    databasePool

}

from "../database/database.js";


export interface StoredCurrentOperationalState {

    assessmentTime:string;

    day:string;

    hour:number;

    forecastHours:number;

    totalEDVolume:number;

    boardedPatients:number;

    esi1:number;

    esi2:number;

    staffedAcuteCareBeds:number;

    occupiedAcuteCareBeds:number;

    staffedCriticalCareBeds:number;

    occupiedCriticalCareBeds:number;

    currentEDAdmissions:number;

    currentDirectAdmissions:number;

    currentSurgicalAdmissions:number;

    expectedEDVolume:number;

    expectedEDBoarders:number;

    expectedStaffedAcuteCareBeds:number;

    expectedOccupiedAcuteCareBeds:number;

    expectedAvailableAcuteCareBeds:number;

    expectedEDAdmissions4h:number;

    expectedDirectAdmissions4h:number;

    expectedSurgicalAdmissions4h:number;

    expectedHospitalInflow4h:number;

    expectedInpatientDepartures4h:number;

    historicalProjectedBedDemand4h:number;

    historicalProjectedBedBalance4h:number;

}


interface CurrentStateRow {

    assessment:StoredCurrentOperationalState;

    updated_at:Date;

    updated_by_user_id:string | null;

    updated_by_username:string;

    updated_by_display_name:string;

}


/**
 * Return the single current state row.
 */
export async function getCurrentOperationalState():

Promise<{

    assessment:StoredCurrentOperationalState;

    updatedAt:string;

    updatedByUserId:string;

    updatedByUsername:string;

    updatedByDisplayName:string;

} | null> {

    const result =

        await databasePool.query<CurrentStateRow>(

            `
                SELECT
                    assessment,
                    updated_at,
                    updated_by_user_id,
                    updated_by_username,
                    updated_by_display_name
                FROM current_operational_state
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

        assessment:{
            ...row.assessment
        },

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


/**
 * Insert or replace the authoritative current state.
 */
export async function saveCurrentOperationalState(

    input:{

        assessment:StoredCurrentOperationalState;

        schemaVersion:number;

        updatedByUserId:string;

        updatedByUsername:string;

        updatedByDisplayName:string;

    }

):Promise<void> {

    const assessmentTimestamp =

        input.assessment.assessmentTime

            ? input.assessment.assessmentTime

            : null;


    await databasePool.query(

        `
            INSERT INTO current_operational_state (
                singleton_key,
                assessment_timestamp,
                schema_version,
                updated_by_user_id,
                updated_by_username,
                updated_by_display_name,
                assessment,
                updated_at
            )
            VALUES (
                'current',
                $1,
                $2,
                $3,
                $4,
                $5,
                $6::jsonb,
                NOW()
            )
            ON CONFLICT (singleton_key)
            DO UPDATE SET
                assessment_timestamp =
                    EXCLUDED.assessment_timestamp,
                schema_version =
                    EXCLUDED.schema_version,
                updated_by_user_id =
                    EXCLUDED.updated_by_user_id,
                updated_by_username =
                    EXCLUDED.updated_by_username,
                updated_by_display_name =
                    EXCLUDED.updated_by_display_name,
                assessment =
                    EXCLUDED.assessment,
                updated_at =
                    NOW()
        `,

        [
            assessmentTimestamp,
            input.schemaVersion,
            input.updatedByUserId,
            input.updatedByUsername,
            input.updatedByDisplayName,
            JSON.stringify(
                input.assessment
            )
        ]

    );

}


/**
 * Clear the authoritative current operational state.
 */
export async function clearCurrentOperationalState():

Promise<boolean> {

    const result =

        await databasePool.query(

            `
                DELETE FROM current_operational_state
                WHERE singleton_key = 'current'
            `

        );


    return result.rowCount === 1;

}