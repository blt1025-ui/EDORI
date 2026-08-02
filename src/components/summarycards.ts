/**
 * SummaryCards
 *
 * Displays six command-center operational cards
 * using the authoritative OperationalAssessment.
 *
 * Cards:
 *
 * - ED Demand
 * - Boarding
 * - Medical Capacity
 * - Expected Throughput
 * - Clinical Acuity
 * - Operational Status
 *
 * This component does not calculate EDORI,
 * evaluate triggers, or modify application state.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    HOSPITAL

}

from "../config/constants";


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
 * Render the command-center card region.
 */
export function SummaryCards():string {

    return `

        <section
            id="summaryCards"
            class="command-center-cards"
            aria-live="polite"
        >

            ${createAwaitingAssessmentCards()}

        </section>

    `;

}


/**
 * Initialize summary-card behavior.
 */
export function initializeSummaryCards():void {

    updateSummaryCards();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateSummaryCards

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateSummaryCards

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateSummaryCards

    );

}


/**
 * Refresh all cards from authoritative services.
 */
function updateSummaryCards():void {

    const container = document.getElementById(

        "summaryCards"

    );


    if(!container){

        return;

    }


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        container.innerHTML =

            createRecalculationRequiredCard(

                invalidationReason

            );


        return;

    }


    if(!hasCommittedAssessment()){

        container.innerHTML =

            createAwaitingAssessmentCards();


        return;

    }


    const result = getLatestResult();


    if(!result){

        container.innerHTML =

            createAwaitingAssessmentCards();


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

            createCommandCenterCards(

                operationalAssessment

            );

    }
    catch(error){

        console.error(

            "Unable to update command-center cards:",

            error

        );


        container.innerHTML = `

            <article
                class="
                    command-center-card
                    command-center-card-wide
                    command-center-card-error
                "
            >

                <span class="command-center-card-label">
                    Summary unavailable
                </span>

                <strong class="command-center-card-value">
                    Error
                </strong>

                <p class="command-center-card-description">
                    Review the browser console for additional details.
                </p>

            </article>

        `;

    }

}


/**
 * Create all six completed cards.
 */
function createCommandCenterCards(

    operationalAssessment:OperationalAssessment

):string {

    const assessment =

        operationalAssessment.assessment;


    const finalState =

        operationalAssessment.finalOperationalState;


    const baseState =

        operationalAssessment.baseOperationalState;


    const edOccupancyPercent = calculatePercentage(

        assessment.totalEDVolume,

        HOSPITAL.ED_BEDS

    );


    const volumeDifference =

        assessment.totalEDVolume

        -

        assessment.expectedVolume;


    const boardingDifference =

        assessment.boardedPatients

        -

        assessment.expectedBoarders;


    const boardingShare = calculatePercentage(

        assessment.boardedPatients,

        assessment.totalEDVolume

    );


    const hospitalOccupancyPercent =

        calculatePercentage(

            assessment.occupiedMedicalBeds,

            HOSPITAL.MEDICAL_BEDS

        );


    const availableMedicalBeds = Math.max(

        0,

        HOSPITAL.MEDICAL_BEDS

        -

        assessment.occupiedMedicalBeds

    );


    const expectedNetFlow =

        assessment.expectedArrivals

        -

        assessment.expectedDepartures;


    const highAcuityCount =

        assessment.esi1

        +

        assessment.esi2;


    const highAcuityPercent = calculatePercentage(

        highAcuityCount,

        assessment.totalEDVolume

    );


    const activeTriggerCount =

        operationalAssessment.activeTriggers.length;


    const scoreChange = determineLatestScoreChange(

        operationalAssessment

    );


    return `

        ${createCommandCenterCard({

            title:
                "ED Demand",

            icon:
                "🏥",

            primaryLabel:
                "Total ED Volume",

            primaryValue:
                `${formatNumber(
                    assessment.totalEDVolume
                )} / ${HOSPITAL.ED_BEDS}`,

            secondaryValue:
                `${formatNumber(
                    edOccupancyPercent
                )}% capacity use`,

            comparison:
                createDifferenceText(

                    volumeDifference,

                    "vs expected"

                ),

            detail:
                `Historical expectation: ${formatNumber(
                    assessment.expectedVolume
                )} patients.`,

            severity:
                determinePercentageSeverity(

                    edOccupancyPercent

                )

        })}


        ${createCommandCenterCard({

            title:
                "Boarding",

            icon:
                "🛏️",

            primaryLabel:
                "Boarding Patients",

            primaryValue:
                formatNumber(
                    assessment.boardedPatients
                ),

            secondaryValue:
                `${formatNumber(
                    boardingShare
                )}% of ED census`,

            comparison:
                createDifferenceText(

                    boardingDifference,

                    "vs expected"

                ),

            detail:
                `Historical expectation: ${formatNumber(
                    assessment.expectedBoarders
                )} boarders.`,

            severity:
                determineBoardingSeverity(

                    assessment.boardedPatients,

                    boardingDifference

                )

        })}


        ${createCommandCenterCard({

            title:
                "Medical Capacity",

            icon:
                "🏨",

            primaryLabel:
                "Occupied Medical Beds",

            primaryValue:
                `${formatNumber(
                    assessment.occupiedMedicalBeds
                )} / ${HOSPITAL.MEDICAL_BEDS}`,

            secondaryValue:
                `${formatNumber(
                    hospitalOccupancyPercent
                )}% occupied`,

            comparison:
                `${formatNumber(
                    availableMedicalBeds
                )} beds available`,

            detail:
                "Medical capacity affects admitted-patient movement from the ED.",

            severity:
                determineHospitalSeverity(

                    hospitalOccupancyPercent

                )

        })}


        ${createCommandCenterCard({

            title:
                "Expected Throughput",

            icon:
                "↔️",

            primaryLabel:
                "Expected Net Flow",

            primaryValue:
                formatSignedNumber(

                    expectedNetFlow

                ),

            secondaryValue:
                `${formatNumber(
                    assessment.expectedArrivals
                )} arrivals · ${formatNumber(
                    assessment.expectedDepartures
                )} departures`,

            comparison:
                createNetFlowLabel(

                    expectedNetFlow

                ),

            detail:
                "Positive net flow suggests potential ED census growth.",

            severity:
                determineFlowSeverity(

                    expectedNetFlow

                )

        })}


        ${createCommandCenterCard({

            title:
                "Clinical Acuity",

            icon:
                "⚕️",

            primaryLabel:
                "ESI 1–2 Patients",

            primaryValue:
                formatNumber(

                    highAcuityCount

                ),

            secondaryValue:
                `${formatNumber(
                    highAcuityPercent
                )}% high acuity`,

            comparison:
                determineAcuityLabel(

                    highAcuityPercent

                ),

            detail:
                `ESI distribution total: ${formatNumber(
                    assessment.esi1
                    +
                    assessment.esi2
                    +
                    assessment.esi3
                    +
                    assessment.esi4
                    +
                    assessment.esi5
                )} patients.`,

            severity:
                determineAcuitySeverity(

                    highAcuityPercent

                )

        })}


        ${createCommandCenterCard({

            title:
                "Operational Status",

            icon:
                finalState.icon,

            primaryLabel:
                "Final EDORI Level",

            primaryValue:
                finalState.title,

            secondaryValue:
                `EDORI ${Math.round(
                    operationalAssessment
                        .scoreResult
                        .score
                )} · ${operationalAssessment.riskDirection}`,

            comparison:
                createOperationalStatusComparison(

                    baseState.title,

                    finalState.title,

                    activeTriggerCount,

                    scoreChange

                ),

            detail:
                `${activeTriggerCount} active operational ${
                    activeTriggerCount === 1

                        ? "trigger"

                        : "triggers"
                }. Confidence: ${operationalAssessment.confidence}.`,

            severity:
                createStateSeverity(

                    finalState.title

                ),

            accentColor:
                finalState.color

        })}

    `;

}


/**
 * Create one command-center card.
 */
function createCommandCenterCard(

    options:{

        title:string;

        icon:string;

        primaryLabel:string;

        primaryValue:string;

        secondaryValue:string;

        comparison:string;

        detail:string;

        severity:

            | "alpha"

            | "bravo"

            | "charlie"

            | "delta"

            | "echo";

        accentColor?:string;

    }

):string {

    const styleAttribute = options.accentColor

        ? `style="--command-card-accent:${escapeAttribute(
            options.accentColor
        )};"`

        : "";


    return `

        <article
            class="
                command-center-card
                command-center-card-${escapeAttribute(
                    options.severity
                )}
            "
            ${styleAttribute}
        >

            <div class="command-center-card-header">

                <div>

                    <span class="command-center-card-title">

                        ${escapeHtml(
                            options.title
                        )}

                    </span>


                    <span class="command-center-card-primary-label">

                        ${escapeHtml(
                            options.primaryLabel
                        )}

                    </span>

                </div>


                <span
                    class="command-center-card-icon"
                    aria-hidden="true"
                >

                    ${escapeHtml(
                        options.icon
                    )}

                </span>

            </div>


            <strong class="command-center-card-value">

                ${escapeHtml(
                    options.primaryValue
                )}

            </strong>


            <span class="command-center-card-secondary">

                ${escapeHtml(
                    options.secondaryValue
                )}

            </span>


            <div class="command-center-card-comparison">

                ${escapeHtml(
                    options.comparison
                )}

            </div>


            <p class="command-center-card-description">

                ${escapeHtml(
                    options.detail
                )}

            </p>

        </article>

    `;

}


/**
 * Determine the latest EDORI score change.
 */
function determineLatestScoreChange(

    operationalAssessment:OperationalAssessment

):number | null {

    const snapshots = operationalAssessment

        .triggerResults.length >= 0

            ? getSnapshots()

            : [];


    const validSnapshots = snapshots

        .filter(

            snapshot =>

                Number.isFinite(

                    snapshot.score

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


    if(validSnapshots.length < 2){

        return null;

    }


    const latest = validSnapshots[

        validSnapshots.length - 1

    ];


    const previous = validSnapshots[

        validSnapshots.length - 2

    ];


    return latest.score

        -

        previous.score;

}


/**
 * Create current-versus-expected text.
 */
function createDifferenceText(

    difference:number,

    suffix:string

):string {

    if(difference > 0){

        return `▲ ${formatSignedNumber(
            difference
        )} ${suffix}`;

    }


    if(difference < 0){

        return `▼ ${formatSignedNumber(
            difference
        )} ${suffix}`;

    }


    return `No difference ${suffix}`;

}


/**
 * Create net-flow interpretation.
 */
function createNetFlowLabel(

    netFlow:number

):string {

    if(netFlow >= 5){

        return "Demand expected to increase";

    }


    if(netFlow > 0){

        return "Mild census growth expected";

    }


    if(netFlow < 0){

        return "Census reduction expected";

    }


    return "Expected flow is balanced";

}


/**
 * Create acuity interpretation.
 */
function determineAcuityLabel(

    highAcuityPercent:number

):string {

    if(highAcuityPercent >= 35){

        return "Very high acuity burden";

    }


    if(highAcuityPercent >= 25){

        return "High acuity burden";

    }


    if(highAcuityPercent >= 15){

        return "Moderate acuity burden";

    }


    return "Lower acuity burden";

}


/**
 * Create the operational-status comparison line.
 */
function createOperationalStatusComparison(

    baseLevel:string,

    finalLevel:string,

    activeTriggerCount:number,

    scoreChange:number | null

):string {

    const changeText = scoreChange === null

        ? "No previous score comparison"

        : scoreChange > 0

            ? `▲ ${formatSignedNumber(
                scoreChange
            )} since previous assessment`

            : scoreChange < 0

                ? `▼ ${formatSignedNumber(
                    scoreChange
                )} since previous assessment`

                : "No score change";


    if(baseLevel !== finalLevel){

        return `${changeText} · elevated from ${baseLevel} by ${activeTriggerCount} active ${
            activeTriggerCount === 1

                ? "trigger"

                : "triggers"
        }`;

    }


    return `${changeText} · score-derived level ${baseLevel}`;

}


/**
 * Determine severity from ED-capacity use.
 */
function determinePercentageSeverity(

    percentage:number

):

    | "alpha"

    | "bravo"

    | "charlie"

    | "delta"

    | "echo" {

    if(percentage >= 140){

        return "echo";

    }


    if(percentage >= 120){

        return "delta";

    }


    if(percentage >= 105){

        return "charlie";

    }


    if(percentage >= 90){

        return "bravo";

    }


    return "alpha";

}


/**
 * Determine boarding-card severity.
 */
function determineBoardingSeverity(

    boardedPatients:number,

    difference:number

):

    | "alpha"

    | "bravo"

    | "charlie"

    | "delta"

    | "echo" {

    if(boardedPatients >= 50){

        return "echo";

    }


    if(boardedPatients >= 40){

        return "delta";

    }


    if(

        boardedPatients >= 30

        ||

        difference >= 10

    ){

        return "charlie";

    }


    if(

        boardedPatients >= 20

        ||

        difference >= 5

    ){

        return "bravo";

    }


    return "alpha";

}


/**
 * Determine hospital-capacity severity.
 */
function determineHospitalSeverity(

    percentage:number

):

    | "alpha"

    | "bravo"

    | "charlie"

    | "delta"

    | "echo" {

    if(percentage >= 100){

        return "echo";

    }


    if(percentage >= 97){

        return "delta";

    }


    if(percentage >= 95){

        return "charlie";

    }


    if(percentage >= 90){

        return "bravo";

    }


    return "alpha";

}


/**
 * Determine expected-flow severity.
 */
function determineFlowSeverity(

    netFlow:number

):

    | "alpha"

    | "bravo"

    | "charlie"

    | "delta"

    | "echo" {

    if(netFlow >= 12){

        return "echo";

    }


    if(netFlow >= 8){

        return "delta";

    }


    if(netFlow >= 5){

        return "charlie";

    }


    if(netFlow > 0){

        return "bravo";

    }


    return "alpha";

}


/**
 * Determine clinical-acuity severity.
 */
function determineAcuitySeverity(

    percentage:number

):

    | "alpha"

    | "bravo"

    | "charlie"

    | "delta"

    | "echo" {

    if(percentage >= 45){

        return "echo";

    }


    if(percentage >= 35){

        return "delta";

    }


    if(percentage >= 25){

        return "charlie";

    }


    if(percentage >= 15){

        return "bravo";

    }


    return "alpha";

}


/**
 * Convert Alpha–Echo title to card severity.
 */
function createStateSeverity(

    title:string

):

    | "alpha"

    | "bravo"

    | "charlie"

    | "delta"

    | "echo" {

    switch(title){

        case "Bravo":

            return "bravo";


        case "Charlie":

            return "charlie";


        case "Delta":

            return "delta";


        case "Echo":

            return "echo";


        default:

            return "alpha";

    }

}


/**
 * Safely calculate a percentage.
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
 * Format a number for display.
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


    const formatted = formatNumber(

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
 * Create placeholder cards before calculation.
 */
function createAwaitingAssessmentCards():string {

    const cards = [

        {

            title:
                "ED Demand",

            icon:
                "🏥"

        },

        {

            title:
                "Boarding",

            icon:
                "🛏️"

        },

        {

            title:
                "Medical Capacity",

            icon:
                "🏨"

        },

        {

            title:
                "Expected Throughput",

            icon:
                "↔️"

        },

        {

            title:
                "Clinical Acuity",

            icon:
                "⚕️"

        },

        {

            title:
                "Operational Status",

            icon:
                "◯"

        }

    ];


    return cards

        .map(

            card => `

                <article
                    class="
                        command-center-card
                        command-center-card-placeholder
                    "
                >

                    <div class="command-center-card-header">

                        <span class="command-center-card-title">

                            ${escapeHtml(
                                card.title
                            )}

                        </span>


                        <span
                            class="command-center-card-icon"
                            aria-hidden="true"
                        >

                            ${escapeHtml(
                                card.icon
                            )}

                        </span>

                    </div>


                    <strong class="command-center-card-value">
                        --
                    </strong>


                    <p class="command-center-card-description">
                        Awaiting EDORI calculation.
                    </p>

                </article>

            `

        )

        .join("");

}


/**
 * Create the recalculation-required card.
 */
function createRecalculationRequiredCard(

    reason:string

):string {

    return `

        <article
            class="
                command-center-card
                command-center-card-wide
                command-center-card-recalculation
            "
        >

            <span class="command-center-card-label">
                Recalculation Required
            </span>

            <strong class="command-center-card-value">
                Update needed
            </strong>

            <p class="command-center-card-description">

                ${escapeHtml(reason)}

            </p>

        </article>

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

    return escapeHtml(

        value

    );

}