/**
 * SurgePlanRepository
 *
 * PostgreSQL persistence for the optional hospital-
 * specific EDORI surge-plan override.
 *
 * Built-in TypeScript surge-plan configuration remains
 * the fallback when no database override exists.
 */

import {

    databasePool

}

from "../database/database.js";


export type SurgePlanCategory =
    | "ED Capacity"
    | "ED Flow"
    | "Boarding"
    | "Hospital Throughput"
    | "Leadership Escalation"
    | "Clinical Operations"
    | "Monitoring";


export type SurgePlanPriority =
    | "Routine"
    | "Moderate"
    | "High"
    | "Immediate";


export interface StoredSurgePlanIntervention {

    id:string;

    title:string;

    description:string;

    category:SurgePlanCategory;

    defaultPriority:SurgePlanPriority;

    responsibleGroup:string;

    objective:string;

    reassessmentMinutes:number | null;

    enabled:boolean;

}


export interface StoredSurgePlanConfiguration {

    schemaVersion:number;

    name:string;

    description:string;

    interventions:StoredSurgePlanIntervention[];

}


export interface StoredSurgePlanEnvelope {

    schemaVersion:number;

    savedAt:string;

    savedByUserId:string;

    savedByUsername:string;

    savedByDisplayName:string;

    configuration:StoredSurgePlanConfiguration;

}


interface SurgePlanRow {

    schema_version:number;

    saved_at:Date;

    saved_by_user_id:string | null;

    saved_by_username:string;

    saved_by_display_name:string;

    configuration:StoredSurgePlanConfiguration;

}


/**
 * Return the optional active surge-plan override.
 */
export async function getSurgePlanOverride():

Promise<StoredSurgePlanEnvelope | null> {

    const result =

        await databasePool.query<SurgePlanRow>(

            `
                SELECT
                    schema_version,
                    saved_at,
                    saved_by_user_id,
                    saved_by_username,
                    saved_by_display_name,
                    configuration
                FROM surge_plan_override
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

        savedAt:
            new Date(
                row.saved_at
            ).toISOString(),

        savedByUserId:
            row.saved_by_user_id
            ?? "",

        savedByUsername:
            row.saved_by_username,

        savedByDisplayName:
            row.saved_by_display_name,

        configuration:
            cloneConfiguration(
                row.configuration
            )

    };

}


/**
 * Insert or replace the active hospital-specific plan.
 */
export async function saveSurgePlanOverride(

    input:{

        schemaVersion:number;

        savedAt:string;

        savedByUserId:string;

        savedByUsername:string;

        savedByDisplayName:string;

        configuration:StoredSurgePlanConfiguration;

    }

):Promise<void> {

    await databasePool.query(

        `
            INSERT INTO surge_plan_override (
                singleton_key,
                schema_version,
                saved_at,
                saved_by_user_id,
                saved_by_username,
                saved_by_display_name,
                configuration,
                updated_at
            )
            VALUES (
                'active',
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
                schema_version =
                    EXCLUDED.schema_version,
                saved_at =
                    EXCLUDED.saved_at,
                saved_by_user_id =
                    EXCLUDED.saved_by_user_id,
                saved_by_username =
                    EXCLUDED.saved_by_username,
                saved_by_display_name =
                    EXCLUDED.saved_by_display_name,
                configuration =
                    EXCLUDED.configuration,
                updated_at =
                    NOW()
        `,

        [
            input.schemaVersion,
            input.savedAt,
            input.savedByUserId,
            input.savedByUsername,
            input.savedByDisplayName,
            JSON.stringify(
                input.configuration
            )
        ]

    );

}


/**
 * Remove the active override so built-in defaults become
 * effective again.
 */
export async function clearSurgePlanOverride():

Promise<boolean> {

    const result =

        await databasePool.query(

            `
                DELETE FROM surge_plan_override
                WHERE singleton_key = 'active'
            `

        );


    return result.rowCount === 1;

}


function cloneConfiguration(

    configuration:StoredSurgePlanConfiguration

):StoredSurgePlanConfiguration {

    return {

        schemaVersion:
            configuration.schemaVersion,

        name:
            configuration.name,

        description:
            configuration.description,

        interventions:
            configuration.interventions.map(
                intervention => ({
                    ...intervention
                })
            )

    };

}