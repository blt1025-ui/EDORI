/**
 * TriggerConfigurationRepository
 *
 * PostgreSQL persistence for EDORI hospital-specific
 * operational-trigger overrides.
 *
 * Only editable override data is stored. Protected
 * built-in trigger logic remains in the application.
 */

import {

    databasePool

}

from "../database/database.js";


export interface StoredTriggerConfigurationOverride {

    triggerId:string;

    enabled:boolean;

    interventionIds:string[];

}


export interface StoredTriggerConfiguration {

    schemaVersion:number;

    overrides:StoredTriggerConfigurationOverride[];

}


export interface StoredTriggerConfigurationEnvelope {

    schemaVersion:number;

    savedAt:string;

    savedByUserId:string;

    savedByUsername:string;

    savedByDisplayName:string;

    configuration:StoredTriggerConfiguration;

}


interface TriggerConfigurationRow {

    schema_version:number;

    saved_at:Date;

    saved_by_user_id:string | null;

    saved_by_username:string;

    saved_by_display_name:string;

    configuration:StoredTriggerConfiguration;

}


/**
 * Return the optional active trigger override.
 */
export async function getTriggerConfigurationOverride():

Promise<StoredTriggerConfigurationEnvelope | null> {

    const result =

        await databasePool.query<TriggerConfigurationRow>(

            `
                SELECT
                    schema_version,
                    saved_at,
                    saved_by_user_id,
                    saved_by_username,
                    saved_by_display_name,
                    configuration
                FROM trigger_configuration_override
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
 * Insert or replace the active hospital-specific trigger
 * override.
 */
export async function saveTriggerConfigurationOverride(

    input:{

        schemaVersion:number;

        savedAt:string;

        savedByUserId:string;

        savedByUsername:string;

        savedByDisplayName:string;

        configuration:StoredTriggerConfiguration;

    }

):Promise<void> {

    await databasePool.query(

        `
            INSERT INTO trigger_configuration_override (
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
 * Remove the saved override so built-in trigger behavior
 * becomes effective again.
 */
export async function clearTriggerConfigurationOverride():

Promise<boolean> {

    const result =

        await databasePool.query(

            `
                DELETE FROM trigger_configuration_override
                WHERE singleton_key = 'active'
            `

        );


    return result.rowCount === 1;

}


function cloneConfiguration(

    configuration:StoredTriggerConfiguration

):StoredTriggerConfiguration {

    return {

        schemaVersion:
            configuration.schemaVersion,

        overrides:
            configuration.overrides.map(
                override => ({

                    triggerId:
                        override.triggerId,

                    enabled:
                        override.enabled,

                    interventionIds:[
                        ...override.interventionIds
                    ]

                })
            )

    };

}