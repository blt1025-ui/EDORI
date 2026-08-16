/**
 * OperationalTrigger
 *
 * Version 2 Hospital Readiness Model
 *
 * Configuration model for one hospital
 * operational trigger rule.
 */

import type {

    OperationalStateTitle

}

from "./OperationalStateTitle";


/**
 * High-level trigger categories used for
 * organization, display, and administration.
 */
export type OperationalTriggerCategory =

    | "ED Operational Pressure"

    | "Acute-Care Capacity"

    | "Critical-Care Capacity"

    | "Hospital Flow"

    | "Projected Capacity"

    | "Operational Momentum";


export type OperationalTriggerPriority =

    | "Advisory"

    | "Moderate"

    | "High"

    | "Critical";


export type OperationalTriggerOperator =

    | "greaterThan"

    | "greaterThanOrEqual"

    | "lessThan"

    | "lessThanOrEqual"

    | "equal";


/**
 * Metrics available to the operational trigger
 * engine.
 *
 * Trigger thresholds remain configuration values.
 * The trigger service calculates the metric and
 * evaluates it against the configured threshold.
 */
export type OperationalTriggerMetric =

    /*
     * =================================================
     * Emergency Department
     * =================================================
     */

    | "totalEDVolume"

    | "edOccupancyPercent"

    | "volumeAboveExpected"

    | "boardedPatients"

    | "boardingAboveExpected"

    | "boardingPercentOfVolume"

    | "highAcuityCount"

    | "highAcuityPercent"

    | "edPressureScore"


    /*
     * =================================================
     * Acute-Care Capacity
     * =================================================
     */

    | "occupiedAcuteCareBeds"

    | "availableAcuteCareBeds"

    | "acuteCareOccupancyPercent"

    | "acuteCapacityScore"


    /*
     * =================================================
     * Critical-Care Capacity
     * =================================================
     */

    | "occupiedCriticalCareBeds"

    | "availableCriticalCareBeds"

    | "criticalCareOccupancyPercent"

    | "criticalCapacityScore"


    /*
     * =================================================
     * Hospital Inflow
     * =================================================
     */

    | "currentHospitalInflow"

    | "expectedHospitalInflow"

    | "hospitalInflowAboveExpected"

    | "hospitalInflowPercentOfExpected"

    | "inflowScore"


    /*
     * =================================================
     * Four-Hour Projected Capacity
     * =================================================
     */

    | "expectedInpatientDepartures"

    | "projectedHospitalInflow"

    | "projectedAvailableAcuteCareBeds"

    | "projectedAcuteCareCapacityChange"

    | "projectedCapacityScore"


    /*
     * =================================================
     * Overall Hospital Readiness
     * =================================================
     */

    | "hospitalReadinessScore"

    | "consecutiveScoreIncreases"

    | "scoreChange";


/**
 * Optional runtime source for a trigger threshold.
 *
 * When absent, the numeric threshold defined on the
 * trigger condition is used normally.
 */
export type OperationalTriggerThresholdSource =

    | "configuredEdCapacity";


export interface OperationalTriggerCondition {

    /**
     * Assessment or derived metric to evaluate.
     */
    metric:OperationalTriggerMetric;


    /**
     * Comparison operator.
     */
    operator:OperationalTriggerOperator;


    /**
     * Built-in/default numeric threshold.
     *
     * This remains required so the trigger definition
     * is complete even when no runtime configuration
     * override exists.
     */
    threshold:number;


    /**
     * Optional runtime source for the effective
     * threshold.
     *
     * When present, OperationalTriggerService replaces
     * the built-in threshold during evaluation.
     */
    thresholdSource?:OperationalTriggerThresholdSource;

}


export interface OperationalTrigger {

    /**
     * Unique trigger identifier.
     */
    id:string;


    /**
     * Readable trigger name.
     */
    title:string;


    /**
     * Operational purpose of the trigger.
     */
    description:string;


    /**
     * Allows an administrator to disable a rule
     * without deleting it.
     */
    enabled:boolean;


    /**
     * Primary operational category.
     */
    category:OperationalTriggerCategory;


    /**
     * Trigger importance.
     */
    priority:OperationalTriggerPriority;


    /**
     * All conditions required to activate
     * the trigger.
     *
     * Multiple conditions currently use AND logic.
     */
    conditions:OperationalTriggerCondition[];


    /**
     * Minimum operational state required when
     * this trigger activates.
     *
     * Null means the trigger provides information
     * but does not force state escalation.
     */
    minimumOperationalState:
        OperationalStateTitle | null;


    /**
     * Recommended reassessment interval.
     *
     * Null means no special interval is required.
     */
    reassessmentMinutes:number | null;


    /**
     * IDs from the intervention library.
     */
    interventionIds:string[];


    /**
     * Explanation of why the rule exists.
     */
    rationale:string;

}