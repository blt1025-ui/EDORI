/**
 * ConfigurationService
 *
 * Administrative runtime configuration layer.
 *
 * Responsibilities:
 *
 * - Build configuration from EDORI defaults
 * - Read validated configuration overrides
 * - Save validated configuration overrides
 * - Restore built-in defaults
 * - Provide one effective configuration object
 * - Publish configuration-change events
 *
 * IMPORTANT:
 *
 * This service does not modify source files.
 *
 * Built-in configuration remains the fallback if
 * saved configuration is absent or invalid.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";

import {

    invalidateLatestResult

}

from "./ResultService";


import {

    defaultSettings

}

from "../config/defaultSettings";


import {

    OPERATIONAL_STATES

}

from "../config/operationalStates";


import {

    ED_PRESSURE_WEIGHTS,

    WEIGHTS

}

from "../config/weights";


import {

    emit

}

from "./EventService";


import type {

    ConfigurationOverrides,

    DomainWeightConfiguration,

    EdPressureWeightConfiguration,

    HospitalConfiguration,

    OperationalLevelConfiguration,

    StoredConfigurationOverrides

}

from "../types/ConfigurationOverrides";


/**
 * localStorage key.
 */
const CONFIGURATION_STORAGE_KEY =

    "edori_configuration_overrides";


/**
 * Current stored-schema version.
 */
const CONFIGURATION_VERSION = 1;


/**
 * Floating-point tolerance used when validating
 * weight totals.
 */
const WEIGHT_TOLERANCE = 0.000001;


/**
 * Result returned by configuration validation.
 */
export interface ConfigurationValidationResult {

    valid:boolean;

    errors:string[];

}


/**
 * Return a new configuration object containing
 * the built-in application defaults.
 */
export function getDefaultConfiguration():

ConfigurationOverrides {

    return {

        hospital:{

            edCapacity:
                defaultSettings.edCapacity

        },


        domainWeights:{

            edPressure:
                WEIGHTS.edPressure,

            acuteCapacity:
                WEIGHTS.acuteCapacity,

            criticalCapacity:
                WEIGHTS.criticalCapacity,

            inflow:
                WEIGHTS.inflow,

            projectedCapacity:
                WEIGHTS.projectedCapacity

        },


        edPressureWeights:{

            volume:
                ED_PRESSURE_WEIGHTS.volume,

            boarding:
                ED_PRESSURE_WEIGHTS.boarding,

            acuity:
                ED_PRESSURE_WEIGHTS.acuity

        },


        operationalLevels:

            OPERATIONAL_STATES.map(

                state => ({

                    title:
                        state.title,

                    minimum:
                        state.minimum,

                    maximum:
                        state.maximum

                })

            )

    };

}


/**
 * Return the currently effective configuration.
 *
 * Valid saved overrides are returned when present.
 * Otherwise built-in defaults are returned.
 */
export function getConfiguration():

ConfigurationOverrides {

    const stored =

        loadStoredConfiguration();


    if(!stored){

        return getDefaultConfiguration();

    }


    return cloneConfiguration(

        stored.configuration

    );

}


/**
 * Determine whether valid saved overrides exist.
 */
export function hasConfigurationOverrides():boolean {

    return loadStoredConfiguration() !== null;

}


/**
 * Return the date/time when overrides were saved.
 */
export function getConfigurationSavedAt():

string | null {

    const stored =

        loadStoredConfiguration();


    return stored

        ? stored.savedAt

        : null;

}


/**
 * Save a complete configuration override.
 *
 * Invalid configuration is rejected and nothing is
 * written to localStorage.
 */
export function saveConfiguration(

    configuration:ConfigurationOverrides

):ConfigurationValidationResult {

    const normalized =

        normalizeConfiguration(

            configuration

        );


    const validation =

        validateConfiguration(

            normalized

        );


    if(!validation.valid){

        return validation;

    }


    const stored:StoredConfigurationOverrides = {

        version:
            CONFIGURATION_VERSION,

        savedAt:
            new Date().toISOString(),

        configuration:
            normalized

    };


    try {

        localStorage.setItem(

            CONFIGURATION_STORAGE_KEY,

            JSON.stringify(

                stored

            )

        );

    }

    catch(error){

        console.error(

            "ConfigurationService could not save configuration.",

            error

        );


        return {

            valid:
                false,

            errors:[

                "The configuration could not be saved in browser storage."

            ]

        };

    }


    publishConfigurationChanged();


    return {

        valid:
            true,

        errors:[]

    };

}


/**
 * Remove all saved overrides and return to the
 * built-in configuration.
 */
export function restoreDefaultConfiguration():void {

    try {

        localStorage.removeItem(

            CONFIGURATION_STORAGE_KEY

        );

    }

    catch(error){

        console.error(

            "ConfigurationService could not remove saved configuration.",

            error

        );

    }


    publishConfigurationChanged();

}


/**
 * Validate a complete configuration object.
 */
export function validateConfiguration(

    configuration:ConfigurationOverrides

):ConfigurationValidationResult {

    const errors:string[] = [];


    validateHospitalConfiguration(

        configuration.hospital,

        errors

    );


    validateDomainWeights(

        configuration.domainWeights,

        errors

    );


    validateEdPressureWeights(

        configuration.edPressureWeights,

        errors

    );


    validateOperationalLevels(

        configuration.operationalLevels,

        errors

    );


    return {

        valid:
            errors.length === 0,

        errors

    };

}


/**
 * Validate hospital/model settings.
 */
function validateHospitalConfiguration(

    hospital:HospitalConfiguration,

    errors:string[]

):void {

    validatePositiveNumber(

        hospital.edCapacity,

        "ED capacity",

        errors

    );
}


/**
 * Validate overall HRI domain weights.
 */
function validateDomainWeights(

    weights:DomainWeightConfiguration,

    errors:string[]

):void {

    const values = [

        weights.edPressure,

        weights.acuteCapacity,

        weights.criticalCapacity,

        weights.inflow,

        weights.projectedCapacity

    ];


    values.forEach(

        (value,index) => {

            validateWeight(

                value,

                `HRI domain weight ${index + 1}`,

                errors

            );

        }

    );


    const total =

        values.reduce(

            (sum,value) =>

                sum + value,

            0

        );


    if(

        Number.isFinite(total)

        &&

        Math.abs(

            total - 1

        ) > WEIGHT_TOLERANCE

    ){

        errors.push(

            "HRI domain weights must total 100%."

        );

    }

}


/**
 * Validate ED Operational Pressure weights.
 */
function validateEdPressureWeights(

    weights:EdPressureWeightConfiguration,

    errors:string[]

):void {

    const values = [

        weights.volume,

        weights.boarding,

        weights.acuity

    ];


    values.forEach(

        (value,index) => {

            validateWeight(

                value,

                `ED Operational Pressure weight ${index + 1}`,

                errors

            );

        }

    );


    const total =

        values.reduce(

            (sum,value) =>

                sum + value,

            0

        );


    if(

        Number.isFinite(total)

        &&

        Math.abs(

            total - 1

        ) > WEIGHT_TOLERANCE

    ){

        errors.push(

            "ED Operational Pressure component weights must total 100%."

        );

    }

}


/**
 * Validate Alpha through Echo score ranges.
 *
 * Requirements:
 *
 * - Exactly five levels
 * - Correct Alpha -> Echo order
 * - Integer boundaries
 * - Alpha begins at 0
 * - Echo ends at 100
 * - No gaps
 * - No overlaps
 */
function validateOperationalLevels(

    levels:OperationalLevelConfiguration[],

    errors:string[]

):void {

    const expectedTitles:

    OperationalLevelConfiguration["title"][] = [

        "Alpha",

        "Bravo",

        "Charlie",

        "Delta",

        "Echo"

    ];


    if(levels.length !== expectedTitles.length){

        errors.push(

            "Operational configuration must contain exactly five levels: Alpha through Echo."

        );


        return;

    }


    levels.forEach(

        (level,index) => {

            if(

                level.title

                !==

                expectedTitles[index]

            ){

                errors.push(

                    "Operational levels must remain ordered Alpha, Bravo, Charlie, Delta, Echo."

                );

            }


            if(

                !Number.isInteger(

                    level.minimum

                )

                ||

                !Number.isInteger(

                    level.maximum

                )

            ){

                errors.push(

                    `${level.title} score boundaries must be whole numbers.`

                );

            }


            if(

                level.minimum < 0

                ||

                level.maximum > 100

            ){

                errors.push(

                    `${level.title} score boundaries must remain between 0 and 100.`

                );

            }


            if(

                level.minimum

                >

                level.maximum

            ){

                errors.push(

                    `${level.title} minimum score cannot exceed its maximum score.`

                );

            }

        }

    );


    if(levels[0].minimum !== 0){

        errors.push(

            "Alpha must begin at score 0."

        );

    }


    if(

        levels[

            levels.length - 1

        ].maximum !== 100

    ){

        errors.push(

            "Echo must end at score 100."

        );

    }


    for(

        let index = 1;

        index < levels.length;

        index += 1

    ){

        const previous =

            levels[index - 1];


        const current =

            levels[index];


        if(

            current.minimum

            !==

            previous.maximum + 1

        ){

            errors.push(

                `${previous.title} and ${current.title} must have contiguous, non-overlapping score ranges.`

            );

        }

    }

}


/**
 * Validate a positive number.
 */
function validatePositiveNumber(

    value:number,

    label:string,

    errors:string[]

):void {

    if(

        !Number.isFinite(

            value

        )

        ||

        value <= 0

    ){

        errors.push(

            `${label} must be greater than 0.`

        );

    }

}





/**
 * Validate one weight.
 */
function validateWeight(

    value:number,

    label:string,

    errors:string[]

):void {

    if(

        !Number.isFinite(

            value

        )

        ||

        value < 0

        ||

        value > 1

    ){

        errors.push(

            `${label} must be between 0% and 100%.`

        );

    }

}


/**
 * Normalize a configuration before validation/storage.
 */
function normalizeConfiguration(

    configuration:ConfigurationOverrides

):ConfigurationOverrides {

    return {

        hospital:{

            edCapacity:
                Number(
                    configuration.hospital.edCapacity
                )

        },


        domainWeights:{

            edPressure:
                Number(
                    configuration.domainWeights.edPressure
                ),

            acuteCapacity:
                Number(
                    configuration.domainWeights.acuteCapacity
                ),

            criticalCapacity:
                Number(
                    configuration.domainWeights.criticalCapacity
                ),

            inflow:
                Number(
                    configuration.domainWeights.inflow
                ),

            projectedCapacity:
                Number(
                    configuration.domainWeights.projectedCapacity
                )

        },


        edPressureWeights:{

            volume:
                Number(
                    configuration.edPressureWeights.volume
                ),

            boarding:
                Number(
                    configuration.edPressureWeights.boarding
                ),

            acuity:
                Number(
                    configuration.edPressureWeights.acuity
                )

        },


        operationalLevels:

            configuration.operationalLevels.map(

                level => ({

                    title:
                        level.title,

                    minimum:
                        Number(
                            level.minimum
                        ),

                    maximum:
                        Number(
                            level.maximum
                        )

                })

            )

    };

}


/**
 * Read and validate the stored configuration.
 *
 * Invalid/corrupt saved data is ignored so the
 * application safely falls back to built-in values.
 */
function loadStoredConfiguration():

StoredConfigurationOverrides | null {

    let raw:string | null = null;


    try {

        raw = localStorage.getItem(

            CONFIGURATION_STORAGE_KEY

        );

    }

    catch(error){

        console.error(

            "ConfigurationService could not read browser storage.",

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

            !isStoredConfigurationOverrides(

                parsed

            )

        ){

            console.warn(

                "ConfigurationService ignored an invalid saved configuration wrapper."

            );


            return null;

        }


        const normalized =

            normalizeConfiguration(

                parsed.configuration

            );


        const validation =

            validateConfiguration(

                normalized

            );


        if(!validation.valid){

            console.warn(

                "ConfigurationService ignored invalid saved configuration.",

                validation.errors

            );


            return null;

        }


        return {

            version:
                CONFIGURATION_VERSION,

            savedAt:
                parsed.savedAt,

            configuration:
                normalized

        };

    }

    catch(error){

        console.error(

            "ConfigurationService could not parse saved configuration.",

            error

        );


        return null;

    }

}


/**
 * Runtime guard for stored configuration wrapper.
 */
function isStoredConfigurationOverrides(

    value:unknown

):value is StoredConfigurationOverrides {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return false;

    }


    const candidate =

        value as Partial<StoredConfigurationOverrides>;


    return (

        candidate.version === CONFIGURATION_VERSION

        &&

        typeof candidate.savedAt === "string"

        &&

        typeof candidate.configuration === "object"

        &&

        candidate.configuration !== null

    );

}


/**
 * Return a defensive copy.
 */
function cloneConfiguration(

    configuration:ConfigurationOverrides

):ConfigurationOverrides {

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


/**
 * Publish configuration change.
 */
function publishConfigurationChanged():void {

    /*
     * A configuration change can alter the meaning
     * of the currently displayed HRI result.
     */

    invalidateLatestResult(

        "Hospital Readiness configuration changed. Recalculate the current assessment to apply the updated model settings."

    );


    emit(

        APP_EVENTS.CONFIGURATION_CHANGED

    );


    /*
     * Existing dashboard components already respond
     * to RESULT_CHANGED, so emit it as well to force
     * an immediate refresh into recalculation-required
     * state.
     */

    emit(

        APP_EVENTS.RESULT_CHANGED

    );

}


/**
 * Export storage key for administrative diagnostics.
 */
export function getConfigurationStorageKey():string {

    return CONFIGURATION_STORAGE_KEY;

}