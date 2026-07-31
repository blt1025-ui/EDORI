/**
 * Dashboard
 *
 * Main EDORI operational dashboard.
 *
 * Data flow:
 *
 * Situation Assessment
 *        ↓
 * State Service
 *        ↓
 * Validation
 *        ↓
 * EDORI Calculation Engine
 *        ↓
 * Result Service
 *        ↓
 * Dashboard Displays
 *
 * Historical data changes invalidate the latest
 * EDORI result and require recalculation.
 */

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

    Recommendations,

    initializeRecommendations

}

from "./Recommendations";


import {

    SituationAssessment,

    initializeSituationAssessment

}

from "./assessment/SituationAssessment";


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

    subscribe

}

from "../services/EventService";


import {

    getState

}

from "../services/StateService";


import {

    getLatestResult,

    getResultInvalidationReason

}

from "../services/ResultService";


import type {

    EdoriResult

}

from "../types/EdoriResult";


import type {

    SituationAssessment as SituationAssessmentType

}

from "../types/SituationAssessment";


/**
 * Render the main EDORI dashboard.
 */
export function Dashboard():string {

    return `

        <main class="dashboard">

            <div class="dashboard-header">

                <div
                    id="statusBanner"
                    class="status-banner status-awaiting"
                >

                    <div class="status-header">

                        <div id="statusIcon">

                            ⚪

                        </div>


                        <div>

                            <div id="statusTitle">

                                Awaiting Assessment

                            </div>


                            <div class="status-score">

                                EDORI Score: --

                            </div>

                        </div>

                    </div>


                    <div class="status-recommendation">

                        Complete the situation assessment and select Calculate EDORI.

                    </div>

                </div>


                <h2>

                    Emergency Department Dashboard

                </h2>


                <p>

                    Operational Readiness Overview

                </p>


                <div
                    id="assessmentFreshness"
                    class="assessment-freshness"
                >

                    Assessment not yet calculated.

                </div>

            </div>


            ${SummaryCards()}


            <div class="dashboard-grid">

                <div class="left-column">

                    ${SituationAssessment()}

                </div>


                <div class="right-column">

                    ${Gauge()}

                    ${Drivers()}

                    ${Recommendations()}

                    ${TrendChart()}

                    ${AssessmentHistory()}

                    ${HistoricalDataManager()}

                </div>

            </div>

        </main>

    `;

}


/**
 * Initialize the dashboard and all child components.
 */
export function initializeDashboard():void {

    initializeSituationAssessment();

    initializeSummaryCards();

    initializeGauge();

    initializeDrivers();

    initializeRecommendations();

    initializeTrendChart();

    initializeAssessmentHistory();

    initializeHistoricalDataManager();


    /*
     * Restore the most recent valid result or
     * invalidation state when the page opens.
     */

    updateDashboard();


    /*
     * resultChanged is emitted after:
     *
     * - a new EDORI calculation;
     * - a historical dataset import;
     * - restoration of the built-in dataset.
     */

    subscribe(

        "resultChanged",

        updateDashboard

    );

}


/**
 * Update the dashboard from ResultService.
 */
function updateDashboard():void {

    const state = getState();


    const result = getLatestResult();


    const invalidationReason =

        getResultInvalidationReason();


    /*
     * Historical-data changes invalidate the latest
     * score until the assessment is recalculated.
     */

    if(!result){

        if(invalidationReason){

            showRecalculationRequired(

                invalidationReason

            );


            updateRecalculationFreshness();


            return;

        }


        showAwaitingAssessment();


        updateAssessmentFreshness(

            state

        );


        return;

    }


    updateStatusBanner(

        result

    );


    updateAssessmentFreshness(

        state

    );

}


/**
 * Display the latest operational state.
 */
function updateStatusBanner(

    result:EdoriResult

):void {

    const banner = document.getElementById(

        "statusBanner"

    );


    if(!banner){

        return;

    }


    const operationalState =

        result.operationalState;


    const stateClass = createStateClass(

        operationalState.title

    );


    banner.className =

        `status-banner ${stateClass}`;


    banner.style.borderLeftColor =

        operationalState.color;


    banner.innerHTML = `

        <div class="status-header">

            <div id="statusIcon">

                ${escapeHtml(

                    operationalState.icon

                )}

            </div>


            <div>

                <div id="statusTitle">

                    ${escapeHtml(

                        operationalState.title

                    )}

                </div>


                <div class="status-score">

                    EDORI Score: ${Math.round(

                        result.score

                    )}

                </div>

            </div>

        </div>


        <div class="status-recommendation">

            ${escapeHtml(

                operationalState.recommendation

            )}

        </div>

    `;

}


/**
 * Display the initial state before an assessment
 * has been calculated.
 */
function showAwaitingAssessment():void {

    const banner = document.getElementById(

        "statusBanner"

    );


    if(!banner){

        return;

    }


    banner.className =

        "status-banner status-awaiting";


    banner.style.removeProperty(

        "border-left-color"

    );


    banner.innerHTML = `

        <div class="status-header">

            <div id="statusIcon">

                ⚪

            </div>


            <div>

                <div id="statusTitle">

                    Awaiting Assessment

                </div>


                <div class="status-score">

                    EDORI Score: --

                </div>

            </div>

        </div>


        <div class="status-recommendation">

            Complete the situation assessment and select Calculate EDORI.

        </div>

    `;

}


/**
 * Display that the previous result is no longer
 * valid because the historical dataset changed.
 */
function showRecalculationRequired(

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

        "border-left-color"

    );


    banner.innerHTML = `

        <div class="status-header">

            <div id="statusIcon">

                ⚠️

            </div>


            <div>

                <div id="statusTitle">

                    Recalculation Required

                </div>


                <div class="status-score">

                    EDORI Score: --

                </div>

            </div>

        </div>


        <div class="status-recommendation">

            ${escapeHtml(reason)}

            Submit the assessment again to calculate EDORI using the active historical dataset.

        </div>

    `;

}


/**
 * Create a CSS-safe operational-state class.
 */
function createStateClass(

    title:string

):string {

    return title

        .trim()

        .toLowerCase()

        .replaceAll(

            " ",

            "-"

        )

        .replace(

            /[^a-z0-9-]/g,

            ""

        );

}


/**
 * Display the age of the committed assessment.
 */
function updateAssessmentFreshness(

    state:SituationAssessmentType

):void {

    const element = document.getElementById(

        "assessmentFreshness"

    );


    if(!element){

        return;

    }


    element.classList.remove(

        "assessment-warning",

        "assessment-critical",

        "assessment-recalculation"

    );


    if(!state.assessmentTime){

        element.textContent =

            "Assessment not yet calculated.";


        return;

    }


    const assessmentDate = new Date(

        state.assessmentTime

    );


    if(Number.isNaN(

        assessmentDate.getTime()

    )){

        element.textContent =

            "Assessment time unavailable.";


        return;

    }


    const minutes = Math.max(

        0,

        Math.floor(

            (

                Date.now()

                -

                assessmentDate.getTime()

            )

            /

            60000

        )

    );


    element.textContent =

        formatAssessmentAge(

            minutes

        );


    /*
     * Freshness categories:
     *
     * Less than 30 minutes:
     * Current
     *
     * 30–59 minutes:
     * Warning
     *
     * 60 minutes or more:
     * Stale
     */

    if(minutes >= 60){

        element.classList.add(

            "assessment-critical"

        );


        return;

    }


    if(minutes >= 30){

        element.classList.add(

            "assessment-warning"

        );

    }

}


/**
 * Display freshness state after result invalidation.
 */
function updateRecalculationFreshness():void {

    const element = document.getElementById(

        "assessmentFreshness"

    );


    if(!element){

        return;

    }


    element.classList.remove(

        "assessment-warning",

        "assessment-critical"

    );


    element.classList.add(

        "assessment-recalculation"

    );


    element.textContent =

        "The previous EDORI result is no longer current.";

}


/**
 * Format the assessment age.
 */
function formatAssessmentAge(

    minutes:number

):string {

    if(minutes === 0){

        return "Last calculated less than one minute ago";

    }


    if(minutes === 1){

        return "Last calculated 1 minute ago";

    }


    if(minutes < 60){

        return `Last calculated ${minutes} minutes ago`;

    }


    const hours = Math.floor(

        minutes / 60

    );


    const remainingMinutes =

        minutes % 60;


    if(hours === 1){

        if(remainingMinutes === 0){

            return "Last calculated 1 hour ago";

        }


        if(remainingMinutes === 1){

            return "Last calculated 1 hour and 1 minute ago";

        }


        return `Last calculated 1 hour and ${remainingMinutes} minutes ago`;

    }


    if(remainingMinutes === 0){

        return `Last calculated ${hours} hours ago`;

    }


    if(remainingMinutes === 1){

        return `Last calculated ${hours} hours and 1 minute ago`;

    }


    return `Last calculated ${hours} hours and ${remainingMinutes} minutes ago`;

}


/**
 * Escape text before inserting it into HTML.
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