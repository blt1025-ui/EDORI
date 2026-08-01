/**
 * OperationalTriggerContext
 *
 * Contains the information required to evaluate
 * EDORI operational trigger rules.
 */

import type {

    EdoriResult

}

from "./EdoriResult";


import type {

    EdoriSnapshot

}

from "./EdoriSnapshot";


import type {

    SituationAssessment

}

from "./SituationAssessment";


export interface OperationalTriggerContext {

    /**
     * Current completed operational assessment.
     */
    assessment:SituationAssessment;


    /**
     * Current authoritative EDORI result.
     */
    result:EdoriResult;


    /**
     * Previous persistent snapshots.
     *
     * The current result may already be represented
     * by the newest snapshot. The trigger service
     * handles that safely.
     */
    snapshots:EdoriSnapshot[];


    /**
     * Trigger evaluation time.
     */
    evaluatedAt:Date;

}