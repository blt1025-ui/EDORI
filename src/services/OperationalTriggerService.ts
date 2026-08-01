/**
 * OperationalTriggerService
 *
 * Evaluates configurable EDORI operational
 * triggers against a completed assessment,
 * current result, and persistent score history.
 *
 * This service does not:
 *
 * - Modify application state
 * - Save results
 * - Save snapshots
 * - Emit events
 * - Change the EDORI score
 */

import {

    HOSPITAL

}

from "../config/constants";


import {

    OPERATIONAL_TRIGGERS

}

from "../config/operationalTriggers";


import type {

    OperationalTrigger,

    OperationalTriggerCondition,

    OperationalTriggerMetric,

    OperationalTriggerOperator

}

from "../types/OperationalTrigger";


import type {

    OperationalTriggerContext

}

from "../types/OperationalTriggerContext";


import type {

    OperationalTriggerConditionResult,

    OperationalTriggerResult

}

from "../types/OperationalTriggerResult";


/**
 * A trigger is considered approaching when its
 * overall proximity reaches this percentage.
 */
const APPROACHING_TRIGGER_PERCENT = 85;


/**
 * Evaluate every configured trigger.
 */
export function evaluateOperationalTriggers(

    context:OperationalTriggerContext,

    triggers:OperationalTrigger[] =

        OPERATIONAL_TRIGGERS

):OperationalTriggerResult[] {

    const safeEvaluationTime =

        normalizeEvaluationTime(

            context.evaluatedAt

        );


    return triggers

        .filter(

            trigger => trigger.enabled

        )

        .map(

            trigger => evaluateSingleTrigger(

                trigger,

                {

                    ...context,

                    evaluatedAt:
                        safeEvaluationTime

                }

            )

        )

        .sort(

            compareTriggerResults

        );

}


/**
 * Return active trigger results only.
 */
export function getActiveOperationalTriggers(

    context:OperationalTriggerContext,

    triggers?:OperationalTrigger[]

):OperationalTriggerResult[] {

    return evaluateOperationalTriggers(

        context,

        triggers

    ).filter(

        result => result.active

    );

}


/**
 * Return approaching but inactive triggers.
 */
export function getApproachingOperationalTriggers(

    context:OperationalTriggerContext,

    triggers?:OperationalTrigger[]

):OperationalTriggerResult[] {

    return evaluateOperationalTriggers(

        context,

        triggers

    ).filter(

        result =>

            result.approaching

            &&

            !result.active

    );

}


/**
 * Evaluate one configured trigger.
 */
export function evaluateSingleTrigger(

    trigger:OperationalTrigger,

    context:OperationalTriggerContext

):OperationalTriggerResult {

    const conditionResults = trigger.conditions.map(

        condition => evaluateCondition(

            condition,

            context

        )

    );


    const active =

        conditionResults.length > 0

        &&

        conditionResults.every(

            result => result.passed

        );


    const proximityPercent =

        calculateOverallProximity(

            conditionResults

        );


    const approaching =

        !active

        &&

        conditionResults.length > 0

        &&

        proximityPercent

        >=

        APPROACHING_TRIGGER_PERCENT;


    return {

        trigger:cloneTrigger(

            trigger

        ),

        active,

        approaching,

        proximityPercent,

        conditionResults,

        activationReason:
            createTriggerReason(

                trigger,

                conditionResults,

                active,

                approaching

            ),

        evaluatedAt:new Date(

            context.evaluatedAt

        )

    };

}


/**
 * Evaluate one trigger condition.
 */
function evaluateCondition(

    condition:OperationalTriggerCondition,

    context:OperationalTriggerContext

):OperationalTriggerConditionResult {

    const actualValue = getMetricValue(

        condition.metric,

        context

    );


    const passed = compareValue(

        actualValue,

        condition.operator,

        condition.threshold

    );


    const distanceFromThreshold =

        calculateDistanceFromThreshold(

            actualValue,

            condition.operator,

            condition.threshold,

            passed

        );


    const proximityPercent =

        calculateConditionProximity(

            actualValue,

            condition.operator,

            condition.threshold,

            passed

        );


    return {

        metric:
            condition.metric,

        actualValue:
            roundValue(

                actualValue

            ),

        threshold:
            condition.threshold,

        passed,

        distanceFromThreshold:
            roundValue(

                distanceFromThreshold

            ),

        proximityPercent:
            roundValue(

                proximityPercent

            ),

        explanation:
            createConditionExplanation(

                condition.metric,

                actualValue,

                condition.operator,

                condition.threshold,

                passed

            )

    };

}


/**
 * Return one derived metric.
 */
function getMetricValue(

    metric:OperationalTriggerMetric,

    context:OperationalTriggerContext

):number {

    const assessment =

        context.assessment;


    switch(metric){

        case "totalEDVolume":

            return assessment.totalEDVolume;


        case "edOccupancyPercent":

            return calculatePercentage(

                assessment.totalEDVolume,

                HOSPITAL.ED_BEDS

            );


        case "volumeAboveExpected":

            return assessment.totalEDVolume

                -

                assessment.expectedVolume;


        case "boardedPatients":

            return assessment.boardedPatients;


        case "boardingAboveExpected":

            return assessment.boardedPatients

                -

                assessment.expectedBoarders;


        case "boardingPercentOfVolume":

            return calculatePercentage(

                assessment.boardedPatients,

                assessment.totalEDVolume

            );


        case "occupiedMedicalBeds":

            return assessment.occupiedMedicalBeds;


        case "hospitalOccupancyPercent":

            return calculatePercentage(

                assessment.occupiedMedicalBeds,

                HOSPITAL.MEDICAL_BEDS

            );


        case "expectedNetFlow":

            return assessment.expectedArrivals

                -

                assessment.expectedDepartures;


        case "highAcuityCount":

            return assessment.esi1

                +

                assessment.esi2;


        case "highAcuityPercent":

            return calculatePercentage(

                assessment.esi1

                +

                assessment.esi2,

                assessment.totalEDVolume

            );


        case "edoriScore":

            return context.result.score;


        case "consecutiveScoreIncreases":

            return calculateConsecutiveScoreIncreases(

                context

            );


        case "scoreChange":

            return calculateLatestScoreChange(

                context

            );

    }

}


/**
 * Compare the actual value with a threshold.
 */
function compareValue(

    actualValue:number,

    operator:OperationalTriggerOperator,

    threshold:number

):boolean {

    switch(operator){

        case "greaterThan":

            return actualValue > threshold;


        case "greaterThanOrEqual":

            return actualValue >= threshold;


        case "lessThan":

            return actualValue < threshold;


        case "lessThanOrEqual":

            return actualValue <= threshold;


        case "equal":

            return actualValue === threshold;

    }

}


/**
 * Calculate consecutive positive score changes.
 */
function calculateConsecutiveScoreIncreases(

    context:OperationalTriggerContext

):number {

    const scores = createChronologicalScoreSeries(

        context

    );


    if(scores.length < 2){

        return 0;

    }


    let consecutiveIncreases = 0;


    for(

        let index = scores.length - 1;

        index > 0;

        index -= 1

    ){

        if(

            scores[index]

            >

            scores[index - 1]

        ){

            consecutiveIncreases += 1;

            continue;

        }


        break;

    }


    return consecutiveIncreases;

}


/**
 * Calculate change from the previous score.
 */
function calculateLatestScoreChange(

    context:OperationalTriggerContext

):number {

    const scores = createChronologicalScoreSeries(

        context

    );


    if(scores.length < 2){

        return 0;

    }


    return scores[

        scores.length - 1

    ]

    -

    scores[

        scores.length - 2

    ];

}


/**
 * Create a chronological score list and avoid
 * duplicating the current result when its score
 * and timestamp already match the latest snapshot.
 */
function createChronologicalScoreSeries(

    context:OperationalTriggerContext

):number[] {

    const snapshots = context.snapshots

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


    const scores = snapshots.map(

        snapshot => snapshot.score

    );


    const latestSnapshot = snapshots[

        snapshots.length - 1

    ];


    const latestSnapshotTime = latestSnapshot

        ? new Date(

            latestSnapshot.timestamp

        ).getTime()

        : null;


    const currentResultTime = new Date(

        context.result.timestamp

    ).getTime();


    const currentAlreadyIncluded =

        latestSnapshot !== undefined

        &&

        latestSnapshot.score

        ===

        context.result.score

        &&

        latestSnapshotTime

        ===

        currentResultTime;


    if(!currentAlreadyIncluded){

        scores.push(

            context.result.score

        );

    }


    return scores;

}


/**
 * Calculate percentage safely.
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


    return numerator

        /

        denominator

        *

        100;

}


/**
 * Calculate condition distance from activation.
 */
function calculateDistanceFromThreshold(

    actualValue:number,

    operator:OperationalTriggerOperator,

    threshold:number,

    passed:boolean

):number {

    if(passed){

        return 0;

    }


    switch(operator){

        case "greaterThan":

        case "greaterThanOrEqual":

            return Math.max(

                0,

                threshold - actualValue

            );


        case "lessThan":

        case "lessThanOrEqual":

            return Math.max(

                0,

                actualValue - threshold

            );


        case "equal":

            return Math.abs(

                actualValue - threshold

            );

    }

}


/**
 * Calculate trigger-condition proximity.
 */
function calculateConditionProximity(

    actualValue:number,

    operator:OperationalTriggerOperator,

    threshold:number,

    passed:boolean

):number {

    if(passed){

        return 100;

    }


    if(threshold === 0){

        return actualValue === 0

            ? 100

            : 0;

    }


    switch(operator){

        case "greaterThan":

        case "greaterThanOrEqual":

            return clampPercent(

                actualValue

                /

                threshold

                *

                100

            );


        case "lessThan":

        case "lessThanOrEqual":

            if(actualValue <= 0){

                return 100;

            }


            return clampPercent(

                threshold

                /

                actualValue

                *

                100

            );


        case "equal":

            return clampPercent(

                100

                -

                (

                    Math.abs(

                        actualValue - threshold

                    )

                    /

                    Math.max(

                        1,

                        Math.abs(

                            threshold

                        )

                    )

                    *

                    100

                )

            );

    }

}


/**
 * Multi-condition triggers use the least-complete
 * condition as the overall proximity.
 */
function calculateOverallProximity(

    conditionResults:
        OperationalTriggerConditionResult[]

):number {

    if(conditionResults.length === 0){

        return 0;

    }


    return roundValue(

        Math.min(

            ...conditionResults.map(

                result =>

                    result.proximityPercent

            )

        )

    );

}


/**
 * Create a readable trigger result.
 */
function createTriggerReason(

    trigger:OperationalTrigger,

    results:OperationalTriggerConditionResult[],

    active:boolean,

    approaching:boolean

):string {

    const conditionText = results

        .map(

            result =>

                result.explanation

        )

        .join(" ");


    if(active){

        return `${trigger.title} is active. ${conditionText}`;

    }


    if(approaching){

        return `${trigger.title} is approaching activation at ${Math.round(calculateOverallProximity(results))}% proximity. ${conditionText}`;

    }


    return `${trigger.title} is not active. ${conditionText}`;

}


/**
 * Create one condition explanation.
 */
function createConditionExplanation(

    metric:OperationalTriggerMetric,

    actualValue:number,

    operator:OperationalTriggerOperator,

    threshold:number,

    passed:boolean

):string {

    const metricLabel = getMetricLabel(

        metric

    );


    const operatorLabel = getOperatorLabel(

        operator

    );


    return `${metricLabel} is ${formatValue(actualValue)}; the trigger requires ${operatorLabel} ${formatValue(threshold)}. Condition ${passed ? "met" : "not met"}.`;

}


/**
 * Return a user-facing metric label.
 */
function getMetricLabel(

    metric:OperationalTriggerMetric

):string {

    const labels:Record<

        OperationalTriggerMetric,

        string

    > = {

        totalEDVolume:
            "Total ED volume",

        edOccupancyPercent:
            "ED occupancy",

        volumeAboveExpected:
            "ED volume above expected",

        boardedPatients:
            "Boarding patients",

        boardingAboveExpected:
            "Boarding above expected",

        boardingPercentOfVolume:
            "Boarding percentage of ED census",

        occupiedMedicalBeds:
            "Occupied medical beds",

        hospitalOccupancyPercent:
            "Hospital medical-bed occupancy",

        expectedNetFlow:
            "Expected net flow",

        highAcuityCount:
            "ESI 1 and ESI 2 count",

        highAcuityPercent:
            "ESI 1 and ESI 2 percentage",

        edoriScore:
            "EDORI score",

        consecutiveScoreIncreases:
            "Consecutive EDORI increases",

        scoreChange:
            "EDORI score change"

    };


    return labels[metric];

}


/**
 * Return a readable comparison operator.
 */
function getOperatorLabel(

    operator:OperationalTriggerOperator

):string {

    const labels:Record<

        OperationalTriggerOperator,

        string

    > = {

        greaterThan:
            "greater than",

        greaterThanOrEqual:
            "at least",

        lessThan:
            "less than",

        lessThanOrEqual:
            "no more than",

        equal:
            "equal to"

    };


    return labels[operator];

}


/**
 * Sort active triggers first, then approaching,
 * then by priority and proximity.
 */
function compareTriggerResults(

    first:OperationalTriggerResult,

    second:OperationalTriggerResult

):number {

    if(first.active !== second.active){

        return first.active

            ? -1

            : 1;

    }


    if(first.approaching !== second.approaching){

        return first.approaching

            ? -1

            : 1;

    }


    const priorityDifference =

        getPriorityRank(

            second.trigger.priority

        )

        -

        getPriorityRank(

            first.trigger.priority

        );


    if(priorityDifference !== 0){

        return priorityDifference;

    }


    return second.proximityPercent

        -

        first.proximityPercent;

}


/**
 * Rank trigger priorities.
 */
function getPriorityRank(

    priority:OperationalTrigger["priority"]

):number {

    const ranks:Record<

        OperationalTrigger["priority"],

        number

    > = {

        Advisory:
            1,

        Moderate:
            2,

        High:
            3,

        Critical:
            4

    };


    return ranks[priority];

}


/**
 * Return a defensive trigger copy.
 */
function cloneTrigger(

    trigger:OperationalTrigger

):OperationalTrigger {

    return {

        ...trigger,

        conditions:trigger.conditions.map(

            condition => ({

                ...condition

            })

        ),

        interventionIds:[

            ...trigger.interventionIds

        ]

    };

}


/**
 * Normalize evaluation time.
 */
function normalizeEvaluationTime(

    value:Date

):Date {

    if(

        value instanceof Date

        &&

        !Number.isNaN(

            value.getTime()

        )

    ){

        return new Date(

            value

        );

    }


    return new Date();

}


/**
 * Clamp a percentage to 0–100.
 */
function clampPercent(

    value:number

):number {

    if(!Number.isFinite(value)){

        return 0;

    }


    return Math.min(

        100,

        Math.max(

            0,

            value

        )

    );

}


/**
 * Round a value to one decimal place.
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
 * Format a value for an explanation.
 */
function formatValue(

    value:number

):string {

    const rounded = roundValue(

        value

    );


    return Number.isInteger(

        rounded

    )

        ? String(

            rounded

        )

        : rounded.toFixed(

            1

        );

}