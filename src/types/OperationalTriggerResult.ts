/**
 * OperationalTriggerResult
 *
 * Represents the evaluation of one configured
 * operational trigger.
 */

import type {

    OperationalTrigger,

    OperationalTriggerMetric

}

from "./OperationalTrigger";


export interface OperationalTriggerConditionResult {

    /**
     * Metric evaluated by this condition.
     */
    metric:OperationalTriggerMetric;


    /**
     * Current derived metric value.
     */
    actualValue:number;


    /**
     * Configured activation threshold.
     */
    threshold:number;


    /**
     * True when this individual condition passes.
     */
    passed:boolean;


    /**
     * Absolute distance from activation.
     *
     * Zero means the condition is active.
     */
    distanceFromThreshold:number;


    /**
     * Percentage proximity from 0 through 100.
     *
     * 100 means the condition is active.
     */
    proximityPercent:number;


    /**
     * Human-readable condition explanation.
     */
    explanation:string;

}


export interface OperationalTriggerResult {

    /**
     * Original trigger configuration.
     */
    trigger:OperationalTrigger;


    /**
     * True only when every configured condition
     * passes.
     */
    active:boolean;


    /**
     * True when the trigger is not active but all
     * conditions are sufficiently close to their
     * thresholds.
     */
    approaching:boolean;


    /**
     * Overall trigger proximity from 0 through 100.
     */
    proximityPercent:number;


    /**
     * Individual condition results.
     */
    conditionResults:
        OperationalTriggerConditionResult[];


    /**
     * Human-readable activation or proximity
     * summary.
     */
    activationReason:string;


    /**
     * Date and time of evaluation.
     */
    evaluatedAt:Date;

}