/**
 * Drivers
 *
 * Displays the primary operational conditions
 * contributing to the current EDORI assessment.
 *
 * Responsibilities:
 *
 * - Show active operational trigger conditions
 * - Show the strongest EDORI score contributors
 * - Explain why those conditions matter
 *
 * Detailed domain/pillar status belongs on the
 * Dashboard and is intentionally not repeated here.
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

    OperationalTriggerResult

}

from "../types/OperationalTriggerResult";


/**
 * Maximum active operational conditions shown.
 */
const MAXIMUM_TRIGGER_DRIVERS = 6;


/**
 * Keep the score-contribution section intentionally
 * focused on the strongest contributors.
 */
const MAXIMUM_SCORE_DRIVERS = 4;


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
                        Active operational conditions and strongest score contributors
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

    const container =

        document.getElementById(

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


    const result =

        getLatestResult();


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
 *
 * Only two categories are intentionally shown:
 *
 * 1. Active operational trigger conditions
 * 2. Strongest EDORI score contributors
 *
 * Operational pillar/domain cards are excluded
 * because those are already presented on the
 * Dashboard.
 */
function createDriversMarkup(

    operationalAssessment:OperationalAssessment

):string {

    const triggerDrivers =

        operationalAssessment
            .activeTriggers
            .slice()
            .sort(

                compareTriggerPriority

            );


    const scoreDrivers =

        operationalAssessment
            .primaryDrivers
            .slice()
            .sort(

                compareDriverSeverity

            );


    const visibleTriggerCount =

        Math.min(

            triggerDrivers.length,

            MAXIMUM_TRIGGER_DRIVERS

        );


    const visibleScoreDriverCount =

        Math.min(

            scoreDrivers.length,

            MAXIMUM_SCORE_DRIVERS

        );


    const totalVisibleDriverCount =

        visibleTriggerCount

        +

        visibleScoreDriverCount;


    updateDriverCount(

        totalVisibleDriverCount

    );


    if(

        triggerDrivers.length === 0

        &&

        scoreDrivers.length === 0

    ){

        return createRoutineState();

    }


    return `

        ${triggerDrivers.length > 0

            ? createTriggerDriverSection(

                triggerDrivers

            )

            : createNoActiveConditionsSection()

        }


        ${scoreDrivers.length > 0

            ? createScoreDriverSection(

                scoreDrivers

            )

            : createNoScoreDriversSection()

        }

    `;

}


/**
 * Create the active operational-condition section.
 */
function createTriggerDriverSection(

    triggerDrivers:OperationalTriggerResult[]

):string {

    const visibleDrivers =

        triggerDrivers.slice(

            0,

            MAXIMUM_TRIGGER_DRIVERS

        );


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

                    <p>
                        Conditions currently meeting configured operational trigger thresholds.
                    </p>

                </div>


                <span class="driver-section-count">

                    ${triggerDrivers.length}

                </span>

            </div>


            <div class="driver-section-content">

                ${visibleDrivers

                    .map(

                        triggerResult =>

                            createTriggerDriverCard(

                                triggerResult

                            )

                    )

                    .join("")}

            </div>


            ${triggerDrivers.length > MAXIMUM_TRIGGER_DRIVERS

                ? createAdditionalDriverMessage(

                    triggerDrivers.length

                    -

                    MAXIMUM_TRIGGER_DRIVERS,

                    "active operational conditions"

                )

                : ""

            }

        </div>

    `;

}


/**
 * Create the EDORI score-contributor section.
 */
function createScoreDriverSection(

    scoreDrivers:Driver[]

):string {

    const visibleDrivers =

        scoreDrivers.slice(

            0,

            MAXIMUM_SCORE_DRIVERS

        );


    return `

        <div class="driver-section">

            <div class="driver-section-heading">

                <div>

                    <span class="driver-section-kicker">
                        Score Contribution
                    </span>

                    <h4>
                        Top HRI Contributors
                    </h4>

                    <p>
                        Strongest contributors to the current calculated HRI score.
                    </p>

                </div>


                <span class="driver-section-count">

                    ${visibleDrivers.length}

                </span>

            </div>


            <div class="driver-section-content">

                ${visibleDrivers

                    .map(

                        driver =>

                            createScoreDriverCard(

                                driver

                            )

                    )

                    .join("")}

            </div>


            ${scoreDrivers.length > MAXIMUM_SCORE_DRIVERS

                ? createAdditionalDriverMessage(

                    scoreDrivers.length

                    -

                    MAXIMUM_SCORE_DRIVERS,

                    "lower-ranked HRI contributors"

                )

                : ""

            }

        </div>

    `;

}


/**
 * Create one active-trigger driver card.
 */
function createTriggerDriverCard(

    triggerResult:OperationalTriggerResult

):string {

    const severity =

        createTriggerSeverity(

            triggerResult.trigger.priority

        );


    const severityLabel =

        triggerResult.trigger.priority;


    const proximity =

        clampPercentage(

            triggerResult.proximityPercent

        );


    return `

        <article
            class="
                driver-card
                driver-card-${severity}
                driver-trigger-card
            "
        >

            <div class="driver-card-header">

                <div class="driver-card-title-group">

                    <span
                        class="driver-card-indicator"
                        aria-hidden="true"
                    >
                    </span>


                    <div class="driver-card-heading-copy">

                        <div class="driver-card-eyebrow-row">

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


                            <span class="driver-category">

                                ${escapeHtml(
                                    triggerResult.trigger.category
                                )}

                            </span>

                        </div>


                        <h5>

                            ${escapeHtml(
                                triggerResult.trigger.title
                            )}

                        </h5>

                    </div>

                </div>

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


            <div class="driver-impact-row">

                <span>
                    Threshold reached
                </span>

                <strong>
                    ${proximity}%
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
 * Create one EDORI score-contributor card.
 */
function createScoreDriverCard(

    driver:Driver

):string {

    const impact =

        clampPercentage(

            driver.severity

        );


    const severity =

        createNumericSeverity(

            impact

        );


    const difference =

        calculateDriverDifference(

            driver.currentValue,

            driver.expectedValue

        );


    return `

        <article
            class="
                driver-card
                driver-card-${severity}
                driver-score-card
            "
        >

            <div class="driver-card-header">

                <div class="driver-card-title-group">

                    <span
                        class="driver-card-indicator"
                        aria-hidden="true"
                    >
                    </span>


                    <div class="driver-card-heading-copy">

                        <span class="driver-category">
                            HRI Contributor
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
                    ${impact}
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
 * Create a quiet state for the operational-condition
 * section when no trigger is currently active.
 */
function createNoActiveConditionsSection():string {

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
                    0
                </span>

            </div>


            <div class="drivers-empty-state routine">

                <strong>
                    No active operational triggers
                </strong>

                <p>
                    No configured operational trigger currently meets its activation threshold.
                </p>

            </div>

        </div>

    `;

}


/**
 * Create a quiet state when no score contributors
 * are available.
 */
function createNoScoreDriversSection():string {

    return `

        <div class="driver-section">

            <div class="driver-section-heading">

                <div>

                    <span class="driver-section-kicker">
                        Score Contribution
                    </span>

                    <h4>
                        Top HRI Contributors
                    </h4>

                </div>

                <span class="driver-section-count">
                    0
                </span>

            </div>


            <div class="drivers-empty-state routine">

                <strong>
                    No dominant score contributor
                </strong>

                <p>
                    The current HRI result does not identify a major individual score contributor.
                </p>

            </div>

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
 * Create a note when more drivers exist than are
 * shown in the condensed operational view.
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
            ${
                additionalCount === 1
                    ? "is"
                    : "are"
            }
            not shown in this condensed view.

        </div>

    `;

}


/**
 * Sort active triggers by priority and then
 * proximity.
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
 * Sort EDORI contributors from highest to lowest
 * relative impact.
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
 * Rank operational-trigger priorities.
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
 * Convert trigger priority to existing driver-card
 * visual severity.
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
 * Convert numerical driver severity into the
 * existing driver-card visual severity classes.
 *
 * Thresholds remain centralized in domainSeverity.
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
 * current and expected values when both are finite
 * numbers.
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
 * Format a number without unnecessary trailing zero.
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
 *
 * This count represents the number of driver cards
 * actually shown in the condensed view rather than
 * every available domain/pillar record.
 */
function updateDriverCount(

    count:number

):void {

    const element =

        document.getElementById(

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
                Submit the Hospital Readiness Assessment to display the current operational drivers.
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