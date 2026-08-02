/**
 * Dashboard
 *
 * Main EDORI operational dashboard.
 *
 * Responsibilities:
 *
 * - Render dashboard components
 * - Initialize dashboard behavior
 * - Display the latest authoritative result
 * - Build the trigger-adjusted operational level
 * - Display assessment freshness
 *
 * This component does not calculate EDORI.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    AssessmentHistory,

    initializeAssessmentHistory

}

from "./AssessmentHistory";


import {

    Drivers,

    initializeDrivers

}

from "./Drivers";


import {

    ExecutiveSummary,

    initializeExecutiveSummary

}

from "./ExecutiveSummary";


import {

    Gauge,

    initializeGauge

}

from "./Gauge";


import {

    HistoricalDataManager,

    initializeHistoricalDataManager

}

from "./HistoricalDataManager";


import {

    OperationalOverview,

    initializeOperationalOverview

}

from "./OperationalOverview";


import {

    OperationalTimeline,

    initializeOperationalTimeline

}

from "./OperationalTimeline";


import {

    Recommendations,

    initializeRecommendations

}

from "./Recommendations";


import {

    SummaryCards,

    initializeSummaryCards

}

from "./SummaryCards";


import {

    TrendChart,

    initializeTrendChart

}

from "./TrendChart";


import {

    SituationAssessment,

    initializeSituationAssessment

}

from "./assessment/SituationAssessment";


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

    OperationalState

}

from "../config/operationalStates";


import type {

    SituationAssessment as SituationAssessmentType

}

from "../types/SituationAssessment";


/**
 * Render the complete EDORI dashboard.
 */
export function Dashboard():string {

    return `

        <main class="dashboard">

            <div class="dashboard-header">

                <div
                    id="statusBanner"
                    class="
                        status-banner
                        status-awaiting-assessment
                    "
                    aria-live="polite"
                >

                    ${createAwaitingAssessmentBanner()}

                </div>


                <div class="dashboard-title-group">

                    <h2>
                        Emergency Department Dashboard
                    </h2>

                    <p>
                        Operational Readiness Overview
                    </p>

                </div>


                <div
                    id="assessmentFreshness"
                    class="assessment-freshness"
                    aria-live="polite"
                >

                    Assessment not yet calculated.

                </div>

            </div>


            ${ExecutiveSummary()}


            ${SummaryCards()}


            <div class="dashboard-grid">

                <div class="left-column">

                    ${SituationAssessment()}

                </div>


                <div class="right-column">

                    ${Gauge()}

                    ${OperationalOverview()}

                    ${Drivers()}

                    ${Recommendations()}

                    ${TrendChart()}

                    ${OperationalTimeline()}

                    ${AssessmentHistory()}

                    ${HistoricalDataManager()}

                </div>

            </div>

        </main>

    `;

}


/**
 * Initialize all dashboard components.
 */
export function initializeDashboard():void {

    initializeSituationAssessment();

    initializeExecutiveSummary();

    initializeSummaryCards();

    initializeGauge();

    initializeOperationalOverview();

    initializeDrivers();

    initializeRecommendations();

    initializeTrendChart();

    initializeOperationalTimeline();

    initializeAssessmentHistory();

    initializeHistoricalDataManager();


    updateDashboard();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateDashboard

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateDashboard

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateDashboard

    );

}


/**
 * Update the dashboard banner and assessment
 * freshness from authoritative services.
 */
function updateDashboard():void {

    const assessment = getState();


    updateAssessmentFreshness(

        assessment

    );


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        updateRecalculationRequiredBanner(

            invalidationReason

        );


        return;

    }


    const result = getLatestResult();


    if(

        !result

        ||

        !hasCommittedAssessment()

    ){

        updateAwaitingAssessmentBanner();


        return;

    }


    try {

        const operationalAssessment =

            createOperationalAssessment({

                assessment,

                result,

                snapshots:
                    getSnapshots(),

                evaluatedAt:
                    new Date()

            });


        updateStatusBanner(

            operationalAssessment
                .scoreResult
                .score,

            operationalAssessment
                .finalOperationalState,

            operationalAssessment
                .baseOperationalState
                .title,

            operationalAssessment
                .activeTriggers
                .length

        );

    }
    catch(error){

        console.error(

            "Unable to build the dashboard operational assessment:",

            error

        );


        /*
         * Fall back to the score-derived state so
         * the dashboard remains usable.
         */

        updateStatusBanner(

            result.score,

            result.operationalState,

            result.operationalState.title,

            0

        );

    }

}


/**
 * Display the current trigger-adjusted
 * operational status banner.
 */
function updateStatusBanner(

    score:number,

    operationalState:OperationalState,

    baseStateTitle:string,

    activeTriggerCount:number

):void {

    const banner = document.getElementById(

        "statusBanner"

    );


    if(!banner){

        return;

    }


    const safeScore = Math.min(

        100,

        Math.max(

            0,

            Math.round(

                score

            )

        )

    );


    const stateClass = createStateClassName(

        operationalState.title

    );


    const stateWasEscalated =

        operationalState.title

        !==

        baseStateTitle;


    const triggerText =

        activeTriggerCount === 1

            ? "1 active operational trigger"

            : `${activeTriggerCount} active operational triggers`;


    banner.className =

        `status-banner ${stateClass}`;


    banner.style.setProperty(

        "--status-color",

        operationalState.color

    );


    banner.innerHTML = `

        <div class="status-header">

            <div
                id="statusIcon"
                class="status-icon"
                aria-hidden="true"
            >

                ${escapeHtml(
                    operationalState.icon
                )}

            </div>


            <div class="status-title-group">

                <div
                    id="statusTitle"
                    class="status-title"
                >

                    ${escapeHtml(
                        operationalState.title
                    )}

                </div>


                <div class="status-score">

                    EDORI Score:

                    <strong>

                        ${safeScore}

                    </strong>

                </div>

            </div>

        </div>


        <div class="status-recommendation">

            ${escapeHtml(
                operationalState.recommendation
            )}

        </div>


        <div class="status-context">

            <span>

                Score-derived level:

                <strong>

                    ${escapeHtml(
                        baseStateTitle
                    )}

                </strong>

            </span>


            <span>

                ${escapeHtml(
                    triggerText
                )}

            </span>


            ${stateWasEscalated

                ? `

                    <span class="status-escalation-note">

                        Operational triggers elevated the final level.

                    </span>

                `

                : ""

            }

        </div>

    `;

}


/**
 * Display a recalculation-required banner.
 */
function updateRecalculationRequiredBanner(

    reason:string

):void {

    const banner = document.getElementById(

        "statusBanner"

    );


    if(!banner){

        return;

    }


    banner.className =

        "status-banner status-recalculation-required";


    banner.style.removeProperty(

        "--status-color"

    );


    banner.innerHTML = `

        <div class="status-header">

            <div
                id="statusIcon"
                class="status-icon"
                aria-hidden="true"
            >

                ⚠️

            </div>


            <div class="status-title-group">

                <div
                    id="statusTitle"
                    class="status-title"
                >

                    Recalculation Required

                </div>


                <div class="status-score">

                    The previous EDORI result is no longer current.

                </div>

            </div>

        </div>


        <div class="status-recommendation">

            ${escapeHtml(reason)}

            Review the current operational values and select

            <strong>
                Calculate EDORI
            </strong>

            to generate an updated result.

        </div>

    `;

}


/**
 * Display the initial awaiting-assessment banner.
 */
function updateAwaitingAssessmentBanner():void {

    const banner = document.getElementById(

        "statusBanner"

    );


    if(!banner){

        return;

    }


    banner.className =

        "status-banner status-awaiting-assessment";


    banner.style.removeProperty(

        "--status-color"

    );


    banner.innerHTML =

        createAwaitingAssessmentBanner();

}


/**
 * Create the initial banner markup.
 */
function createAwaitingAssessmentBanner():string {

    return `

        <div class="status-header">

            <div
                id="statusIcon"
                class="status-icon"
                aria-hidden="true"
            >

                ◯

            </div>


            <div class="status-title-group">

                <div
                    id="statusTitle"
                    class="status-title"
                >

                    Awaiting Assessment

                </div>


                <div class="status-score">

                    No current EDORI result is available.

                </div>

            </div>

        </div>


        <div class="status-recommendation">

            Complete the Situation Assessment and select

            <strong>
                Calculate EDORI
            </strong>

            to generate the operational readiness assessment.

        </div>

    `;

}


/**
 * Display the age of the most recently committed
 * assessment.
 */
function updateAssessmentFreshness(

    assessment:SituationAssessmentType

):void {

    const element = document.getElementById(

        "assessmentFreshness"

    );


    if(!element){

        return;

    }


    element.classList.remove(

        "assessment-current",

        "assessment-warning",

        "assessment-critical",

        "assessment-recalculation"

    );


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        element.textContent =

            "The current operational assessment requires recalculation.";


        element.classList.add(

            "assessment-recalculation"

        );


        return;

    }


    if(

        !hasCommittedAssessment()

        ||

        !assessment.assessmentTime

    ){

        element.textContent =

            "Assessment not yet calculated.";


        return;

    }


    const assessmentDate = new Date(

        assessment.assessmentTime

    );


    if(

        Number.isNaN(

            assessmentDate.getTime()

        )

    ){

        element.textContent =

            "Assessment time is unavailable.";


        element.classList.add(

            "assessment-warning"

        );


        return;

    }


    const elapsedMilliseconds = Math.max(

        0,

        new Date().getTime()

        -

        assessmentDate.getTime()

    );


    const minutes = Math.floor(

        elapsedMilliseconds

        /

        60000

    );


    element.textContent =

        createFreshnessMessage(

            minutes,

            assessmentDate

        );


    if(minutes < 30){

        element.classList.add(

            "assessment-current"

        );


        return;

    }


    if(minutes < 60){

        element.classList.add(

            "assessment-warning"

        );


        return;

    }


    element.classList.add(

        "assessment-critical"

    );

}


/**
 * Create a readable assessment-age message.
 */
function createFreshnessMessage(

    minutes:number,

    assessmentDate:Date

):string {

    const timeText = assessmentDate.toLocaleTimeString(

        [],

        {

            hour:
                "2-digit",

            minute:
                "2-digit"

        }

    );


    if(minutes === 0){

        return `Calculated less than one minute ago at ${timeText}`;

    }


    if(minutes === 1){

        return `Calculated 1 minute ago at ${timeText}`;

    }


    if(minutes < 60){

        return `Calculated ${minutes} minutes ago at ${timeText}`;

    }


    const hours = Math.floor(

        minutes / 60

    );


    const remainingMinutes =

        minutes % 60;


    if(remainingMinutes === 0){

        return hours === 1

            ? `Calculated 1 hour ago at ${timeText}`

            : `Calculated ${hours} hours ago at ${timeText}`;

    }


    const hourText = hours === 1

        ? "1 hour"

        : `${hours} hours`;


    const minuteText = remainingMinutes === 1

        ? "1 minute"

        : `${remainingMinutes} minutes`;


    return `Calculated ${hourText} and ${minuteText} ago at ${timeText}`;

}


/**
 * Convert a state title into a valid CSS class.
 */
function createStateClassName(

    title:string

):string {

    return `status-${title

        .toLowerCase()

        .replaceAll(

            "&",

            "and"

        )

        .replace(

            /[^a-z0-9]+/g,

            "-"

        )

        .replace(

            /^-+|-+$/g,

            ""

        )}`;

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