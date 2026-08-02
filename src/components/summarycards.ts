/**
 * SummaryCards
 *
 * Displays concise operational metrics from the
 * authoritative EDORI OperationalAssessment.
 *
 * This component does not:
 *
 * - Calculate EDORI
 * - Evaluate operational triggers
 * - Modify application state
 * - Save results or snapshots
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


/**
 * Render the summary-card region.
 */
export function SummaryCards():string {

    return `

        <section
            id="summaryCards"
            class="summary-cards"
            aria-live="polite"
        >

            ${createAwaitingAssessmentCards()}

        </section>

    `;

}


/**
 * Initialize summary-card behavior.
 */
export function initializeSummaryCards():void {

    updateSummaryCards();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateSummaryCards

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateSummaryCards

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateSummaryCards

    );

}


/**
 * Refresh summary cards from authoritative
 * application services.
 */
function updateSummaryCards():void {

    const container = document.getElementById(

        "summaryCards"

    );


    if(!container){

        return;

    }


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        container.innerHTML =

            createRecalculationRequiredCards(

                invalidationReason

            );


        return;

    }


    if(!hasCommittedAssessment()){

        container.innerHTML =

            createAwaitingAssessmentCards();


        return;

    }


    const result = getLatestResult();


    if(!result){

        container.innerHTML =

            createAwaitingAssessmentCards();


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

            createCompletedSummaryCards(

                operationalAssessment

            );

    }
    catch(error){

        console.error(

            "Unable to update summary cards:",

            error

        );


        container.innerHTML = `

            <article
                class="
                    summary-card
                    summary-card-wide
                    summary-card-error
                "
            >

                <span class="summary-card-label">
                    Summary unavailable
                </span>

                <strong class="summary-card-value">
                    Error
                </strong>

                <p class="summary-card-description">
                    Review the browser console for additional details.
                </p>

            </article>

        `;

    }

}


/**
 * Create completed summary cards.
 */
function createCompletedSummaryCards(

    operationalAssessment:OperationalAssessment

):string {

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


    const finalState =

        operationalAssessment.finalOperationalState;


    const baseState =

        operationalAssessment.baseOperationalState;


    const activeTriggerCount =

        operationalAssessment.activeTriggers.length;


    const approachingTriggerCount =

        operationalAssessment.triggerResults.filter(

            triggerResult =>

                triggerResult.approaching

                &&

                !triggerResult.active

        ).length;


    const nextReassessment =

        determineNextReassessment(

            operationalAssessment

        );


    const levelWasEscalated =

        finalState.title

        !==

        baseState.title;


    return `

        ${createSummaryCard({

            label:
                "EDORI Score",

            value:
                String(score),

            description:
                "Current numerical operational readiness score.",

            className:
                "summary-card-score"

        })}


        ${createSummaryCard({

            label:
                "Final Level",

            value:
                `${finalState.icon} ${finalState.title}`,

            description:
                levelWasEscalated

                    ? `Triggers elevated the level from ${baseState.title}.`

                    : `Score-derived level: ${baseState.title}.`,

            className:
                "summary-card-level",

            accentColor:
                finalState.color

        })}


        ${createSummaryCard({

            label:
                "Operational Trend",

            value:
                operationalAssessment.riskDirection,

            description:
                createTrendDescription(

                    operationalAssessment.riskDirection

                ),

            className:
                createTrendClassName(

                    operationalAssessment.riskDirection

                )

        })}


        ${createSummaryCard({

            label:
                "Active Triggers",

            value:
                String(activeTriggerCount),

            description:
                createTriggerDescription(

                    activeTriggerCount,

                    approachingTriggerCount

                ),

            className:
                activeTriggerCount > 0

                    ? "summary-card-trigger-active"

                    : "summary-card-trigger-clear"

        })}


        ${createSummaryCard({

            label:
                "Confidence",

            value:
                operationalAssessment.confidence,

            description:
                createConfidenceDescription(

                    operationalAssessment.confidence

                ),

            className:
                createConfidenceClassName(

                    operationalAssessment.confidence

                )

        })}


        ${createSummaryCard({

            label:
                "Next Reassessment",

            value:
                nextReassessment === null

                    ? "Routine"

                    : `${nextReassessment} min`,

            description:
                nextReassessment === null

                    ? "Continue the usual local reassessment schedule."

                    : "Use the shortest interval recommended by active triggers.",

            className:
                nextReassessment !== null

                    &&

                    nextReassessment <= 30

                        ? "summary-card-reassessment-urgent"

                        : "summary-card-reassessment-routine"

        })}

    `;

}


/**
 * Create one summary card.
 */
function createSummaryCard(

    options:{

        label:string;

        value:string;

        description:string;

        className:string;

        accentColor?:string;

    }

):string {

    const styleAttribute = options.accentColor

        ? `style="--summary-accent:${escapeAttribute(
            options.accentColor
        )};"`

        : "";


    return `

        <article
            class="
                summary-card
                ${escapeAttribute(
                    options.className
                )}
            "
            ${styleAttribute}
        >

            <span class="summary-card-label">

                ${escapeHtml(
                    options.label
                )}

            </span>


            <strong class="summary-card-value">

                ${escapeHtml(
                    options.value
                )}

            </strong>


            <p class="summary-card-description">

                ${escapeHtml(
                    options.description
                )}

            </p>

        </article>

    `;

}


/**
 * Determine the shortest current reassessment
 * interval from triggers and recommendations.
 */
function determineNextReassessment(

    operationalAssessment:OperationalAssessment

):number | null {

    const intervals:number[] = [];


    operationalAssessment.activeTriggers.forEach(

        triggerResult => {

            const interval =

                triggerResult
                    .trigger
                    .reassessmentMinutes;


            if(

                interval !== null

                &&

                Number.isFinite(interval)

                &&

                interval > 0

            ){

                intervals.push(

                    interval

                );

            }

        }

    );


    operationalAssessment.recommendations.forEach(

        recommendation => {

            const interval =

                recommendation.reassessmentMinutes;


            if(

                interval !== null

                &&

                Number.isFinite(interval)

                &&

                interval > 0

            ){

                intervals.push(

                    interval

                );

            }

        }

    );


    if(intervals.length === 0){

        return null;

    }


    return Math.min(

        ...intervals

    );

}


/**
 * Describe trigger counts.
 */
function createTriggerDescription(

    activeTriggerCount:number,

    approachingTriggerCount:number

):string {

    if(

        activeTriggerCount === 0

        &&

        approachingTriggerCount === 0

    ){

        return "No active or approaching operational triggers.";

    }


    if(activeTriggerCount === 0){

        return approachingTriggerCount === 1

            ? "One operational trigger is approaching activation."

            : `${approachingTriggerCount} operational triggers are approaching activation.`;

    }


    if(approachingTriggerCount === 0){

        return activeTriggerCount === 1

            ? "One operational trigger is currently active."

            : `${activeTriggerCount} operational triggers are currently active.`;

    }


    return `${activeTriggerCount} active and ${approachingTriggerCount} approaching triggers.`;

}


/**
 * Describe operational trend.
 */
function createTrendDescription(

    riskDirection:
        OperationalAssessment["riskDirection"]

):string {

    switch(riskDirection){

        case "Improving":

            return "The latest EDORI score decreased meaningfully.";


        case "Stable":

            return "The latest score shows no meaningful deterioration.";


        case "Increasing":

            return "The latest EDORI score increased.";


        case "Rapidly Worsening":

            return "The latest EDORI score increased rapidly.";


        case "Insufficient Data":

            return "Additional saved assessments are required for trend analysis.";

    }

}


/**
 * Describe assessment confidence.
 */
function createConfidenceDescription(

    confidence:
        OperationalAssessment["confidence"]

):string {

    switch(confidence){

        case "High":

            return "Historical expectations and sufficient trend history are available.";


        case "Moderate":

            return "Historical expectations and limited trend history are available.";


        case "Low":

            return "The assessment has limited supporting trend information.";


        case "Insufficient Data":

            return "The available data are insufficient to assess confidence.";

    }

}


/**
 * Create a CSS class for trend direction.
 */
function createTrendClassName(

    riskDirection:
        OperationalAssessment["riskDirection"]

):string {

    switch(riskDirection){

        case "Improving":

            return "summary-card-trend-improving";


        case "Increasing":

            return "summary-card-trend-increasing";


        case "Rapidly Worsening":

            return "summary-card-trend-critical";


        case "Stable":

            return "summary-card-trend-stable";


        case "Insufficient Data":

            return "summary-card-trend-unknown";

    }

}


/**
 * Create a CSS class for confidence.
 */
function createConfidenceClassName(

    confidence:
        OperationalAssessment["confidence"]

):string {

    return `summary-card-confidence-${confidence

        .toLowerCase()

        .replace(

            /[^a-z0-9]+/g,

            "-"

        )}`;

}


/**
 * Create the initial card set.
 */
function createAwaitingAssessmentCards():string {

    return `

        ${createPlaceholderCard(

            "EDORI Score",

            "--",

            "Awaiting calculation."

        )}


        ${createPlaceholderCard(

            "Final Level",

            "--",

            "Awaiting calculation."

        )}


        ${createPlaceholderCard(

            "Operational Trend",

            "--",

            "Additional assessments are required."

        )}


        ${createPlaceholderCard(

            "Active Triggers",

            "0",

            "No assessment is available."

        )}


        ${createPlaceholderCard(

            "Confidence",

            "--",

            "Awaiting assessment data."

        )}


        ${createPlaceholderCard(

            "Next Reassessment",

            "--",

            "Awaiting assessment."

        )}

    `;

}


/**
 * Create cards shown when the result is invalid.
 */
function createRecalculationRequiredCards(

    reason:string

):string {

    return `

        <article
            class="
                summary-card
                summary-card-wide
                summary-card-recalculation
            "
        >

            <span class="summary-card-label">
                Recalculation Required
            </span>

            <strong class="summary-card-value">
                Update needed
            </strong>

            <p class="summary-card-description">

                ${escapeHtml(reason)}

            </p>

        </article>

    `;

}


/**
 * Create one placeholder card.
 */
function createPlaceholderCard(

    label:string,

    value:string,

    description:string

):string {

    return `

        <article class="summary-card summary-card-placeholder">

            <span class="summary-card-label">

                ${escapeHtml(label)}

            </span>


            <strong class="summary-card-value">

                ${escapeHtml(value)}

            </strong>


            <p class="summary-card-description">

                ${escapeHtml(description)}

            </p>

        </article>

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