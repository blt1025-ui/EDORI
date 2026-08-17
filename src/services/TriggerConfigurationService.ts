/**
 * TriggerConfigurationService
 *
 * Hospital-specific override layer for operational
 * triggers.
 *
 * Phase A allows administrators to customize only:
 *
 * - Trigger enabled / disabled status
 * - Associated response-action IDs
 *
 * The following remain protected built-in logic:
 *
 * - Trigger metric
 * - Comparison operator
 * - Threshold
 * - Threshold source
 * - Multi-condition AND logic
 * - Priority
 * - Minimum operational state
 * - Rationale
 *
 * This service does not modify HRI scoring.
 */

import {

    requirePermission

}

from "./AuthorizationService";




import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    OPERATIONAL_TRIGGERS

}

from "../config/operationalTriggers";


import {

    emit

}

from "./EventService";


import {

    getSurgePlan

}

from "./SurgePlanService";


import type {

    OperationalTrigger

}

from "../types/OperationalTrigger";


/**
 * Persisted schema version.
 */
const SCHEMA_VERSION = 1;


/**
 * Browser-storage key.
 */
const STORAGE_KEY =

    "edori_trigger_configuration";


/**
 * One hospital-specific trigger override.
 */
export interface TriggerConfigurationOverride {

    triggerId:string;

    enabled:boolean;

    interventionIds:string[];

}


/**
 * Complete persisted trigger configuration.
 */
export interface TriggerConfiguration {

    schemaVersion:number;

    overrides:TriggerConfigurationOverride[];

}


/**
 * Validation result.
 */
export interface TriggerConfigurationValidationResult {

    valid:boolean;

    errors:string[];

}


/**
 * Stored envelope.
 */
interface StoredTriggerConfiguration {

    schemaVersion:number;

    savedAt:string;

    configuration:TriggerConfiguration;

}


/**
 * Return a defensive copy of the built-in trigger
 * library.
 */
export function getDefaultTriggerConfiguration():

OperationalTrigger[] {

    return OPERATIONAL_TRIGGERS.map(

        cloneTrigger

    );

}


/**
 * Return the effective trigger library.
 *
 * Saved hospital overrides are applied only to
 * enabled and interventionIds.
 */
export function getOperationalTriggers():

OperationalTrigger[] {

    const defaults =

        getDefaultTriggerConfiguration();


    const stored =

        readStoredConfiguration();


    if(!stored){

        return defaults;

    }


    const overrideMap =

        new Map(

            stored.configuration.overrides.map(

                override => [

                    override.triggerId,

                    override

                ]

            )

        );


    return defaults.map(

        trigger => {

            const override =

                overrideMap.get(

                    trigger.id

                );


            if(!override){

                return trigger;

            }


            return {

                ...trigger,

                enabled:
                    override.enabled,

                interventionIds:[
                    ...override.interventionIds
                ]

            };

        }

    );

}


/**
 * Return the effective trigger with one identifier.
 */
export function getOperationalTrigger(

    triggerId:string

):OperationalTrigger | null {

    const trigger =

        getOperationalTriggers().find(

            item =>

                item.id === triggerId

        );


    return trigger

        ? cloneTrigger(
            trigger
        )

        : null;

}


/**
 * Determine whether saved overrides exist.
 */
export function hasTriggerConfigurationOverrides():

boolean {

    return readStoredConfiguration() !== null;

}


/**
 * Return the saved timestamp for hospital-specific
 * trigger configuration.
 */
export function getTriggerConfigurationSavedAt():

string | null {

    return readStoredConfiguration()

        ?.savedAt

        ?? null;

}


/**
 * Return the current editable override object.
 *
 * Every built-in trigger receives one override row so
 * the UI can edit a complete, stable list.
 */
export function getTriggerConfiguration():

TriggerConfiguration {

    const triggers =

        getOperationalTriggers();


    return {

        schemaVersion:
            SCHEMA_VERSION,

        overrides:
            triggers.map(

                trigger => ({

                    triggerId:
                        trigger.id,

                    enabled:
                        trigger.enabled,

                    interventionIds:[
                        ...trigger.interventionIds
                    ]

                })

            )

    };

}


/**
 * Save hospital-specific trigger configuration.
 */
export function saveTriggerConfiguration(

    configuration:TriggerConfiguration

):TriggerConfigurationValidationResult {

    requirePermission(
        "triggerConfiguration.manage"
    );


    const normalized =

        normalizeConfiguration(

            configuration

        );


    const validation =

        validateTriggerConfiguration(

            normalized

        );


    if(!validation.valid){

        return validation;

    }


    const stored:StoredTriggerConfiguration = {

        schemaVersion:
            SCHEMA_VERSION,

        savedAt:
            new Date().toISOString(),

        configuration:
            normalized

    };


    try {

        window.localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(

                stored

            )

        );

    }

    catch(error){

        console.error(

            "Unable to save operational trigger configuration:",

            error

        );


        return {

            valid:
                false,

            errors:[
                "The trigger configuration could not be saved to browser storage."
            ]

        };

    }


    publishTriggerConfigurationChanged();


    return {

        valid:
            true,

        errors:[]

    };

}


/**
 * Restore all trigger behavior and recommendation
 * mappings to built-in defaults.
 */
export function restoreDefaultTriggerConfiguration():

void {

    requirePermission(
        "triggerConfiguration.manage"
    );


    try {

        window.localStorage.removeItem(

            STORAGE_KEY

        );

    }

    catch(error){

        console.error(

            "Unable to restore built-in trigger configuration:",

            error

        );

    }


    publishTriggerConfigurationChanged();

}


/**
 * Validate one complete trigger-configuration object.
 */
export function validateTriggerConfiguration(

    configuration:TriggerConfiguration

):TriggerConfigurationValidationResult {

    const errors:string[] = [];


    if(

        !configuration

        ||

        typeof configuration !== "object"

    ){

        return {

            valid:
                false,

            errors:[
                "Trigger configuration is missing or invalid."
            ]

        };

    }


    if(

        configuration.schemaVersion

        !==

        SCHEMA_VERSION

    ){

        errors.push(

            `Unsupported trigger-configuration schema version. Expected version ${SCHEMA_VERSION}.`

        );

    }


    if(

        !Array.isArray(

            configuration.overrides

        )

    ){

        errors.push(

            "Trigger configuration must include an override list."

        );


        return {

            valid:
                false,

            errors

        };

    }


    const validTriggerIds =

        new Set(

            OPERATIONAL_TRIGGERS.map(

                trigger =>

                    trigger.id

            )

        );


    const validInterventionIds =

        new Set(

            getSurgePlan()

                .interventions

                .map(

                    intervention =>

                        intervention.id

                )

        );


    const seenTriggerIds =

        new Set<string>();


    configuration.overrides.forEach(

        (
            override,
            index
        ) => {

            const label =

                `Trigger override ${index + 1}`;


            if(

                typeof override.triggerId

                !==

                "string"

                ||

                override.triggerId.trim().length

                ===

                0

            ){

                errors.push(

                    `${label} must include a trigger identifier.`

                );

            }

            else{

                if(

                    !validTriggerIds.has(

                        override.triggerId

                    )

                ){

                    errors.push(

                        `${label} references an unknown trigger: ${override.triggerId}.`

                    );

                }


                if(

                    seenTriggerIds.has(

                        override.triggerId

                    )

                ){

                    errors.push(

                        `Duplicate trigger override: ${override.triggerId}.`

                    );

                }


                seenTriggerIds.add(

                    override.triggerId

                );

            }


            if(

                typeof override.enabled

                !==

                "boolean"

            ){

                errors.push(

                    `${label} must specify whether the trigger is enabled.`

                );

            }


            if(

                !Array.isArray(

                    override.interventionIds

                )

            ){

                errors.push(

                    `${label} must include a response-action list.`

                );


                return;

            }


            const seenInterventionIds =

                new Set<string>();


            override.interventionIds.forEach(

                interventionId => {

                    if(

                        typeof interventionId

                        !==

                        "string"

                        ||

                        interventionId.trim().length

                        ===

                        0

                    ){

                        errors.push(

                            `${label} contains an invalid response-action identifier.`

                        );


                        return;

                    }


                    if(

                        !validInterventionIds.has(

                            interventionId

                        )

                    ){

                        errors.push(

                            `${label} references an unknown response action: ${interventionId}.`

                        );

                    }


                    if(

                        seenInterventionIds.has(

                            interventionId

                        )

                    ){

                        errors.push(

                            `${label} contains duplicate response action: ${interventionId}.`

                        );

                    }


                    seenInterventionIds.add(

                        interventionId

                    );

                }

            );

        }

    );


    return {

        valid:
            errors.length === 0,

        errors

    };

}


/**
 * Export current effective hospital trigger mapping.
 */
export function exportTriggerConfiguration():string {

    return JSON.stringify(

        getTriggerConfiguration(),

        null,

        2

    );

}


/**
 * Parse, validate, and save imported trigger mapping.
 */
export function importTriggerConfiguration(

    json:string

):TriggerConfigurationValidationResult {

    let parsed:unknown;


    try {

        parsed = JSON.parse(

            json

        );

    }

    catch {

        return {

            valid:
                false,

            errors:[
                "The selected trigger-configuration file does not contain valid JSON."
            ]

        };

    }


    if(

        !isObject(

            parsed

        )

    ){

        return {

            valid:
                false,

            errors:[
                "The selected file does not contain a valid trigger configuration."
            ]

        };

    }


    return saveTriggerConfiguration(

        parsed as unknown as TriggerConfiguration

    );

}


/**
 * Return storage key for diagnostics.
 */
export function getTriggerConfigurationStorageKey():

string {

    return STORAGE_KEY;

}


/**
 * Publish hospital trigger-configuration changes.
 *
 * Trigger configuration affects derived operational
 * triggers and recommendations, but not the underlying
 * HRI score. The result is therefore not invalidated.
 *
 * RESULT_CHANGED is emitted so existing dashboard
 * components rebuild their OperationalAssessment
 * immediately with the new trigger mapping.
 */
function publishTriggerConfigurationChanged():void {

    emit(

        APP_EVENTS.TRIGGER_CONFIGURATION_CHANGED

    );


    emit(

        APP_EVENTS.RESULT_CHANGED

    );

}


/**
 * Normalize configuration before persistence.
 */
function normalizeConfiguration(

    configuration:TriggerConfiguration

):TriggerConfiguration {

    return {

        schemaVersion:
            SCHEMA_VERSION,

        overrides:
            Array.isArray(
                configuration.overrides
            )

                ? configuration.overrides.map(

                    override => ({

                        triggerId:
                            String(
                                override.triggerId
                                ?? ""
                            ).trim(),

                        enabled:
                            Boolean(
                                override.enabled
                            ),

                        interventionIds:
                            Array.isArray(
                                override.interventionIds
                            )

                                ? Array.from(

                                    new Set(

                                        override.interventionIds

                                            .map(

                                                id =>

                                                    String(
                                                        id
                                                    ).trim()

                                            )

                                            .filter(

                                                id =>

                                                    id.length > 0

                                            )

                                    )

                                )

                                : []

                    })

                )

                : []

    };

}


/**
 * Read stored configuration safely.
 */
function readStoredConfiguration():

StoredTriggerConfiguration | null {

    let raw:string | null = null;


    try {

        raw = window.localStorage.getItem(

            STORAGE_KEY

        );

    }

    catch(error){

        console.error(

            "Unable to read operational trigger configuration:",

            error

        );


        return null;

    }


    if(!raw){

        return null;

    }


    try {

        const parsed:unknown =

            JSON.parse(

                raw

            );


        if(

            !isObject(

                parsed

            )

        ){

            return null;

        }


        const candidate =

            parsed as unknown as StoredTriggerConfiguration;


        if(

            candidate.schemaVersion

            !==

            SCHEMA_VERSION

        ){

            return null;

        }


        if(

            typeof candidate.savedAt

            !==

            "string"

        ){

            return null;

        }


        const validation =

            validateTriggerConfiguration(

                candidate.configuration

            );


        if(!validation.valid){

            console.warn(

                "Saved trigger configuration is invalid. Built-in trigger behavior will be used.",

                validation.errors

            );


            return null;

        }


        return {

            schemaVersion:
                candidate.schemaVersion,

            savedAt:
                candidate.savedAt,

            configuration:
                cloneConfiguration(

                    candidate.configuration

                )

        };

    }

    catch(error){

        console.error(

            "Unable to parse operational trigger configuration:",

            error

        );


        return null;

    }

}


/**
 * Clone trigger configuration.
 */
function cloneConfiguration(

    configuration:TriggerConfiguration

):TriggerConfiguration {

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


/**
 * Clone one operational trigger.
 */
function cloneTrigger(

    trigger:OperationalTrigger

):OperationalTrigger {

    return {

        ...trigger,

        conditions:
            trigger.conditions.map(

                condition => ({

                    ...condition

                })

            ),

        interventionIds:[
            ...trigger.interventionIds
        ]

    };

}


/**
 * Narrow unknown JSON values to plain objects.
 */
function isObject(

    value:unknown

):value is Record<string,unknown> {

    return (

        typeof value === "object"

        &&

        value !== null

        &&

        !Array.isArray(

            value

        )

    );

}