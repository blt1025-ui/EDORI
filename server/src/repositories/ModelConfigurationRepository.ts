/**
 * ModelConfigurationRepository
 *
 * PostgreSQL persistence for the optional EDORI model
 * configuration override.
 *
 * Built-in TypeScript configuration remains the fallback
 * whenever no active database override exists.
 */

import {

    databasePool

}

from "../database/database.js";


export interface StoredModelConfiguration {

    hospital:{
        edCapacity:number;
    };

    domainWeights:{
        edPressure:number;
        acuteCapacity:number;
        criticalCapacity:number;
        inflow:number;
        projectedCapacity:number;
    };

    edPressureWeights:{
        volume:number;
        boarding:number;
        acuity:number;
    };

    operationalLevels:Array<{
        title:
            | "Alpha"
            | "Bravo"
            | "Charlie"
            | "Delta"
            | "Echo";

        minimum:number;

        maximum:number;
    }>;

}


interface ModelConfigurationRow {

    schema_version:number;

    saved_at:Date;

    saved_by_user_id:string | null;

    saved_by_username:string;

    saved_by_display_name:string;

    configuration:StoredModelConfiguration;

}


export interface StoredModelConfigurationEnvelope {

    schemaVersion:number;

    savedAt:string;

    savedByUserId:string;

    savedByUsername:string;

    savedByDisplayName:string;

    configuration:StoredModelConfiguration;

}


/**
 * Return the active optional override.
 */
export async function getModelConfigurationOverride():

Promise<StoredModelConfigurationEnvelope | null> {

    const result =

        await databasePool.query<ModelConfigurationRow>(

            `
                SELECT
                    schema_version,
                    saved_at,
                    saved_by_user_id,
                    saved_by_username,
                    saved_by_display_name,
                    configuration
                FROM model_configuration_override
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
 * Insert or replace the active override.
 */
export async function saveModelConfigurationOverride(

    input:{

        schemaVersion:number;

        savedAt:string;

        savedByUserId:string;

        savedByUsername:string;

        savedByDisplayName:string;

        configuration:StoredModelConfiguration;

    }

):Promise<void> {

    await databasePool.query(

        `
            INSERT INTO model_configuration_override (
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
 * Remove the override so EDORI falls back to built-in
 * configuration.
 */
export async function clearModelConfigurationOverride():

Promise<boolean> {

    const result =

        await databasePool.query(

            `
                DELETE FROM model_configuration_override
                WHERE singleton_key = 'active'
            `

        );


    return result.rowCount === 1;

}


function cloneConfiguration(

    configuration:StoredModelConfiguration

):StoredModelConfiguration {

    return {

        hospital:{
            ...configuration.hospital
        },

        domainWeights:{
            ...configuration.domainWeights
        },

        edPressureWeights:{
            ...configuration.edPressureWeights
        },

        operationalLevels:
            configuration.operationalLevels.map(
                level => ({
                    ...level
                })
            )

    };

}