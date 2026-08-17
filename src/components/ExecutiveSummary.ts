/**
 * ExecutiveSummary
 *
 * Provides a concise operational briefing from the
 * authoritative EDORI OperationalAssessment.
 *
 * This component does not:
 *
 * - Calculate EDORI
 * - Evaluate triggers
 * - Generate recommendations
 * - Modify application state
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    subscribe

}

from "../services/EventService";


import {

    createOperationalAssessment

}

from "../services/OperationalAssessmentService";


import {

    getLatestResult,

    getResultInvalidationReason

}

from "../services/ResultService";


import {

    getSnapshots

}

from "../services/SnapshotService";


import {

    getState,

    hasCommittedAssessment

}

from "../services/StateService";





import type {

    OperationalAssessment

}

from "../types/OperationalAssessment";


import type {

    OperationalRecommendation

}

from "../types/OperationalRecommendation";


import type {

    OperationalTriggerResult

}

from "../types/OperationalTriggerResult";


/**
 * Render the Executive Summary panel.
 */
export function ExecutiveSummary():string {

    return `

        <section class="executive-summary-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Executive Summary
                    </h3>

                    <p class="panel-description">
                        Current operational status, primary cause, and most urgent action
                    </p>

                </div>

            </div>


            <div
                id="executiveSummaryContent"
                class="executive-summary-content"
                aria-live="polite"
            >

                ${createAwaitingAssessmentState()}

            </div>

        </section>

    `;

}


/**
 * Initialize the Executive Summary panel.
 */
export function initializeExecutiveSummary():void {

    updateExecutiveSummary();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateExecutiveSummary

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateExecutiveSummary

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateExecutiveSummary

    );

}


/**
 * Refresh the summary from authoritative
 * application services.
 */
function updateExecutiveSummary():void {

    const container = document.getElementById(

        "executiveSummaryContent"

    );


    if(!container){

        return;

    }


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        container.innerHTML =

            createRecalculationRequiredState(

                invalidationReason

            );


        return;

    }


    if(!hasCommittedAssessment()){

        container.innerHTML =

            createAwaitingAssessmentState();


        return;

    }


    const result = getLatestResult();


    if(!result){

        container.innerHTML =

            createAwaitingAssessmentState();


        return;

    }


    try {

        const operationalAssessment =

            createOperationalAssessment({

                assessment:
                    getState(),

                result,

                snapshots:
                    getSnapshots(),

                evaluatedAt:
                    new Date()

            });


        container.innerHTML =

            createExecutiveSummaryMarkup(

                operationalAssessment

            );

    }
    catch(error){

        console.error(

            "Unable to create the executive summary:",

            error

        );


        container.innerHTML = `

            <div class="executive-summary-empty error">

                <strong>
                    Executive summary unavailable
                </strong>

                <p>
                    Review the browser console for additional details.
                </p>

            </div>

        `;

    }

}


/**
 * Create the completed summary.
 */
function createExecutiveSummaryMarkup(

    operationalAssessment:OperationalAssessment

):string {

    const primaryCause = determinePrimaryCause(

        operationalAssessment

    );


    const mostUrgentAction =

        operationalAssessment
            .recommendations
            .slice()
            .sort(

                compareRecommendationPriority

            )[0];


    const finalState =

        operationalAssessment.finalOperationalState;


    const score = Math.min(

        100,

        Math.max(

            0,

            Math.round(

                operationalAssessment
                    .scoreResult
                    .score

            )

        )

    );


    return `

        <div class="executive-summary-refined executive-summary-simple">

            <div class="executive-summary-status-grid">

                <div
                    class="executive-level-card"
                    style="
                        --executive-state-color:
                        ${escapeAttribute(
                            finalState.color
                        )};
                    "
                >

                    <span class="executive-summary-label">
                        Current Level
                    </span>


                    <div class="executive-level-value">

                        <span
                            class="executive-level-icon"
                            aria-hidden="true"
                        >

                            ${escapeHtml(
                                finalState.icon
                            )}

                        </span>


                        <strong>

                            ${escapeHtml(
                                finalState.title
                            )}

                        </strong>

                    </div>


                    <p>

                        ${escapeHtml(
                            finalState.recommendation
                        )}

                    </p>

                </div>


                <div class="executive-score-card">

                    <span class="executive-summary-label">
                        HRI Score
                    </span>


                    <strong class="executive-score-value">

                        ${score}

                    </strong>


                    <span class="executive-score-range">
                        out of 100
                    </span>

                </div>


                <div class="executive-status-card">

                    <span class="executive-summary-label">
                        Trend
                    </span>


                    <strong>

                        ${escapeHtml(
                            operationalAssessment.riskDirection
                        )}

                    </strong>


                    <span class="executive-status-context">
                        Current trajectory
                    </span>

                </div>


                <div class="executive-status-card">

                    <span class="executive-summary-label">
                        Confidence
                    </span>


                    <strong>

                        ${escapeHtml(
                            operationalAssessment.confidence
                        )}

                    </strong>


                    <span class="executive-status-context">
                        Assessment completeness
                    </span>

                </div>

            </div>


            <div class="executive-summary-simple-focus-grid">

                <div class="executive-cause-card">

                    <span class="executive-summary-label">
                        Primary Cause
                    </span>


                    <strong>

                        ${escapeHtml(
                            primaryCause.title
                        )}

                    </strong>


                    <p>

                        ${escapeHtml(
                            primaryCause.description
                        )}

                    </p>

                </div>


                <div class="executive-action-card">

                    <span class="executive-summary-label">
                        Most Urgent Action
                    </span>


                    ${mostUrgentAction

                        ? `

                            <div class="executive-action-title-row">

                                <span
                                    class="
                                        executive-priority-badge
                                        executive-priority-badge-${mostUrgentAction
                                            .priority
                                            .toLowerCase()}
                                    "
                                >

                                    ${escapeHtml(
                                        mostUrgentAction.priority
                                    )}

                                </span>


                                <strong>

                                    ${escapeHtml(
                                        mostUrgentAction.title
                                    )}

                                </strong>

                            </div>


                            <p>

                                ${escapeHtml(
                                    mostUrgentAction.description
                                )}

                            </p>


                            ${mostUrgentAction.responsibleGroup

                                ? `

                                    <span class="executive-action-owner">

                                        ${escapeHtml(
                                            mostUrgentAction
                                                .responsibleGroup
                                        )}

                                    </span>

                                `

                                : ""

                            }

                        `

                        : `

                            <strong class="executive-action-routine">
                                Continue routine operations
                            </strong>


                            <p>
                                No trigger-based operational intervention is currently required.
                            </p>

                        `

                    }

                </div>

            </div>

        </div>

    `;

}


/**
 * Determine the primary operational cause.
 *
 * Priority:
 *
 * 1. Highest-priority active trigger
 * 2. Highest-severity EDORI driver
 * 3. Highest-scoring pillar
 */
function determinePrimaryCause(

    operationalAssessment:OperationalAssessment

):{

    title:string;

    description:string;

} {

    const primaryTrigger =

        operationalAssessment.activeTriggers

            .slice()

            .sort(

                compareTriggerPriority

            )[0];


    if(primaryTrigger){

        return {

            title:
                primaryTrigger.trigger.title,

            description:
                primaryTrigger.activationReason

        };

    }


    const primaryDriver =

        operationalAssessment.primaryDrivers

            .slice()

            .sort(

                (

                    first,

                    second

                ) =>

                    second.severity

                    -

                    first.severity

            )[0];


    if(primaryDriver){

        return {

            title:
                primaryDriver.title,

            description:
                primaryDriver.description

        };

    }


    const primaryPillar =

        operationalAssessment.pillarDetails

            .filter(

                pillar =>

                    pillar.score !== null

            )

            .slice()

            .sort(

                (

                    first,

                    second

                ) =>

                    (

                        second.score

                        ?? 0

                    )

                    -

                    (

                        first.score

                        ?? 0

                    )

            )[0];


    if(primaryPillar){

        return {

            title:
                primaryPillar.title,

            description:
                primaryPillar.summary

        };

    }


    return {

        title:
            "No significant operational cause",

        description:
            "Current conditions do not show a dominant operational driver."

    };

}


/**
 * Sort triggers from highest to lowest priority.
 */
function compareTriggerPriority(

    first:OperationalTriggerResult,

    second:OperationalTriggerResult

):number {

    const priorityDifference =

        getTriggerPriorityRank(

            second.trigger.priority

        )

        -

        getTriggerPriorityRank(

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
function getTriggerPriorityRank(

    priority:
        OperationalTriggerResult["trigger"]["priority"]

):number {

    const ranks:Record<

        OperationalTriggerResult["trigger"]["priority"],

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
 * Sort recommendations from highest to lowest
 * priority.
 */
function compareRecommendationPriority(

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
 * Create the initial state.
 */
function createAwaitingAssessmentState():string {

    return `

        <div class="executive-summary-empty">

            <strong>
                Awaiting assessment
            </strong>

            <p>
                Calculate Hospital Readiness to generate the executive operational summary.
            </p>

        </div>

    `;

}


/**
 * Create the recalculation-required state.
 */
function createRecalculationRequiredState(

    reason:string

):string {

    return `

        <div class="executive-summary-empty warning">

            <strong>
                Recalculation required
            </strong>

            <p>

                ${escapeHtml(reason)}

            </p>

        </div>

    `;

}


/**
 * Escape text inserted into HTML.
 */
function escapeHtml(

    value:string

):string {

    return value

        .replaceAll(

            "&",

            "&amp;"

        )

        .replaceAll(

            "<",

            "&lt;"

        )

        .replaceAll(

            ">",

            "&gt;"

        )

        .replaceAll(

            "\"",

            "&quot;"

        )

        .replaceAll(

            "'",

            "&#039;"

        );

}


/**
 * Escape text inserted into HTML attributes.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}