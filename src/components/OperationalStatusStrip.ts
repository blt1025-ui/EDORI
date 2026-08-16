/**
 * OperationalStatusStrip
 *
 * Compact Operational Detail status summary.
 *
 * Displays:
 *
 * - Current HRI score
 * - Current Alpha through Echo level
 * - Risk direction
 * - Assessment confidence
 * - Active trigger count
 * - Approaching trigger count
 *
 * The component reads only from authoritative EDORI
 * services and does not modify application state.
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
 * Render the status strip shell.
 */
export function OperationalStatusStrip():string {

    return `

        <section
            class="operational-status-strip"
            aria-label="Current Hospital Readiness summary"
        >

            <div
                id="operationalStatusStripContent"
                class="operational-status-strip-content"
                aria-live="polite"
            >

                ${createAwaitingAssessmentMarkup()}

            </div>

        </section>

    `;

}


/**
 * Initialize status-strip refresh behavior.
 */
export function initializeOperationalStatusStrip():void {

    updateOperationalStatusStrip();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateOperationalStatusStrip

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateOperationalStatusStrip

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateOperationalStatusStrip

    );

}


/**
 * Refresh from authoritative application services.
 */
function updateOperationalStatusStrip():void {

    const container =

        document.getElementById(

            "operationalStatusStripContent"

        );


    if(!container){

        return;

    }


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        container.innerHTML =

            createRecalculationRequiredMarkup(

                invalidationReason

            );


        return;

    }


    if(!hasCommittedAssessment()){

        container.innerHTML =

            createAwaitingAssessmentMarkup();


        return;

    }


    const result =

        getLatestResult();


    if(!result){

        container.innerHTML =

            createUnavailableMarkup();


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

            createStatusMarkup(

                operationalAssessment

            );

    }
    catch(error){

        console.error(

            "Unable to update Operational Status Strip:",

            error

        );


        container.innerHTML =

            createUnavailableMarkup();

    }

}


/**
 * Create completed status markup.
 */
function createStatusMarkup(

    operationalAssessment:OperationalAssessment

):string {

    const approachingCount =

        operationalAssessment.triggerResults.filter(

            triggerResult =>

                triggerResult.approaching

                &&

                !triggerResult.active

        ).length;


    const activeCount =

        operationalAssessment.activeTriggers.length;


    const stateColor =

        operationalAssessment
            .finalOperationalState
            .color;


    return `

        <div
            class="operational-status-strip-state"
            style="
                --operational-status-color:
                ${escapeAttribute(
                    stateColor
                )};
            "
        >

            <span class="operational-status-strip-kicker">
                Current HRI
            </span>


            <strong class="operational-status-strip-score">

                ${formatScore(
                    operationalAssessment
                        .scoreResult
                        .score
                )}

            </strong>


            <span class="operational-status-strip-level">

                ${escapeHtml(
                    operationalAssessment
                        .finalOperationalState
                        .title
                )}

            </span>

        </div>


        ${createMetric(

            "Risk Direction",

            operationalAssessment.riskDirection

        )}


        ${createMetric(

            "Confidence",

            operationalAssessment.confidence

        )}


        ${createMetric(

            "Active Triggers",

            String(
                activeCount
            ),

            activeCount > 0

                ? "operational-status-strip-metric-alert"

                : ""

        )}


        ${createMetric(

            "Approaching",

            String(
                approachingCount
            ),

            approachingCount > 0

                ? "operational-status-strip-metric-watch"

                : ""

        )}


        <div class="operational-status-strip-time">

            <span>
                Assessment
            </span>


            <strong>

                ${formatAssessmentTime(

                    operationalAssessment
                        .assessment
                        .assessmentTime

                )}

            </strong>

        </div>

    `;

}


/**
 * Create one compact metric.
 */
function createMetric(

    label:string,

    value:string,

    className:string = ""

):string {

    return `

        <div
            class="
                operational-status-strip-metric
                ${className}
            "
        >

            <span>

                ${escapeHtml(
                    label
                )}

            </span>


            <strong>

                ${escapeHtml(
                    value
                )}

            </strong>

        </div>

    `;

}


/**
 * Awaiting-assessment state.
 */
function createAwaitingAssessmentMarkup():string {

    return `

        <div class="operational-status-strip-empty">

            <strong>
                No current Hospital Readiness assessment
            </strong>


            <span>
                Complete and calculate an assessment to populate this operational summary.
            </span>

        </div>

    `;

}


/**
 * Recalculation-required state.
 */
function createRecalculationRequiredMarkup(

    reason:string

):string {

    return `

        <div class="
            operational-status-strip-empty
            operational-status-strip-empty-warning
        ">

            <strong>
                Recalculation Required
            </strong>


            <span>

                ${escapeHtml(
                    reason
                )}

            </span>

        </div>

    `;

}


/**
 * Unavailable state.
 */
function createUnavailableMarkup():string {

    return `

        <div class="
            operational-status-strip-empty
            operational-status-strip-empty-error
        ">

            <strong>
                Hospital Readiness summary unavailable
            </strong>


            <span>
                Recalculate the current assessment or review the browser console.
            </span>

        </div>

    `;

}


/**
 * Format one HRI score.
 */
function formatScore(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    return value.toFixed(

        1

    );

}


/**
 * Format assessment timestamp compactly.
 */
function formatAssessmentTime(

    value:Date | string

):string {

    const date = new Date(

        value

    );


    if(

        Number.isNaN(

            date.getTime()

        )

    ){

        return "Unavailable";

    }


    return date.toLocaleString(

        undefined,

        {

            month:
                "short",

            day:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"

        }

    );

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
 * Escape text inserted into an HTML attribute.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}