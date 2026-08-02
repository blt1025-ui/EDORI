/**
 * Gauge
 *
 * Displays the current EDORI score together with
 * the trigger-adjusted final operational state.
 *
 * This component does not calculate EDORI,
 * evaluate triggers, or modify application state.
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


/**
 * Render the EDORI gauge.
 */
export function Gauge():string {

    return `

        <section class="gauge-container">

            <div class="panel-header">

                <div>

                    <h3>
                        EDORI Score
                    </h3>

                    <p class="panel-description">
                        Current operational readiness score
                    </p>

                </div>

            </div>


            <div
                id="gaugeContent"
                class="gauge-content"
                aria-live="polite"
            >

                ${createAwaitingAssessmentState()}

            </div>

        </section>

    `;

}


/**
 * Initialize the gauge.
 */
export function initializeGauge():void {

    updateGauge();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateGauge

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateGauge

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateGauge

    );

}


/**
 * Refresh the gauge from authoritative services.
 */
function updateGauge():void {

    const container = document.getElementById(

        "gaugeContent"

    );


    if(!container){

        return;

    }


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        container.innerHTML =

            createRecalculationRequiredState();


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

            createGaugeMarkup(

                operationalAssessment.scoreResult.score,

                operationalAssessment
                    .baseOperationalState
                    .title,

                operationalAssessment
                    .finalOperationalState
                    .title,

                operationalAssessment
                    .finalOperationalState
                    .color,

                operationalAssessment
                    .activeTriggers
                    .length

            );

    }
    catch(error){

        console.error(

            "Unable to update the EDORI gauge:",

            error

        );


        container.innerHTML =

            createGaugeMarkup(

                result.score,

                result.operationalState.title,

                result.operationalState.title,

                result.operationalState.color,

                0

            );

    }

}


/**
 * Create the completed gauge.
 */
function createGaugeMarkup(

    score:number,

    baseStateTitle:string,

    finalStateTitle:string,

    stateColor:string,

    activeTriggerCount:number

):string {

    const safeScore = Math.min(

        100,

        Math.max(

            0,

            Math.round(

                score

            )

        )

    );


    const rotation =

        -90

        +

        safeScore * 1.8;


    const stateWasEscalated =

        baseStateTitle

        !==

        finalStateTitle;


    const triggerText = activeTriggerCount === 1

        ? "1 active trigger"

        : `${activeTriggerCount} active triggers`;


    return `

        <div
            class="gauge-visual"
            style="
                --gauge-score:${safeScore};
                --gauge-color:${escapeAttribute(stateColor)};
                --gauge-rotation:${rotation}deg;
            "
        >

            <div class="gauge-arc">

                <div class="gauge-needle">
                </div>

                <div class="gauge-center">
                </div>

            </div>


            <div class="gauge-score-display">

                <strong>

                    ${safeScore}

                </strong>

                <span>
                    out of 100
                </span>

            </div>

        </div>


        <div class="gauge-status-summary">

            <div class="gauge-final-state">

                <span>
                    Final Operational State
                </span>

                <strong>

                    ${escapeHtml(finalStateTitle)}

                </strong>

            </div>


            <div class="gauge-context-grid">

                <div>

                    <span>
                        Score-Derived State
                    </span>

                    <strong>

                        ${escapeHtml(baseStateTitle)}

                    </strong>

                </div>


                <div>

                    <span>
                        Operational Triggers
                    </span>

                    <strong>

                        ${escapeHtml(triggerText)}

                    </strong>

                </div>

            </div>


            ${stateWasEscalated

                ? `

                    <div class="gauge-escalation-message">

                        Operational triggers elevated the final state above the score-derived state.

                    </div>

                `

                : ""

            }

        </div>

    `;

}


/**
 * Create the initial gauge state.
 */
function createAwaitingAssessmentState():string {

    return `

        <div class="gauge-empty-state">

            <strong>
                Awaiting assessment
            </strong>

            <p>
                Calculate EDORI to display the current readiness score.
            </p>

        </div>

    `;

}


/**
 * Create the recalculation-required state.
 */
function createRecalculationRequiredState():string {

    return `

        <div class="gauge-empty-state warning">

            <strong>
                Recalculation required
            </strong>

            <p>
                Submit the current assessment to update the EDORI score and operational state.
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
 * Escape text inserted into an HTML attribute.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}