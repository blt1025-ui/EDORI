/**
 * EdoriScenarioResult
 *
 * Result of evaluating one EDORI scenario.
 */

import type {

    EdoriResult

}

from "./EdoriResult";


import type {

    EdoriScenario

}

from "./EdoriScenario";


export interface EdoriScenarioResult {

    scenario:EdoriScenario;

    result:EdoriResult;


    /**
     * True when the actual score falls within
     * the expected minimum and maximum.
     */
    scorePassed:boolean;


    /**
     * True when:
     *
     * - no expected state was specified; or
     * - the actual state matches the expected state.
     */
    statePassed:boolean;


    /**
     * True only when all configured expectations
     * pass.
     */
    passed:boolean;


    /**
     * Difference from the nearest acceptable
     * boundary.
     *
     * Zero means the score is within range.
     */
    scoreDeviation:number;

}