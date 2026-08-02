/**
 * AssessmentDetails
 *
 * Displays the current committed EDORI assessment
 * values and historical comparisons.
 *
 * This component does not:
 *
 * - Calculate EDORI
 * - Evaluate operational triggers
 * - Modify application state
 * - Save assessments
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

    getResultInvalidationReason

}

from "../services/ResultService";


import {

    getState,

    hasCommittedAssessment

}

from "../services/StateService";


import type {

    SituationAssessment

}

from "../types/SituationAssessment";


/**
 * Render the Current Assessment Details panel.
 */
export function AssessmentDetails():string {

    return `

        <section class="assessment-details-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Current Assessment Details
                    </h3>

                    <p class="panel-description">
                        Submitted operational values and historical comparisons
                    </p>

                </div>

            </div>


            <div
                id="assessmentDetailsContent"
                class="assessment-details-content"
                aria-live="polite"
            >

                ${createAwaitingAssessmentState()}

            </div>

        </section>

    `;

}


/**
 * Initialize assessment-detail behavior.
 */
export function initializeAssessmentDetails():void {

    updateAssessmentDetails();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateAssessmentDetails

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateAssessmentDetails

    );

}


/**
 * Refresh the panel from the committed assessment.
 */
function updateAssessmentDetails():void {

    const container = document.getElementById(

        "assessmentDetailsContent"

    );


    if(!container){

        return;

    }


    if(!hasCommittedAssessment()){

        container.innerHTML =

            createAwaitingAssessmentState();


        return;

    }


    const assessment = getState();


    const invalidationReason =

        getResultInvalidationReason();


    container.innerHTML =

        createAssessmentMarkup(

            assessment,

            invalidationReason

        );

}


/**
 * Create the completed assessment display.
 */
function createAssessmentMarkup(

    assessment:SituationAssessment,

    invalidationReason:string | null

):string {

    const edVolumeDifference =

        assessment.totalEDVolume

        -

        assessment.expectedVolume;


    const boardingDifference =

        assessment.boardedPatients

        -

        assessment.expectedBoarders;


    const hospitalOccupancy = calculatePercentage(

        assessment.occupiedMedicalBeds,

        HOSPITAL.MEDICAL_BEDS

    );


    const expectedNetFlow =

        assessment.expectedArrivals

        -

        assessment.expectedDepartures;


    const esiTotal =

        assessment.esi1

        +

        assessment.esi2

        +

        assessment.esi3

        +

        assessment.esi4

        +

        assessment.esi5;


    const highAcuityCount =

        assessment.esi1

        +

        assessment.esi2;


    const highAcuityPercent = calculatePercentage(

        highAcuityCount,

        assessment.totalEDVolume

    );


    return `

        ${invalidationReason

            ? `

                <div class="assessment-details-warning">

                    <strong>
                        Recalculation required
                    </strong>

                    <p>

                        ${escapeHtml(
                            invalidationReason
                        )}

                    </p>

                </div>

            `

            : ""

        }


        <div class="assessment-details-timestamp">

            <div>

                <span class="assessment-details-label">
                    Assessment Time
                </span>

                <strong>

                    ${escapeHtml(
                        formatAssessmentTime(
                            assessment.assessmentTime
                        )
                    )}

                </strong>

            </div>


            <div>

                <span class="assessment-details-label">
                    Historical Baseline
                </span>

                <strong>

                    ${escapeHtml(
                        createHistoricalPeriodLabel(
                            assessment
                        )
                    )}

                </strong>

            </div>

        </div>


        <div class="assessment-details-section">

            <h4>
                ED Demand
            </h4>


            <div class="assessment-details-grid">

                ${createComparisonCard({

                    label:
                        "Total ED Volume",

                    currentValue:
                        assessment.totalEDVolume,

                    expectedValue:
                        assessment.expectedVolume,

                    difference:
                        edVolumeDifference,

                    unit:
                        "patients"

                })}


                ${createComparisonCard({

                    label:
                        "Boarding Patients",

                    currentValue:
                        assessment.boardedPatients,

                    expectedValue:
                        assessment.expectedBoarders,

                    difference:
                        boardingDifference,

                    unit:
                        "patients"

                })}


                ${createMetricCard({

                    label:
                        "ED Capacity Use",

                    value:
                        `${formatNumber(
                            calculatePercentage(
                                assessment.totalEDVolume,
                                HOSPITAL.ED_BEDS
                            )
                        )}%`,

                    description:
                        `${assessment.totalEDVolume} patients across ${HOSPITAL.ED_BEDS} configured ED beds.`

                })}


                ${createMetricCard({

                    label:
                        "Boarding Share",

                    value:
                        `${formatNumber(
                            calculatePercentage(
                                assessment.boardedPatients,
                                assessment.totalEDVolume
                            )
                        )}%`,

                    description:
                        "Percentage of the current ED census consisting of admitted boarders."

                })}

            </div>

        </div>


        <div class="assessment-details-section">

            <h4>
                Hospital Capacity and Expected Flow
            </h4>


            <div class="assessment-details-grid">

                ${createMetricCard({

                    label:
                        "Occupied Medical Beds",

                    value:
                        formatNumber(
                            assessment.occupiedMedicalBeds
                        ),

                    description:
                        `${formatNumber(
                            hospitalOccupancy
                        )}% of the configured ${HOSPITAL.MEDICAL_BEDS}-bed medical capacity.`

                })}


                ${createMetricCard({

                    label:
                        "Expected Arrivals",

                    value:
                        formatNumber(
                            assessment.expectedArrivals
                        ),

                    description:
                        "Historical expected arrivals for the current hourly period."

                })}


                ${createMetricCard({

                    label:
                        "Expected Departures",

                    value:
                        formatNumber(
                            assessment.expectedDepartures
                        ),

                    description:
                        "Historical expected departures for the current hourly period."

                })}


                ${createMetricCard({

                    label:
                        "Expected Net Flow",

                    value:
                        formatSignedNumber(
                            expectedNetFlow
                        ),

                    description:
                        createNetFlowDescription(
                            expectedNetFlow
                        ),

                    className:
                        expectedNetFlow > 0

                            ? "assessment-details-flow-increasing"

                            : expectedNetFlow < 0

                                ? "assessment-details-flow-improving"

                                : "assessment-details-flow-stable"

                })}

            </div>

        </div>


        <div class="assessment-details-section">

            <h4>
                Patient Acuity
            </h4>


            <div class="assessment-details-acuity-summary">

                <div>

                    <span class="assessment-details-label">
                        ESI Total
                    </span>

                    <strong>
                        ${formatNumber(esiTotal)}
                    </strong>

                </div>


                <div>

                    <span class="assessment-details-label">
                        ESI 1–2 Patients
                    </span>

                    <strong>
                        ${formatNumber(highAcuityCount)}
                    </strong>

                </div>


                <div>

                    <span class="assessment-details-label">
                        High-Acuity Percentage
                    </span>

                    <strong>
                        ${formatNumber(highAcuityPercent)}%
                    </strong>

                </div>

            </div>


            <div class="assessment-details-esi-grid">

                ${createEsiCard(
                    1,
                    assessment.esi1,
                    assessment.totalEDVolume
                )}

                ${createEsiCard(
                    2,
                    assessment.esi2,
                    assessment.totalEDVolume
                )}

                ${createEsiCard(
                    3,
                    assessment.esi3,
                    assessment.totalEDVolume
                )}

                ${createEsiCard(
                    4,
                    assessment.esi4,
                    assessment.totalEDVolume
                )}

                ${createEsiCard(
                    5,
                    assessment.esi5,
                    assessment.totalEDVolume
                )}

            </div>

        </div>

    `;

}


/**
 * Create one current-versus-expected card.
 */
function createComparisonCard(

    options:{

        label:string;

        currentValue:number;

        expectedValue:number;

        difference:number;

        unit:string;

    }

):string {

    const differenceClass = options.difference > 0

        ? "assessment-details-difference-above"

        : options.difference < 0

            ? "assessment-details-difference-below"

            : "assessment-details-difference-equal";


    return `

        <article class="assessment-details-card">

            <span class="assessment-details-label">

                ${escapeHtml(
                    options.label
                )}

            </span>


            <strong class="assessment-details-value">

                ${formatNumber(
                    options.currentValue
                )}

            </strong>


            <div class="assessment-details-comparison">

                <span>

                    Expected:

                    <strong>

                        ${formatNumber(
                            options.expectedValue
                        )}

                    </strong>

                </span>


                <span
                    class="
                        assessment-details-difference
                        ${differenceClass}
                    "
                >

                    ${formatSignedNumber(
                        options.difference
                    )}

                    ${escapeHtml(
                        options.unit
                    )}

                </span>

            </div>

        </article>

    `;

}


/**
 * Create one standard metric card.
 */
function createMetricCard(

    options:{

        label:string;

        value:string;

        description:string;

        className?:string;

    }

):string {

    return `

        <article
            class="
                assessment-details-card
                ${escapeAttribute(
                    options.className

                    ?? ""
                )}
            "
        >

            <span class="assessment-details-label">

                ${escapeHtml(
                    options.label
                )}

            </span>


            <strong class="assessment-details-value">

                ${escapeHtml(
                    options.value
                )}

            </strong>


            <p class="assessment-details-description">

                ${escapeHtml(
                    options.description
                )}

            </p>

        </article>

    `;

}


/**
 * Create one ESI distribution card.
 */
function createEsiCard(

    esiLevel:number,

    patientCount:number,

    totalEDVolume:number

):string {

    const percentage = calculatePercentage(

        patientCount,

        totalEDVolume

    );


    return `

        <article class="assessment-details-esi-card">

            <span>
                ESI ${esiLevel}
            </span>

            <strong>
                ${formatNumber(patientCount)}
            </strong>

            <small>
                ${formatNumber(percentage)}%
            </small>

        </article>

    `;

}


/**
 * Create a historical weekday/hour label.
 */
function createHistoricalPeriodLabel(

    assessment:SituationAssessment

):string {

    const hour = Math.min(

        23,

        Math.max(

            0,

            Math.round(
                assessment.hour
            )

        )

    );


    const formattedHour = new Date(

        2000,

        0,

        1,

        hour

    ).toLocaleTimeString(

        [],

        {

            hour:
                "numeric"

        }

    );


    return `${assessment.day}, ${formattedHour}`;

}


/**
 * Format the assessment timestamp.
 */
function formatAssessmentTime(

    assessmentTime:Date | string

):string {

    const date = new Date(

        assessmentTime

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
 * Describe expected net flow.
 */
function createNetFlowDescription(

    expectedNetFlow:number

):string {

    if(expectedNetFlow > 0){

        return "Expected arrivals exceed expected departures, suggesting potential census growth.";

    }


    if(expectedNetFlow < 0){

        return "Expected departures exceed expected arrivals, suggesting potential census reduction.";

    }


    return "Expected arrivals and departures are balanced.";

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
 * Format a signed value.
 */
function formatSignedNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    const formattedValue = formatNumber(

        Math.abs(value)

    );


    if(value > 0){

        return `+${formattedValue}`;

    }


    if(value < 0){

        return `-${formattedValue}`;

    }


    return "0";

}


/**
 * Create the initial empty state.
 */
function createAwaitingAssessmentState():string {

    return `

        <div class="assessment-details-empty">

            <strong>
                Awaiting assessment
            </strong>

            <p>
                Calculate EDORI to display the committed operational values.
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