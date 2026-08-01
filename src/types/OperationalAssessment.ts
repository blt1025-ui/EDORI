/**
 * OperationalAssessment
 *
 * Authoritative EDORI 2.0 operational output.
 *
 * Future dashboard components will read this
 * object instead of independently interpreting
 * scores, thresholds, triggers, or trends.
 */

import type {

    OperationalState

}

from "../config/operationalStates";


import type {

    Driver

}

from "./Driver";


import type {

    EdoriResult

}

from "./EdoriResult";


import type {

    OperationalConfidence

}

from "./OperationalConfidence";


import type {

    OperationalPillarDetail

}

from "./OperationalPillarDetail";


import type {

    OperationalPillarScores

}

from "./OperationalPillarScores";


import type {

    OperationalRecommendation

}

from "./OperationalRecommendation";


import type {

    OperationalRiskDirection

}

from "./OperationalRiskDirection";


import type {

    OperationalTriggerResult

}

from "./OperationalTriggerResult";


import type {

    SituationAssessment

}

from "./SituationAssessment";


export interface OperationalAssessment {

    /**
     * Unique identifier for this operational
     * assessment.
     */
    id:string;


    /**
     * Completed current-state assessment.
     */
    assessment:SituationAssessment;


    /**
     * Existing EDORI numerical score result.
     */
    scoreResult:EdoriResult;


    /**
     * State determined by the EDORI score alone.
     */
    baseOperationalState:OperationalState;


    /**
     * Final state after trigger-based escalation.
     */
    finalOperationalState:OperationalState;


    /**
     * Four EDORI 2.0 pillar scores.
     */
    pillarScores:OperationalPillarScores;


    /**
     * Full explanations of pillar calculations.
     */
    pillarDetails:OperationalPillarDetail[];


    /**
     * Operational trend direction.
     */
    riskDirection:OperationalRiskDirection;


    /**
     * Data completeness and assessment confidence.
     */
    confidence:OperationalConfidence;


    /**
     * Every evaluated trigger.
     *
     * Active triggers are identified by:
     *
     * result.active === true
     */
    triggerResults:OperationalTriggerResult[];


    /**
     * Active triggers only.
     */
    activeTriggers:OperationalTriggerResult[];


    /**
     * Ordered operational drivers.
     */
    primaryDrivers:Driver[];


    /**
     * Prioritized operational actions.
     */
    recommendations:OperationalRecommendation[];


    /**
     * Assessment creation timestamp.
     */
    generatedAt:Date;

}