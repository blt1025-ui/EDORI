/**
 * ConfigurationBackupService
 *
 * Unified backup / restore layer for EDORI hospital-
 * specific administrative configuration.
 *
 * Includes:
 * - Hospital Readiness calculation-model configuration
 * - Operational trigger configuration
 * - Hospital Surge Plan configuration
 *
 * Excludes:
 * - Assessment data/history
 * - Historical baseline data
 * - Current calculated result
 */

import {

    requirePermission

}

from "./AuthorizationService";




import {
    getConfiguration,
    hasConfigurationOverrides,
    restoreDefaultConfiguration,
    saveConfiguration,
    validateConfiguration
}
from "./ConfigurationService";

import {
    getSurgePlan,
    hasSurgePlanOverrides,
    restoreDefaultSurgePlan,
    saveSurgePlan,
    validateSurgePlan
}
from "./SurgePlanService";

import {
    getTriggerConfiguration,
    hasTriggerConfigurationOverrides,
    restoreDefaultTriggerConfiguration,
    saveTriggerConfiguration,
    validateTriggerConfiguration
}
from "./TriggerConfigurationService";

export const CONFIGURATION_BACKUP_SCHEMA_VERSION = 1;

export const CONFIGURATION_BACKUP_TYPE =
    "EDORI Hospital Configuration Backup";

type ModelConfiguration =
    ReturnType<typeof getConfiguration>;

type TriggerConfiguration =
    ReturnType<typeof getTriggerConfiguration>;

type SurgePlanConfiguration =
    ReturnType<typeof getSurgePlan>;

export interface ConfigurationBackupDocument {

    backupType:
        typeof CONFIGURATION_BACKUP_TYPE;

    schemaVersion:number;

    exportedAt:string;

    application:string;

    includes:{
        modelConfiguration:boolean;
        triggerConfiguration:boolean;
        surgePlanConfiguration:boolean;
    };

    sourceState:{
        modelCustomized:boolean;
        triggersCustomized:boolean;
        surgePlanCustomized:boolean;
    };

    modelConfiguration:ModelConfiguration;

    triggerConfiguration:TriggerConfiguration;

    surgePlanConfiguration:SurgePlanConfiguration;
}

export interface ConfigurationBackupResult {
    valid:boolean;
    errors:string[];
}

export interface ConfigurationBackupPreview {

    filename:string;

    exportedAt:string;

    modelCustomized:boolean;

    triggersCustomized:boolean;

    surgePlanCustomized:boolean;

    enabledTriggerCount:number;

    totalTriggerCount:number;

    enabledInterventionCount:number;

    totalInterventionCount:number;

    document:ConfigurationBackupDocument;
}

export function createConfigurationBackupDocument():
ConfigurationBackupDocument {

    return {

        backupType:
            CONFIGURATION_BACKUP_TYPE,

        schemaVersion:
            CONFIGURATION_BACKUP_SCHEMA_VERSION,

        exportedAt:
            new Date().toISOString(),

        application:
            "EDORI",

        includes:{
            modelConfiguration:true,
            triggerConfiguration:true,
            surgePlanConfiguration:true
        },

        sourceState:{
            modelCustomized:
                hasConfigurationOverrides(),

            triggersCustomized:
                hasTriggerConfigurationOverrides(),

            surgePlanCustomized:
                hasSurgePlanOverrides()
        },

        modelConfiguration:
            cloneJsonSafe(
                getConfiguration()
            ),

        triggerConfiguration:
            cloneJsonSafe(
                getTriggerConfiguration()
            ),

        surgePlanConfiguration:
            cloneJsonSafe(
                getSurgePlan()
            )
    };
}

export function exportConfigurationBackup():string {

    return JSON.stringify(
        createConfigurationBackupDocument(),
        null,
        2
    );
}

export function validateConfigurationBackupText(
    json:string,
    filename:string
):
    | {
        valid:true;
        preview:ConfigurationBackupPreview;
        errors:[];
    }
    | {
        valid:false;
        preview:null;
        errors:string[];
    } {

    let parsed:unknown;

    try {
        parsed = JSON.parse(json);
    }
    catch {
        return {
            valid:false,
            preview:null,
            errors:[
                "The selected file does not contain valid JSON."
            ]
        };
    }

    const validation =
        validateConfigurationBackupDocument(parsed);

    if(!validation.valid){
        return {
            valid:false,
            preview:null,
            errors:validation.errors
        };
    }

    const document =
        parsed as ConfigurationBackupDocument;

    return {
        valid:true,
        errors:[],
        preview:createPreview(
            filename,
            document
        )
    };
}

export function validateConfigurationBackupDocument(
    value:unknown
):ConfigurationBackupResult {

    const errors:string[] = [];

    if(!isRecord(value)){
        return {
            valid:false,
            errors:[
                "Configuration backup must be a JSON object."
            ]
        };
    }

    if(
        value.backupType
        !==
        CONFIGURATION_BACKUP_TYPE
    ){
        errors.push(
            `Unsupported backup type. Expected "${CONFIGURATION_BACKUP_TYPE}".`
        );
    }

    if(
        value.schemaVersion
        !==
        CONFIGURATION_BACKUP_SCHEMA_VERSION
    ){
        errors.push(
            `Unsupported configuration-backup schema version. Expected version ${CONFIGURATION_BACKUP_SCHEMA_VERSION}.`
        );
    }

    if(
        typeof value.exportedAt !== "string"
        ||
        Number.isNaN(
            new Date(value.exportedAt).getTime()
        )
    ){
        errors.push(
            "Configuration backup does not contain a valid export timestamp."
        );
    }

    if(!isRecord(value.includes)){
        errors.push(
            "Configuration backup is missing the includes manifest."
        );
    }
    else{
        if(value.includes.modelConfiguration !== true){
            errors.push(
                "Configuration backup does not include calculation-model configuration."
            );
        }

        if(value.includes.triggerConfiguration !== true){
            errors.push(
                "Configuration backup does not include operational-trigger configuration."
            );
        }

        if(value.includes.surgePlanConfiguration !== true){
            errors.push(
                "Configuration backup does not include Hospital Surge Plan configuration."
            );
        }
    }

    if(!isRecord(value.sourceState)){
        errors.push(
            "Configuration backup is missing source customization metadata."
        );
    }

    if(!isRecord(value.modelConfiguration)){
        errors.push(
            "Configuration backup is missing calculation-model configuration."
        );
    }
    else{
        const result =
            validateConfiguration(
                value.modelConfiguration as unknown as ModelConfiguration
            );

        result.errors.forEach(
            error =>
                errors.push(
                    `Calculation Model: ${error}`
                )
        );
    }

    if(!isRecord(value.surgePlanConfiguration)){
        errors.push(
            "Configuration backup is missing Hospital Surge Plan configuration."
        );
    }
    else{
        const result =
            validateSurgePlan(
                value.surgePlanConfiguration as unknown as SurgePlanConfiguration
            );

        result.errors.forEach(
            error =>
                errors.push(
                    `Hospital Surge Plan: ${error}`
                )
        );
    }

    if(!isRecord(value.triggerConfiguration)){
        errors.push(
            "Configuration backup is missing operational-trigger configuration."
        );
    }
    else{
        const result =
            validateTriggerConfiguration(
                value.triggerConfiguration as unknown as TriggerConfiguration
            );

        result.errors.forEach(
            error =>
                errors.push(
                    `Operational Triggers: ${error}`
                )
        );
    }

    return {
        valid:
            errors.length === 0,
        errors
    };
}

export function restoreConfigurationBackup(
    document:ConfigurationBackupDocument
):ConfigurationBackupResult {

    requirePermission(
        "configurationBackup.manage"
    );


    const validation =
        validateConfigurationBackupDocument(
            document
        );

    if(!validation.valid){
        return validation;
    }

    const rollback = {
        model:
            cloneJsonSafe(
                getConfiguration()
            ),

        triggers:
            cloneJsonSafe(
                getTriggerConfiguration()
            ),

        surgePlan:
            cloneJsonSafe(
                getSurgePlan()
            ),

        modelCustomized:
            hasConfigurationOverrides(),

        triggersCustomized:
            hasTriggerConfigurationOverrides(),

        surgePlanCustomized:
            hasSurgePlanOverrides()
    };

    try {

        const surgeResult =
            saveSurgePlan(
                cloneJsonSafe(
                    document.surgePlanConfiguration
                )
            );

        if(!surgeResult.valid){
            throw new ConfigurationRestoreError(
                "Hospital Surge Plan",
                surgeResult.errors
            );
        }

        const triggerValidation =
            validateTriggerConfiguration(
                document.triggerConfiguration
            );

        if(!triggerValidation.valid){
            throw new ConfigurationRestoreError(
                "Operational Triggers",
                triggerValidation.errors
            );
        }

        const triggerResult =
            saveTriggerConfiguration(
                cloneJsonSafe(
                    document.triggerConfiguration
                )
            );

        if(!triggerResult.valid){
            throw new ConfigurationRestoreError(
                "Operational Triggers",
                triggerResult.errors
            );
        }

        const modelResult =
            saveConfiguration(
                cloneJsonSafe(
                    document.modelConfiguration
                )
            );

        if(!modelResult.valid){
            throw new ConfigurationRestoreError(
                "Calculation Model",
                modelResult.errors
            );
        }

        if(
            document.sourceState
            &&
            document.sourceState.surgePlanCustomized === false
        ){
            restoreDefaultSurgePlan();
        }

        if(
            document.sourceState
            &&
            document.sourceState.triggersCustomized === false
        ){
            restoreDefaultTriggerConfiguration();
        }

        if(
            document.sourceState
            &&
            document.sourceState.modelCustomized === false
        ){
            restoreDefaultConfiguration();
        }

        return {
            valid:true,
            errors:[]
        };
    }
    catch(error){

        const restoreErrors =
            error instanceof ConfigurationRestoreError
                ? error.errors
                : [
                    error instanceof Error
                        ? error.message
                        : "Configuration restore failed unexpectedly."
                ];

        const rollbackErrors =
            rollbackConfiguration(rollback);

        return {
            valid:false,
            errors:[
                ...restoreErrors,
                ...rollbackErrors
            ]
        };
    }
}

function createPreview(
    filename:string,
    document:ConfigurationBackupDocument
):ConfigurationBackupPreview {

    return {
        filename,

        exportedAt:
            document.exportedAt,

        modelCustomized:
            document.sourceState.modelCustomized,

        triggersCustomized:
            document.sourceState.triggersCustomized,

        surgePlanCustomized:
            document.sourceState.surgePlanCustomized,

        enabledTriggerCount:
            document.triggerConfiguration.overrides
                .filter(
                    item => item.enabled
                )
                .length,

        totalTriggerCount:
            document.triggerConfiguration.overrides.length,

        enabledInterventionCount:
            document.surgePlanConfiguration.interventions
                .filter(
                    item => item.enabled
                )
                .length,

        totalInterventionCount:
            document.surgePlanConfiguration.interventions.length,

        document:
            cloneJsonSafe(document)
    };
}

function rollbackConfiguration(
    rollback:{
        model:ModelConfiguration;
        triggers:TriggerConfiguration;
        surgePlan:SurgePlanConfiguration;
        modelCustomized:boolean;
        triggersCustomized:boolean;
        surgePlanCustomized:boolean;
    }
):string[] {

    const errors:string[] = [];

    try{
        if(rollback.surgePlanCustomized){
            const result =
                saveSurgePlan(
                    rollback.surgePlan
                );

            if(!result.valid){
                errors.push(
                    "Rollback warning: the previous Hospital Surge Plan could not be fully restored."
                );
            }
        }
        else{
            restoreDefaultSurgePlan();
        }
    }
    catch{
        errors.push(
            "Rollback warning: the previous Hospital Surge Plan could not be restored."
        );
    }

    try{
        if(rollback.triggersCustomized){
            const result =
                saveTriggerConfiguration(
                    rollback.triggers
                );

            if(!result.valid){
                errors.push(
                    "Rollback warning: the previous operational-trigger configuration could not be fully restored."
                );
            }
        }
        else{
            restoreDefaultTriggerConfiguration();
        }
    }
    catch{
        errors.push(
            "Rollback warning: the previous operational-trigger configuration could not be restored."
        );
    }

    try{
        if(rollback.modelCustomized){
            const result =
                saveConfiguration(
                    rollback.model
                );

            if(!result.valid){
                errors.push(
                    "Rollback warning: the previous calculation-model configuration could not be fully restored."
                );
            }
        }
        else{
            restoreDefaultConfiguration();
        }
    }
    catch{
        errors.push(
            "Rollback warning: the previous calculation-model configuration could not be restored."
        );
    }

    return errors;
}

class ConfigurationRestoreError extends Error {

    public readonly errors:string[];

    constructor(
        area:string,
        errors:string[]
    ){
        super(
            `${area} could not be restored.`
        );

        this.name =
            "ConfigurationRestoreError";

        this.errors =
            errors.length > 0
                ? errors.map(
                    error =>
                        `${area}: ${error}`
                )
                : [
                    `${area} could not be restored.`
                ];
    }
}

function cloneJsonSafe<T>(
    value:T
):T {

    return JSON.parse(
        JSON.stringify(value)
    ) as T;
}

function isRecord(
    value:unknown
):value is Record<string,unknown> {

    return (
        typeof value === "object"
        &&
        value !== null
        &&
        !Array.isArray(value)
    );
}