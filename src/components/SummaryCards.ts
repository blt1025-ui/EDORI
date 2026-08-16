/**
 * SummaryCards
 *
 * Displays five Hospital Readiness domain cards
 * using the authoritative OperationalAssessment.
 *
 * Cards:
 *
 * - ED Operational Pressure
 * - Acute-Care Capacity
 * - Critical-Care Capacity
 * - Hospital Inflow
 * - Projected Capacity
 *
 * This component does not calculate Hospital Readiness,
 * evaluate triggers, or modify application state.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    getDomainCardSeverity

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

    OperationalAssessment

}

from "../types/OperationalAssessment";


/**
 * Physical ED treatment-bed capacity used for the
 * ED census capacity-use display.
 */
const ED_TREATMENT_BEDS = 63;


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
 * Create all five completed domain cards.
 */
function createCommandCenterCards(

    operationalAssessment:OperationalAssessment

):string {

    const assessment =

        operationalAssessment.assessment;


    const result =

        operationalAssessment.scoreResult;
/*
     * =================================================
     * Emergency Department
     * =================================================
     */

    const edOccupancyPercent = calculatePercentage(

        assessment.totalEDVolume,

        ED_TREATMENT_BEDS

    );


    const volumeDifference =

        assessment.totalEDVolume

        -

        assessment.expectedEDVolume;


    const boardingDifference =

        assessment.boardedPatients

        -

        assessment.expectedEDBoarders;


    const boardingShare = calculatePercentage(

        assessment.boardedPatients,

        assessment.totalEDVolume

    );


    const highAcuityCount =

        assessment.esi1

        +

        assessment.esi2;


    const highAcuityPercent = calculatePercentage(

        highAcuityCount,

        assessment.totalEDVolume

    );


    /*
     * =================================================
     * Hospital Capacity
     * =================================================
     */

    const acuteOccupancyPercent = calculatePercentage(

        assessment.occupiedAcuteCareBeds,

        assessment.staffedAcuteCareBeds

    );


    const criticalOccupancyPercent = calculatePercentage(

        assessment.occupiedCriticalCareBeds,

        assessment.staffedCriticalCareBeds

    );


    const currentAvailableAcuteCareBeds =

        result.currentAvailableAcuteCareBeds;


    /*
     * =================================================
     * Hospital Flow
     * =================================================
     */

    const inflowDifference =

        result.currentHospitalInflow

        -

        result.expectedHospitalInflow;


    const projectedAvailableAcuteCareBeds =

        result.projectedAvailableAcuteCareBeds;
return `

        ${createCommandCenterCard({

            title:
                "ED Operational Pressure",

            icon:
                "🏥",

            primaryLabel:
                "Total ED Volume",

            primaryValue:
                `${formatNumber(
                    assessment.totalEDVolume
                )} / ${ED_TREATMENT_BEDS}`,

            secondaryValue:
                `${formatNumber(
                    edOccupancyPercent
                )}% ED capacity use`,

            comparison:
                createDifferenceText(

                    volumeDifference,

                    "vs historical expected volume"

                ),

            detail:
                `Boarding: ${formatNumber(
                    assessment.boardedPatients
                )} (${formatNumber(
                    boardingShare
                )}% of ED census); ${createDifferenceText(
                    boardingDifference,
                    "vs historical expected boarding"
                )}. ESI 1-2: ${formatNumber(
                    highAcuityCount
                )} (${formatNumber(
                    highAcuityPercent
                )}%).`,

            severity:
                getDomainCardSeverity(

                    result.edPressureScore

                )

        })}


        ${createCommandCenterCard({

            title:
                "Acute-Care Capacity",

            icon:
                "🛏️",

            primaryLabel:
                "Occupied / Staffed Beds",

            primaryValue:
                `${formatNumber(
                    assessment.occupiedAcuteCareBeds
                )} / ${formatNumber(
                    assessment.staffedAcuteCareBeds
                )}`,

            secondaryValue:
                `${formatNumber(
                    acuteOccupancyPercent
                )}% occupied`,

            comparison:
                `${formatSignedAvailability(
                    currentAvailableAcuteCareBeds
                )} currently available`,

            detail:
                `Four-hour projected availability: ${formatSignedAvailability(
                    projectedAvailableAcuteCareBeds
                )}.`,

            severity:
                getDomainCardSeverity(

                    result.acuteCapacityScore

                )

        })}


        ${createCommandCenterCard({

            title:
                "Critical-Care Capacity",

            icon:
                "⚕️",

            primaryLabel:
                "Occupied / Staffed Beds",

            primaryValue:
                `${formatNumber(
                    assessment.occupiedCriticalCareBeds
                )} / ${formatNumber(
                    assessment.staffedCriticalCareBeds
                )}`,

            secondaryValue:
                `${formatNumber(
                    criticalOccupancyPercent
                )}% occupied`,

            comparison:
                `${formatSignedAvailability(
                    assessment.staffedCriticalCareBeds
                    -
                    assessment.occupiedCriticalCareBeds
                )} currently available`,

            detail:
                "Critical-care capacity is evaluated separately from acute-care capacity.",

            severity:
                getDomainCardSeverity(

                    result.criticalCapacityScore

                )

        })}


        ${createCommandCenterCard({

            title:
                "Hospital Inflow",

            icon:
                "↘️",

            primaryLabel:
    "Known Non-ED Inflow",

            primaryValue:
                formatNumber(

                    result.currentHospitalInflow

                ),

            secondaryValue:
                `${formatNumber(
                    result.expectedHospitalInflow
                )} historical expected`,

            comparison:
                createDifferenceText(

                    inflowDifference,

                    "vs historical expected inflow"

                ),

            detail:
    `Known non-ED inflow: direct admissions ${formatNumber(
        assessment.currentDirectAdmissions
    )} · surgical/procedural admissions ${formatNumber(
        assessment.currentSurgicalAdmissions
    )}.`,

            severity:
                getDomainCardSeverity(

                    result.inflowScore

                )

        })}


        ${createCommandCenterCard({

            title:
                "Projected Capacity",

            icon:
                "↔️",

            primaryLabel:
                "Projected Acute-Care Beds",

            primaryValue:
                formatSignedAvailability(

                    projectedAvailableAcuteCareBeds

                ),

            secondaryValue:
                `${formatNumber(
                    result.expectedInpatientDepartures
                )} expected inpatient departures`,

            comparison:
                createProjectedCapacityLabel(

                    projectedAvailableAcuteCareBeds

                ),

            detail:
                `Forecast uses ${formatNumber(
                    result.projectedHospitalInflow
                )} projected admissions over the ${formatNumber(
                    assessment.forecastHours
                )}-hour horizon. Negative bed availability means projected demand exceeds staffed acute-care capacity.`,

            severity:
                getDomainCardSeverity(

                    result.projectedCapacityScore

                )

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
 * Format available-bed values without hiding a
 * negative capacity deficit.
 */
function formatSignedAvailability(

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
 * Interpret projected acute-care availability.
 */
function createProjectedCapacityLabel(

    projectedAvailableBeds:number

):string {

    if(projectedAvailableBeds < 0){

        return `Projected capacity deficit of ${formatNumber(
            Math.abs(projectedAvailableBeds)
        )} beds`;

    }


    if(projectedAvailableBeds === 0){

        return "Projected to fully utilize staffed capacity";

    }


    return `${formatNumber(
        projectedAvailableBeds
    )} staffed beds projected available`;

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
            title:"ED Operational Pressure",
            icon:"🏥"
        },

        {
            title:"Acute-Care Capacity",
            icon:"🛏️"
        },

        {
            title:"Critical-Care Capacity",
            icon:"⚕️"
        },

        {
            title:"Hospital Inflow",
            icon:"↘️"
        },

        {
            title:"Projected Capacity",
            icon:"↔️"
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
                        Awaiting Hospital Readiness calculation.
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