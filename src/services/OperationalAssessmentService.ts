/**
 * OperationalAssessmentService
 *
 * Creates one authoritative EDORI 2.0
 * operational assessment.
 *
 * Combines:
 *
 * - Current committed SituationAssessment
 * - Current EdoriResult
 * - Operational triggers
 * - Risk direction
 * - Confidence
 * - Pillar placeholders
 * - Current drivers
 *
 * This service does not modify application state.
 */

import {

    getOperationalIntervention

}

from "../config/interventions";

import {

    evaluateOperationalTriggers

}

from "./OperationalTriggerService";


import type {

    OperationalAssessment

}

from "../types/OperationalAssessment";


import type {

    OperationalConfidence

}

from "../types/OperationalConfidence";


import type {

    OperationalPillarDetail

}

from "../types/OperationalPillarDetail";


import type {

    OperationalPillarScores

}

from "../types/OperationalPillarScores";


import type {

    OperationalRecommendation

}

from "../types/OperationalRecommendation";


import type {

    OperationalRiskDirection

}

from "../types/OperationalRiskDirection";


import type {

    OperationalTriggerContext

}

from "../types/OperationalTriggerContext";


/**
 * Create one authoritative operational assessment.
 */
export function createOperationalAssessment(

    context:OperationalTriggerContext

):OperationalAssessment {

    const triggerResults =

        evaluateOperationalTriggers(

            context

        );


    const activeTriggers =

        triggerResults.filter(

            result => result.active

        );


    const pillarScores = createInitialPillarScores(

        context

    );


    const pillarDetails = createInitialPillarDetails(

        context,

        pillarScores

    );


    const riskDirection = determineRiskDirection(

        context

    );


    const confidence = determineConfidence(

        context

    );


    const finalOperationalState =

        determineFinalOperationalState(

            context.result.operationalState,

            activeTriggers

        );


    const recommendations =

        createInitialRecommendations(

            activeTriggers

        );


    return {

        id:
            createOperationalAssessmentId(

                context.evaluatedAt

            ),

        assessment:{
            ...context.assessment
        },

        scoreResult:{

            ...context.result,

            operationalState:{

                ...context.result.operationalState

            },

            drivers:context.result.drivers.map(

                driver => ({

                    ...driver

                })

            ),

            recommendations:[

                ...context.result.recommendations

            ],

            timestamp:new Date(

                context.result.timestamp

            )

        },

        baseOperationalState:{

            ...context.result.operationalState

        },

        finalOperationalState,

        pillarScores,

        pillarDetails,

        riskDirection,

        confidence,

        triggerResults,

        activeTriggers,

        primaryDrivers:context.result.drivers.map(

            driver => ({

                ...driver

            })

        ),

        recommendations,

        generatedAt:new Date(

            context.evaluatedAt

        )

    };

}


/**
 * Create initial pillar values from the
 * existing EDORI domain scores.
 *
 * These mappings are transitional and will
 * be replaced by dedicated pillar formulas.
 */
function createInitialPillarScores(

    context:OperationalTriggerContext

):OperationalPillarScores {

    return {

        operationalDemand:
            clampScore(

                (

                    context.result.demandScore

                    +

                    context.result.boardingScore

                )

                /

                2

            ),

        clinicalComplexity:
            clampScore(

                context.result.acuityScore

            ),

        hospitalThroughput:
            clampScore(

                (

                    context.result.hospitalScore

                    +

                    context.result.forecastScore

                )

                /

                2

            ),

        operationalMomentum:
            calculateMomentumScore(

                context

            )

    };

}


/**
 * Create initial explainable pillar details.
 */
function createInitialPillarDetails(

    context:OperationalTriggerContext,

    scores:OperationalPillarScores

):OperationalPillarDetail[] {

    return [

        {

            id:
                "operationalDemand",

            title:
                "Operational Demand",

            score:
                scores.operationalDemand,

            summary:
                "Current ED workload based on demand and boarding strain.",

            factors:[

                {

                    id:
                        "ed-volume",

                    label:
                        "ED Volume",

                    currentValue:
                        context.assessment.totalEDVolume,

                    comparisonValue:
                        context.assessment.expectedVolume,

                    difference:
                        context.assessment.totalEDVolume

                        -

                        context.assessment.expectedVolume,

                    severity:
                        context.result.demandScore,

                    explanation:
                        "Current ED census compared with the historical weekday and hour expectation."

                },


                {

                    id:
                        "boarding",

                    label:
                        "Boarding",

                    currentValue:
                        context.assessment.boardedPatients,

                    comparisonValue:
                        context.assessment.expectedBoarders,

                    difference:
                        context.assessment.boardedPatients

                        -

                        context.assessment.expectedBoarders,

                    severity:
                        context.result.boardingScore,

                    explanation:
                        "Current boarding compared with the historical weekday and hour expectation."

                }

            ]

        },


        {

            id:
                "clinicalComplexity",

            title:
                "Clinical Complexity",

            score:
                scores.clinicalComplexity,

            summary:
                "Current patient acuity burden based on the ESI distribution.",

            factors:[

                {

                    id:
                        "high-acuity-count",

                    label:
                        "ESI 1 and ESI 2 Patients",

                    currentValue:
                        context.assessment.esi1

                        +

                        context.assessment.esi2,

                    comparisonValue:
                        null,

                    difference:
                        null,

                    severity:
                        context.result.acuityScore,

                    explanation:
                        "Number of current ED patients categorized as ESI 1 or ESI 2."

                }

            ]

        },


        {

            id:
                "hospitalThroughput",

            title:
                "Hospital Throughput",

            score:
                scores.hospitalThroughput,

            summary:
                "Hospital capacity and expected hourly flow affecting ED operations.",

            factors:[

                {

                    id:
                        "hospital-occupancy",

                    label:
                        "Occupied Medical Beds",

                    currentValue:
                        context.assessment.occupiedMedicalBeds,

                    comparisonValue:
                        273,

                    difference:
                        273

                        -

                        context.assessment.occupiedMedicalBeds,

                    severity:
                        context.result.hospitalScore,

                    explanation:
                        "Current occupied medical beds compared with the configured 273-bed denominator."

                },


                {

                    id:
                        "expected-net-flow",

                    label:
                        "Expected Net Flow",

                    currentValue:
                        context.assessment.expectedArrivals

                        -

                        context.assessment.expectedDepartures,

                    comparisonValue:
                        0,

                    difference:
                        context.assessment.expectedArrivals

                        -

                        context.assessment.expectedDepartures,

                    severity:
                        context.result.forecastScore,

                    explanation:
                        "Expected arrivals minus expected departures for the current hourly period."

                }

            ]

        },


        {

            id:
                "operationalMomentum",

            title:
                "Operational Momentum",

            score:
                scores.operationalMomentum,

            summary:
                scores.operationalMomentum === null

                    ? "Insufficient history is available to calculate operational momentum."

                    : "Recent EDORI score movement across persistent assessments.",

            factors:[]

        }

    ];

}


/**
 * Determine operational risk direction.
 */
function determineRiskDirection(

    context:OperationalTriggerContext

):OperationalRiskDirection {

    const scores = createScoreSeries(

        context

    );


    if(scores.length < 2){

        return "Insufficient Data";

    }


    const latestChange =

        scores[scores.length - 1]

        -

        scores[scores.length - 2];


    if(latestChange <= -5){

        return "Improving";

    }


    if(latestChange >= 10){

        return "Rapidly Worsening";

    }


    if(latestChange > 0){

        return "Increasing";

    }


    return "Stable";

}


/**
 * Determine assessment confidence.
 */
function determineConfidence(

    context:OperationalTriggerContext

):OperationalConfidence {

    const snapshotCount =

        context.snapshots.length;


    const historicalValuesAvailable =

        context.assessment.expectedVolume > 0

        &&

        context.assessment.expectedBoarders >= 0

        &&

        context.assessment.expectedArrivals >= 0

        &&

        context.assessment.expectedDepartures >= 0;


    if(!historicalValuesAvailable){

        return "Low";

    }


    if(snapshotCount >= 5){

        return "High";

    }


    if(snapshotCount >= 2){

        return "Moderate";

    }


    return "Low";

}


/**
 * Elevate the base state when an active trigger
 * requires a higher minimum operational state.
 */
function determineFinalOperationalState(

    baseState:OperationalAssessment["baseOperationalState"],

    activeTriggers:OperationalAssessment["activeTriggers"]

):OperationalAssessment["finalOperationalState"] {

    let finalState = {

        ...baseState

    };


    activeTriggers.forEach(

        result => {

            const minimumState =

                result.trigger.minimumOperationalState;


            if(!minimumState){

                return;

            }


            if(

                getStateRank(

                    minimumState

                )

                >

                getStateRank(

                    finalState.title

                )

            ){

                finalState = createStateFromTitle(

                    minimumState

                );

            }

        }

    );


    return finalState;

}


/**
 * Create initial trigger-based recommendations.
 */
/**
 * Create configured trigger-based recommendations.
 */
function createInitialRecommendations(

    activeTriggers:OperationalAssessment["activeTriggers"]

):OperationalRecommendation[] {

    const recommendations = new Map<

        string,

        OperationalRecommendation

    >();


    activeTriggers.forEach(

        triggerResult => {

            triggerResult.trigger.interventionIds.forEach(

                interventionId => {

                    const intervention =

                        getOperationalIntervention(

                            interventionId

                        );


                    if(!intervention){

                        console.warn(

                            `No enabled operational intervention was found for "${interventionId}".`

                        );


                        return;

                    }


                    const existingRecommendation =

                        recommendations.get(

                            interventionId

                        );


                    const triggerPriority =

                        mapTriggerPriority(

                            triggerResult.trigger.priority

                        );


                    const finalPriority =

                        getHigherRecommendationPriority(

                            intervention.defaultPriority,

                            triggerPriority

                        );


                    const reassessmentMinutes =

                        selectShortestReassessmentInterval(

                            existingRecommendation
                                ?.reassessmentMinutes

                            ?? intervention.reassessmentMinutes,

                            triggerResult
                                .trigger
                                .reassessmentMinutes

                        );


                    if(existingRecommendation){

                        recommendations.set(

                            interventionId,

                            {

                                ...existingRecommendation,

                                priority:
                                    getHigherRecommendationPriority(

                                        existingRecommendation.priority,

                                        finalPriority

                                    ),

                                sourceIds:Array.from(

                                    new Set([

                                        ...existingRecommendation.sourceIds,

                                        triggerResult.trigger.id

                                    ])

                                ),

                                rationale:
                                    createCombinedRationale(

                                        existingRecommendation.rationale,

                                        triggerResult.activationReason

                                    ),

                                reassessmentMinutes

                            }

                        );


                        return;

                    }


                    recommendations.set(

                        interventionId,

                        {

                            id:
                                intervention.id,

                            title:
                                intervention.title,

                            description:
                                intervention.description,

                            priority:
                                finalPriority,

                            rationale:
                                triggerResult.activationReason,

                            sourceIds:[

                                triggerResult.trigger.id

                            ],

                            responsibleGroup:
                                intervention.responsibleGroup,

                            reassessmentMinutes

                        }

                    );

                }

            );

        }

    );


    return Array.from(

        recommendations.values()

    )

        .sort(

            compareOperationalRecommendations

        );

}


/**
 * Calculate a transitional momentum score.
 */
function calculateMomentumScore(

    context:OperationalTriggerContext

):number | null {

    const scores = createScoreSeries(

        context

    );


    if(scores.length < 2){

        return null;

    }


    const latestChange =

        scores[scores.length - 1]

        -

        scores[scores.length - 2];


    return clampScore(

        50

        +

        latestChange * 5

    );

}


/**
 * Create a chronological score series.
 */
function createScoreSeries(

    context:OperationalTriggerContext

):number[] {

    const scores = context.snapshots

        .slice()

        .sort(

            (

                first,

                second

            ) =>

                new Date(

                    first.timestamp

                ).getTime()

                -

                new Date(

                    second.timestamp

                ).getTime()

        )

        .map(

            snapshot => snapshot.score

        );


    if(

        scores.length === 0

        ||

        scores[scores.length - 1]

        !==

        context.result.score

    ){

        scores.push(

            context.result.score

        );

    }


    return scores;

}


/**
 * Rank supported operational states.
 */
function getStateRank(

    title:string

):number {

    const ranks:Record<

        string,

        number

    > = {

        "Normal Operations":
            0,

        "Elevated Activity":
            1,

        "Elevated Awareness":
            1,

        "Busy":
            2,

        "Capacity Strain":
            2,

        "Surge":
            3,

        "High Surge":
            3,

        "Severe Surge":
            4,

        "Critical Operations":
            5

    };


    return ranks[title]

        ?? 0;

}


/**
 * Create an operational state from a state title.
 */
function createStateFromTitle(

    title:string

):OperationalAssessment["finalOperationalState"] {

    const states:Record<

        string,

        OperationalAssessment["finalOperationalState"]

    > = {

        "Normal Operations":{

            title:
                "Normal Operations",

            icon:
                "🟢",

            color:
                "#2E7D32",

            recommendation:
                "Continue routine operational monitoring."

        },

        "Elevated Awareness":{

            title:
                "Elevated Awareness",

            icon:
                "🔵",

            color:
                "#1565C0",

            recommendation:
                "Increase situational awareness and monitor developing operational strain."

        },

        "Capacity Strain":{

            title:
                "Capacity Strain",

            icon:
                "🟡",

            color:
                "#F9A825",

            recommendation:
                "Review throughput barriers and prepare operational escalation."

        },

        "High Surge":{

            title:
                "High Surge",

            icon:
                "🟠",

            color:
                "#EF6C00",

            recommendation:
                "Activate coordinated surge interventions and increase reassessment frequency."

        },

        "Severe Surge":{

            title:
                "Severe Surge",

            icon:
                "🔴",

            color:
                "#C62828",

            recommendation:
                "Initiate immediate hospital-wide operational response."

        },

        "Critical Operations":{

            title:
                "Critical Operations",

            icon:
                "🔴",

            color:
                "#8B0000",

            recommendation:
                "Activate the highest appropriate organizational response and executive oversight."

        }

    };


    return states[title]

        ?? states["Normal Operations"];

}


/**
 * Map trigger priority to recommendation priority.
 */
function mapTriggerPriority(

    priority:string

):OperationalRecommendation["priority"] {

    switch(priority){

        case "Critical":

            return "Immediate";


        case "High":

            return "High";


        case "Moderate":

            return "Moderate";


        default:

            return "Routine";

    }

}


/**
 * Convert an intervention identifier into a
 * readable title.
 */



/**
 * Create a unique assessment identifier.
 */
function createOperationalAssessmentId(

    generatedAt:Date

):string {

    return `operational-assessment-${generatedAt.getTime()}`;

}


/**
 * Clamp a score to 0–100.
 */
function clampScore(

    value:number

):number {

    if(!Number.isFinite(value)){

        return 0;

    }


    return Math.round(

        Math.min(

            100,

            Math.max(

                0,

                value

            )

        )

        *

        10

    ) / 10;

}

/**
 * Return the higher of two recommendation
 * priorities.
 */
function getHigherRecommendationPriority(

    first:OperationalRecommendation["priority"],

    second:OperationalRecommendation["priority"]

):OperationalRecommendation["priority"] {

    return getRecommendationPriorityRank(

        first

    )

    >=

    getRecommendationPriorityRank(

        second

    )

        ? first

        : second;

}


/**
 * Rank recommendation priorities.
 */
function getRecommendationPriorityRank(

    priority:OperationalRecommendation["priority"]

):number {

    const ranks:Record<

        OperationalRecommendation["priority"],

        number

    > = {

        Routine:
            1,

        Moderate:
            2,

        High:
            3,

        Immediate:
            4

    };


    return ranks[priority];

}


/**
 * Use the shortest available reassessment interval.
 */
function selectShortestReassessmentInterval(

    first:number | null,

    second:number | null

):number | null {

    if(first === null){

        return second;

    }


    if(second === null){

        return first;

    }


    return Math.min(

        first,

        second

    );

}


/**
 * Combine trigger rationale without repeating
 * identical text.
 */
function createCombinedRationale(

    existingRationale:string,

    additionalRationale:string

):string {

    if(

        existingRationale

        ===

        additionalRationale

    ){

        return existingRationale;

    }


    return `${existingRationale} ${additionalRationale}`;

}


/**
 * Sort recommendations by priority and then
 * reassessment urgency.
 */
function compareOperationalRecommendations(

    first:OperationalRecommendation,

    second:OperationalRecommendation

):number {

    const priorityDifference =

        getRecommendationPriorityRank(

            second.priority

        )

        -

        getRecommendationPriorityRank(

            first.priority

        );


    if(priorityDifference !== 0){

        return priorityDifference;

    }


    const firstInterval =

        first.reassessmentMinutes

        ?? Number.MAX_SAFE_INTEGER;


    const secondInterval =

        second.reassessmentMinutes

        ?? Number.MAX_SAFE_INTEGER;


    return firstInterval

        -

        secondInterval;

}