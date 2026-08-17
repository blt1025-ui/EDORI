/**
 * SurgePlanConfiguration
 *
 * Defines the hospital-customizable operational
 * response plan used by Hospital Readiness.
 *
 * IMPORTANT:
 *
 * Surge-plan configuration does not modify:
 *
 * - HRI scoring
 * - HRI domain weights
 * - Operational-level thresholds
 * - Trigger evaluation
 *
 * It controls only the operational interventions
 * returned after configured triggers become active.
 */

import type {

    OperationalIntervention

}

from "./OperationalIntervention";


/**
 * Current persisted surge-plan schema version.
 *
 * Increment this value if the stored configuration
 * structure changes in a future release.
 */
export const SURGE_PLAN_SCHEMA_VERSION = 1;


/**
 * Complete hospital surge-plan configuration.
 */
export interface SurgePlanConfiguration {

    /**
     * Persisted schema version.
     */
    schemaVersion:number;


    /**
     * Human-readable plan name.
     */
    name:string;


    /**
     * Optional description of the local plan.
     */
    description:string;


    /**
     * Configured operational interventions.
     *
     * Trigger definitions continue to reference
     * these actions using intervention.id.
     */
    interventions:OperationalIntervention[];

}


/**
 * Result returned when validating a surge plan.
 */
export interface SurgePlanValidationResult {

    valid:boolean;

    errors:string[];

}


/**
 * Persisted surge-plan envelope.
 *
 * The envelope gives us room to add metadata later
 * without changing the actual configuration object.
 */
export interface StoredSurgePlanConfiguration {

    schemaVersion:number;

    savedAt:string;

    configuration:SurgePlanConfiguration;

}