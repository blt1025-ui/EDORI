/**
 * Drivers
 *
 * Displays the primary operational conditions
 * contributing to the current EDORI assessment.
 *
 * Driver information is read from the authoritative
 * OperationalAssessment.
 *
 * This component does not:
 *
 * - Calculate EDORI
 * - Evaluate triggers
 * - Modify application state
 * - Save results or snapshots
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    getDomainSeverity

}

from "../config/domainSeverity";


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

    OperationalPillarDetail

}

from "../types/OperationalPillarDetail";


import type {

    OperationalTriggerResult

}

from "../types/OperationalTriggerResult";


/**
 * Maximum number of primary driver cards displayed
 * in each section.
 */
const MAXIMUM_PRIMARY_DRIVERS = 6;


/**
 * Visual severity used by driver cards.
 */
type DriverVisualSeverity =

    | "routine"

    | "moderate"

    | "high"

    | "critical";


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
                        Conditions contributing to the current operational level
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
                id="driversContent"
                class="drivers-content"
                aria-live="polite"
            >

                ${createAwaitingAssessmentState()}

            </div>

        </section>

    `;

}


/**
 * Initialize driver-panel behavior.
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
 * Refresh drivers from authoritative services.
 */
function updateDrivers():void {

    const container = document.getElementById(

        "driversContent"

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

            createRecalculationRequiredState(

                invalidationReason

            );


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


        container.innerHTML =

            createDriversMarkup(

                operationalAssessment

            );

    }
    catch(error){

        console.error(

            "Unable to update primary drivers:",

            error

        );


        updateDriverCount(

            0

        );


        container.innerHTML = `

            <div class="drivers-empty-state error">

                <strong>
                    Drivers unavailable
                </strong>

                <p>
                    Review the browser console for additional details.
                </p>

            </div>

        `;

    }

}


/**
 * Create the completed driver display.
 */
function createDriversMarkup(

    operationalAssessment:OperationalAssessment

):string {

    const triggerDrivers =

        operationalAssessment.activeTriggers

            .slice()

            .sort(

                compareTriggerPriority

            );


    const scoreDrivers =

        operationalAssessment.primaryDrivers

            .slice()

            .sort(

                compareDriverSeverity

            );


    const pillarDrivers =

        operationalAssessment.pillarDetails

            .filter(

                pillar =>

                    pillar.score !== null

            )

            .slice()

            .sort(

                comparePillarScore

            );


    const totalDriverCount =

        triggerDrivers.length

        +

        scoreDrivers.length

        +

        pillarDrivers.length;


    updateDriverCount(

        totalDriverCount

    );


    if(totalDriverCount === 0){

        return createRoutineState();

    }


    return `

        ${triggerDrivers.length > 0

            ? createTriggerDriverSection(

                triggerDrivers

            )

            : ""

        }


        ${scoreDrivers.length > 0

            ? createScoreDriverSection(

                scoreDrivers

            )

            : ""

        }


        ${pillarDrivers.length > 0

            ? createPillarDriverSection(

                pillarDrivers

            )

            : ""

        }

    `;

}


/**
 * Create the active operational-trigger section.
 */
function createTriggerDriverSection(

    triggerDrivers:OperationalTriggerResult[]

):string {

    return `

        <div class="driver-section">

            <div class="driver-section-heading">

                <div>

                    <span class="driver-section-kicker">
                        Active Conditions
                    </span>

                    <h4>
                        Operational Triggers
                    </h4>

                </div>


                <span class="driver-section-count">

                    ${triggerDrivers.length}

                </span>

            </div>


            <div class="driver-section-content">

                ${triggerDrivers

                    .slice(

                        0,

                        MAXIMUM_PRIMARY_DRIVERS

                    )

                    .map(

                        triggerResult =>

                            createTriggerDriverCard(

                                triggerResult

                            )

                    )

                    .join("")}

            </div>


            ${triggerDrivers.length > MAXIMUM_PRIMARY_DRIVERS

                ? createAdditionalDriverMessage(

                    triggerDrivers.length

                    -

                    MAXIMUM_PRIMARY_DRIVERS,

                    "operational triggers"

                )

                : ""

            }

        </div>

    `;

}


/**
 * Create the EDORI score-driver section.
 */
function createScoreDriverSection(

    scoreDrivers:Driver[]

):string {

    return `

        <div class="driver-section">

            <div class="driver-section-heading">

                <div>

                    <span class="driver-section-kicker">
                        Score Contribution
                    </span>

                    <h4>
                        EDORI Drivers
                    </h4>

                </div>


                <span class="driver-section-count">

                    ${scoreDrivers.length}

                </span>

            </div>


            <div class="driver-section-content">

                ${scoreDrivers

                    .slice(

                        0,

                        MAXIMUM_PRIMARY_DRIVERS

                    )

                    .map(

                        driver =>

                            createScoreDriverCard(

                                driver

                            )

                    )

                    .join("")}

            </div>


            ${scoreDrivers.length > MAXIMUM_PRIMARY_DRIVERS

                ? createAdditionalDriverMessage(

                    scoreDrivers.length

                    -

                    MAXIMUM_PRIMARY_DRIVERS,

                    "EDORI drivers"

                )

                : ""

            }

        </div>

    `;

}


/**
 * Create the operational-pillar section.
 */
function createPillarDriverSection(

    pillarDrivers:OperationalPillarDetail[]

):string {

    return `

        <div class="driver-section">

            <div class="driver-section-heading">

                <div>

                    <span class="driver-section-kicker">
                        Operational Domains
                    </span>

                    <h4>
                        Pillar Conditions
                    </h4>

                </div>


                <span class="driver-section-count">

                    ${pillarDrivers.length}

                </span>

            </div>


            <div class="driver-section-content">

                ${pillarDrivers

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
 * Create one active-trigger driver card.
 */
function createTriggerDriverCard(

    triggerResult:OperationalTriggerResult

):string {

    const severity = createTriggerSeverity(

        triggerResult.trigger.priority

    );


    const severityLabel =

        triggerResult.trigger.priority;


    const proximity = clampPercentage(

        triggerResult.proximityPercent

    );


    const reassessmentText =

        triggerResult.trigger.reassessmentMinutes === null

            ? "Routine"

            : `${triggerResult.trigger.reassessmentMinutes} min`;


    const minimumLevel =

        triggerResult.trigger.minimumOperationalState

        ?? "No forced level";


    return `

        <article
            class="
                driver-card
                driver-card-${severity}
            "
        >

            <div class="driver-card-header">

                <div class="driver-card-title-group">

                    <span
                        class="driver-card-indicator"
                        aria-hidden="true"
                    >
                    </span>


                    <div>

                        <span class="driver-category">

                            ${escapeHtml(
                                triggerResult.trigger.category
                            )}

                        </span>


                        <h5>

                            ${escapeHtml(
                                triggerResult.trigger.title
                            )}

                        </h5>

                    </div>

                </div>


                <span
                    class="
                        driver-priority-badge
                        driver-priority-${severity}
                    "
                >

                    ${escapeHtml(
                        severityLabel
                    )}

                </span>

            </div>


            <p class="driver-description">

                ${escapeHtml(
                    triggerResult.trigger.description
                )}

            </p>


            <div class="driver-trigger-reason">

                <strong>
                    Why it is active
                </strong>

                <span>

                    ${escapeHtml(
                        triggerResult.activationReason
                    )}

                </span>

            </div>


            <div class="driver-values-grid">

                ${createValueCell(

                    "Proximity",

                    `${proximity}%`

                )}


                ${createValueCell(

                    "Reassess",

                    reassessmentText

                )}


                ${createValueCell(

                    "Minimum Level",

                    minimumLevel

                )}

            </div>


            <div class="driver-impact-row">

                <span>
                    Trigger intensity
                </span>

                <strong>
                    ${proximity} / 100
                </strong>

            </div>


            <div class="driver-severity-track">

                <div
                    class="driver-severity-fill"
                    style="
                        width:${proximity}%;
                    "
                >
                </div>

            </div>

        </article>

    `;

}


/**
 * Create one EDORI score-driver card.
 */
function createScoreDriverCard(

    driver:Driver

):string {

    const impact = clampPercentage(

        driver.severity

    );


    const severity = createNumericSeverity(

        impact

    );


    const difference = calculateDriverDifference(

        driver.currentValue,

        driver.expectedValue

    );


    return `

        <article
            class="
                driver-card
                driver-card-${severity}
            "
        >

            <div class="driver-card-header">

                <div class="driver-card-title-group">

                    <span
                        class="driver-card-indicator"
                        aria-hidden="true"
                    >
                    </span>


                    <div>

                        <span class="driver-category">
                            EDORI Driver
                        </span>

                        <h5>

                            ${escapeHtml(
                                driver.title
                            )}

                        </h5>

                    </div>

                </div>


                <div class="driver-impact-score">

                    <span>
                        Impact
                    </span>

                    <strong>
                        ${impact}
                    </strong>

                </div>

            </div>


            <p class="driver-description">

                ${escapeHtml(
                    driver.description
                )}

            </p>


            <div class="driver-values-grid">

                ${createValueCell(

                    "Current",

                    formatUnknownValue(

                        driver.currentValue

                    )

                )}


                ${createValueCell(

                    "Expected",

                    formatUnknownValue(

                        driver.expectedValue

                    )

                )}


                ${createValueCell(

                    "Difference",

                    formatSignedUnknownValue(

                        difference

                    )

                )}

            </div>


            <div class="driver-impact-row">

                <span>
                    Relative contribution
                </span>

                <strong>
                    ${impact} / 100
                </strong>

            </div>


            <div class="driver-severity-track">

                <div
                    class="driver-severity-fill"
                    style="
                        width:${impact}%;
                    "
                >
                </div>

            </div>

        </article>

    `;

}


/**
 * Create one operational-pillar driver card.
 */
function createPillarDriverCard(

    pillar:OperationalPillarDetail

):string {

    const score = clampPercentage(

        pillar.score

        ?? 0

    );


    const severity = createNumericSeverity(

        score

    );


    return `

        <article
            class="
                driver-card
                driver-card-${severity}
            "
        >

            <div class="driver-card-header">

                <div class="driver-card-title-group">

                    <span
                        class="driver-card-indicator"
                        aria-hidden="true"
                    >
                    </span>


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

                </div>


                <div class="driver-impact-score">

                    <span>
                        Score
                    </span>

                    <strong>
                        ${score}
                    </strong>

                </div>

            </div>


            <p class="driver-description">

                ${escapeHtml(
                    pillar.summary
                )}

            </p>


            ${pillar.factors.length > 0

                ? createPillarFactorList(

                    pillar

                )

                : ""

            }


            <div class="driver-impact-row">

                <span>
                    Pillar severity
                </span>

                <strong>
                    ${score} / 100
                </strong>

            </div>


            <div class="driver-severity-track">

                <div
                    class="driver-severity-fill"
                    style="
                        width:${score}%;
                    "
                >
                </div>

            </div>

        </article>

    `;

}


/**
 * Create the factor list for one operational pillar.
 */
function createPillarFactorList(

    pillar:OperationalPillarDetail

):string {

    return `

        <div class="pillar-factor-list">

            ${pillar.factors

                .slice(

                    0,

                    4

                )

                .map(

                    factor => {

                        const differenceMarkup =

                            factor.difference !== null

                                ? `

                                    <small>

                                        ${escapeHtml(
                                            formatSignedUnknownValue(
                                                factor.difference
                                            )
                                        )}

                                    </small>

                                `

                                : "";


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
                                            factor.explanation
                                        )}

                                    </span>

                                </div>


                                <div class="pillar-factor-values">

                                    <span>

                                        ${escapeHtml(
                                            formatUnknownValue(
                                                factor.currentValue
                                            )
                                        )}

                                    </span>


                                    ${differenceMarkup}

                                </div>

                            </div>

                        `;

                    }

                )

                .join("")}

        </div>

    `;

}


/**
 * Create one driver value cell.
 */
function createValueCell(

    label:string,

    value:string

):string {

    return `

        <div class="driver-value">

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
 * Create a note when more drivers exist than can
 * be displayed.
 */
function createAdditionalDriverMessage(

    additionalCount:number,

    label:string

):string {

    return `

        <div class="driver-additional-message">

            ${additionalCount}

            additional

            ${escapeHtml(label)}

            are not shown in this condensed view.

        </div>

    `;

}


/**
 * Sort active triggers by priority and proximity.
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
 * Sort EDORI drivers from highest to lowest impact.
 */
function compareDriverSeverity(

    first:Driver,

    second:Driver

):number {

    return second.severity

        -

        first.severity;

}


/**
 * Sort operational pillars by score.
 */
function comparePillarScore(

    first:OperationalPillarDetail,

    second:OperationalPillarDetail

):number {

    return (

        second.score

        ?? 0

    )

    -

    (

        first.score

        ?? 0

    );

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
 * Convert trigger priority to visual severity.
 */
function createTriggerSeverity(

    priority:
        OperationalTriggerResult["trigger"]["priority"]

):DriverVisualSeverity {

    switch(priority){

        case "Critical":

            return "critical";


        case "High":

            return "high";


        case "Moderate":

            return "moderate";


        default:

            return "routine";

    }

}


/**
 * Convert a numerical domain severity into the
 * existing driver-card visual severity classes.
 *
 * Domain thresholds come from the centralized
 * domainSeverity configuration.
 */
function createNumericSeverity(

    value:number

):DriverVisualSeverity {

    const domainSeverity =

        getDomainSeverity(

            value

        );


    switch(domainSeverity.level){

        case "severe":

            return "critical";


        case "high":

            return "high";


        case "elevated":

        case "watch":

            return "moderate";


        default:

            return "routine";

    }

}


/**
 * Calculate the difference between a driver's
 * current and expected values.
 *
 * A difference is returned only when both values
 * are finite numbers.
 */
function calculateDriverDifference(

    currentValue:unknown,

    expectedValue:unknown

):number | null {

    if(

        typeof currentValue !== "number"

        ||

        !Number.isFinite(

            currentValue

        )

        ||

        typeof expectedValue !== "number"

        ||

        !Number.isFinite(

            expectedValue

        )

    ){

        return null;

    }


    return currentValue

        -

        expectedValue;

}


/**
 * Clamp a numerical value to a whole percentage
 * between 0 and 100.
 */
function clampPercentage(

    value:number

):number {

    if(!Number.isFinite(value)){

        return 0;

    }


    return Math.min(

        100,

        Math.max(

            0,

            Math.round(

                value

            )

        )

    );

}


/**
 * Format an unknown display value.
 */
function formatUnknownValue(

    value:unknown

):string {

    if(

        typeof value === "number"

        &&

        Number.isFinite(

            value

        )

    ){

        return formatNumber(

            value

        );

    }


    if(

        typeof value === "string"

        &&

        value.trim().length > 0

    ){

        return value.trim();

    }


    return "--";

}


/**
 * Format a signed unknown display value.
 */
function formatSignedUnknownValue(

    value:unknown

):string {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(

            value

        )

    ){

        return "--";

    }


    if(value > 0){

        return `+${formatNumber(value)}`;

    }


    return formatNumber(

        value

    );

}


/**
 * Format a number with no unnecessary trailing
 * zero.
 */
function formatNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(Number.isInteger(value)){

        return String(

            value

        );

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
 * Update the displayed driver count.
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


    element.textContent = count === 1

        ? "1 driver"

        : `${count} drivers`;

}


/**
 * Create the routine state.
 */
function createRoutineState():string {

    return `

        <div class="drivers-empty-state routine">

            <strong>
                No major operational drivers
            </strong>

            <p>
                The current assessment does not identify a dominant operational concern.
            </p>

        </div>

    `;

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
                Calculate EDORI to display the current operational drivers.
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

        <div class="drivers-empty-state warning">

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