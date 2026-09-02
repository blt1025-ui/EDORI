/**
 * Gauge
 *
 * Displays the current EDORI score and the
 * HRI score-derived Alpha–Echo operational level.
 *
 * This component does not:
 *
 * - Calculate EDORI
 * - Evaluate operational triggers
 * - Modify application state
 * - Save assessment history
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

    EdoriSnapshot

}

from "../types/EdoriSnapshot";


import type {

    OperationalAssessment

}

from "../types/OperationalAssessment";


/**
 * Render the EDORI gauge panel.
 */
export function Gauge():string {

    return `

        <section class="gauge-container">

            <div class="panel-header">

                <div>

                    <h3>
                        HRI Gauge
                    </h3>

                    <p class="panel-description">
                        Current Hospital Readiness score and operational level
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
 * Initialize gauge behavior.
 */
export function initializeGauge():void {

    updateGauge();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateGauge

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateGauge

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

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

        const snapshots = getSnapshots();


        const operationalAssessment =

            createOperationalAssessment({

                assessment:
                    getState(),

                result,

                snapshots,

                evaluatedAt:
                    new Date()

            });


        container.innerHTML =

            createCompletedGauge(

                operationalAssessment,

                determineLatestScoreChange(

                    snapshots,

                    result.score

                )

            );

    }
    catch(error){

        console.error(

            "Unable to update the HRI gauge:",

            error

        );


        container.innerHTML = `

            <div class="gauge-empty-state error">

                <strong>
                    Gauge unavailable
                </strong>

                <p>
                    Review the browser console for additional details.
                </p>

            </div>

        `;

    }

}


/**
 * Create the completed command-center gauge.
 */
function createCompletedGauge(

    operationalAssessment:OperationalAssessment,

    scoreChange:number | null

):string {

    const score = clampScore(

        operationalAssessment
            .scoreResult
            .score

    );


    const roundedScore = Math.round(

        score

    );


    const finalState =

        operationalAssessment.finalOperationalState;


    const needleRotation =

        -90

        +

        score * 1.8;


    const activeTriggerCount =

        operationalAssessment.activeTriggers.length;


    return `

        <div
            class="
                command-gauge
                command-gauge-${finalState.title.toLowerCase()}
            "
            style="
                --gauge-color:${escapeAttribute(
                    finalState.color
                )};
                --gauge-rotation:${needleRotation}deg;
            "
        >

            <div class="command-gauge-level">

                <span>
                    Operational Level
                </span>

                <strong>

                    ${escapeHtml(
                        finalState.title
                    )}

                </strong>

            </div>


            <div class="command-gauge-visual">

                <div class="command-gauge-arc">

                    ${createTickMarks()}


                    <span class="command-gauge-label gauge-label-alpha">
                        Alpha
                    </span>

                    <span class="command-gauge-label gauge-label-bravo">
                        Bravo
                    </span>

                    <span class="command-gauge-label gauge-label-charlie">
                        Charlie
                    </span>

                    <span class="command-gauge-label gauge-label-delta">
                        Delta
                    </span>

                    <span class="command-gauge-label gauge-label-echo">
                        Echo
                    </span>


                    <div class="command-gauge-inner">
                    </div>


                    <div class="command-gauge-needle">
                    </div>


                    <div class="command-gauge-center">
                    </div>

                </div>


                <div class="command-gauge-score">

                    <strong>

                        ${roundedScore}

                    </strong>

                    <span>
                        HRI
                    </span>

                </div>

            </div>


            <div class="command-gauge-change">

                ${createScoreChangeMarkup(
                    scoreChange
                )}

            </div>


            <div class="command-gauge-scale">

                <span>
                    0
                </span>

                <span>
                    20
                </span>

                <span>
                    40
                </span>

                <span>
                    60
                </span>

                <span>
                    80
                </span>

                <span>
                    100
                </span>

            </div>


            <div class="command-gauge-context">

                <div>

                    <span>
                        HRI Score-Derived Level
                    </span>

                    <strong>

                        ${escapeHtml(
                            finalState.title
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        Active Triggers
                    </span>

                    <strong>

                        ${activeTriggerCount}

                    </strong>

                </div>


                <div>

                    <span>
                        Trend
                    </span>

                    <strong>

                        ${escapeHtml(
                            operationalAssessment.riskDirection
                        )}

                    </strong>

                </div>

            </div>

        </div>

    `;

}


/**
 * Create visual tick marks at ten-point intervals.
 */
function createTickMarks():string {

    return Array.from(

        {

            length:
                11

        },

        (

            _,

            index

        ) => {

            const rotation =

                -90

                +

                index * 18;


            const majorTick =

                index % 2 === 0;


            return `

                <span
                    class="
                        command-gauge-tick
                        ${majorTick
                            ? "command-gauge-tick-major"
                            : ""
                        }
                    "
                    style="
                        --tick-rotation:${rotation}deg;
                    "
                    aria-hidden="true"
                >
                </span>

            `;

        }

    ).join("");

}


/**
 * Create the score-change display.
 */
function createScoreChangeMarkup(

    scoreChange:number | null

):string {

    if(scoreChange === null){

        return `

            <span class="gauge-change-neutral">
                No previous assessment comparison
            </span>

        `;

    }


    const roundedChange = Math.round(

        scoreChange

    );


    if(roundedChange > 0){

        return `

            <span class="${
                roundedChange >= 10

                    ? "gauge-change-critical"

                    : "gauge-change-increasing"
            }">

                ▲ +${roundedChange}

                since previous assessment

            </span>

        `;

    }


    if(roundedChange < 0){

        return `

            <span class="gauge-change-improving">

                ▼ ${roundedChange}

                since previous assessment

            </span>

        `;

    }


    return `

        <span class="gauge-change-neutral">
            No score change
        </span>

    `;

}


/**
 * Determine the latest score change.
 *
 * Snapshot history may already contain the current
 * result. This function avoids comparing the current
 * score with itself.
 */
function determineLatestScoreChange(

    snapshots:EdoriSnapshot[],

    currentScore:number

):number | null {

    const validSnapshots = snapshots

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


    if(validSnapshots.length === 0){

        return null;

    }


    const latestSnapshot =

        validSnapshots[

            validSnapshots.length - 1

        ];


    const currentResultIsLatestSnapshot =

        Math.abs(

            latestSnapshot.score

            -

            currentScore

        )

        <

        0.001;


    if(currentResultIsLatestSnapshot){

        if(validSnapshots.length < 2){

            return null;

        }


        const previousSnapshot =

            validSnapshots[

                validSnapshots.length - 2

            ];


        return currentScore

            -

            previousSnapshot.score;

    }


    return currentScore

        -

        latestSnapshot.score;

}


/**
 * Create the initial state.
 */
function createAwaitingAssessmentState():string {

    return `

        <div class="gauge-empty-state">

            <strong>
                Awaiting assessment
            </strong>

          <p>
    Calculate HRI to display the command-center gauge.
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

        <div class="gauge-empty-state warning">

            <strong>
                Recalculation required
            </strong>

            <p>

                ${escapeHtml(
                    reason
                )}

            </p>

        </div>

    `;

}


/**
 * Clamp an EDORI score to 0–100.
 */
function clampScore(

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
 * Escape text inserted into HTML.
 */
function escapeHtml(

    value:string

):string {

    return value

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll("\"", "&quot;")

        .replaceAll("'", "&#039;");

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