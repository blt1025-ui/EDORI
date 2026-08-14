/**
 * OperationalOverview
 *
 * Displays the Version 2 Hospital Readiness operational assessment.
 *
 * This component does not calculate Hospital Readiness or
 * modify application state.
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

    getLatestResult

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
 * Render the operational overview panel.
 */
export function OperationalOverview():string {

    return `

        <section class="operational-overview-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Operational Assessment
                    </h3>

                    <p class="panel-description">
                        Trigger-adjusted Hospital Readiness overview
                    </p>

                </div>

            </div>


            <div
                id="operationalOverviewContent"
                class="operational-overview-content"
                aria-live="polite"
            >

                ${createEmptyState()}

            </div>

        </section>

    `;

}


/**
 * Initialize the operational overview.
 */
export function initializeOperationalOverview():void {

    updateOperationalOverview();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateOperationalOverview

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateOperationalOverview

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateOperationalOverview

    );

}


/**
 * Rebuild the overview from the current
 * authoritative application data.
 */
function updateOperationalOverview():void {

    const container = document.getElementById(

        "operationalOverviewContent"

    );


    if(!container){

        return;

    }


    if(!hasCommittedAssessment()){

        container.innerHTML = createEmptyState();

        return;

    }


    const result = getLatestResult();


    if(!result){

        container.innerHTML = createUnavailableState();

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

            createOperationalAssessmentMarkup(

                operationalAssessment

            );

    }
    catch(error){

        console.error(

            "Unable to create operational overview:",

            error

        );


        container.innerHTML = `

            <div class="operational-overview-empty">

                <strong>
                    Operational assessment unavailable
                </strong>

                <p>
                    Review the browser console for additional details.
                </p>

            </div>

        `;

    }

}


/**
 * Create the completed overview.
 */
function createOperationalAssessmentMarkup(

    operationalAssessment:OperationalAssessment

):string {

    const activeTriggers =

        operationalAssessment.activeTriggers;


    const approachingTriggers =

        operationalAssessment.triggerResults.filter(

            triggerResult =>

                triggerResult.approaching

                &&

                !triggerResult.active

        );


    return `

        <div class="operational-state-summary">

            <div
                class="operational-final-state"
                style="
                    --operational-state-color:
                    ${escapeAttribute(
                        operationalAssessment
                            .finalOperationalState
                            .color
                    )};
                "
            >

                <span
                    class="operational-state-icon"
                    aria-hidden="true"
                >

                    ${escapeHtml(
                        operationalAssessment
                            .finalOperationalState
                            .icon
                    )}

                </span>


                <div>

                    <span class="operational-state-label">
                        Final Operational State
                    </span>

                    <strong class="operational-state-title">

                        ${escapeHtml(
                            operationalAssessment
                                .finalOperationalState
                                .title
                        )}

                    </strong>

                </div>

            </div>


            <div class="operational-base-state">

                <span>
                    Score-Derived State
                </span>

                <strong>

                    ${escapeHtml(
                        operationalAssessment
                            .baseOperationalState
                            .title
                    )}

                </strong>

            </div>

        </div>


        <div class="operational-assessment-metrics">

            ${createMetricCard(

                "Risk Direction",

                operationalAssessment.riskDirection

            )}


            ${createMetricCard(

                "Confidence",

                operationalAssessment.confidence

            )}


            ${createMetricCard(

                "Active Triggers",

                String(

                    activeTriggers.length

                )

            )}


            ${createMetricCard(

                "Approaching",

                String(

                    approachingTriggers.length

                )

            )}

        </div>


        <div class="operational-pillar-grid">

            ${createPillarCard(

                "ED Operational Pressure",

                operationalAssessment
                    .pillarScores
                    .edOperationalPressure,

                "35%"

            )}


            ${createPillarCard(

                "Acute-Care Capacity",

                operationalAssessment
                    .pillarScores
                    .acuteCareCapacity,

                "20%"

            )}


            ${createPillarCard(

                "Critical-Care Capacity",

                operationalAssessment
                    .pillarScores
                    .criticalCareCapacity,

                "15%"

            )}


            ${createPillarCard(

                "Hospital Inflow",

                operationalAssessment
                    .pillarScores
                    .hospitalInflow,

                "15%"

            )}


            ${createPillarCard(

                "Projected Capacity",

                operationalAssessment
                    .pillarScores
                    .projectedCapacity,

                "15%"

            )}

        </div>


        <div class="operational-momentum-section">

            ${createPillarCard(

                "Operational Momentum",

                operationalAssessment
                    .pillarScores
                    .operationalMomentum,

                "Trend — not weighted"

            )}

        </div>


        ${createTriggerSummary(

            activeTriggers,

            approachingTriggers

        )}

    `;

}


/**
 * Create one overview metric card.
 */
function createMetricCard(

    label:string,

    value:string

):string {

    return `

        <div class="operational-metric-card">

            <span>
                ${escapeHtml(label)}
            </span>

            <strong>
                ${escapeHtml(value)}
            </strong>

        </div>

    `;

}


/**
 * Create one pillar-score card.
 */
function createPillarCard(

    title:string,

    score:number | null,

    weightLabel:string

):string {

    const scoreText = score === null

        ? "--"

        : String(

            Math.round(score)

        );


    const progressValue = score === null

        ? 0

        : Math.min(

            100,

            Math.max(

                0,

                score

            )

        );


    return `

        <div class="operational-pillar-card">

            <div class="operational-pillar-header">

                <div>

                    <span>
                        ${escapeHtml(title)}
                    </span>

                    <small class="operational-pillar-weight">
                        ${escapeHtml(weightLabel)}
                    </small>

                </div>

                <strong>
                    ${scoreText}
                </strong>

            </div>


            <div
                class="operational-pillar-track"
                role="progressbar"
                aria-label="${escapeAttribute(title)}"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${Math.round(progressValue)}"
            >

                <div
                    class="operational-pillar-fill"
                    style="width:${progressValue}%;"
                >
                </div>

            </div>

        </div>

    `;

}


/**
 * Create active and approaching trigger summaries.
 */
function createTriggerSummary(

    activeTriggers:
        OperationalAssessment["activeTriggers"],

    approachingTriggers:
        OperationalAssessment["triggerResults"]

):string {

    if(

        activeTriggers.length === 0

        &&

        approachingTriggers.length === 0

    ){

        return `

            <div class="operational-trigger-empty">

                No active or approaching operational triggers.

            </div>

        `;

    }


    const activeMarkup = activeTriggers.length > 0

        ? `

            <div class="operational-trigger-group">

                <h4>
                    Active Triggers
                </h4>

                ${activeTriggers

                    .map(

                        triggerResult => `

                            <div class="operational-trigger-card active">

                                <strong>

                                    ${escapeHtml(
                                        triggerResult
                                            .trigger
                                            .title
                                    )}

                                </strong>

                                <span>

                                    ${escapeHtml(
                                        triggerResult
                                            .trigger
                                            .priority
                                    )}

                                </span>

                            </div>

                        `

                    )

                    .join("")}

            </div>

        `

        : "";


    const approachingMarkup =

        approachingTriggers.length > 0

            ? `

                <div class="operational-trigger-group">

                    <h4>
                        Approaching Triggers
                    </h4>

                    ${approachingTriggers

                        .map(

                            triggerResult => `

                                <div class="operational-trigger-card approaching">

                                    <strong>

                                        ${escapeHtml(
                                            triggerResult
                                                .trigger
                                                .title
                                        )}

                                    </strong>

                                    <span>

                                        ${Math.round(
                                            triggerResult
                                                .proximityPercent
                                        )}% proximity

                                    </span>

                                </div>

                            `

                        )

                        .join("")}

                </div>

            `

            : "";


    return `

        <div class="operational-trigger-summary">

            ${activeMarkup}

            ${approachingMarkup}

        </div>

    `;

}


/**
 * Create the initial empty state.
 */
function createEmptyState():string {

    return `

        <div class="operational-overview-empty">

            <strong>
                Awaiting assessment
            </strong>

            <p>
                Complete the Hospital Readiness Assessment and calculate Hospital Readiness.
            </p>

        </div>

    `;

}


/**
 * Create the recalculation-required state.
 */
function createUnavailableState():string {

    return `

        <div class="operational-overview-empty">

            <strong>
                Recalculation required
            </strong>

            <p>
                Submit the current assessment to generate an updated operational assessment.
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