/**
 * OperationalAssessmentService
 *
 * Creates one authoritative Version 2 Hospital
 * Readiness operational assessment.
 *
 * Combines:
 *
 * - Current committed SituationAssessment
 * - Current EdoriResult
 * - Operational triggers
 * - Operational pillar scores
 * - Risk direction
 * - Confidence
 * - Score-derived operational state
 * - Configured operational recommendations
 *
 * This service does not:
 *
 * - Modify application state
 * - Save results
 * - Save snapshots
 * - Emit application events
 * - Recalculate Hospital Readiness
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


    const finalOperationalState = {

        ...normalizedContext.result.operationalState

    };


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
 * Create Version 2 Hospital Readiness explanatory
 * pillar scores.
 *
 * These pillars do not replace or recalculate HRI.
 * They group authoritative Hospital Readiness
 * domains into leadership-friendly categories.
 */
function createInitialPillarScores(

    context:OperationalTriggerContext

):OperationalPillarScores {

    /*
     * The five displayed domain scores map directly to
     * the authoritative Hospital Readiness result.
     *
     * No secondary weighting or averaging occurs here.
     */

    const edOperationalPressure =

        clampScore(

            context.result.edPressureScore

        );


    const acuteCareCapacity =

        clampScore(

            context.result.acuteCapacityScore

        );


    const criticalCareCapacity =

        clampScore(

            context.result.criticalCapacityScore

        );


    const hospitalInflow =

        clampScore(

            context.result.inflowScore

        );


    const projectedCapacity =

        clampScore(

            context.result.projectedCapacityScore

        );


    const operationalMomentum =

        calculateMomentumScore(

            context

        );


    return {

        edOperationalPressure,

        acuteCareCapacity,

        criticalCareCapacity,

        hospitalInflow,

        projectedCapacity,

        operationalMomentum

    };

}


/**
 * Create explainable Version 2 Hospital Readiness
 * pillar details.
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


    const highAcuityPercent =

        calculatePercentage(

            highAcuityCount,

            totalEDVolume

        );


    const acuteOccupancyPercent =

        calculatePercentage(

            context.assessment.occupiedAcuteCareBeds,

            context.assessment.staffedAcuteCareBeds

        );


    const criticalOccupancyPercent =

        calculatePercentage(

            context.assessment.occupiedCriticalCareBeds,

            context.assessment.staffedCriticalCareBeds

        );


    const currentAvailableAcuteCareBeds =

        context.assessment.staffedAcuteCareBeds

        -

        context.assessment.occupiedAcuteCareBeds;


    const currentAvailableCriticalCareBeds =

        context.assessment.staffedCriticalCareBeds

        -

        context.assessment.occupiedCriticalCareBeds;


    const inflowVariance =

        context.result.currentHospitalInflow

        -

        context.result.expectedHospitalInflow;


    const projectedCapacityChange =

        context.result.projectedAvailableAcuteCareBeds

        -

        context.result.currentAvailableAcuteCareBeds;


    return [

        /*
         * =================================================
         * ED Operational Pressure — 35%
         * =================================================
         */

        {

            id:
                "edOperationalPressure",

            title:
                "ED Operational Pressure",

            score:
                scores.edOperationalPressure,

            summary:
                createEdOperationalPressureSummary(

                    context

                ),

            factors:[

                {

                    id:
                        "ed-volume",

                    label:
                        "ED Volume",

                    currentValue:
                        totalEDVolume,

                    comparisonValue:
                        context.assessment.expectedEDVolume,

                    difference:
                        totalEDVolume

                        -

                        context.assessment.expectedEDVolume,

                    severity:
                        clampScore(

                            context.result.edVolumeScore

                        ),

                    explanation:
                        "Current ED census compared with the historical expectation for the current weekday and hour."

                },


                {

                    id:
                        "ed-boarding",

                    label:
                        "ED Boarding",

                    currentValue:
                        context.assessment.boardedPatients,

                    comparisonValue:
                        context.assessment.expectedEDBoarders,

                    difference:
                        context.assessment.boardedPatients

                        -

                        context.assessment.expectedEDBoarders,

                    severity:
                        clampScore(

                            context.result.edBoardingScore

                        ),

                    explanation:
                        "Current ED boarding population compared with the historical expectation for the current weekday and hour."

                },


                {

                    id:
                        "high-acuity-percent",

                    label:
                        "ESI 1-2 Percentage",

                    currentValue:
                        highAcuityPercent,

                    comparisonValue:
                        30,

                    difference:
                        highAcuityPercent

                        -

                        30,

                    severity:
                        clampScore(

                            context.result.edAcuityScore

                        ),

                    explanation:
                        "Percentage of the current ED census categorized as ESI 1 or ESI 2."

                }

            ]

        },


        /*
         * =================================================
         * Acute-Care Capacity — 20%
         * =================================================
         */

        {

            id:
                "acuteCareCapacity",

            title:
                "Acute-Care Capacity",

            score:
                scores.acuteCareCapacity,

            summary:
                createAcuteCareCapacitySummary(

                    context,

                    acuteOccupancyPercent,

                    currentAvailableAcuteCareBeds

                ),

            factors:[

                {

                    id:
                        "acute-care-occupancy",

                    label:
                        "Acute-Care Occupancy",

                    currentValue:
                        acuteOccupancyPercent,

                    comparisonValue:
                        null,

                    difference:
                        null,

                    severity:
                        clampScore(

                            context.result.acuteCapacityScore

                        ),

                    explanation:
                        `Current staffed acute-care occupancy: ${formatNumber(context.assessment.occupiedAcuteCareBeds)} of ${formatNumber(context.assessment.staffedAcuteCareBeds)} staffed beds.`

                },


                {

                    id:
                        "available-acute-care-beds",

                    label:
                        "Available Acute-Care Beds",

                    currentValue:
                        currentAvailableAcuteCareBeds,

                    comparisonValue:
                        null,

                    difference:
                        null,

                    severity:
                        clampScore(

                            context.result.acuteCapacityScore

                        ),

                    explanation:
                        "Current staffed acute-care beds not occupied."

                }

            ]

        },


        /*
         * =================================================
         * Critical-Care Capacity — 15%
         * =================================================
         */

        {

            id:
                "criticalCareCapacity",

            title:
                "Critical-Care Capacity",

            score:
                scores.criticalCareCapacity,

            summary:
                createCriticalCareCapacitySummary(

                    context,

                    criticalOccupancyPercent,

                    currentAvailableCriticalCareBeds

                ),

            factors:[

                {

                    id:
                        "critical-care-occupancy",

                    label:
                        "Critical-Care Occupancy",

                    currentValue:
                        criticalOccupancyPercent,

                    comparisonValue:
                        null,

                    difference:
                        null,

                    severity:
                        clampScore(

                            context.result.criticalCapacityScore

                        ),

                    explanation:
                        `Current staffed critical-care occupancy: ${formatNumber(context.assessment.occupiedCriticalCareBeds)} of ${formatNumber(context.assessment.staffedCriticalCareBeds)} staffed beds.`

                },


                {

                    id:
                        "available-critical-care-beds",

                    label:
                        "Available Critical-Care Beds",

                    currentValue:
                        currentAvailableCriticalCareBeds,

                    comparisonValue:
                        null,

                    difference:
                        null,

                    severity:
                        clampScore(

                            context.result.criticalCapacityScore

                        ),

                    explanation:
                        "Current staffed critical-care beds not occupied."

                }

            ]

        },


        /*
         * =================================================
         * Hospital Inflow — 15%
         * =================================================
         */

        {

            id:
                "hospitalInflow",

            title:
                "Hospital Inflow",

            score:
                scores.hospitalInflow,

            summary:
                createHospitalInflowSummary(

                    context

                ),

            factors:[

                {

                    id:
                        "known-hospital-inflow",

                    label:
                        "Known Hospital Inflow",

                    currentValue:
                        context.result.currentHospitalInflow,

                    comparisonValue:
                        context.result.expectedHospitalInflow,

                    difference:
                        inflowVariance,

                    severity:
                        clampScore(

                            context.result.inflowScore

                        ),

                    explanation:
                        "Current known ED, direct, and surgical/procedural admissions compared with the historical four-hour hospital inflow expectation."

                },


                {

                    id:
                        "projected-hospital-inflow",

                    label:
                        "Projected Hospital Inflow",

                    currentValue:
                        context.result.projectedHospitalInflow,

                    comparisonValue:
                        context.result.expectedHospitalInflow,

                    difference:
                        context.result.projectedHospitalInflow

                        -

                        context.result.expectedHospitalInflow,

                    severity:
                        clampScore(

                            context.result.inflowScore

                        ),

                    explanation:
                        "Hospital inflow used by the four-hour forecast. The model uses the greater of currently known inflow and historical expected inflow."

                }

            ]

        },


        /*
         * =================================================
         * Projected Capacity — 15%
         * =================================================
         */

        {

            id:
                "projectedCapacity",

            title:
                "Projected Capacity",

            score:
                scores.projectedCapacity,

            summary:
                createProjectedCapacitySummary(

                    context

                ),

            factors:[

                {

                    id:
                        "expected-inpatient-departures",

                    label:
                        "Expected Inpatient Departures",

                    currentValue:
                        context.result.expectedInpatientDepartures,

                    comparisonValue:
                        null,

                    difference:
                        null,

                    severity:
                        clampScore(

                            context.result.projectedCapacityScore

                        ),

                    explanation:
                        "Historical expected inpatient departures during the four-hour forecast period. This value is not entered or estimated by the user."

                },


                {

                    id:
                        "projected-available-acute-care-beds",

                    label:
                        "Projected Available Acute-Care Beds",

                    currentValue:
                        context.result.projectedAvailableAcuteCareBeds,

                    comparisonValue:
                        context.result.currentAvailableAcuteCareBeds,

                    difference:
                        projectedCapacityChange,

                    severity:
                        clampScore(

                            context.result.projectedCapacityScore

                        ),

                    explanation:
                        createProjectedCapacityExplanation(

                            context

                        )

                }

            ]

        },


        /*
         * =================================================
         * Operational Momentum — not part of HRI
         * =================================================
         */

        {

            id:
                "operationalMomentum",

            title:
                "Operational Momentum",

            score:
                scores.operationalMomentum,

            summary:
                scores.operationalMomentum === null

                    ? "Insufficient Hospital Readiness history is available to calculate operational momentum."

                    : createMomentumSummary(

                        context

                    ),

            factors:
                createMomentumFactors(

                    context,

                    scores.operationalMomentum

                )

        }

    ];

}

/**
 * Explain the ED Operational Pressure pillar.
 */
function createEdOperationalPressureSummary(

    context:OperationalTriggerContext

):string {

    const result =

        context.result;


    const drivers:string[] = [];


    if(result.edVolumeScore >= 40){

        drivers.push(

            "ED census"

        );

    }


    if(result.edBoardingScore >= 40){

        drivers.push(

            "boarding"

        );

    }


    if(result.edAcuityScore >= 40){

        drivers.push(

            "high acuity"

        );

    }


    if(drivers.length === 0){

        return "ED volume, boarding, and high-acuity burden are not currently generating substantial operational pressure.";

    }


    return `ED operational pressure is being driven by ${formatReadableList(drivers)}.`;

}


/**
 * Explain the Acute-Care Capacity domain.
 */
function createAcuteCareCapacitySummary(

    context:OperationalTriggerContext,

    occupancyPercent:number,

    availableBeds:number

):string {

    if(availableBeds <= 0){

        return `Acute-care capacity is fully utilized with ${formatNumber(context.assessment.occupiedAcuteCareBeds)} of ${formatNumber(context.assessment.staffedAcuteCareBeds)} staffed beds occupied.`;

    }


    if(context.result.acuteCapacityScore >= 60){

        return `Acute-care capacity is significantly constrained at ${formatNumber(occupancyPercent)}% occupancy with ${formatNumber(availableBeds)} staffed beds currently available.`;

    }


    if(context.result.acuteCapacityScore >= 30){

        return `Acute-care capacity is under pressure at ${formatNumber(occupancyPercent)}% occupancy with ${formatNumber(availableBeds)} staffed beds currently available.`;

    }


    return `Acute-care capacity is currently in a lower-pressure range at ${formatNumber(occupancyPercent)}% occupancy with ${formatNumber(availableBeds)} staffed beds available.`;

}


/**
 * Explain the Critical-Care Capacity domain.
 */
function createCriticalCareCapacitySummary(

    context:OperationalTriggerContext,

    occupancyPercent:number,

    availableBeds:number

):string {

    if(availableBeds <= 0){

        return `Critical-care capacity is fully utilized with ${formatNumber(context.assessment.occupiedCriticalCareBeds)} of ${formatNumber(context.assessment.staffedCriticalCareBeds)} staffed beds occupied.`;

    }


    if(context.result.criticalCapacityScore >= 60){

        return `Critical-care capacity is significantly constrained at ${formatNumber(occupancyPercent)}% occupancy with ${formatNumber(availableBeds)} staffed beds currently available.`;

    }


    if(context.result.criticalCapacityScore >= 30){

        return `Critical-care capacity is under pressure at ${formatNumber(occupancyPercent)}% occupancy with ${formatNumber(availableBeds)} staffed beds currently available.`;

    }


    return `Critical-care capacity is currently in a lower-pressure range at ${formatNumber(occupancyPercent)}% occupancy with ${formatNumber(availableBeds)} staffed beds available.`;

}


/**
 * Explain the Hospital Inflow domain.
 */
function createHospitalInflowSummary(

    context:OperationalTriggerContext

):string {

    const current =

        context.result.currentHospitalInflow;


    const expected =

        context.result.expectedHospitalInflow;


    const variance =

        current

        -

        expected;


    if(variance > 0){

        return `Known four-hour hospital inflow is ${formatNumber(variance)} patients above the historical expectation (${formatNumber(current)} known versus ${formatNumber(expected)} expected).`;

    }


    if(variance < 0){

        return `Known four-hour hospital inflow is ${formatNumber(Math.abs(variance))} patients below the historical expectation; the forecast continues to use at least the historical expected inflow.`;

    }


    return `Known four-hour hospital inflow matches the historical expectation at ${formatNumber(expected)} patients.`;

}


/**
 * Explain the Projected Capacity domain.
 */
function createProjectedCapacitySummary(

    context:OperationalTriggerContext

):string {

    const currentAvailable =

        context.result.currentAvailableAcuteCareBeds;


    const projectedAvailable =

        context.result.projectedAvailableAcuteCareBeds;


    if(projectedAvailable < 0){

        return `The four-hour forecast projects demand exceeding staffed acute-care capacity by approximately ${formatNumber(Math.abs(projectedAvailable))} beds.`;

    }


    if(projectedAvailable === 0){

        return "The four-hour forecast projects complete utilization of currently staffed acute-care capacity.";

    }


    if(projectedAvailable < currentAvailable){

        return `Acute-care availability is projected to tighten from ${formatNumber(currentAvailable)} beds currently available to approximately ${formatNumber(projectedAvailable)} beds over the next four hours.`;

    }


    if(projectedAvailable > currentAvailable){

        return `Acute-care availability is projected to improve from ${formatNumber(currentAvailable)} beds currently available to approximately ${formatNumber(projectedAvailable)} beds over the next four hours.`;

    }


    return `Acute-care availability is projected to remain approximately stable at ${formatNumber(projectedAvailable)} beds over the next four hours.`;

}


/**
 * Explain the projected-capacity calculation.
 */
function createProjectedCapacityExplanation(

    context:OperationalTriggerContext

):string {

    const projectedAvailable =

        context.result.projectedAvailableAcuteCareBeds;


    if(projectedAvailable < 0){

        return `The four-hour forecast projects a capacity deficit of approximately ${formatNumber(Math.abs(projectedAvailable))} acute-care beds after expected inpatient departures and projected hospital inflow are applied.`;

    }


    if(projectedAvailable === 0){

        return "The four-hour forecast projects no remaining staffed acute-care bed availability after expected departures and projected inflow are applied.";

    }


    return `The four-hour forecast projects approximately ${formatNumber(projectedAvailable)} staffed acute-care beds remaining available after expected departures and projected inflow are applied.`;

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
 * Determine Hospital Readiness assessment confidence.
 *
 * This represents data completeness and historical
 * availability, not a statistical confidence
 * interval.
 */
function determineConfidence(

    context:OperationalTriggerContext

):OperationalConfidence {

    const snapshotCount =

        context.snapshots.length;


    const historicalValuesAvailable =

        Number.isFinite(

            context.assessment.expectedEDVolume

        )

        &&

        context.assessment.expectedEDVolume > 0

        &&

        Number.isFinite(

            context.assessment.expectedEDBoarders

        )

        &&

        context.assessment.expectedEDBoarders >= 0

        &&

        Number.isFinite(

            context.assessment.expectedHospitalInflow4h

        )

        &&

        context.assessment.expectedHospitalInflow4h >= 0

        &&

        Number.isFinite(

            context.assessment.expectedInpatientDepartures4h

        )

        &&

        context.assessment.expectedInpatientDepartures4h >= 0

        &&

        context.assessment.forecastHours === 4;


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
 * Operational triggers do not alter Alpha–Echo in
 * Version 2.1. They remain available for warnings,
 * recommendations, and reassessment guidance.
 */


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
 * Create a readable Hospital Readiness
 * momentum summary.
 */
function createMomentumSummary(

    context:OperationalTriggerContext

):string {

    const scores = createScoreSeries(

        context

    );


    if(scores.length < 2){

        return "Insufficient Hospital Readiness history is available to calculate operational momentum.";

    }


    const latestChange =

        scores[scores.length - 1]

        -

        scores[scores.length - 2];


    if(latestChange >= 10){

        return `Hospital Readiness pressure increased rapidly by ${formatSignedNumber(latestChange)} points since the previous assessment.`;

    }


    if(latestChange > 0){

        return `Hospital Readiness pressure increased by ${formatSignedNumber(latestChange)} points since the previous assessment.`;

    }


    if(latestChange <= -5){

        return `Hospital Readiness pressure improved by ${Math.abs(roundValue(latestChange))} points since the previous assessment.`;

    }


    return "Hospital Readiness is stable compared with the previous assessment.";

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
    "Latest Hospital Readiness Change",

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
    "Change in Hospital Readiness compared with the previous recorded assessment."

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
 * Format a number without unnecessary trailing
 * decimal zeros.
 */
function formatNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "0";

    }


    const rounded =

        roundValue(

            value

        );


    return Number.isInteger(

        rounded

    )

        ? String(

            rounded

        )

        : rounded

            .toFixed(

                1

            )

            .replace(

                /\.0$/,

                ""

            );

}


/**
 * Format a readable English list.
 */
function formatReadableList(

    values:string[]

):string {

    if(values.length === 0){

        return "";

    }


    if(values.length === 1){

        return values[0];

    }


    if(values.length === 2){

        return `${values[0]} and ${values[1]}`;

    }


    return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;

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