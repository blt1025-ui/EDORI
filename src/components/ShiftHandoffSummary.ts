/**
 * ShiftHandoffSummary
 *
 * Creates a concise operational handoff from the
 * authoritative Hospital Readiness OperationalAssessment.
 *
 * The component:
 *
 * - Displays the current Alpha–Echo status
 * - Summarizes demand, boarding, and capacity
 * - Identifies active triggers and leading drivers
 * - Lists urgent operational actions
 * - Produces a copyable plain-text handoff
 *
 * This component does not calculate Hospital Readiness or
 * modify application state.
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


const ED_TREATMENT_BEDS = 63;


/**
 * Maximum items shown in condensed handoff lists.
 */
const MAXIMUM_HANDOFF_DRIVERS = 3;

const MAXIMUM_HANDOFF_TRIGGERS = 4;

const MAXIMUM_HANDOFF_ACTIONS = 4;


/**
 * Render the Shift Handoff Summary panel.
 */
export function ShiftHandoffSummary():string {

    return `

        <section class="shift-handoff-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Shift Handoff Summary
                    </h3>

                    <p class="panel-description">
                        Concise operational briefing for leadership and shift transition
                    </p>

                </div>


                <button
                    id="copyShiftHandoffButton"
                    class="shift-handoff-copy-button"
                    type="button"
                    disabled
                >
                    Copy Summary
                </button>

            </div>


            <div
                id="shiftHandoffMessage"
                class="shift-handoff-message"
                aria-live="polite"
            >
            </div>


            <div
                id="shiftHandoffContent"
                class="shift-handoff-content"
                aria-live="polite"
            >

                ${createAwaitingAssessmentState()}

            </div>

        </section>

    `;

}


/**
 * Initialize handoff behavior.
 */
export function initializeShiftHandoffSummary():void {

    const copyButton = document.getElementById(

        "copyShiftHandoffButton"

    );


    copyButton?.addEventListener(

        "click",

        handleCopyHandoff

    );


    updateShiftHandoffSummary();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateShiftHandoffSummary

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateShiftHandoffSummary

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateShiftHandoffSummary

    );

}


/**
 * Refresh the handoff from authoritative services.
 */
function updateShiftHandoffSummary():void {

    const container = document.getElementById(

        "shiftHandoffContent"

    );


    if(!container){

        return;

    }


    clearHandoffMessage();


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        updateCopyButton(

            false

        );


        container.innerHTML =

            createRecalculationRequiredState(

                invalidationReason

            );


        return;

    }


    if(!hasCommittedAssessment()){

        updateCopyButton(

            false

        );


        container.innerHTML =

            createAwaitingAssessmentState();


        return;

    }


    const result = getLatestResult();


    if(!result){

        updateCopyButton(

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

            createHandoffMarkup(

                operationalAssessment,

                snapshots

            );


        updateCopyButton(

            true

        );

    }
    catch(error){

        console.error(

            "Unable to create shift handoff summary:",

            error

        );


        updateCopyButton(

            false

        );


        container.innerHTML = `

            <div class="shift-handoff-empty error">

                <strong>
                    Handoff summary unavailable
                </strong>

                <p>
                    Review the browser console for additional details.
                </p>

            </div>

        `;

    }

}


/**
 * Create the completed handoff display.
 */
function createHandoffMarkup(

    operationalAssessment:OperationalAssessment,

    snapshots:EdoriSnapshot[]

):string {

    const assessment = operationalAssessment.assessment;

    const result = operationalAssessment.scoreResult;

    const finalState = operationalAssessment.finalOperationalState;

    const score = Math.round(result.score);


    const attribution =
        getAssessmentAttribution(
            snapshots,
            assessment.assessmentTime
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

    const urgentActions =
        operationalAssessment.recommendations
            .filter(
                recommendation =>
                    recommendation.priority === "Immediate"
                    ||
                    recommendation.priority === "High"
            )
            .slice()
            .sort(compareRecommendations)
            .slice(0, MAXIMUM_HANDOFF_ACTIONS);

    const leadingDrivers =
        operationalAssessment.primaryDrivers
            .slice()
            .sort(
                (first, second) =>
                    second.severity - first.severity
            )
            .slice(0, MAXIMUM_HANDOFF_DRIVERS);

    const activeTriggers =
        operationalAssessment.activeTriggers
            .slice(0, MAXIMUM_HANDOFF_TRIGGERS);

    const handoffText = createPlainTextHandoff(
        operationalAssessment,
        snapshots
    );

    return `

        <div
            class="shift-handoff-status"
            style="
                --handoff-state-color:
                ${escapeAttribute(finalState.color)};
            "
        >

            <div class="shift-handoff-status-main">

                <span
                    class="shift-handoff-status-icon"
                    aria-hidden="true"
                >
                    ${escapeHtml(finalState.icon)}
                </span>

                <div>

                    <span class="shift-handoff-label">
                        Current Operational Status
                    </span>

                    <strong>
                        ${escapeHtml(finalState.title)}
                        · HRI ${score}
                    </strong>

                    <small>
                        ${escapeHtml(operationalAssessment.riskDirection)}
                        ${scoreChange === null
                            ? "· no prior score comparison"
                            : `· ${formatSignedNumber(scoreChange)} since previous assessment`
                        }
                    </small>

                </div>

            </div>

            <div class="shift-handoff-status-time">

                <span>
                    Assessment Time
                </span>

                <strong>
                    ${escapeHtml(
                        formatAssessmentTime(
                            assessment.assessmentTime
                        )
                    )}
                </strong>


                <small>
                    Entered by
                    ${escapeHtml(
                        attribution.displayName
                    )}
                    (${escapeHtml(
                        attribution.username
                    )})
                </small>

            </div>

        </div>


        <div class="shift-handoff-metrics">

            ${createMetricCard(
                "ED Census",
                `${formatNumber(assessment.totalEDVolume)} patients`,
                `${formatNumber(edCapacityPercent)}% of ${ED_TREATMENT_BEDS}-bed treatment capacity`
            )}

            ${createMetricCard(
                "Boarding",
                `${formatNumber(assessment.boardedPatients)} patients`,
                `${formatNumber(boardingShare)}% of ED census`
            )}

            ${createMetricCard(
                "Acute-Care Capacity",
                `${formatNumber(assessment.occupiedAcuteCareBeds)} / ${formatNumber(assessment.staffedAcuteCareBeds)}`,
                `${formatNumber(acuteOccupancy)}% occupied`
            )}

            ${createMetricCard(
                "Critical-Care Capacity",
                `${formatNumber(assessment.occupiedCriticalCareBeds)} / ${formatNumber(assessment.staffedCriticalCareBeds)}`,
                `${formatNumber(criticalOccupancy)}% occupied`
            )}

            ${createMetricCard(
                "Known Four-Hour Bed Demand",
                `${formatNumber(assessment.currentDirectAdmissions + assessment.currentSurgicalAdmissions)} known admissions`,
                `${formatNumber(assessment.expectedEDAdmissions4h)} expected additional ED admissions · ${formatNumber(result.expectedInpatientDepartures)} expected departures`
            )}

            ${createMetricCard(
                "Projected Acute Beds",
                formatBedAvailability(
                    result.projectedAvailableAcuteCareBeds
                ),
                createProjectedCapacityDescription(
                    result.projectedAvailableAcuteCareBeds
                )
            )}

            ${createMetricCard(
                "High Acuity",
                `${formatNumber(highAcuityCount)} ESI 1–2`,
                `${formatNumber(
                    calculatePercentage(
                        highAcuityCount,
                        assessment.totalEDVolume
                    )
                )}% of ED census`
            )}

            ${createMetricCard(
                "Active Triggers",
                String(
                    operationalAssessment.activeTriggers.length
                ),
                createTriggerCountDescription(
                    operationalAssessment.activeTriggers.length
                )
            )}

        </div>


        <div class="shift-handoff-sections">

            ${createDriverSection(leadingDrivers)}

            ${createTriggerSection(activeTriggers)}

            ${createActionSection(urgentActions)}

        </div>


        <div class="shift-handoff-outlook">

            <div>

                <span class="shift-handoff-label">
                    Four-Hour Hospital Outlook
                </span>

                <strong>
                    ${escapeHtml(
                        createOutlookHeading(
                            result.projectedAvailableAcuteCareBeds,
                            operationalAssessment.riskDirection
                        )
                    )}
                </strong>

            </div>

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


        <details class="shift-handoff-text-preview">

            <summary>
                Preview Copyable Handoff Text
            </summary>

            <pre>${escapeHtml(handoffText)}</pre>

        </details>

    `;

}


/**
 * Create one high-level metric card.
 */
function createMetricCard(

    label:string,

    value:string,

    description:string

):string {

    return `

        <article class="shift-handoff-metric">

            <span>

                ${escapeHtml(label)}

            </span>

            <strong>

                ${escapeHtml(value)}

            </strong>

            <small>

                ${escapeHtml(description)}

            </small>

        </article>

    `;

}


/**
 * Create the leading-driver section.
 */
function createDriverSection(

    drivers:OperationalAssessment["primaryDrivers"]

):string {

    return `

        <section class="shift-handoff-section">

            <div class="shift-handoff-section-header">

                <span>
                    Primary Drivers
                </span>

                <strong>
                    ${drivers.length}
                </strong>

            </div>


            ${drivers.length === 0

                ? createSectionEmptyState(

                    "No dominant score drivers were identified."

                )

                : `

                    <div class="shift-handoff-list">

                        ${drivers

                            .map(

                                driver => `

                                    <div class="shift-handoff-list-item">

                                        <div>

                                            <strong>

                                                ${escapeHtml(
                                                    driver.title
                                                )}

                                            </strong>

                                            <span>

                                                ${escapeHtml(
                                                    driver.description
                                                )}

                                            </span>

                                        </div>


                                        <b>

                                            Impact

                                            ${Math.round(
                                                driver.severity
                                            )}

                                        </b>

                                    </div>

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
 * Create the active-trigger section.
 */
function createTriggerSection(

    triggers:OperationalAssessment["activeTriggers"]

):string {

    return `

        <section class="shift-handoff-section">

            <div class="shift-handoff-section-header">

                <span>
                    Active Triggers
                </span>

                <strong>
                    ${triggers.length}
                </strong>

            </div>


            ${triggers.length === 0

                ? createSectionEmptyState(

                    "No operational triggers are currently active."

                )

                : `

                    <div class="shift-handoff-list">

                        ${triggers

                            .map(

                                triggerResult => `

                                    <div class="shift-handoff-list-item">

                                        <div>

                                            <strong>

                                                ${escapeHtml(
                                                    triggerResult
                                                        .trigger
                                                        .title
                                                )}

                                            </strong>

                                            <span>

                                                ${escapeHtml(
                                                    triggerResult
                                                        .activationReason
                                                )}

                                            </span>

                                        </div>


                                        <b>

                                            ${escapeHtml(
                                                triggerResult
                                                    .trigger
                                                    .priority
                                            )}

                                        </b>

                                    </div>

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
 * Create the urgent-action section.
 */
function createActionSection(

    recommendations:OperationalRecommendation[]

):string {

    return `

        <section class="shift-handoff-section">

            <div class="shift-handoff-section-header">

                <span>
                    Priority Actions
                </span>

                <strong>
                    ${recommendations.length}
                </strong>

            </div>


            ${recommendations.length === 0

                ? createSectionEmptyState(

                    "No immediate or high-priority actions are currently listed."

                )

                : `

                    <div class="shift-handoff-list">

                        ${recommendations

                            .map(

                                recommendation => `

                                    <div class="shift-handoff-list-item">

                                        <div>

                                            <strong>

                                                ${escapeHtml(
                                                    recommendation.title
                                                )}

                                            </strong>

                                            <span>

                                                ${escapeHtml(
                                                    recommendation.description
                                                )}

                                            </span>

                                        </div>


                                        <b>

                                            ${escapeHtml(
                                                recommendation.priority
                                            )}

                                        </b>

                                    </div>

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
 * Create an empty subsection state.
 */
function createSectionEmptyState(

    message:string

):string {

    return `

        <div class="shift-handoff-section-empty">

            ${escapeHtml(message)}

        </div>

    `;

}


/**
 * Create the copyable plain-text handoff.
 */
function createPlainTextHandoff(

    operationalAssessment:OperationalAssessment,

    snapshots:EdoriSnapshot[]

):string {

    const assessment = operationalAssessment.assessment;

    const result = operationalAssessment.scoreResult;

    const score = Math.round(result.score);

    const finalState = operationalAssessment.finalOperationalState;

    
    const scoreChange = determineScoreChange(
        snapshots,
        score
    );


    const attribution =
        getAssessmentAttribution(
            snapshots,
            assessment.assessmentTime
        );

    const driverLines =
        operationalAssessment.primaryDrivers
            .slice()
            .sort(
                (first, second) =>
                    second.severity - first.severity
            )
            .slice(0, MAXIMUM_HANDOFF_DRIVERS)
            .map(
                driver =>
                    `- ${driver.title}: ${driver.description}`
            );

    const triggerLines =
        operationalAssessment.activeTriggers
            .slice(0, MAXIMUM_HANDOFF_TRIGGERS)
            .map(
                triggerResult =>
                    `- ${triggerResult.trigger.title} (${triggerResult.trigger.priority}): ${triggerResult.activationReason}`
            );

    const actionLines =
        operationalAssessment.recommendations
            .filter(
                recommendation =>
                    recommendation.priority === "Immediate"
                    ||
                    recommendation.priority === "High"
            )
            .slice()
            .sort(compareRecommendations)
            .slice(0, MAXIMUM_HANDOFF_ACTIONS)
            .map(
                recommendation =>
                    `- ${recommendation.priority}: ${recommendation.title} — ${recommendation.description}`
            );

    const scoreDerivedStateLine =
    `Operational level is score-derived: ${finalState.title}.`;

    return [

        "HOSPITAL READINESS SHIFT HANDOFF",

        `Assessment: ${formatAssessmentTime(
            assessment.assessmentTime
        )}`,

        `Entered by: ${attribution.displayName} (${attribution.username})`,

        "",

        `Status: ${finalState.title} — HRI ${score}`,

        `Trend: ${operationalAssessment.riskDirection}`,

        `Score change: ${scoreChange === null
            ? "No prior comparison"
            : formatSignedNumber(scoreChange)
        }`,

        scoreDerivedStateLine,

        "",

        `ED census: ${formatNumber(
            assessment.totalEDVolume
        )} patients (${formatNumber(
            calculatePercentage(
                assessment.totalEDVolume,
                ED_TREATMENT_BEDS
            )
        )}% of ${ED_TREATMENT_BEDS}-bed treatment capacity)`,

        `Boarding: ${formatNumber(
            assessment.boardedPatients
        )} patients (${formatNumber(
            calculatePercentage(
                assessment.boardedPatients,
                assessment.totalEDVolume
            )
        )}% of ED census)`,

        `Acute-care beds: ${formatNumber(
            assessment.occupiedAcuteCareBeds
        )}/${formatNumber(
            assessment.staffedAcuteCareBeds
        )} occupied (${formatNumber(
            calculatePercentage(
                assessment.occupiedAcuteCareBeds,
                assessment.staffedAcuteCareBeds
            )
        )}%)`,

        `Critical-care beds: ${formatNumber(
            assessment.occupiedCriticalCareBeds
        )}/${formatNumber(
            assessment.staffedCriticalCareBeds
        )} occupied (${formatNumber(
            calculatePercentage(
                assessment.occupiedCriticalCareBeds,
                assessment.staffedCriticalCareBeds
            )
        )}%)`,

        `ED admissions awaiting beds: ${formatNumber(
            assessment.boardedPatients
        )}`,

        `Known direct admissions, next four hours: ${formatNumber(
            assessment.currentDirectAdmissions
        )}`,

        `Known surgical/procedural admissions, next four hours: ${formatNumber(
            assessment.currentSurgicalAdmissions
        )}`,

        `Expected additional ED admissions, next four hours: ${formatNumber(
            assessment.expectedEDAdmissions4h
        )}`,

        `Expected inpatient departures, next four hours: ${formatNumber(
            result.expectedInpatientDepartures
        )}`,

        `Projected available acute-care beds: ${formatBedAvailability(
            result.projectedAvailableAcuteCareBeds
        )}`,

        "",

        "PRIMARY DRIVERS",

        ...(
            driverLines.length > 0
                ? driverLines
                : [
                    "- No dominant Hospital Readiness drivers identified."
                ]
        ),

        "",

        "ACTIVE TRIGGERS",

        ...(
            triggerLines.length > 0
                ? triggerLines
                : [
                    "- No active operational triggers."
                ]
        ),

        "",

        "PRIORITY ACTIONS",

        ...(
            actionLines.length > 0
                ? actionLines
                : [
                    "- No immediate or high-priority actions listed."
                ]
        ),

        "",

        `Four-hour outlook: ${createOutlookDescription(
            result.projectedAvailableAcuteCareBeds,
            assessment.boardedPatients,
            assessment.expectedEDBoarders,
            operationalAssessment.riskDirection
        )}`

    ].join("\n");

}


/**
 * Copy the current handoff to the clipboard.
 */
async function handleCopyHandoff():Promise<void> {

    const invalidationReason =

        getResultInvalidationReason();


    const result = getLatestResult();


    if(

        invalidationReason

        ||

        !result

        ||

        !hasCommittedAssessment()

    ){

        showHandoffMessage(

            "A current calculated assessment is required before copying the handoff.",

            "error"

        );


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


        const handoffText = createPlainTextHandoff(

            operationalAssessment,

            getSnapshots()

        );


        await copyTextToClipboard(

            handoffText

        );


        showHandoffMessage(

            "Shift handoff copied to the clipboard.",

            "success"

        );

    }
    catch(error){

        console.error(

            "Unable to copy shift handoff:",

            error

        );


        showHandoffMessage(

            "The shift handoff could not be copied.",

            "error"

        );

    }

}


/**
 * Copy text using the Clipboard API with a
 * document-command fallback.
 */
async function copyTextToClipboard(

    value:string

):Promise<void> {

    if(

        navigator.clipboard

        &&

        typeof navigator.clipboard.writeText

        ===

        "function"

    ){

        await navigator.clipboard.writeText(

            value

        );


        return;

    }


    const textArea = document.createElement(

        "textarea"

    );


    textArea.value = value;

    textArea.setAttribute(

        "readonly",

        ""

    );


    textArea.style.position =

        "fixed";

    textArea.style.opacity =

        "0";


    document.body.appendChild(

        textArea

    );


    textArea.select();


    const copied = document.execCommand(

        "copy"

    );


    document.body.removeChild(

        textArea

    );


    if(!copied){

        throw new Error(

            "Clipboard copy was rejected."

        );

    }

}


/**
 * Determine the score change from the latest
 * relevant historical snapshot.
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


    const latest = validSnapshots[

        validSnapshots.length - 1

    ];


    if(

        Math.abs(

            latest.score

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

        latest.score;

}


/**
 * Sort recommendations by priority.
 */
function compareRecommendations(

    first:OperationalRecommendation,

    second:OperationalRecommendation

):number {

    return getRecommendationPriorityRank(

        second.priority

    )

    -

    getRecommendationPriorityRank(

        first.priority

    );

}


/**
 * Rank recommendation priority.
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
 * Format current or projected acute-care bed availability.
 *
 * Negative values are intentionally preserved because
 * they represent a projected capacity deficit.
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

        return "Projected flow fully utilizes staffed acute-care capacity.";

    }

    return `${formatNumber(
        projectedAvailableBeds
    )} staffed acute-care beds projected to remain available.`;

}


/**
 * Create the four-hour hospital outlook heading.
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

    return "Near-term hospital capacity remains available";

}


/**
 * Create a transparent four-hour hospital outlook.
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
        )} beds after projected hospital inflow and historical expected inpatient departures.`;

    }

    if(
        projectedAvailableBeds === 0
        &&
        boardingDifference > 0
    ){

        return `The four-hour forecast projects full utilization of staffed acute-care capacity while ED boarding remains ${formatNumber(
            boardingDifference
        )} patients above baseline. Inpatient throughput remains an important constraint.`;

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
        )} patients above baseline. Continue monitoring hospital throughput and active triggers.`;

    }

    return `Approximately ${formatNumber(
        projectedAvailableBeds
    )} staffed acute-care beds are projected to remain available after projected inflow and historical expected inpatient departures.`;

}


/**
 * Describe the trigger count.
 */
function createTriggerCountDescription(

    count:number

):string {

    if(count === 0){

        return "No active triggers";

    }


    if(count === 1){

        return "1 active condition";

    }


    return `${count} active conditions`;

}


/**
 * Format assessment time.
 */

/**
 * Resolve audit attribution for the committed assessment.
 *
 * Assessment snapshots are the authoritative audit record.
 * The snapshot nearest to the assessment timestamp is used.
 */
function getAssessmentAttribution(

    snapshots:EdoriSnapshot[],

    assessmentTime:Date | string

):{

    displayName:string;

    username:string;

    userId:string;

} {

    const assessmentTimestamp =
        new Date(
            assessmentTime
        ).getTime();


    const matchingSnapshot = snapshots
        .slice()
        .sort(
            (first, second) => {

                const firstDistance = Math.abs(
                    new Date(first.timestamp).getTime()
                    -
                    assessmentTimestamp
                );

                const secondDistance = Math.abs(
                    new Date(second.timestamp).getTime()
                    -
                    assessmentTimestamp
                );

                return firstDistance - secondDistance;

            }
        )[0];


    if(!matchingSnapshot){

        return {

            displayName:
                "Legacy / Unknown",

            username:
                "unknown",

            userId:
                "legacy-unknown"

        };

    }


    return {

        displayName:
            matchingSnapshot.enteredByDisplayName
            || "Legacy / Unknown",

        username:
            matchingSnapshot.enteredByUsername
            || "unknown",

        userId:
            matchingSnapshot.enteredByUserId
            || "legacy-unknown"

    };

}


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
 * Enable or disable the copy button.
 */
function updateCopyButton(

    enabled:boolean

):void {

    const button = document.getElementById(

        "copyShiftHandoffButton"

    ) as HTMLButtonElement | null;


    if(!button){

        return;

    }


    button.disabled = !enabled;

}


/**
 * Clear the temporary copy message.
 */
function clearHandoffMessage():void {

    const element = document.getElementById(

        "shiftHandoffMessage"

    );


    if(!element){

        return;

    }


    element.className =

        "shift-handoff-message";


    element.textContent = "";

}


/**
 * Show a copy success or error message.
 */
function showHandoffMessage(

    message:string,

    type:"success" | "error"

):void {

    const element = document.getElementById(

        "shiftHandoffMessage"

    );


    if(!element){

        return;

    }


    element.className =

        `shift-handoff-message shift-handoff-message-${type}`;


    element.textContent = message;

}


/**
 * Create the initial state.
 */
function createAwaitingAssessmentState():string {

    return `

        <div class="shift-handoff-empty">

            <strong>
                Awaiting assessment
            </strong>

            Calculate the HRI to generate a shift handoff summary.

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

        <div class="shift-handoff-empty warning">

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