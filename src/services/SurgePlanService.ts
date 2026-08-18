/**
 * SurgePlanService
 *
 * Manages the hospital-customizable operational
 * response plan used by Hospital Readiness.
 *
 * Responsibilities:
 *
 * - Return the effective surge plan
 * - Persist hospital-specific overrides
 * - Restore built-in defaults
 * - Validate imported or edited plans
 * - Resolve interventions for recommendation logic
 * - Publish response-plan changes
 *
 * IMPORTANT:
 *
 * This service does not:
 *
 * - Recalculate HRI
 * - Change HRI domain weights
 * - Change operational-level thresholds
 * - Evaluate operational triggers
 * - Invalidate the current HRI result
 */

import {

    requirePermission

}

from "./AuthorizationService";


import {

    clearServerSurgePlan,
    loadServerSurgePlan,
    saveServerSurgePlan

}

from "./SurgePlanApiService";




import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    getDefaultSurgePlan

}

from "../config/defaultSurgePlan";


import {

    emit,
    subscribe

}

from "./EventService";


import {

    SURGE_PLAN_SCHEMA_VERSION

}

from "../types/SurgePlanConfiguration";


import type {

    OperationalIntervention,
    OperationalInterventionCategory

}

from "../types/OperationalIntervention";


import type {

    OperationalRecommendationPriority

}

from "../types/OperationalRecommendation";


import type {

    SurgePlanConfiguration,
    SurgePlanValidationResult

}

from "../types/SurgePlanConfiguration";


/**
 * Previous workstation-local browser-storage key.
 *
 * Retained only so Phase 17B can remove obsolete surge
 * plan storage.
 */
const LEGACY_STORAGE_KEY =

    "edori_surge_plan_configuration";


let serverSurgePlan:SurgePlanConfiguration | null = null;

let serverSurgePlanSavedAt:string | null = null;

let serverSurgePlanInitialized = false;

let serverSurgePlanInitializationInProgress = false;


clearLegacySurgePlanStorage();


subscribe(

    APP_EVENTS.USERS_CHANGED,

    () => {

        serverSurgePlanInitialized = false;


        void initializeServerSurgePlan();

    }

);


/**
 * Supported intervention categories.
 */
const VALID_CATEGORIES:

OperationalInterventionCategory[] = [

    "ED Capacity",

    "ED Flow",

    "Boarding",

    "Hospital Throughput",

    "Leadership Escalation",

    "Clinical Operations",

    "Monitoring"

];


/**
 * Supported recommendation priorities.
 */
const VALID_PRIORITIES:

OperationalRecommendationPriority[] = [

    "Routine",

    "Moderate",

    "High",

    "Immediate"

];


/**
 * Return the currently effective hospital surge plan.
 *
 * A validated PostgreSQL-backed override is returned when
 * present. Otherwise the built-in plan is used.
 */
export function getSurgePlan():

SurgePlanConfiguration {

    if(!serverSurgePlan){

        return getDefaultSurgePlan();

    }


    const validation =

        validateSurgePlan(
            serverSurgePlan
        );


    if(!validation.valid){

        console.warn(
            "Saved Hospital Surge Plan is invalid. Built-in defaults will be used.",
            validation.errors
        );


        return getDefaultSurgePlan();

    }


    return cloneConfiguration(
        serverSurgePlan
    );

}


/**
 * Determine whether a hospital-specific response-plan
 * override currently exists.
 */
export function hasSurgePlanOverrides():boolean {

    return serverSurgePlan !== null;

}


/**
 * Return the saved timestamp for the current override.
 */
export function getSurgePlanSavedAt():

string | null {

    return serverSurgePlanSavedAt;

}


/**
 * Save a complete hospital surge-plan configuration.
 */
export function saveSurgePlan(

    configuration:SurgePlanConfiguration

):SurgePlanValidationResult {

    requirePermission(
        "surgePlan.manage"
    );


    const normalized =

        normalizeConfiguration(
            configuration
        );


    const validation =

        validateSurgePlan(
            normalized
        );


    if(!validation.valid){

        return validation;

    }


    serverSurgePlan =

        cloneConfiguration(
            normalized
        );


    serverSurgePlanSavedAt =

        new Date().toISOString();


    serverSurgePlanInitialized = true;


    void persistSurgePlanToServer(
        normalized
    );


    publishSurgePlanChanged();


    return {

        valid:
            true,

        errors:[]

    };

}


/**
 * Remove the saved hospital-specific response plan
 * and restore the built-in plan.
 */
export function restoreDefaultSurgePlan():void {

    requirePermission(
        "surgePlan.manage"
    );


    serverSurgePlan = null;

    serverSurgePlanSavedAt = null;

    serverSurgePlanInitialized = true;


    void clearServerSurgePlan()
        .catch(
            error => {

                console.error(
                    "Unable to restore the built-in Hospital Surge Plan in PostgreSQL:",
                    error
                );

            }
        );


    publishSurgePlanChanged();

}


/**
 * Resolve one enabled intervention by identifier.
 *
 * OperationalAssessmentService uses this function
 * rather than reading interventions.ts directly.
 */
export function getSurgePlanIntervention(

    interventionId:string

):OperationalIntervention | null {

    const intervention =

        getSurgePlan()

            .interventions

            .find(

                item =>

                    item.id === interventionId

                    &&

                    item.enabled

            );


    if(!intervention){

        return null;

    }


    return {

        ...intervention

    };

}


/**
 * Return all enabled interventions in the currently
 * effective hospital surge plan.
 */
export function getEnabledSurgePlanInterventions():

OperationalIntervention[] {

    return getSurgePlan()

        .interventions

        .filter(

            intervention =>

                intervention.enabled

        )

        .map(

            intervention => ({

                ...intervention

            })

        );

}


/**
 * Validate a complete hospital surge plan.
 */
export function validateSurgePlan(

    configuration:SurgePlanConfiguration

):SurgePlanValidationResult {

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
                "Surge-plan configuration is missing or invalid."
            ]

        };

    }


    if(

        configuration.schemaVersion

        !==

        SURGE_PLAN_SCHEMA_VERSION

    ){

        errors.push(

            `Unsupported surge-plan schema version. Expected version ${SURGE_PLAN_SCHEMA_VERSION}.`

        );

    }


    if(

        typeof configuration.name !== "string"

        ||

        configuration.name.trim().length === 0

    ){

        errors.push(

            "The surge plan must have a name."

        );

    }


    if(

        typeof configuration.description !== "string"

    ){

        errors.push(

            "The surge-plan description must be text."

        );

    }


    if(

        !Array.isArray(

            configuration.interventions

        )

    ){

        errors.push(

            "The surge plan must contain an intervention list."

        );


        return {

            valid:
                false,

            errors

        };

    }


    if(configuration.interventions.length === 0){

        errors.push(

            "The surge plan must contain at least one intervention."

        );

    }


    const identifiers =

        new Set<string>();


    configuration.interventions.forEach(

        (intervention,index) => {

            const label =

                `Intervention ${index + 1}`;


            if(

                typeof intervention.id !== "string"

                ||

                intervention.id.trim().length === 0

            ){

                errors.push(

                    `${label} must have an identifier.`

                );

            }

            else {

                if(

                    identifiers.has(

                        intervention.id

                    )

                ){

                    errors.push(

                        `Duplicate intervention identifier: ${intervention.id}.`

                    );

                }


                identifiers.add(

                    intervention.id

                );

            }


            if(

                typeof intervention.title !== "string"

                ||

                intervention.title.trim().length === 0

            ){

                errors.push(

                    `${label} must have a title.`

                );

            }


            if(

                typeof intervention.description !== "string"

                ||

                intervention.description.trim().length === 0

            ){

                errors.push(

                    `${label} must have a description.`

                );

            }


            if(

                !VALID_CATEGORIES.includes(

                    intervention.category

                )

            ){

                errors.push(

                    `${label} has an unsupported category.`

                );

            }


            if(

                !VALID_PRIORITIES.includes(

                    intervention.defaultPriority

                )

            ){

                errors.push(

                    `${label} has an unsupported priority.`

                );

            }


            if(

                typeof intervention.responsibleGroup !== "string"

                ||

                intervention.responsibleGroup.trim().length === 0

            ){

                errors.push(

                    `${label} must identify a responsible group.`

                );

            }


            if(

                typeof intervention.objective !== "string"

                ||

                intervention.objective.trim().length === 0

            ){

                errors.push(

                    `${label} must have an objective.`

                );

            }


            if(

                intervention.reassessmentMinutes !== null

                &&

                (

                    !Number.isFinite(

                        intervention.reassessmentMinutes

                    )

                    ||

                    intervention.reassessmentMinutes <= 0

                )

            ){

                errors.push(

                    `${label} reassessment time must be greater than zero or left blank.`

                );

            }


            if(

                typeof intervention.enabled !== "boolean"

            ){

                errors.push(

                    `${label} must specify whether it is enabled.`

                );

            }

        }

    );


    return {

        valid:
            errors.length === 0,

        errors

    };

}


/**
 * Export the current effective surge plan as
 * formatted JSON.
 */
export function exportSurgePlan():string {

    return JSON.stringify(

        getSurgePlan(),

        null,

        2

    );

}


/**
 * Parse, validate, and save an imported surge-plan
 * JSON document.
 */
export function importSurgePlan(

    json:string

):SurgePlanValidationResult {

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
                "The selected file does not contain valid JSON."
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
                "The selected file does not contain a valid Hospital Surge Plan."
            ]

        };

    }


    return saveSurgePlan(

        parsed as unknown as SurgePlanConfiguration

    );

}


/**
 * Return the storage key for administrative
 * diagnostics.
 */
export function getSurgePlanStorageKey():string {

    return LEGACY_STORAGE_KEY;

}


/**
 * Publish a response-plan change.
 *
 * SURGE_PLAN_CHANGED is the semantically correct
 * event for new components.
 *
 * RESULT_CHANGED is also emitted so existing
 * operational-assessment presentation components
 * refresh immediately using the unchanged HRI result
 * and the newly configured response plan.
 *
 * No result is invalidated and no HRI recalculation
 * is required.
 */
function publishSurgePlanChanged():void {

    emit(

        APP_EVENTS.SURGE_PLAN_CHANGED

    );


    emit(

        APP_EVENTS.RESULT_CHANGED

    );

}


/**
 * Load the authoritative optional Hospital Surge Plan
 * override from PostgreSQL after authentication is
 * established.
 */
export async function initializeServerSurgePlan():

Promise<void> {

    if(
        serverSurgePlanInitialized
        ||
        serverSurgePlanInitializationInProgress
    ){

        return;

    }


    serverSurgePlanInitializationInProgress = true;


    try {

        const serverOverride =

            await loadServerSurgePlan();


        if(!serverOverride){

            serverSurgePlan = null;

            serverSurgePlanSavedAt = null;

            serverSurgePlanInitialized = true;

            return;

        }


        const normalized =

            normalizeConfiguration(
                serverOverride.configuration
            );


        const validation =

            validateSurgePlan(
                normalized
            );


        if(!validation.valid){

            throw new Error(
                validation.errors.join(
                    " "
                )
            );

        }


        serverSurgePlan =

            cloneConfiguration(
                normalized
            );


        serverSurgePlanSavedAt =

            serverOverride.savedAt;


        serverSurgePlanInitialized = true;

    }
    catch(error){

        console.warn(
            "Unable to load the PostgreSQL Hospital Surge Plan:",
            error
        );

    }
    finally {

        serverSurgePlanInitializationInProgress = false;

    }

}


/**
 * Persist one validated Hospital Surge Plan override.
 */
async function persistSurgePlanToServer(

    configuration:SurgePlanConfiguration

):Promise<void> {

    try {

        const serverOverride =

            await saveServerSurgePlan(
                cloneConfiguration(
                    configuration
                )
            );


        const normalized =

            normalizeConfiguration(
                serverOverride.configuration
            );


        const validation =

            validateSurgePlan(
                normalized
            );


        if(!validation.valid){

            throw new Error(
                validation.errors.join(
                    " "
                )
            );

        }


        serverSurgePlan =

            cloneConfiguration(
                normalized
            );


        serverSurgePlanSavedAt =

            serverOverride.savedAt;


        serverSurgePlanInitialized = true;

    }
    catch(error){

        console.error(
            "Unable to save the PostgreSQL Hospital Surge Plan:",
            error
        );

    }

}


/**
 * Remove obsolete workstation-local Hospital Surge Plan
 * storage.
 */
function clearLegacySurgePlanStorage():

void {

    try {

        window.localStorage.removeItem(
            LEGACY_STORAGE_KEY
        );

    }
    catch(error){

        console.warn(
            "Unable to remove legacy Hospital Surge Plan browser storage:",
            error
        );

    }

}


/**
 * Normalize configuration before validation and
 * persistence.
 */
function normalizeConfiguration(

    configuration:SurgePlanConfiguration

):SurgePlanConfiguration {

    return {

        schemaVersion:
            SURGE_PLAN_SCHEMA_VERSION,

        name:
            String(
                configuration.name
                ?? ""
            ).trim(),

        description:
            String(
                configuration.description
                ?? ""
            ).trim(),

        interventions:
            Array.isArray(
                configuration.interventions
            )

                ? configuration.interventions.map(

                    intervention => ({

                        id:
                            String(
                                intervention.id
                                ?? ""
                            ).trim(),

                        title:
                            String(
                                intervention.title
                                ?? ""
                            ).trim(),

                        description:
                            String(
                                intervention.description
                                ?? ""
                            ).trim(),

                        category:
                            intervention.category,

                        defaultPriority:
                            intervention.defaultPriority,

                        responsibleGroup:
                            String(
                                intervention.responsibleGroup
                                ?? ""
                            ).trim(),

                        objective:
                            String(
                                intervention.objective
                                ?? ""
                            ).trim(),

                        reassessmentMinutes:
                            intervention.reassessmentMinutes,

                        enabled:
                            intervention.enabled

                    })

                )

                : []

    };

}


/**
 * Clone configuration before returning it to callers.
 */
function cloneConfiguration(

    configuration:SurgePlanConfiguration

):SurgePlanConfiguration {

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


/**
 * Narrow unknown JSON values to object-like values.
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