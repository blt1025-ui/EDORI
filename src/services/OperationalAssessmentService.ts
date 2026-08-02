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
 * - Operational pillar scores
 * - Risk direction
 * - Confidence
 * - Trigger-adjusted operational state
 * - Configured operational recommendations
 *
 * This service does not:
 *
 * - Modify application state
 * - Save results
 * - Save snapshots
 * - Emit application events
 * - Recalculate EDORI
 */

import {

    getOperationalIntervention

}

from "../config/interventions";


import {

    getOperationalStateByTitle,

    getOperationalStateRank

}

from "../config/operationalStates";


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

    const evaluationTime = normalizeDate(

        context.evaluatedAt

    );


    const normalizedContext:OperationalTriggerContext = {

        assessment:{

            ...context.assessment

        },

        result:{

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

            timestamp:normalizeDate(

                context.result.timestamp

            )

        },

        snapshots:context.snapshots.map(

            snapshot => ({

                ...snapshot,

                operationalState:{

                    ...snapshot.operationalState

                },

                timestamp:normalizeDate(

                    snapshot.timestamp

                )

            })

        ),

        evaluatedAt:evaluationTime

    };


    const triggerResults =

        evaluateOperationalTriggers(

            normalizedContext

        );


    const activeTriggers =

        triggerResults.filter(

            result => result.active

        );


    const pillarScores = createInitialPillarScores(

        normalizedContext

    );


    const pillarDetails = createInitialPillarDetails(

        normalizedContext,

        pillarScores

    );


    const riskDirection = determineRiskDirection(

        normalizedContext

    );


    const confidence = determineConfidence(

        normalizedContext

    );


    const finalOperationalState =

        determineFinalOperationalState(

            normalizedContext
                .result
                .operationalState,

            activeTriggers

        );


    const recommendations =

        createOperationalRecommendations(

            activeTriggers

        );


    return {

        id:createOperationalAssessmentId(

            evaluationTime

        ),

        assessment:{

            ...normalizedContext.assessment

        },

        scoreResult:{

            ...normalizedContext.result,

            operationalState:{

                ...normalizedContext
                    .result
                    .operationalState

            },

            drivers:normalizedContext
                .result
                .drivers
                .map(

                    driver => ({

                        ...driver

                    })

                ),

            recommendations:[

                ...normalizedContext
                    .result
                    .recommendations

            ],

            timestamp:new Date(

                normalizedContext
                    .result
                    .timestamp

            )

        },

        baseOperationalState:{

            ...normalizedContext
                .result
                .operationalState

        },

        finalOperationalState:{

            ...finalOperationalState

        },

        pillarScores:{

            ...pillarScores

        },

        pillarDetails:pillarDetails.map(

            pillar => ({

                ...pillar,

                factors:pillar.factors.map(

                    factor => ({

                        ...factor

                    })

                )

            })

        ),

        riskDirection,

        confidence,

        triggerResults:triggerResults.map(

            result => ({

                ...result,

                trigger:{

                    ...result.trigger,

                    conditions:result
                        .trigger
                        .conditions
                        .map(

                            condition => ({

                                ...condition

                            })

                        ),

                    interventionIds:[

                        ...result
                            .trigger
                            .interventionIds

                    ]

                },

                conditionResults:result
                    .conditionResults
                    .map(

                        conditionResult => ({

                            ...conditionResult

                        })

                    ),

                evaluatedAt:new Date(

                    result.evaluatedAt

                )

            })

        ),

        activeTriggers:activeTriggers.map(

            result => ({

                ...result,

                trigger:{

                    ...result.trigger,

                    conditions:result
                        .trigger
                        .conditions
                        .map(

                            condition => ({

                                ...condition

                            })

                        ),

                    interventionIds:[

                        ...result
                            .trigger
                            .interventionIds

                    ]

                },

                conditionResults:result
                    .conditionResults
                    .map(

                        conditionResult => ({

                            ...conditionResult

                        })

                    ),

                evaluatedAt:new Date(

                    result.evaluatedAt

                )

            })

        ),

        primaryDrivers:normalizedContext
            .result
            .drivers
            .map(

                driver => ({

                    ...driver

                })

            ),

        recommendations:recommendations.map(

            recommendation => ({

                ...recommendation,

                sourceIds:[

                    ...recommendation.sourceIds

                ]

            })

        ),

        generatedAt:new Date(

            evaluationTime

        )

    };

}


/**
 * Create transitional pillar values from the
 * existing EDORI domain scores.
 *
 * These mappings can later be replaced with
 * dedicated EDORI 2.0 pillar formulas.
 */
function createInitialPillarScores(

    context:OperationalTriggerContext

):OperationalPillarScores {

    const operationalDemand = clampScore(

        (

            context.result.demandScore

            +

            context.result.boardingScore

        )

        /

        2

    );


    const clinicalComplexity = clampScore(

        context.result.acuityScore

    );


    const hospitalThroughput = clampScore(

        (

            context.result.hospitalScore

            +

            context.result.forecastScore

        )

        /

        2

    );


    const operationalMomentum =

        calculateMomentumScore(

            context

        );


    return {

        operationalDemand,

        clinicalComplexity,

        hospitalThroughput,

        operationalMomentum

    };

}


/**
 * Create explainable pillar details.
 */
function createInitialPillarDetails(

    context:OperationalTriggerContext,

    scores:OperationalPillarScores

):OperationalPillarDetail[] {

    const totalEDVolume =

        context.assessment.totalEDVolume;


    const highAcuityCount =

        context.assessment.esi1

        +

        context.assessment.esi2;


    const expectedNetFlow =

        context.assessment.expectedArrivals

        -

        context.assessment.expectedDepartures;


    return [

        {

            id:
                "operationalDemand",

            title:
                "Operational Demand",

            score:
                scores.operationalDemand,

            summary:
                "Current ED workload based on volume and boarding strain.",

            factors:[

                {

                    id:
                        "ed-volume",

                    label:
                        "ED Volume",

                    currentValue:
                        totalEDVolume,

                    comparisonValue:
                        context.assessment.expectedVolume,

                    difference:
                        totalEDVolume

                        -

                        context.assessment.expectedVolume,

                    severity:
                        clampScore(

                            context.result.demandScore

                        ),

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
                        clampScore(

                            context.result.boardingScore

                        ),

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
                        highAcuityCount,

                    comparisonValue:
                        null,

                    difference:
                        null,

                    severity:
                        clampScore(

                            context.result.acuityScore

                        ),

                    explanation:
                        "Number of current ED patients categorized as ESI 1 or ESI 2."

                },


                {

                    id:
                        "high-acuity-percent",

                    label:
                        "High-Acuity Percentage",

                    currentValue:
                        calculatePercentage(

                            highAcuityCount,

                            totalEDVolume

                        ),

                    comparisonValue:
                        25,

                    difference:
                        calculatePercentage(

                            highAcuityCount,

                            totalEDVolume

                        )

                        -

                        25,

                    severity:
                        clampScore(

                            context.result.acuityScore

                        ),

                    explanation:
                        "Percentage of the ED census categorized as ESI 1 or ESI 2."

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
                        context.assessment
                            .occupiedMedicalBeds,

                    comparisonValue:
                        273,

                    difference:
                        context.assessment
                            .occupiedMedicalBeds

                        -

                        273,

                    severity:
                        clampScore(

                            context.result.hospitalScore

                        ),

                    explanation:
                        "Current occupied medical beds compared with the configured 273-bed denominator."

                },


                {

                    id:
                        "expected-net-flow",

                    label:
                        "Expected Net Flow",

                    currentValue:
                        expectedNetFlow,

                    comparisonValue:
                        0,

                    difference:
                        expectedNetFlow,

                    severity:
                        clampScore(

                            context.result.forecastScore

                        ),

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

                    : createMomentumSummary(

                        context

                    ),

            factors:createMomentumFactors(

                context,

                scores.operationalMomentum

            )

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


    const latestScore =

        scores[scores.length - 1];


    const previousScore =

        scores[scores.length - 2];


    const latestChange =

        latestScore

        -

        previousScore;


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
 *
 * This is a data-completeness indicator, not a
 * statistical confidence interval.
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


    const assessmentTimestamp = new Date(

        context.assessment.assessmentTime

    );


    const validAssessmentTime =

        !Number.isNaN(

            assessmentTimestamp.getTime()

        );


    if(

        !historicalValuesAvailable

        ||

        !validAssessmentTime

    ){

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
 * requires a higher minimum Alpha–Echo level.
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

                result.trigger
                    .minimumOperationalState;


            if(!minimumState){

                return;

            }


            const minimumStateRank =

                getOperationalStateRank(

                    minimumState

                );


            const currentStateRank =

                getOperationalStateRank(

                    finalState.title

                );


            if(

                minimumStateRank

                >

                currentStateRank

            ){

                finalState =

                    getOperationalStateByTitle(

                        minimumState

                    );

            }

        }

    );


    return {

        ...finalState

    };

}


/**
 * Create configured trigger-based recommendations.
 */
function createOperationalRecommendations(

    activeTriggers:OperationalAssessment["activeTriggers"]

):OperationalRecommendation[] {

    const recommendations = new Map<

        string,

        OperationalRecommendation

    >();


    activeTriggers.forEach(

        triggerResult => {

            triggerResult
                .trigger
                .interventionIds
                .forEach(

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

                                triggerResult
                                    .trigger
                                    .priority

                            );


                        const finalPriority =

                            getHigherRecommendationPriority(

                                intervention
                                    .defaultPriority,

                                triggerPriority

                            );


                        const triggerInterval =

                            triggerResult
                                .trigger
                                .reassessmentMinutes;


                        const defaultInterval =

                            intervention
                                .reassessmentMinutes;


                        if(existingRecommendation){

                            recommendations.set(

                                interventionId,

                                {

                                    ...existingRecommendation,

                                    priority:
                                        getHigherRecommendationPriority(

                                            existingRecommendation
                                                .priority,

                                            finalPriority

                                        ),

                                    sourceIds:Array.from(

                                        new Set([

                                            ...existingRecommendation
                                                .sourceIds,

                                            triggerResult
                                                .trigger
                                                .id

                                        ])

                                    ),

                                    rationale:
                                        createCombinedRationale(

                                            existingRecommendation
                                                .rationale,

                                            triggerResult
                                                .activationReason

                                        ),

                                    reassessmentMinutes:
                                        selectShortestReassessmentInterval(

                                            existingRecommendation
                                                .reassessmentMinutes,

                                            selectShortestReassessmentInterval(

                                                defaultInterval,

                                                triggerInterval

                                            )

                                        )

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
                                    triggerResult
                                        .activationReason,

                                sourceIds:[

                                    triggerResult
                                        .trigger
                                        .id

                                ],

                                responsibleGroup:
                                    intervention
                                        .responsibleGroup,

                                reassessmentMinutes:
                                    selectShortestReassessmentInterval(

                                        defaultInterval,

                                        triggerInterval

                                    )

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

        )

        .map(

            recommendation => ({

                ...recommendation,

                sourceIds:[

                    ...recommendation.sourceIds

                ]

            })

        );

}


/**
 * Calculate a transitional momentum score.
 *
 * A stable score begins at 50.
 *
 * Improving conditions move below 50.
 * Worsening conditions move above 50.
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
 *
 * The current result is added only if it is not
 * already represented by the latest snapshot.
 */
function createScoreSeries(

    context:OperationalTriggerContext

):number[] {

    const validSnapshots = context.snapshots

        .filter(

            snapshot =>

                Number.isFinite(

                    snapshot.score

                )

                &&

                !Number.isNaN(

                    new Date(

                        snapshot.timestamp

                    ).getTime()

                )

        )

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

        );


    const scores = validSnapshots.map(

        snapshot =>

            snapshot.score

    );


    const latestSnapshot =

        validSnapshots[

            validSnapshots.length - 1

        ];


    const resultTimestamp = new Date(

        context.result.timestamp

    ).getTime();


    const latestSnapshotTimestamp =

        latestSnapshot

            ? new Date(

                latestSnapshot.timestamp

            ).getTime()

            : null;


    const resultAlreadyIncluded =

        latestSnapshot !== undefined

        &&

        latestSnapshot.score

        ===

        context.result.score

        &&

        latestSnapshotTimestamp

        ===

        resultTimestamp;


    if(!resultAlreadyIncluded){

        scores.push(

            context.result.score

        );

    }


    return scores;

}


/**
 * Create a readable momentum summary.
 */
function createMomentumSummary(

    context:OperationalTriggerContext

):string {

    const scores = createScoreSeries(

        context

    );


    if(scores.length < 2){

        return "Insufficient history is available to calculate operational momentum.";

    }


    const latestChange =

        scores[scores.length - 1]

        -

        scores[scores.length - 2];


    if(latestChange >= 10){

        return `EDORI increased rapidly by ${formatSignedNumber(latestChange)} points since the previous assessment.`;

    }


    if(latestChange > 0){

        return `EDORI increased by ${formatSignedNumber(latestChange)} points since the previous assessment.`;

    }


    if(latestChange <= -5){

        return `EDORI improved by ${Math.abs(latestChange)} points since the previous assessment.`;

    }


    return "EDORI is stable compared with the previous assessment.";

}


/**
 * Create factors for the momentum pillar.
 */
function createMomentumFactors(

    context:OperationalTriggerContext,

    momentumScore:number | null

):OperationalPillarDetail["factors"] {

    const scores = createScoreSeries(

        context

    );


    if(

        scores.length < 2

        ||

        momentumScore === null

    ){

        return [];

    }


    const latestScore =

        scores[scores.length - 1];


    const previousScore =

        scores[scores.length - 2];


    return [

        {

            id:
                "latest-score-change",

            label:
                "Latest EDORI Change",

            currentValue:
                latestScore,

            comparisonValue:
                previousScore,

            difference:
                latestScore

                -

                previousScore,

            severity:
                momentumScore,

            explanation:
                "Change in EDORI compared with the previous recorded assessment."

        }

    ];

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


    if(

        existingRationale.includes(

            additionalRationale

        )

    ){

        return existingRationale;

    }


    return `${existingRationale} ${additionalRationale}`;

}


/**
 * Sort recommendations by priority and then by
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


    if(firstInterval !== secondInterval){

        return firstInterval

            -

            secondInterval;

    }


    return first.title.localeCompare(

        second.title

    );

}


/**
 * Create a unique assessment identifier.
 */
function createOperationalAssessmentId(

    generatedAt:Date

):string {

    return `operational-assessment-${generatedAt.getTime()}`;

}


/**
 * Safely calculate a percentage.
 */
function calculatePercentage(

    numerator:number,

    denominator:number

):number {

    if(

        !Number.isFinite(

            numerator

        )

        ||

        !Number.isFinite(

            denominator

        )

        ||

        denominator <= 0

    ){

        return 0;

    }


    return roundValue(

        numerator

        /

        denominator

        *

        100

    );

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


    return roundValue(

        Math.min(

            100,

            Math.max(

                0,

                value

            )

        )

    );

}


/**
 * Normalize an unknown date-like value.
 */
function normalizeDate(

    value:Date | string | number

):Date {

    const date = value instanceof Date

        ? new Date(

            value.getTime()

        )

        : new Date(

            value

        );


    if(Number.isNaN(date.getTime())){

        return new Date();

    }


    return date;

}


/**
 * Round a number to one decimal place.
 */
function roundValue(

    value:number

):number {

    if(!Number.isFinite(value)){

        return 0;

    }


    return Math.round(

        value * 10

    ) / 10;

}


/**
 * Format a signed value for readable text.
 */
function formatSignedNumber(

    value:number

):string {

    const rounded = roundValue(

        value

    );


    if(rounded > 0){

        return `+${rounded}`;

    }


    return String(

        rounded

    );

}