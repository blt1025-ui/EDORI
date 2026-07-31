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
 * The dashboard does not calculate EDORI.
 * It displays the latest submitted result.
 */

import {

    AssessmentHistory,

    initializeAssessmentHistory

}

from "./AssessmentHistory";


import {

    SummaryCards,

    initializeSummaryCards

}

from "./SummaryCards";


import {

    SituationAssessment,

    initializeSituationAssessment

}

from "./assessment/SituationAssessment";


import {

    Gauge,

    initializeGauge

}

from "./Gauge";


import {

    Drivers,

    initializeDrivers

}

from "./Drivers";


import {

    Recommendations,

    initializeRecommendations

}

from "./Recommendations";


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

    getLatestResult

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
 * Render the main operational dashboard.
 */
export function Dashboard():string {

    return `

        <main class="dashboard">

            <div class="dashboard-header">

                <div
                    id="statusBanner"
                    class="status-banner"
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

    initializeSummaryCards();

    initializeGauge();

    initializeDrivers();

    initializeRecommendations();

    initializeTrendChart();

    initializeAssessmentHistory();


    /*
     * Display any result already available in
     * ResultService.
     */

    updateDashboard();


    /*
     * A resultChanged event occurs only after
     * a completed assessment has been calculated.
     */

    subscribe(

        "resultChanged",

        updateDashboard

    );

}


/**
 * Update the dashboard from the most recently
 * submitted EDORI result.
 */
function updateDashboard():void {

    const state = getState();

    const result = getLatestResult();


    if(!result){

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
 * Update the operational status banner.
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


    banner.innerHTML = `

        <div class="status-header">

            <div id="statusIcon">

                ${escapeHtml(operationalState.icon)}

            </div>


            <div>

                <div id="statusTitle">

                    ${escapeHtml(operationalState.title)}

                </div>


                <div class="status-score">

                    EDORI Score: ${Math.round(result.score)}

                </div>

            </div>

        </div>


        <div class="status-recommendation">

            ${escapeHtml(operationalState.recommendation)}

        </div>

    `;


    banner.style.borderLeftColor =

        operationalState.color;

}


/**
 * Display the initial dashboard state before
 * the first submitted assessment.
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
 * Create a CSS-safe class from an operational
 * state title.
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

        "assessment-critical"

    );


    if(!state.assessmentTime){

        element.textContent =

            "Assessment not yet calculated.";

        return;

    }


    const assessmentDate = new Date(

        state.assessmentTime

    );


    if(Number.isNaN(assessmentDate.getTime())){

        element.textContent =

            "Assessment time unavailable.";

        return;

    }


    const minutes = Math.max(

        0,

        Math.floor(

            (

                Date.now() -

                assessmentDate.getTime()

            ) /

            60000

        )

    );


    element.textContent = formatAssessmentAge(

        minutes

    );


    /*
     * Freshness categories:
     *
     * Under 30 minutes: current
     * 30–59 minutes: warning
     * 60+ minutes: critical/stale
     */

    if(minutes >= 60){

        element.classList.add(

            "assessment-critical"

        );

    }
    else if(minutes >= 30){

        element.classList.add(

            "assessment-warning"

        );

    }

}


/**
 * Format assessment age for display.
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


        return `Last calculated 1 hour and ${remainingMinutes} minutes ago`;

    }


    if(remainingMinutes === 0){

        return `Last calculated ${hours} hours ago`;

    }


    return `Last calculated ${hours} hours and ${remainingMinutes} minutes ago`;

}


/**
 * Escape values before inserting them into HTML.
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