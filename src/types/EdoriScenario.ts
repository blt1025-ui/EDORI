/**
 * EdoriScenario
 *
 * Defines one operational scenario used to
 * evaluate and calibrate the EDORI algorithm.
 */

import type {

    SituationAssessment

}

from "./SituationAssessment";


export interface EdoriScenario {

    /**
     * Unique scenario identifier.
     */
    id:string;


    /**
     * Readable scenario name.
     */
    name:string;


    /**
     * Operational explanation of the scenario.
     */
    description:string;


    /**
     * Complete assessment passed directly to the
     * pure EdoriService calculation.
     */
    assessment:SituationAssessment;


    /**
     * Expected acceptable EDORI score range.
     */
    expectedScore:{

        minimum:number;

        maximum:number;

    };


    /**
     * Optional expected operational-state title.
     *
     * Leave undefined when the acceptable score
     * range crosses more than one state.
     */
    expectedOperationalState?:string;


    /**
     * Clinical or operational reasoning behind
     * the expected result.
     */
    rationale:string;

}