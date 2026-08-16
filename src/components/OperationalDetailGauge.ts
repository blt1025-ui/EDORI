/**
 * OperationalDetailGauge
 *
 * Dedicated gauge for the Operational Detail page.
 *
 * This component intentionally uses its own DOM
 * identifiers so it can coexist with the primary
 * Dashboard Gauge without duplicate IDs.
 *
 * It reads the authoritative current EDORI result and
 * OperationalAssessment and does not modify state.
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
 * Render the gauge shell.
 */
export function OperationalDetailGauge():string {

    return `

        <section class="operational-detail-gauge-card">

            <div class="operational-detail-gauge-heading">

                <span>
                    Hospital Readiness
                </span>


                <strong>
                    Current HRI
                </strong>

            </div>


            <div
                id="operationalDetailGaugeContent"
                class="operational-detail-gauge-content"
                aria-live="polite"
            >

                ${createAwaitingMarkup()}

            </div>

        </section>

    `;

}


/**
 * Initialize gauge refresh behavior.
 */
export function initializeOperationalDetailGauge():void {

    updateOperationalDetailGauge();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateOperationalDetailGauge

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateOperationalDetailGauge

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateOperationalDetailGauge

    );

}


/**
 * Refresh the dedicated Operational Detail gauge.
 */
function updateOperationalDetailGauge():void {

    const container =

        document.getElementById(

            "operationalDetailGaugeContent"

        );


    if(!container){

        return;

    }


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        container.innerHTML =

            createMessageMarkup(

                "Recalculation Required",

                invalidationReason,

                "warning"

            );


        return;

    }


    if(!hasCommittedAssessment()){

        container.innerHTML =

            createAwaitingMarkup();


        return;

    }


    const result =

        getLatestResult();


    if(!result){

        container.innerHTML =

            createAwaitingMarkup();


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

                operationalAssessment

            );

    }
    catch(error){

        console.error(

            "Unable to update Operational Detail gauge:",

            error

        );


        container.innerHTML =

            createMessageMarkup(

                "Gauge Unavailable",

                "Review the browser console for additional details.",

                "error"

            );

    }

}


/**
 * Create the visual semi-circular gauge.
 */
function createGaugeMarkup(

    assessment:OperationalAssessment

):string {

    const score = clampScore(

        assessment.scoreResult.score

    );


    const rotation =

        -90

        +

        score * 1.8;


    const state =

        assessment.finalOperationalState;


    const levelRange =

        getLevelRangeText(

            state.title

        );


    return `

        <div
            class="
                operational-detail-command-gauge
                operational-detail-command-gauge-${state.title.toLowerCase()}
            "
            style="
                --detail-gauge-color:
                ${escapeAttribute(
                    state.color
                )};

                --detail-gauge-rotation:
                ${rotation}deg;
            "
        >

            <div class="operational-detail-gauge-visual">

                <div class="operational-detail-gauge-arc">

                    ${createTickMarks()}


                    <span
                        class="
                            operational-detail-gauge-zone
                            operational-detail-gauge-zone-alpha
                        "
                    >
                        Alpha
                    </span>


                    <span
                        class="
                            operational-detail-gauge-zone
                            operational-detail-gauge-zone-bravo
                        "
                    >
                        Bravo
                    </span>


                    <span
                        class="
                            operational-detail-gauge-zone
                            operational-detail-gauge-zone-charlie
                        "
                    >
                        Charlie
                    </span>


                    <span
                        class="
                            operational-detail-gauge-zone
                            operational-detail-gauge-zone-delta
                        "
                    >
                        Delta
                    </span>


                    <span
                        class="
                            operational-detail-gauge-zone
                            operational-detail-gauge-zone-echo
                        "
                    >
                        Echo
                    </span>


                    <div class="operational-detail-gauge-inner">
                    </div>


                    <div class="operational-detail-gauge-needle">
                    </div>


                    <div class="operational-detail-gauge-center">
                    </div>

                </div>


                <div class="operational-detail-gauge-score">

                    <strong>

                        ${formatScore(
                            score
                        )}

                    </strong>


                    <span>
                        HRI
                    </span>

                </div>

            </div>


            <div class="operational-detail-gauge-state">

                <span
                    class="operational-detail-gauge-state-badge"
                >

                    ${escapeHtml(
                        state.title
                    )}

                </span>


                <span class="operational-detail-gauge-range">

                    ${escapeHtml(
                        levelRange
                    )}

                </span>

            </div>


            <div class="operational-detail-gauge-scale">

                <span>0</span>

                <span>20</span>

                <span>40</span>

                <span>60</span>

                <span>80</span>

                <span>100</span>

            </div>

        </div>

    `;

}


/**
 * Create gauge tick marks at ten-point intervals.
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


            const major =

                index % 2 === 0;


            return `

                <span
                    class="
                        operational-detail-gauge-tick
                        ${major
                            ? "operational-detail-gauge-tick-major"
                            : ""
                        }
                    "
                    style="
                        --detail-tick-rotation:
                        ${rotation}deg;
                    "
                    aria-hidden="true"
                >
                </span>

            `;

        }

    ).join("");

}


/**
 * Awaiting-assessment display.
 */
function createAwaitingMarkup():string {

    return createMessageMarkup(

        "Awaiting Assessment",

        "Calculate Hospital Readiness to display the current gauge.",

        "default"

    );

}


/**
 * Create a compact empty/error state.
 */
function createMessageMarkup(

    title:string,

    message:string,

    tone:
        | "default"
        | "warning"
        | "error"

):string {

    return `

        <div
            class="
                operational-detail-gauge-message
                operational-detail-gauge-message-${tone}
            "
        >

            <strong>

                ${escapeHtml(
                    title
                )}

            </strong>


            <span>

                ${escapeHtml(
                    message
                )}

            </span>

        </div>

    `;

}


/**
 * Return the default configured score-band label.
 *
 * The displayed range is descriptive only; the
 * authoritative current state still comes from the
 * OperationalAssessment.
 */
function getLevelRangeText(

    title:string

):string {

    switch(title){

        case "Alpha":
            return "0 – 19";

        case "Bravo":
            return "20 – 39";

        case "Charlie":
            return "40 – 59";

        case "Delta":
            return "60 – 79";

        case "Echo":
            return "80 – 100";

        default:
            return "";

    }

}


/**
 * Clamp score for gauge geometry.
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
 * Format score consistently with the status strip.
 */
function formatScore(

    value:number

):string {

    return value.toFixed(

        1

    );

}


/**
 * Escape HTML.
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
 * Escape HTML attributes.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}