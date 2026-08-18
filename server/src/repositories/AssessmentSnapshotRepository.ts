/**
 * AssessmentSnapshotRepository
 *
 * PostgreSQL persistence for completed EDORI Hospital
 * Readiness assessment snapshots.
 *
 * The complete versioned snapshot is stored in JSONB while
 * frequently queried fields are also stored in typed,
 * indexed columns.
 */

import {

    databasePool

}

from "../database/database.js";


export interface StoredAssessmentSnapshot {

    id:string;

    timestamp:string;

    schemaVersion:number;

    enteredByUserId:string;

    enteredByDisplayName:string;

    enteredByUsername:string;

    score:number;

    status:string;

    operationalState:{
        title:string;

        icon:string;

        color:string;

        recommendation:string;
    };

    day:string;

    hour:number;

    forecastHours:number;

    totalEDVolume:number;

    boardedPatients:number;

    staffedAcuteCareBeds:number;

    occupiedAcuteCareBeds:number;

    staffedCriticalCareBeds:number;

    occupiedCriticalCareBeds:number;

    projectedTotalBedDemand:number;

    projectedCapacityVariance:number;

    [key:string]:unknown;

}


interface SnapshotRow {

    payload:StoredAssessmentSnapshot;

}


/**
 * Save one completed snapshot.
 *
 * Snapshot IDs are authoritative. Re-submitting the same
 * snapshot ID is idempotent.
 */
export async function saveAssessmentSnapshot(

    snapshot:StoredAssessmentSnapshot

):Promise<{

    inserted:boolean;

}> {

    const result =

        await databasePool.query(

            `
                INSERT INTO assessment_snapshots (
                    id,
                    assessment_timestamp,
                    schema_version,

                    entered_by_user_id,
                    entered_by_display_name,
                    entered_by_username,

                    score,
                    status,
                    operational_state_title,

                    assessment_day,
                    assessment_hour,
                    forecast_hours,

                    total_ed_volume,
                    boarded_patients,

                    staffed_acute_care_beds,
                    occupied_acute_care_beds,

                    staffed_critical_care_beds,
                    occupied_critical_care_beds,

                    projected_total_bed_demand,
                    projected_capacity_variance,

                    payload
                )
                VALUES (
                    $1,
                    $2,
                    $3,

                    $4,
                    $5,
                    $6,

                    $7,
                    $8,
                    $9,

                    $10,
                    $11,
                    $12,

                    $13,
                    $14,

                    $15,
                    $16,

                    $17,
                    $18,

                    $19,
                    $20,

                    $21::jsonb
                )
                ON CONFLICT (id)
                DO NOTHING
            `,

            [
                snapshot.id,
                snapshot.timestamp,
                snapshot.schemaVersion,

                normalizeNullableUserId(
                    snapshot.enteredByUserId
                ),
                snapshot.enteredByDisplayName,
                snapshot.enteredByUsername,

                snapshot.score,
                snapshot.status,
                snapshot.operationalState.title,

                snapshot.day,
                snapshot.hour,
                snapshot.forecastHours,

                snapshot.totalEDVolume,
                snapshot.boardedPatients,

                snapshot.staffedAcuteCareBeds,
                snapshot.occupiedAcuteCareBeds,

                snapshot.staffedCriticalCareBeds,
                snapshot.occupiedCriticalCareBeds,

                snapshot.projectedTotalBedDemand,
                snapshot.projectedCapacityVariance,

                JSON.stringify(
                    snapshot
                )
            ]

        );


    return {

        inserted:
            result.rowCount === 1

    };

}


/**
 * Return snapshots newest first.
 */
export async function listAssessmentSnapshots(

    limit:number

):Promise<StoredAssessmentSnapshot[]> {

    const safeLimit =

        Math.max(
            1,
            Math.min(
                1000,
                Math.trunc(
                    limit
                )
            )
        );


    const result =

        await databasePool.query<SnapshotRow>(

            `
                SELECT payload
                FROM assessment_snapshots
                ORDER BY assessment_timestamp DESC
                LIMIT $1
            `,

            [
                safeLimit
            ]

        );


    return result.rows.map(

        row =>
            normalizePayload(
                row.payload
            )

    );

}


/**
 * Return the latest completed snapshot.
 */
export async function getLatestAssessmentSnapshot():

Promise<StoredAssessmentSnapshot | null> {

    const result =

        await databasePool.query<SnapshotRow>(

            `
                SELECT payload
                FROM assessment_snapshots
                ORDER BY assessment_timestamp DESC
                LIMIT 1
            `

        );


    const row =
        result.rows[0];


    return row

        ? normalizePayload(
            row.payload
        )

        : null;

}


/**
 * Remove all persisted assessment history.
 *
 * Authorization for this destructive action belongs in
 * the API route, not the repository.
 */
export async function clearAssessmentSnapshots():

Promise<number> {

    const result =

        await databasePool.query(

            `
                DELETE FROM assessment_snapshots
            `

        );


    return result.rowCount

        ?? 0;

}


function normalizeNullableUserId(

    value:string

):string | null {

    const normalized =
        value.trim();


    return normalized

        ? normalized

        : null;

}


function normalizePayload(

    payload:StoredAssessmentSnapshot

):StoredAssessmentSnapshot {

    return {

        ...payload,

        timestamp:
            new Date(
                payload.timestamp
            ).toISOString(),

        operationalState:{
            ...payload.operationalState
        }

    };

}