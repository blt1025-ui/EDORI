/**
 * OperationalIntervention
 *
 * Defines one configured operational action
 * available to EDORI trigger-based recommendations.
 */

import type {

    OperationalRecommendationPriority

}

from "./OperationalRecommendation";


export type OperationalInterventionCategory =

    | "ED Capacity"

    | "ED Flow"

    | "Boarding"

    | "Hospital Throughput"

    | "Leadership Escalation"

    | "Clinical Operations"

    | "Monitoring";


export interface OperationalIntervention {

    /**
     * Unique identifier referenced by trigger rules.
     */
    id:string;


    /**
     * User-facing intervention title.
     */
    title:string;


    /**
     * Detailed description of the suggested action.
     */
    description:string;


    /**
     * Primary operational category.
     */
    category:OperationalInterventionCategory;


    /**
     * Default recommendation priority.
     *
     * The trigger priority may elevate this value.
     */
    defaultPriority:OperationalRecommendationPriority;


    /**
     * Team or role expected to coordinate the action.
     */
    responsibleGroup:string;


    /**
     * Intended operational outcome.
     */
    objective:string;


    /**
     * Default reassessment interval after action.
     */
    reassessmentMinutes:number | null;


    /**
     * Whether this intervention is currently
     * available to the recommendation engine.
     */
    enabled:boolean;

}