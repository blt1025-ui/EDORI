/**
 * ExecutiveAssessmentReport
 *
 * Creates a printable leadership report from the
 * authoritative Hospital Readiness OperationalAssessment.
 *
 * The report uses the browser print dialog, which
 * allows the user to print the report or save it as
 * a PDF.
 *
 * This component does not:
 *
 * - Calculate Hospital Readiness
 * - Modify application state
 * - Save assessment history
 * - Reevaluate operational triggers
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


import type {

    OperationalRecommendation

}

from "../types/OperationalRecommendation";


/**
 * Physical ED treatment-bed capacity used only for
 * contextual ED capacity-use reporting.
 */
const ED_TREATMENT_BEDS = 63;


/**
 * Maximum number of condensed report items.
 */
const MAXIMUM_REPORT_DRIVERS = 5;

const MAXIMUM_REPORT_TRIGGERS = 8;

const MAXIMUM_REPORT_ACTIONS = 8;


/**
 * Render the Executive Assessment Report panel.
 */
export function ExecutiveAssessmentReport():string {

    return `

        <section class="executive-report-container">

            <div class="panel-header executive-report-panel-header">

                <div>

                    <h3>
                        Executive Assessment Report
                    </h3>

                    <p class="panel-description">
                        Printable leadership summary of the current Hospital Readiness assessment
                    </p>

                </div>


                <button
                    id="printExecutiveReportButton"
                    class="executive-report-print-button"
                    type="button"
                    disabled
                >
                    Print / Save as PDF
                </button>

            </div>


            <div
                id="executiveReportMessage"
                class="executive-report-message"
                aria-live="polite"
            >
            </div>


            <div
                id="executiveReportContent"
                class="executive-report-content"
                aria-live="polite"
            >

                ${createAwaitingAssessmentState()}

            </div>

        </section>

    `;

}


/**
 * Initialize executive-report behavior.
 */
export function initializeExecutiveAssessmentReport():void {

    const printButton = document.getElementById(

        "printExecutiveReportButton"

    );


    printButton?.addEventListener(

        "click",

        handlePrintExecutiveReport

    );


    updateExecutiveAssessmentReport();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateExecutiveAssessmentReport

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateExecutiveAssessmentReport

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateExecutiveAssessmentReport

    );

}


/**
 * Refresh the report using authoritative services.
 */
function updateExecutiveAssessmentReport():void {

    const container = document.getElementById(

        "executiveReportContent"

    );


    if(!container){

        return;

    }


    clearReportMessage();


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        updatePrintButton(

            false

        );


        container.innerHTML =

            createRecalculationRequiredState(

                invalidationReason

            );


        return;

    }


    if(!hasCommittedAssessment()){

        updatePrintButton(

            false

        );


        container.innerHTML =

            createAwaitingAssessmentState();


        return;

    }


    const result = getLatestResult();


    if(!result){

        updatePrintButton(

            false

        );


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

            createExecutiveReportMarkup(

                operationalAssessment,

                snapshots

            );


        updatePrintButton(

            true

        );

    }
    catch(error){

        console.error(

            "Unable to create the executive assessment report:",

            error

        );


        updatePrintButton(

            false

        );


        container.innerHTML = `

            <div class="executive-report-empty error">

                <strong>
                    Executive report unavailable
                </strong>

                <p>
                    Review the browser console for additional details.
                </p>

            </div>

        `;

    }

}


/**
 * Create the completed report markup.
 */
function createExecutiveReportMarkup(

    operationalAssessment:OperationalAssessment,

    snapshots:EdoriSnapshot[]

):string {

    const assessment =
        operationalAssessment.assessment;

    const result =
        operationalAssessment.scoreResult;

    const finalState =
        operationalAssessment.finalOperationalState;
    const score = Math.round(
        result.score
    );

    const scoreChange = determineScoreChange(
        snapshots,
        score
    );

    const edCapacityPercent = calculatePercentage(
        assessment.totalEDVolume,
        ED_TREATMENT_BEDS
    );

    const boardingShare = calculatePercentage(
        assessment.boardedPatients,
        assessment.totalEDVolume
    );

    const acuteOccupancy = calculatePercentage(
        assessment.occupiedAcuteCareBeds,
        assessment.staffedAcuteCareBeds
    );

    const criticalOccupancy = calculatePercentage(
        assessment.occupiedCriticalCareBeds,
        assessment.staffedCriticalCareBeds
    );

    const highAcuityCount =
        assessment.esi1 + assessment.esi2;

    const lowerAcuityCount = Math.max(
        0,
        assessment.totalEDVolume - highAcuityCount
    );

    const highAcuityPercent = calculatePercentage(
        highAcuityCount,
        assessment.totalEDVolume
    );

    const leadingDrivers =
        operationalAssessment.primaryDrivers
            .slice()
            .sort(
                (first, second) =>
                    second.severity - first.severity
            )
            .slice(
                0,
                MAXIMUM_REPORT_DRIVERS
            );

    const activeTriggers =
        operationalAssessment.activeTriggers
            .slice(
                0,
                MAXIMUM_REPORT_TRIGGERS
            );

    const recommendations =
        operationalAssessment.recommendations
            .slice()
            .sort(
                compareRecommendations
            )
            .slice(
                0,
                MAXIMUM_REPORT_ACTIONS
            );
    return `

        <article
            id="executiveAssessmentPrintableReport"
            class="executive-assessment-report"
        >

            <header class="executive-report-header">

                <div>

                    <span class="executive-report-eyebrow">
                        Hospital Readiness Index
                    </span>

                    <h2>
                        Executive Assessment Report
                    </h2>

                    <p>
                        Assessment completed
                        ${escapeHtml(
                            formatAssessmentTime(
                                assessment.assessmentTime
                            )
                        )}
                    </p>

                </div>

                <div class="executive-report-header-meta">

                    <span>
                        Report generated
                    </span>

                    <strong>
                        ${escapeHtml(
                            formatAssessmentTime(
                                new Date()
                            )
                        )}
                    </strong>

                </div>

            </header>


            <section
                class="executive-report-status"
                style="
                    --executive-state-color:
                    ${escapeAttribute(
                        finalState.color
                    )};
                "
            >

                <div class="executive-report-status-main">

                    <span
                        class="executive-report-status-icon"
                        aria-hidden="true"
                    >
                        ${escapeHtml(
                            finalState.icon
                        )}
                    </span>

                    <div>

                        <span class="executive-report-label">
                            Operational Level
                        </span>

                        <strong>
                            ${escapeHtml(
                                finalState.title
                            )}
                        </strong>

                    </div>

                </div>


                <div class="executive-report-score">

                    <span>
                        Hospital Readiness Score
                    </span>

                    <strong>
                        ${score}
                    </strong>

                </div>


                <div class="executive-report-status-detail">

                    <span>
                        Trend
                    </span>

                    <strong>
                        ${escapeHtml(
                            operationalAssessment.riskDirection
                        )}
                    </strong>

                </div>


                <div class="executive-report-status-detail">

                    <span>
                        Confidence
                    </span>

                    <strong>
                        ${escapeHtml(
                            operationalAssessment.confidence
                        )}
                    </strong>

                </div>

            </section>


            <div class="executive-report-context-row">

                <div>
                    <span>HRI Score-Derived Level</span>
                    <strong>
                        ${escapeHtml(
                            finalState.title
                        )}
                    </strong>
                </div>

                <div>
                    <span>Score Change</span>
                    <strong>
                        ${scoreChange === null
                            ? "No prior comparison"
                            : formatSignedNumber(
                                scoreChange
                            )
                        }
                    </strong>
                </div>

                <div>
                    <span>Active Triggers</span>
                    <strong>
                        ${operationalAssessment.activeTriggers.length}
                    </strong>
                </div>

                <div>
                    <span>Priority Actions</span>
                    <strong>
                        ${operationalAssessment.recommendations.length}
                    </strong>
                </div>

            </div>
            <section class="executive-report-section">

                <div class="executive-report-section-heading">

                    <span>
                        Hospital Readiness Domains
                    </span>

                    <h3>
                        Current Operational Pressure
                    </h3>

                </div>

                <div class="executive-report-metric-grid">

                    ${createReportMetric({
                        label:
                            "ED Operational Pressure",
                        value:
                            `${formatNumber(
                                result.edPressureScore
                            )} / 100`,
                        detail:
                            "45% of the Hospital Readiness score"
                    })}

                    ${createReportMetric({
                        label:
                            "Projected Acute-Care Capacity",
                        value:
                            `${formatNumber(
                                result.projectedCapacityScore
                            )} / 100`,
                        detail:
                            "35% of the Hospital Readiness score"
                    })}

                    ${createReportMetric({
                        label:
                            "Critical-Care Capacity",
                        value:
                            `${formatNumber(
                                result.criticalCapacityScore
                            )} / 100`,
                        detail:
                            "20% of the Hospital Readiness score"
                    })}

                </div>

            </section>


            <section class="executive-report-section">

                <div class="executive-report-section-heading">

                    <span>
                        Current Conditions
                    </span>

                    <h3>
                        ED and Hospital Capacity
                    </h3>

                </div>

                <div class="executive-report-metric-grid">

                    ${createReportMetric({
                        label:
                            "Total ED Volume",
                        value:
                            formatNumber(
                                assessment.totalEDVolume
                            ),
                        detail:
                            `${formatNumber(
                                edCapacityPercent
                            )}% of ${ED_TREATMENT_BEDS}-bed ED treatment capacity`
                    })}

                    ${createReportMetric({
                        label:
                            "Boarding Patients",
                        value:
                            formatNumber(
                                assessment.boardedPatients
                            ),
                        detail:
                            `${formatNumber(
                                boardingShare
                            )}% of ED census`
                    })}

                    ${createReportMetric({
                        label:
                            "Acute-Care Beds",
                        value:
                            `${formatNumber(
                                assessment.occupiedAcuteCareBeds
                            )} / ${formatNumber(
                                assessment.staffedAcuteCareBeds
                            )}`,
                        detail:
                            `${formatNumber(
                                acuteOccupancy
                            )}% occupied`
                    })}

                    ${createReportMetric({
                        label:
                            "Critical-Care Beds",
                        value:
                            `${formatNumber(
                                assessment.occupiedCriticalCareBeds
                            )} / ${formatNumber(
                                assessment.staffedCriticalCareBeds
                            )}`,
                        detail:
                            `${formatNumber(
                                criticalOccupancy
                            )}% occupied`
                    })}

                    ${createReportMetric({
                        label:
                            "Known Direct Admissions - Next 4 Hours",
                        value:
                            formatNumber(
                                assessment.currentDirectAdmissions
                            ),
                        detail:
                            "Known acute-care demand; no historical forward projection applied"
                    })}

                    ${createReportMetric({
                        label:
                            "Known Surgical/Procedural Admissions - Next 4 Hours",
                        value:
                            formatNumber(
                                assessment.currentSurgicalAdmissions
                            ),
                        detail:
                            "Known acute-care demand; no historical forward projection applied"
                    })}

                    ${createReportMetric({
                        label:
                            "Expected Additional ED Admissions - Next 4 Hours",
                        value:
                            formatNumber(
                                assessment.expectedEDAdmissions4h
                            ),
                        detail:
                            "Historical forecast of new ED-origin admissions; current boarders excluded"
                    })}

                    ${createReportMetric({
                        label:
                            "Expected Inpatient Departures - Next 4 Hours",
                        value:
                            formatNumber(
                                result.expectedInpatientDepartures
                            ),
                        detail:
                            "Historical forecast of beds expected to be released"
                    })}

                    ${createReportMetric({
                        label:
                            "Projected Available Acute-Care Beds",
                        value:
                            formatBedAvailability(
                                result.projectedAvailableAcuteCareBeds
                            ),
                        detail:
                            createProjectedCapacityDescription(
                                result.projectedAvailableAcuteCareBeds
                            )
                    })}

                </div>

            </section>


            <section class="executive-report-section">

                <div class="executive-report-section-heading">

                    <span>
                        Clinical Acuity
                    </span>

                    <h3>
                        Emergency Severity Index Distribution
                    </h3>

                </div>

                <div class="executive-report-esi-grid">

                    ${createEsiMetric(
                        1,
                        assessment.esi1,
                        assessment.totalEDVolume
                    )}

                    ${createEsiMetric(
                        2,
                        assessment.esi2,
                        assessment.totalEDVolume
                    )}

                    ${createGroupedEsiMetric(
                        lowerAcuityCount,
                        assessment.totalEDVolume
                    )}

                </div>

                <p>
                    High-acuity patients:
                    ${formatNumber(highAcuityCount)}
                    (${formatNumber(highAcuityPercent)}% of ED census).
                    All patients not entered as ESI 1 or ESI 2 are
                    grouped as ESI 3-5.
                </p>

            </section>


            <div class="executive-report-three-column">

                ${createDriverReportSection(
                    leadingDrivers
                )}

                ${createTriggerReportSection(
                    activeTriggers
                )}

                ${createRecommendationReportSection(
                    recommendations
                )}

            </div>


            <section class="executive-report-section">

                <div class="executive-report-section-heading">

                    <span>
                        Operational Interpretation
                    </span>

                    <h3>
                        Four-Hour Capacity Outlook
                    </h3>

                </div>

                <div class="executive-report-outlook">

                    <strong>
                        ${escapeHtml(
                            createOutlookHeading(
                                result.projectedAvailableAcuteCareBeds,
                                operationalAssessment.riskDirection
                            )
                        )}
                    </strong>

                    <p>
                        ${escapeHtml(
                            createOutlookDescription(
                                result.projectedAvailableAcuteCareBeds,
                                assessment.boardedPatients,
                                assessment.expectedEDBoarders,
                                operationalAssessment.riskDirection
                            )
                        )}
                    </p>

                </div>

            </section>


            <footer class="executive-report-footer">

                <p>
                    The Hospital Readiness Index is an operational
                    decision-support tool. Results should be interpreted
                    with clinical and administrative judgment and local
                    surge policies.
                </p>

            </footer>

        </article>

    `;

}


/**
 * Create one executive report metric.
 */
function createReportMetric(

    options:{

        label:string;

        value:string;

        detail:string;

    }

):string {

    return `

        <article class="executive-report-metric">

            <span>

                ${escapeHtml(
                    options.label
                )}

            </span>

            <strong>

                ${escapeHtml(
                    options.value
                )}

            </strong>

            <small>

                ${escapeHtml(
                    options.detail
                )}

            </small>

        </article>

    `;

}


/**
 * Create one ESI metric.
 */
function createEsiMetric(

    esiLevel:number,

    patientCount:number,

    totalEDVolume:number

):string {

    return `

        <article class="executive-report-esi-item">

            <span>
                ESI ${esiLevel}
            </span>

            <strong>
                ${formatNumber(patientCount)}
            </strong>

            <small>

                ${formatNumber(
                    calculatePercentage(
                        patientCount,
                        totalEDVolume
                    )
                )}%

            </small>

        </article>

    `;

}


/**
 * Create the inferred ESI 3-5 report metric.
 */
function createGroupedEsiMetric(

    patientCount:number,

    totalEDVolume:number

):string {

    return `

        <article class="executive-report-esi-item">

            <span>
                ESI 3-5
            </span>

            <strong>
                ${formatNumber(patientCount)}
            </strong>

            <small>
                ${formatNumber(
                    calculatePercentage(
                        patientCount,
                        totalEDVolume
                    )
                )}% · inferred
            </small>

        </article>

    `;

}


/**
 * Create the driver report section.
 */
function createDriverReportSection(

    drivers:OperationalAssessment["primaryDrivers"]

):string {

    return `

        <section class="executive-report-list-section">

            <div class="executive-report-section-heading">

                <span>
                    Contributors
                </span>

                <h3>
                    Primary Drivers
                </h3>

            </div>


            ${drivers.length === 0

                ? createReportEmptyState(

                    "No dominant Hospital Readiness drivers were identified."

                )

                : `

                    <div class="executive-report-list">

                        ${drivers

                            .map(

                                driver => `

                                    <article class="executive-report-list-item">

                                        <div>

                                            <strong>

                                                ${escapeHtml(
                                                    driver.title
                                                )}

                                            </strong>

                                            <p>

                                                ${escapeHtml(
                                                    driver.description
                                                )}

                                            </p>

                                        </div>


                                        <span>

                                            Impact

                                            ${Math.round(
                                                driver.severity
                                            )}

                                        </span>

                                    </article>

                                `

                            )

                            .join("")}

                    </div>

                `

            }

        </section>

    `;

}


/**
 * Create the trigger report section.
 */
function createTriggerReportSection(

    triggers:OperationalAssessment["activeTriggers"]

):string {

    return `

        <section class="executive-report-list-section">

            <div class="executive-report-section-heading">

                <span>
                    Active Conditions
                </span>

                <h3>
                    Operational Triggers
                </h3>

            </div>


            ${triggers.length === 0

                ? createReportEmptyState(

                    "No operational triggers are currently active."

                )

                : `

                    <div class="executive-report-list">

                        ${triggers

                            .map(

                                triggerResult => `

                                    <article class="executive-report-list-item">

                                        <div>

                                            <strong>

                                                ${escapeHtml(
                                                    triggerResult
                                                        .trigger
                                                        .title
                                                )}

                                            </strong>

                                            <p>

                                                ${escapeHtml(
                                                    triggerResult
                                                        .activationReason
                                                )}

                                            </p>

                                        </div>


                                        <span>

                                            ${escapeHtml(
                                                triggerResult
                                                    .trigger
                                                    .priority
                                            )}

                                        </span>

                                    </article>

                                `

                            )

                            .join("")}

                    </div>

                `

            }

        </section>

    `;

}


/**
 * Create the recommendation report section.
 */
function createRecommendationReportSection(

    recommendations:OperationalRecommendation[]

):string {

    return `

        <section class="executive-report-list-section">

            <div class="executive-report-section-heading">

                <span>
                    Response
                </span>

                <h3>
                    Recommended Actions
                </h3>

            </div>


            ${recommendations.length === 0

                ? createReportEmptyState(

                    "No operational intervention is currently recommended."

                )

                : `

                    <div class="executive-report-list">

                        ${recommendations

                            .map(

                                recommendation => `

                                    <article class="executive-report-list-item">

                                        <div>

                                            <strong>

                                                ${escapeHtml(
                                                    recommendation.title
                                                )}

                                            </strong>

                                            <p>

                                                ${escapeHtml(
                                                    recommendation.description
                                                )}

                                            </p>

                                        </div>


                                        <span>

                                            ${escapeHtml(
                                                recommendation.priority
                                            )}

                                        </span>

                                    </article>

                                `

                            )

                            .join("")}

                    </div>

                `

            }

        </section>

    `;

}


/**
 * Create one empty report state.
 */
function createReportEmptyState(

    message:string

):string {

    return `

        <div class="executive-report-list-empty">

            ${escapeHtml(message)}

        </div>

    `;

}


/**
 * Print only the executive report.
 */
function handlePrintExecutiveReport():void {

    const invalidationReason =

        getResultInvalidationReason();


    if(

        invalidationReason

        ||

        !hasCommittedAssessment()

        ||

        !getLatestResult()

    ){

        showReportMessage(

            "A current calculated Hospital Readiness assessment is required before printing.",

            "error"

        );


        return;

    }


    clearReportMessage();


    document.body.classList.add(

        "printing-executive-report"

    );


    const cleanup = ():void => {

        document.body.classList.remove(

            "printing-executive-report"

        );


        window.removeEventListener(

            "afterprint",

            cleanup

        );

    };


    window.addEventListener(

        "afterprint",

        cleanup

    );


    window.print();


    /*
     * Some browsers do not consistently fire
     * afterprint when printing is cancelled.
     */
    window.setTimeout(

        cleanup,

        1_500

    );

}


/**
 * Determine score change using snapshot history.
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
 * Sort recommendations by priority and interval.
 */
function compareRecommendations(

    first:OperationalRecommendation,

    second:OperationalRecommendation

):number {

    const priorityDifference =

        getRecommendationPriorityRank(

            second.priority

        )

        -

        getRecommendationPriorityRank(

            first.priority

        );


    if(priorityDifference !== 0){

        return priorityDifference;

    }


    return normalizeReassessmentInterval(

        first.reassessmentMinutes

    )

    -

    normalizeReassessmentInterval(

        second.reassessmentMinutes

    );

}


/**
 * Rank recommendation priorities.
 */
function getRecommendationPriorityRank(

    priority:OperationalRecommendation["priority"]

):number {

    switch(priority){

        case "Immediate":

            return 4;


        case "High":

            return 3;


        case "Moderate":

            return 2;


        case "Routine":

            return 1;

    }

}


/**
 * Normalize reassessment intervals for sorting.
 */
function normalizeReassessmentInterval(

    value:number | null

):number {

    if(

        value === null

        ||

        !Number.isFinite(value)

        ||

        value <= 0

    ){

        return Number.MAX_SAFE_INTEGER;

    }


    return value;

}


/**
 * Format current or projected bed availability.
 *
 * Negative values are intentionally preserved.
 */
function formatBedAvailability(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }

    if(value < 0){

        return `${formatNumber(value)} beds (deficit)`;

    }

    if(value === 1){

        return "1 bed";

    }

    return `${formatNumber(value)} beds`;

}


/**
 * Explain projected acute-care capacity.
 */
function createProjectedCapacityDescription(

    projectedAvailableBeds:number

):string {

    if(projectedAvailableBeds < 0){

        return `Projected demand exceeds staffed acute-care capacity by approximately ${formatNumber(
            Math.abs(projectedAvailableBeds)
        )} beds.`;

    }

    if(projectedAvailableBeds === 0){

        return "Projected four-hour flow fully utilizes staffed acute-care capacity.";

    }

    return `${formatNumber(
        projectedAvailableBeds
    )} staffed acute-care beds are projected to remain available.`;

}


/**
 * Create the four-hour outlook heading.
 */
function createOutlookHeading(

    projectedAvailableBeds:number,

    riskDirection:OperationalAssessment["riskDirection"]

):string {

    if(
        projectedAvailableBeds < 0
        ||
        riskDirection === "Rapidly Worsening"
    ){

        return "Significant hospital capacity pressure expected";

    }

    if(
        projectedAvailableBeds === 0
        ||
        riskDirection === "Increasing"
    ){

        return "Continued hospital capacity pressure expected";

    }

    if(riskDirection === "Improving"){

        return "Conditions may improve";

    }

    return "Near-term capacity remains available";

}


/**
 * Create a transparent four-hour outlook explanation.
 */
function createOutlookDescription(

    projectedAvailableBeds:number,

    boardedPatients:number,

    expectedBoarders:number,

    riskDirection:OperationalAssessment["riskDirection"]

):string {

    const boardingDifference =
        boardedPatients - expectedBoarders;

    if(projectedAvailableBeds < 0){

        return `The four-hour forecast projects an acute-care capacity deficit of approximately ${formatNumber(
            Math.abs(projectedAvailableBeds)
        )} beds. Known bed demand plus expected additional ED admissions is projected to exceed currently available capacity after expected inpatient departures.`;

    }

    if(
        projectedAvailableBeds === 0
        &&
        boardingDifference > 0
    ){

        return `The four-hour forecast projects complete utilization of staffed acute-care capacity while ED boarding remains ${formatNumber(
            boardingDifference
        )} patients above baseline. Inpatient throughput remains an important operational constraint.`;

    }

    if(
        projectedAvailableBeds > 0
        &&
        riskDirection === "Improving"
    ){

        return `Approximately ${formatNumber(
            projectedAvailableBeds
        )} staffed acute-care beds are projected to remain available at the end of the four-hour horizon, and the recent operational trend is improving.`;

    }

    if(boardingDifference > 0){

        return `Approximately ${formatNumber(
            projectedAvailableBeds
        )} staffed acute-care beds are projected to remain available, but ED boarding remains ${formatNumber(
            boardingDifference
        )} patients above baseline. Continue monitoring inpatient throughput and active triggers.`;

    }

    return `Approximately ${formatNumber(
        projectedAvailableBeds
    )} staffed acute-care beds are projected to remain available after projected inflow and historical expected inpatient departures.`;

}


/**
 * Format an assessment timestamp.
 */
function formatAssessmentTime(

    value:Date | string

):string {

    const date = new Date(

        value

    );


    if(Number.isNaN(date.getTime())){

        return "Unavailable";

    }


    return date.toLocaleString(

        [],

        {

            month:
                "short",

            day:
                "numeric",

            year:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"

        }

    );

}


/**
 * Calculate a safe percentage.
 */
function calculatePercentage(

    numerator:number,

    denominator:number

):number {

    if(

        !Number.isFinite(numerator)

        ||

        !Number.isFinite(denominator)

        ||

        denominator <= 0

    ){

        return 0;

    }


    return Math.round(

        numerator

        /

        denominator

        *

        1000

    ) / 10;

}


/**
 * Format a number.
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

        .toFixed(1)

        .replace(

            /\.0$/,

            ""

        );

}


/**
 * Format a signed number.
 */
function formatSignedNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(value > 0){

        return `+${formatNumber(value)}`;

    }


    return formatNumber(value);

}


/**
 * Enable or disable the print button.
 */
function updatePrintButton(

    enabled:boolean

):void {

    const button = document.getElementById(

        "printExecutiveReportButton"

    ) as HTMLButtonElement | null;


    if(!button){

        return;

    }


    button.disabled = !enabled;

}


/**
 * Clear the report message.
 */
function clearReportMessage():void {

    const element = document.getElementById(

        "executiveReportMessage"

    );


    if(!element){

        return;

    }


    element.className =

        "executive-report-message";


    element.textContent = "";

}


/**
 * Display a report message.
 */
function showReportMessage(

    message:string,

    type:"success" | "error"

):void {

    const element = document.getElementById(

        "executiveReportMessage"

    );


    if(!element){

        return;

    }


    element.className =

        `executive-report-message executive-report-message-${type}`;


    element.textContent = message;

}


/**
 * Create the initial state.
 */
function createAwaitingAssessmentState():string {

    return `

        <div class="executive-report-empty">

            <strong>
                Awaiting assessment
            </strong>

            <p>
                Calculate Hospital Readiness to generate the executive assessment report.
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

        <div class="executive-report-empty warning">

            <strong>
                Recalculation required
            </strong>

            <p>

                ${escapeHtml(reason)}

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

    return escapeHtml(value);

}