/**
 * AssessmentDetails
 *
 * Displays the current committed Hospital Readiness assessment
 * values and historical comparisons.
 *
 * This component does not:
 *
 * - Calculate Hospital Readiness
 * - Evaluate operational triggers
 * - Modify application state
 * - Save assessments
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
 * Physical ED treatment-bed capacity used for the
 * ED capacity-use display.
 */
const ED_TREATMENT_BEDS = 63;


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
                        Submitted hospital operational values, historical comparisons, and four-hour capacity forecast
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

        assessment.expectedEDVolume;


    const boardingDifference =

        assessment.boardedPatients

        -

        assessment.expectedEDBoarders;


    const edCapacityUse = calculatePercentage(

        assessment.totalEDVolume,

        ED_TREATMENT_BEDS

    );


    const boardingShare = calculatePercentage(

        assessment.boardedPatients,

        assessment.totalEDVolume

    );


    const highAcuityCount =

        assessment.esi1

        +

        assessment.esi2;


    const lowerAcuityCount = Math.max(

        0,

        assessment.totalEDVolume

        -

        highAcuityCount

    );


    const highAcuityPercent = calculatePercentage(

        highAcuityCount,

        assessment.totalEDVolume

    );


    const acuteOccupancyPercent = calculatePercentage(

        assessment.occupiedAcuteCareBeds,

        assessment.staffedAcuteCareBeds

    );


    const criticalOccupancyPercent = calculatePercentage(

        assessment.occupiedCriticalCareBeds,

        assessment.staffedCriticalCareBeds

    );


    const currentAvailableAcuteCareBeds =

        assessment.staffedAcuteCareBeds

        -

        assessment.occupiedAcuteCareBeds;


    const currentAvailableCriticalCareBeds =

        assessment.staffedCriticalCareBeds

        -

        assessment.occupiedCriticalCareBeds;


    /*
     * Version 2.2 projected acute-care capacity:
     *
     * Historical data predicts only uncertain future flow:
     * - additional ED-origin inpatient admissions
     * - inpatient departures
     *
     * Direct and surgical/procedural admissions are treated
     * as known four-hour demand.
     *
     * Existing ED boarders are added exactly once as unresolved
     * inpatient bed demand.
     */
    const projectedAvailableAcuteCareBeds =

        currentAvailableAcuteCareBeds

        +

        assessment.expectedInpatientDepartures4h

        -

        assessment.boardedPatients

        -

        assessment.currentDirectAdmissions

        -

        assessment.currentSurgicalAdmissions

        -

        assessment.expectedEDAdmissions4h;


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


            <div>

                <span class="assessment-details-label">
                    Forecast Horizon
                </span>

                <strong>
                    ${formatNumber(assessment.forecastHours)} hours
                </strong>

            </div>

        </div>


        <div class="assessment-details-section">

            <h4>
                ED Operational Pressure
            </h4>


            <div class="assessment-details-grid">

                ${createComparisonCard({

                    label:
                        "Total ED Volume",

                    currentValue:
                        assessment.totalEDVolume,

                    expectedValue:
                        assessment.expectedEDVolume,

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
                        assessment.expectedEDBoarders,

                    difference:
                        boardingDifference,

                    unit:
                        "patients"

                })}


                ${createMetricCard({

                    label:
                        "ED Capacity Use",

                    value:
                        `${formatNumber(edCapacityUse)}%`,

                    description:
                        `${formatNumber(
                            assessment.totalEDVolume
                        )} patients across ${ED_TREATMENT_BEDS} ED treatment beds.`

                })}


                ${createMetricCard({

                    label:
                        "Boarding Share",

                    value:
                        `${formatNumber(boardingShare)}%`,

                    description:
                        "Percentage of the current ED census consisting of admitted boarders."

                })}

            </div>

        </div>


        <div class="assessment-details-section">

            <h4>
                Acute-Care Capacity
            </h4>


            <div class="assessment-details-grid">

                ${createMetricCard({

                    label:
                        "Occupied / Staffed Acute-Care Beds",

                    value:
                        `${formatNumber(
                            assessment.occupiedAcuteCareBeds
                        )} / ${formatNumber(
                            assessment.staffedAcuteCareBeds
                        )}`,

                    description:
                        `${formatNumber(
                            acuteOccupancyPercent
                        )}% of currently staffed acute-care capacity is occupied.`

                })}


                ${createMetricCard({

                    label:
                        "Currently Available Acute-Care Beds",

                    value:
                        formatBedAvailability(
                            currentAvailableAcuteCareBeds
                        ),

                    description:
                        "Staffed acute-care beds not currently occupied."

                })}

            </div>

        </div>


        <div class="assessment-details-section">

            <h4>
                Critical-Care Capacity
            </h4>


            <div class="assessment-details-grid">

                ${createMetricCard({

                    label:
                        "Occupied / Staffed Critical-Care Beds",

                    value:
                        `${formatNumber(
                            assessment.occupiedCriticalCareBeds
                        )} / ${formatNumber(
                            assessment.staffedCriticalCareBeds
                        )}`,

                    description:
                        `${formatNumber(
                            criticalOccupancyPercent
                        )}% of currently staffed critical-care capacity is occupied.`

                })}


                ${createMetricCard({

                    label:
                        "Currently Available Critical-Care Beds",

                    value:
                        formatBedAvailability(
                            currentAvailableCriticalCareBeds
                        ),

                    description:
                        "Staffed critical-care beds not currently occupied."

                })}

            </div>

        </div>


        <div class="assessment-details-section">

            <h4>
                Known Four-Hour Inpatient Demand
            </h4>


            <div class="assessment-details-grid">

                ${createMetricCard({

                    label:
                        "ED Admissions Awaiting Beds",

                    value:
                        formatNumber(
                            assessment.boardedPatients
                        ),

                    description:
                        "Current admitted ED patients awaiting inpatient beds. These patients are counted once as known acute-care bed demand."

                })}


                ${createMetricCard({

                    label:
                        "Known Direct Admissions",

                    value:
                        formatNumber(
                            assessment.currentDirectAdmissions
                        ),

                    description:
                        "Known direct inpatient admissions expected during the current four-hour forecast horizon."

                })}


                ${createMetricCard({

                    label:
                        "Known Surgical / Procedural Admissions",

                    value:
                        formatNumber(
                            assessment.currentSurgicalAdmissions
                        ),

                    description:
                        "Known inpatient admissions expected from surgical or procedural areas during the current four-hour forecast horizon."

                })}

            </div>

        </div>


        <div class="assessment-details-section">

            <h4>
                Four-Hour Historical Forecast and Projected Capacity
            </h4>


            <div class="assessment-details-grid">

                ${createMetricCard({

                    label:
                        "Expected Additional ED Admissions",

                    value:
                        formatNumber(
                            assessment.expectedEDAdmissions4h
                        ),

                    description:
                        "Historical forecast of new ED-origin inpatient admissions expected during the next four hours. Current ED boarders are excluded."

                })}


                ${createMetricCard({

                    label:
                        "Expected Inpatient Departures",

                    value:
                        formatNumber(
                            assessment.expectedInpatientDepartures4h
                        ),

                    description:
                        "Historical forecast of inpatient departures during the next four hours. This value is not entered by the user."

                })}


                ${createMetricCard({

                    label:
                        "Projected Available Acute-Care Beds",

                    value:
                        formatBedAvailability(
                            projectedAvailableAcuteCareBeds
                        ),

                    description:
                        createProjectedCapacityDescription(
                            projectedAvailableAcuteCareBeds
                        ),

                    className:
                        projectedAvailableAcuteCareBeds < 0

                            ? "assessment-details-flow-increasing"

                            : projectedAvailableAcuteCareBeds === 0

                                ? "assessment-details-flow-stable"

                                : "assessment-details-flow-improving"

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
                        ESI 1-2 Patients
                    </span>

                    <strong>
                        ${formatNumber(highAcuityCount)}
                    </strong>

                </div>


                <div>

                    <span class="assessment-details-label">
                        Assumed ESI 3-5 Patients
                    </span>

                    <strong>
                        ${formatNumber(lowerAcuityCount)}
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

                ${createGroupedEsiCard(
                    lowerAcuityCount,
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
 * Create the inferred ESI 3-5 display card.
 *
 * ESI 3, 4, and 5 are intentionally not entered
 * individually in the Version 2 assessment.
 */
function createGroupedEsiCard(

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
                ESI 3-5
            </span>

            <strong>
                ${formatNumber(patientCount)}
            </strong>

            <small>
                ${formatNumber(percentage)}% · inferred
            </small>

        </article>

    `;

}


/**
 * Format current or projected bed availability.
 *
 * Negative values are intentionally preserved because
 * they represent demand projected to exceed staffed
 * acute-care capacity.
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
 * Explain the four-hour projected acute-care result.
 */
function createProjectedCapacityDescription(

    projectedAvailableBeds:number

):string {

    if(projectedAvailableBeds < 0){

        return `Projected demand exceeds staffed acute-care capacity by approximately ${formatNumber(
            Math.abs(projectedAvailableBeds)
        )} beds over the four-hour forecast horizon.`;

    }


    if(projectedAvailableBeds === 0){

        return "Known inpatient demand, forecast additional ED admissions, and expected inpatient departures result in complete utilization of staffed acute-care capacity.";

    }


    return `Approximately ${formatNumber(
        projectedAvailableBeds
    )} staffed acute-care beds are projected to remain available after known inpatient demand, forecast additional ED admissions, and expected inpatient departures.`;

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
                Calculate Hospital Readiness to display the committed operational values.
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