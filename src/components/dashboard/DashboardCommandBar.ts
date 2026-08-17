/**
 * DashboardCommandBar
 *
 * Displays the high-level EDORI operational status
 * at the top of the dashboard.
 *
 * Information displayed:
 *
 * - Final Alpha–Echo operational level
 * - Current EDORI score
 * - Score change
 * - Risk direction
 * - Active operational triggers
 * - Assessment freshness
 *
 * This component does not calculate EDORI or
 * modify application state.
 */

import {

    APP_EVENTS

}

from "../../config/appEvents";


import {

    subscribe

}

from "../../services/EventService";


import {

    createOperationalAssessment

}

from "../../services/OperationalAssessmentService";


import {

    getLatestResult,

    getResultInvalidationReason

}

from "../../services/ResultService";


import {

    getSnapshots

}

from "../../services/SnapshotService";


import {

    getState,

    hasCommittedAssessment

}

from "../../services/StateService";


import type {

    EdoriSnapshot

}

from "../../types/EdoriSnapshot";


/**
 * Render the command-bar container.
 */
export function DashboardCommandBar():string {

    return `

        <section
            id="dashboardCommandBar"
            class="
                dashboard-command-bar
                dashboard-command-bar-awaiting
            "
            aria-live="polite"
        >

            ${createAwaitingMarkup()}

        </section>

    `;

}


/**
 * Initialize command-bar behavior.
 */
export function initializeDashboardCommandBar():void {

    updateDashboardCommandBar();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateDashboardCommandBar

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateDashboardCommandBar

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateDashboardCommandBar

    );


    /*
     * Refresh assessment freshness every minute.
     */
    window.setInterval(

        updateDashboardCommandBar,

        60_000

    );

}


/**
 * Refresh the command bar from authoritative
 * application services.
 */
function updateDashboardCommandBar():void {

    const container = document.getElementById(

        "dashboardCommandBar"

    );


    if(!container){

        return;

    }


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        container.className =

            "dashboard-command-bar dashboard-command-bar-recalculation";


        container.style.removeProperty(

            "--command-level-color"

        );


        container.innerHTML =

            createRecalculationMarkup(

                invalidationReason

            );


        return;

    }


    if(!hasCommittedAssessment()){

        container.className =

            "dashboard-command-bar dashboard-command-bar-awaiting";


        container.style.removeProperty(

            "--command-level-color"

        );


        container.innerHTML =

            createAwaitingMarkup();


        return;

    }


    const result = getLatestResult();


    if(!result){

        container.className =

            "dashboard-command-bar dashboard-command-bar-awaiting";


        container.style.removeProperty(

            "--command-level-color"

        );


        container.innerHTML =

            createAwaitingMarkup();


        return;

    }


    try {

        const assessment = getState();

        const snapshots = getSnapshots();


        const operationalAssessment =

            createOperationalAssessment({

                assessment,

                result,

                snapshots,

                evaluatedAt:
                    new Date()

            });


        const finalState =

            operationalAssessment
                .finalOperationalState;


        const score = Math.round(

            operationalAssessment
                .scoreResult
                .score

        );


        const scoreChange =

            determineScoreChange(

                snapshots,

                score

            );


        const activeTriggerCount =

            operationalAssessment
                .activeTriggers
                .length;


        const levelEscalated =

            finalState.title

            !==

            operationalAssessment
                .baseOperationalState
                .title;


        container.className =

            `dashboard-command-bar dashboard-command-bar-${finalState.title.toLowerCase()}`;


        container.style.setProperty(

            "--command-level-color",

            finalState.color

        );


        container.innerHTML = `

            <div class="dashboard-command-primary">

                <div
                    class="dashboard-command-state-icon"
                    aria-hidden="true"
                >

                    ${escapeHtml(
                        finalState.icon
                    )}

                </div>


                <div class="dashboard-command-state">

                    <span class="dashboard-command-eyebrow">
                        Current Operational Level
                    </span>


                    <strong>

                        ${escapeHtml(
                            finalState.title
                        )}

                    </strong>


                    <small>

                        ${levelEscalated

                            ? `Elevated from ${escapeHtml(
                                operationalAssessment
                                    .baseOperationalState
                                    .title
                            )} by active triggers`

                            : `Score-derived ${escapeHtml(
                                finalState.title
                            )} level`

                        }

                    </small>

                </div>

            </div>


            <div class="dashboard-command-score">

                <span>
                    EDORI
                </span>

                <strong>
                    ${score}
                </strong>

                <small class="${createScoreChangeClass(
                    scoreChange
                )}">

                    ${createScoreChangeText(
                        scoreChange
                    )}

                </small>

            </div>


            <div class="dashboard-command-metrics">

                ${createCommandMetric(

                    "Trend",

                    operationalAssessment
                        .riskDirection,

                    createTrendClass(
                        operationalAssessment
                            .riskDirection
                    )

                )}


                ${createCommandMetric(

                    "Active Triggers",

                    String(
                        activeTriggerCount
                    ),

                    activeTriggerCount > 0

                        ? "dashboard-command-value-warning"

                        : "dashboard-command-value-stable"

                )}


                ${createCommandMetric(

                    "Assessment Age",

                    createAssessmentAge(

                        assessment.assessmentTime

                    ),

                    createFreshnessClass(

                        assessment.assessmentTime

                    )

                )}

            </div>


            <div class="dashboard-command-recommendation">

                <span>
                    Operational Guidance
                </span>

                <p>

                    ${escapeHtml(
                        finalState.recommendation
                    )}

                </p>

            </div>

        `;

    }
    catch(error){

        console.error(

            "Unable to update the dashboard command bar:",

            error

        );


        container.className =

            "dashboard-command-bar dashboard-command-bar-error";


        container.style.removeProperty(

            "--command-level-color"

        );


        container.innerHTML = `

            <div class="dashboard-command-message">

                <div
                    class="dashboard-command-message-icon"
                    aria-hidden="true"
                >
                    ⚠️
                </div>

                <div>

                    <strong>
                        Operational status unavailable
                    </strong>

                    <p>
                        Review the browser console for additional details.
                    </p>

                </div>

            </div>

        `;

    }

}


/**
 * Create one command-bar metric.
 */
function createCommandMetric(

    label:string,

    value:string,

    valueClass:string

):string {

    return `

        <div class="dashboard-command-metric">

            <span>

                ${escapeHtml(
                    label
                )}

            </span>

            <strong class="${escapeAttribute(
                valueClass
            )}">

                ${escapeHtml(
                    value
                )}

            </strong>

        </div>

    `;

}


/**
 * Create the initial command-bar state.
 */
function createAwaitingMarkup():string {

    return `

        <div class="dashboard-command-message">

            <div
                class="dashboard-command-message-icon"
                aria-hidden="true"
            >
                ◯
            </div>


            <div>

                <strong>
                    Awaiting EDORI Assessment
                </strong>

                <p>
                    Complete the Situation Assessment and select Calculate & Save Assessment.
                </p>

            </div>

        </div>


        <div class="dashboard-command-awaiting-metrics">

            <div>

                <span>
                    Operational Level
                </span>

                <strong>
                    --
                </strong>

            </div>


            <div>

                <span>
                    EDORI Score
                </span>

                <strong>
                    --
                </strong>

            </div>


            <div>

                <span>
                    Assessment Status
                </span>

                <strong>
                    Not calculated
                </strong>

            </div>

        </div>

    `;

}


/**
 * Create the recalculation-required state.
 */
function createRecalculationMarkup(

    reason:string

):string {

    return `

        <div class="dashboard-command-message">

            <div
                class="dashboard-command-message-icon"
                aria-hidden="true"
            >
                ⚠️
            </div>


            <div>

                <strong>
                    Recalculation Required
                </strong>

                <p>

                    ${escapeHtml(
                        reason
                    )}

                </p>

            </div>

        </div>


        <div class="dashboard-command-recalculation-action">

            Review the current values and select

            <strong>
                Calculate & Save Assessment
            </strong>

            to refresh and save the operational assessment.

        </div>

    `;

}


/**
 * Determine the current score change.
 */
function determineScoreChange(

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


    const latestSnapshot = validSnapshots[

        validSnapshots.length - 1

    ];


    if(

        Math.abs(

            latestSnapshot.score

            -

            currentScore

        )

        <

        0.001

    ){

        if(validSnapshots.length < 2){

            return null;

        }


        return currentScore

            -

            validSnapshots[

                validSnapshots.length - 2

            ].score;

    }


    return currentScore

        -

        latestSnapshot.score;

}


/**
 * Create score-change text.
 */
function createScoreChangeText(

    scoreChange:number | null

):string {

    if(scoreChange === null){

        return "No prior comparison";

    }


    const roundedChange = Math.round(

        scoreChange

    );


    if(roundedChange > 0){

        return `▲ +${roundedChange} from previous`;

    }


    if(roundedChange < 0){

        return `▼ ${roundedChange} from previous`;

    }


    return "No score change";

}


/**
 * Create score-change styling.
 */
function createScoreChangeClass(

    scoreChange:number | null

):string {

    if(scoreChange === null){

        return "dashboard-command-score-neutral";

    }


    if(scoreChange > 0){

        return "dashboard-command-score-worsening";

    }


    if(scoreChange < 0){

        return "dashboard-command-score-improving";

    }


    return "dashboard-command-score-neutral";

}


/**
 * Create assessment-age text.
 */
function createAssessmentAge(

    value:Date | string

):string {

    const date = new Date(

        value

    );


    if(Number.isNaN(date.getTime())){

        return "Unavailable";

    }


    const elapsedMinutes = Math.max(

        0,

        Math.floor(

            (

                Date.now()

                -

                date.getTime()

            )

            /

            60_000

        )

    );


    if(elapsedMinutes < 1){

        return "< 1 minute";

    }


    if(elapsedMinutes < 60){

        return `${elapsedMinutes} min`;

    }


    const hours = Math.floor(

        elapsedMinutes / 60

    );


    const minutes = elapsedMinutes % 60;


    if(minutes === 0){

        return `${hours} hr`;

    }


    return `${hours} hr ${minutes} min`;

}


/**
 * Create freshness styling.
 */
function createFreshnessClass(

    value:Date | string

):string {

    const date = new Date(

        value

    );


    if(Number.isNaN(date.getTime())){

        return "dashboard-command-value-warning";

    }


    const elapsedMinutes = Math.max(

        0,

        (

            Date.now()

            -

            date.getTime()

        )

        /

        60_000

    );


    if(elapsedMinutes < 30){

        return "dashboard-command-value-stable";

    }


    if(elapsedMinutes < 60){

        return "dashboard-command-value-warning";

    }


    return "dashboard-command-value-critical";

}


/**
 * Create trend styling.
 */
function createTrendClass(

    direction:string

):string {

    const normalized = direction

        .trim()

        .toLowerCase();


    if(

        normalized.includes(

            "improv"

        )

        ||

        normalized.includes(

            "decreas"

        )

    ){

        return "dashboard-command-value-stable";

    }


    if(

        normalized.includes(

            "rapid"

        )

        ||

        normalized.includes(

            "worsen"

        )

        ||

        normalized.includes(

            "increas"

        )

    ){

        return "dashboard-command-value-critical";

    }


    return "dashboard-command-value-neutral";

}


/**
 * Escape HTML content.
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
 * Escape an HTML attribute.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}