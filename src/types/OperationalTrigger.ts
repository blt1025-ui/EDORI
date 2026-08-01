/**
 * OperationalTrigger
 *
 * Configuration model for one EDORI operational
 * trigger rule.
 */

import type {

    OperationalStateTitle

}

from "./OperationalStateTitle";

export type OperationalTriggerCategory =

    | "Demand"

    | "Boarding"

    | "Hospital Throughput"

    | "Clinical Complexity"

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


export type OperationalTriggerMetric =

    | "totalEDVolume"

    | "edOccupancyPercent"

    | "volumeAboveExpected"

    | "boardedPatients"

    | "boardingAboveExpected"

    | "boardingPercentOfVolume"

    | "occupiedMedicalBeds"

    | "hospitalOccupancyPercent"

    | "expectedNetFlow"

    | "highAcuityCount"

    | "highAcuityPercent"

    | "edoriScore"

    | "consecutiveScoreIncreases"

    | "scoreChange";


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
     * Trigger threshold.
     */
    threshold:number;

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
     * Version 2.0 initially uses AND logic.
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