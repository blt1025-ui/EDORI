/**
 * Drivers
 *
 * Displays the primary factors contributing to the
 * current EDORI OperationalAssessment.
 *
 * Sources include:
 *
 * - Existing EDORI calculation drivers
 * - Operational pillar details
 * - Active operational triggers
 *
 * This component does not:
 *
 * - Calculate EDORI
 * - Evaluate triggers
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

    Driver

}

from "../types/Driver";


import type {

    OperationalAssessment

}

from "../types/OperationalAssessment";


import type {

    OperationalPillarDetail,

    OperationalPillarFactor

}

from "../types/OperationalPillarDetail";


import type {

    OperationalTriggerResult

}

from "../types/OperationalTriggerResult";


/**
 * Maximum number of items displayed in each
 * driver section.
 */
const MAXIMUM_DISPLAYED_DRIVERS = 5;

const MAXIMUM_DISPLAYED_TRIGGERS = 5;


/**
 * Render the Primary Drivers panel.
 */
export function Drivers():string {

    return `

        <section class="drivers-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Primary Drivers
                    </h3>

                    <p class="panel-description">
                        Conditions contributing to the current operational state
                    </p>

                </div>


                <span
                    id="driverCount"
                    class="driver-count"
                >
                    0 drivers
                </span>

            </div>


            <div
                id="drivers-list"
                class="drivers-list"
                aria-live="polite"
            >

                ${createAwaitingAssessmentState()}

            </div>

        </section>

    `;

}


/**
 * Initialize the drivers panel.
 */
export function initializeDrivers():void {

    updateDrivers();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateDrivers

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateDrivers

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateDrivers

    );

}


/**
 * Refresh drivers from the authoritative
 * OperationalAssessment.
 */
function updateDrivers():void {

    const container = document.getElementById(

        "drivers-list"

    );


    if(!container){

        return;

    }


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        updateDriverCount(

            0

        );


        container.innerHTML =

            createRecalculationRequiredState();


        return;

    }


    if(!hasCommittedAssessment()){

        updateDriverCount(

            0

        );


        container.innerHTML =

            createAwaitingAssessmentState();


        return;

    }


    const result = getLatestResult();


    if(!result){

        updateDriverCount(

            0

        );


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


        renderOperationalDrivers(

            container,

            operationalAssessment

        );

    }
    catch(error){

        console.error(

            "Unable to update operational drivers:",

            error

        );


        updateDriverCount(

            0

        );


        container.innerHTML = `

            <div class="drivers-empty-state error">

                <strong>
                    Operational drivers unavailable
                </strong>

                <p>
                    Review the browser console for additional details.
                </p>

            </div>

        `;

    }

}


/**
 * Render all driver sections.
 */
function renderOperationalDrivers(

    container:HTMLElement,

    operationalAssessment:OperationalAssessment

):void {

    const calculationDrivers =

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

            )

            .slice(

                0,

                MAXIMUM_DISPLAYED_DRIVERS

            );


    const activeTriggers =

        operationalAssessment.activeTriggers

            .slice()

            .sort(

                compareTriggerResults

            )

            .slice(

                0,

                MAXIMUM_DISPLAYED_TRIGGERS

            );


    const importantPillars =

        operationalAssessment.pillarDetails

            .filter(

                pillar =>

                    pillar.score !== null

                    &&

                    pillar.score >= 40

            )

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

            );


    const totalCount =

        calculationDrivers.length

        +

        activeTriggers.length;


    updateDriverCount(

        totalCount

    );


    if(

        calculationDrivers.length === 0

        &&

        activeTriggers.length === 0

        &&

        importantPillars.length === 0

    ){

        container.innerHTML =

            createNoSignificantDriversState();


        return;

    }


    container.innerHTML = `

        ${createTriggerSection(

            activeTriggers

        )}


        ${createCalculationDriverSection(

            calculationDrivers

        )}


        ${createPillarSection(

            importantPillars

        )}

    `;

}


/**
 * Create the active-trigger driver section.
 */
function createTriggerSection(

    triggers:OperationalTriggerResult[]

):string {

    if(triggers.length === 0){

        return "";

    }


    return `

        <div class="driver-section">

            <h4>
                Active Operational Triggers
            </h4>


            <div class="driver-section-content">

                ${triggers

                    .map(

                        triggerResult =>

                            createTriggerDriverCard(

                                triggerResult

                            )

                    )

                    .join("")}

            </div>

        </div>

    `;

}


/**
 * Create one active-trigger card.
 */
function createTriggerDriverCard(

    triggerResult:OperationalTriggerResult

):string {

    const trigger =

        triggerResult.trigger;


    const priorityClass =

        createPriorityClassName(

            trigger.priority

        );


    const conditionSummary =

        triggerResult.conditionResults

            .map(

                condition =>

                    condition.explanation

            )

            .join(" ");


    return `

        <article
            class="
                driver-card
                trigger-driver-card
                ${priorityClass}
            "
        >

            <div class="driver-card-header">

                <div>

                    <span class="driver-category">

                        ${escapeHtml(
                            trigger.category
                        )}

                    </span>


                    <h5>

                        ${escapeHtml(
                            trigger.title
                        )}

                    </h5>

                </div>


                <span
                    class="
                        driver-priority-badge
                        ${priorityClass}
                    "
                >

                    ${escapeHtml(
                        trigger.priority
                    )}

                </span>

            </div>


            <p class="driver-description">

                ${escapeHtml(
                    trigger.description
                )}

            </p>


            <div class="driver-trigger-reason">

                ${escapeHtml(
                    conditionSummary
                )}

            </div>


            <div class="driver-trigger-metadata">

                <span>

                    Proximity:

                    <strong>

                        ${Math.round(
                            triggerResult.proximityPercent
                        )}%

                    </strong>

                </span>


                ${trigger.minimumOperationalState

                    ? `

                        <span>

                            Minimum State:

                            <strong>

                                ${escapeHtml(
                                    trigger.minimumOperationalState
                                )}

                            </strong>

                        </span>

                    `

                    : ""

                }

            </div>

        </article>

    `;

}


/**
 * Create the EDORI calculation-driver section.
 */
function createCalculationDriverSection(

    drivers:Driver[]

):string {

    if(drivers.length === 0){

        return "";

    }


    return `

        <div class="driver-section">

            <h4>
                EDORI Score Drivers
            </h4>


            <div class="driver-section-content">

                ${drivers

                    .map(

                        driver =>

                            createCalculationDriverCard(

                                driver

                            )

                    )

                    .join("")}

            </div>

        </div>

    `;

}


/**
 * Create one score-driver card.
 */
function createCalculationDriverCard(

    driver:Driver

):string {

    const severity = clampPercent(

        driver.severity

    );


    const difference =

        driver.currentValue

        -

        driver.expectedValue;


    return `

        <article class="driver-card score-driver-card">

            <div class="driver-card-header">

                <div>

                    <span class="driver-category">
                        Score Driver
                    </span>


                    <h5>

                        ${escapeHtml(
                            driver.title
                        )}

                    </h5>

                </div>


                <strong class="driver-severity-value">

                    ${Math.round(severity)}

                </strong>

            </div>


            <p class="driver-description">

                ${escapeHtml(
                    driver.description
                )}

            </p>


            <div class="driver-values-grid">

                ${createDriverValue(

                    "Current",

                    formatNumber(

                        driver.currentValue

                    )

                )}


                ${createDriverValue(

                    "Comparison",

                    formatNumber(

                        driver.expectedValue

                    )

                )}


                ${createDriverValue(

                    "Difference",

                    formatSignedNumber(

                        difference

                    )

                )}

            </div>


            <div
                class="driver-severity-track"
                role="progressbar"
                aria-label="${escapeAttribute(
                    `${driver.title} severity`
                )}"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${Math.round(severity)}"
            >

                <div
                    class="driver-severity-fill"
                    style="width:${severity}%;"
                >
                </div>

            </div>

        </article>

    `;

}


/**
 * Create the operational-pillar section.
 */
function createPillarSection(

    pillars:OperationalPillarDetail[]

):string {

    if(pillars.length === 0){

        return "";

    }


    return `

        <div class="driver-section">

            <h4>
                Operational Pillars
            </h4>


            <div class="driver-section-content">

                ${pillars

                    .map(

                        pillar =>

                            createPillarDriverCard(

                                pillar

                            )

                    )

                    .join("")}

            </div>

        </div>

    `;

}


/**
 * Create one pillar card.
 */
function createPillarDriverCard(

    pillar:OperationalPillarDetail

):string {

    const score =

        pillar.score

        ?? 0;


    const factors = pillar.factors

        .slice()

        .sort(

            (

                first,

                second

            ) =>

                second.severity

                -

                first.severity

        )

        .slice(

            0,

            3

        );


    return `

        <article class="driver-card pillar-driver-card">

            <div class="driver-card-header">

                <div>

                    <span class="driver-category">
                        Operational Pillar
                    </span>


                    <h5>

                        ${escapeHtml(
                            pillar.title
                        )}

                    </h5>

                </div>


                <strong class="driver-severity-value">

                    ${Math.round(score)}

                </strong>

            </div>


            <p class="driver-description">

                ${escapeHtml(
                    pillar.summary
                )}

            </p>


            ${factors.length > 0

                ? `

                    <div class="pillar-factor-list">

                        ${factors

                            .map(

                                factor =>

                                    createPillarFactor(

                                        factor

                                    )

                            )

                            .join("")}

                    </div>

                `

                : ""

            }


            <div
                class="driver-severity-track"
                role="progressbar"
                aria-label="${escapeAttribute(
                    `${pillar.title} score`
                )}"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${Math.round(score)}"
            >

                <div
                    class="driver-severity-fill"
                    style="width:${clampPercent(score)}%;"
                >
                </div>

            </div>

        </article>

    `;

}


/**
 * Create one pillar-factor row.
 */
function createPillarFactor(

    factor:OperationalPillarFactor

):string {

    const comparisonText =

        factor.comparisonValue === null

            ? "No comparison"

            : `Compared with ${formatNumber(
                factor.comparisonValue
            )}`;


    return `

        <div class="pillar-factor">

            <div>

                <strong>

                    ${escapeHtml(
                        factor.label
                    )}

                </strong>


                <span>

                    ${escapeHtml(
                        comparisonText
                    )}

                </span>

            </div>


            <div class="pillar-factor-values">

                <span>

                    ${formatNumber(
                        factor.currentValue
                    )}

                </span>


                ${factor.difference !== null

                    ? `

                        <small>

                            ${formatSignedNumber(
                                factor.difference
                            )}

                        </small>

                    `

                    : ""

                }

            </div>

        </div>

    `;

}


/**
 * Create one value cell.
 */
function createDriverValue(

    label:string,

    value:string

):string {

    return `

        <div class="driver-value">

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
 * Sort operational triggers by priority and
 * proximity.
 */
function compareTriggerResults(

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
 * Rank trigger priority.
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
 * Update the driver count.
 */
function updateDriverCount(

    count:number

):void {

    const element = document.getElementById(

        "driverCount"

    );


    if(!element){

        return;

    }


    element.textContent =

        count === 1

            ? "1 driver"

            : `${count} drivers`;

}


/**
 * Create the initial state.
 */
function createAwaitingAssessmentState():string {

    return `

        <div class="drivers-empty-state">

            <strong>
                Awaiting assessment
            </strong>

            <p>
                Calculate EDORI to identify the current operational drivers.
            </p>

        </div>

    `;

}


/**
 * Create the recalculation-required state.
 */
function createRecalculationRequiredState():string {

    return `

        <div class="drivers-empty-state warning">

            <strong>
                Recalculation required
            </strong>

            <p>
                Submit the current operational assessment to update the driver analysis.
            </p>

        </div>

    `;

}


/**
 * Create the no-driver state.
 */
function createNoSignificantDriversState():string {

    return `

        <div class="drivers-empty-state routine">

            <strong>
                No significant operational drivers
            </strong>

            <p>
                Current conditions do not meet configured driver or trigger thresholds.
            </p>

        </div>

    `;

}


/**
 * Convert trigger priority into a CSS class.
 */
function createPriorityClassName(

    priority:
        OperationalTriggerResult["trigger"]["priority"]

):string {

    return `priority-${priority

        .toLowerCase()

        .replace(

            /[^a-z0-9]+/g,

            "-"

        )}`;

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
 * Format one number for display.
 */
function formatNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(Number.isInteger(value)){

        return String(value);

    }


    return value

        .toFixed(

            1

        )

        .replace(

            /\.0$/,

            ""

        );

}


/**
 * Format a positive or negative difference.
 */
function formatSignedNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    const formatted =

        formatNumber(

            Math.abs(value)

        );


    if(value > 0){

        return `+${formatted}`;

    }


    if(value < 0){

        return `-${formatted}`;

    }


    return "0";

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