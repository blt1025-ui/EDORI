/**
 * SituationAssessment
 *
 * Main EDORI operational data-entry panel.
 *
 * Workflow:
 *
 * User enters current operational values
 *        ↓
 * Selects Calculate EDORI
 *        ↓
 * Current weekday and hour are captured
 *        ↓
 * Historical expectations are loaded
 *        ↓
 * Assessment is validated and committed
 *        ↓
 * EDORI is calculated once
 *        ↓
 * Latest result is stored
 *        ↓
 * One historical snapshot is saved
 *        ↓
 * resultChanged is emitted
 *
 * Staffing is intentionally excluded from:
 *
 * - The assessment form
 * - Historical expectations
 * - EDORI scoring
 * - Drivers
 * - Recommendations
 */

import {

    submitAssessment,

    updateDraft

}

from "../../services/AssessmentService";


import {

    getState,

    hasCommittedAssessment,

    updateState

}

from "../../services/StateService";


import {

    calculateEdori

}

from "../../services/EdoriService";


import {

    getResultInvalidationReason,

    setLatestResult

}

from "../../services/ResultService";


import {

    saveSnapshot,

    shouldCreateSnapshot

}

from "../../services/SnapshotService";


import {

    validateState

}

from "../../services/ValidationService";


import {

    emit

}

from "../../services/EventService";


import {

    getAssessmentPeriod,

    getExpectedOperationalValues,

    hasHistoricalExpectation

}

from "../../services/HistoricalDataService";


import type {

    ExpectedOperationalValues

}

from "../../services/HistoricalDataService";


import type {

    DayOfWeek

}

from "../../types/HistoricalExpectation";


import type {

    SituationAssessment as SituationAssessmentType

}

from "../../types/SituationAssessment";


/**
 * Current operational values entered by the user.
 *
 * Historical expectation values are populated
 * automatically at calculation time.
 */
const CURRENT_VALUE_FIELDS:Array<

    keyof SituationAssessmentType

> = [

    "totalEDVolume",

    "boardedPatients",

    "occupiedMedicalBeds",

    "esi1",

    "esi2",

    "esi3",

    "esi4",

    "esi5"

];


/**
 * Render the Situation Assessment form.
 */
export function SituationAssessment():string {

    return `

        <section class="situation-assessment">

            <div class="section-header">

                <h2>
                    Situation Assessment
                </h2>

                <p>
                    Enter the current operational data set, then calculate EDORI.
                </p>

            </div>


            <div class="assessment-section">

                <h3>
                    ED Demand
                </h3>


                <div class="input-grid">

                    ${createNumberInput(

                        "totalEDVolume",

                        "Total ED Volume",

                        0

                    )}


                    ${createNumberInput(

                        "boardedPatients",

                        "Boarding Patients",

                        0

                    )}

                </div>

            </div>


            <div class="assessment-section">

                <h3>
                    Hospital Capacity
                </h3>


                <div class="input-grid">

                    ${createNumberInput(

                        "occupiedMedicalBeds",

                        "Occupied Medical Beds",

                        0,

                        273

                    )}

                </div>

            </div>


            <div class="assessment-section">

                <h3>
                    Patient Acuity Distribution
                </h3>


                <p class="section-description">

                    Enter the number of current ED patients in each Emergency Severity Index category.

                </p>


                <div class="input-grid">

                    ${createNumberInput(

                        "esi1",

                        "ESI 1",

                        0

                    )}


                    ${createNumberInput(

                        "esi2",

                        "ESI 2",

                        0

                    )}


                    ${createNumberInput(

                        "esi3",

                        "ESI 3",

                        0

                    )}


                    ${createNumberInput(

                        "esi4",

                        "ESI 4",

                        0

                    )}


                    ${createNumberInput(

                        "esi5",

                        "ESI 5",

                        0

                    )}

                </div>


                <div
                    id="esiTotalSummary"
                    class="esi-total-summary"
                    aria-live="polite"
                >

                    ESI Total: 0

                </div>

            </div>


            <div
                class="
                    assessment-section
                    historical-expectations-section
                "
            >

                <div class="historical-section-header">

                    <div>

                        <h3>
                            Historical Expectations
                        </h3>

                        <p id="historicalPeriodDisplay">

                            Based on the weekday and hour when EDORI is calculated.

                        </p>

                    </div>


                    <span
                        id="historicalDataStatus"
                        class="historical-data-status"
                    >

                        Awaiting calculation

                    </span>

                </div>


                <div class="historical-expectations-grid">

                    ${createExpectationDisplay(

                        "expectedVolumeDisplay",

                        "Expected ED Volume"

                    )}


                    ${createExpectationDisplay(

                        "expectedBoardersDisplay",

                        "Expected Boarding"

                    )}


                    ${createExpectationDisplay(

                        "expectedArrivalsDisplay",

                        "Expected Arrivals"

                    )}


                    ${createExpectationDisplay(

                        "expectedDeparturesDisplay",

                        "Expected Departures"

                    )}

                </div>

            </div>


            <div class="assessment-actions">

                <button
                    id="calculateEdoriButton"
                    class="calculate-button"
                    type="button"
                >

                    Calculate EDORI

                </button>


                <p
                    id="assessmentMessage"
                    class="
                        assessment-message
                        assessment-message-default
                    "
                    aria-live="polite"
                >

                    Enter all operational data, then calculate.

                </p>

            </div>

        </section>

    `;

}


/**
 * Create a numeric assessment input.
 */
function createNumberInput(

    id:keyof SituationAssessmentType,

    label:string,

    minimum:number,

    maximum?:number

):string {

    const maximumAttribute =

        maximum === undefined

            ? ""

            : `max="${maximum}"`;


    return `

        <div class="input-group">

            <label for="${id}">

                ${label}

            </label>


            <input
                id="${id}"
                type="number"
                min="${minimum}"
                ${maximumAttribute}
                step="1"
                value="0"
                inputmode="numeric"
            />

        </div>

    `;

}


/**
 * Create a read-only historical expectation card.
 */
function createExpectationDisplay(

    id:string,

    label:string

):string {

    return `

        <div class="historical-expectation-card">

            <span class="historical-expectation-label">

                ${label}

            </span>


            <strong
                id="${id}"
                class="historical-expectation-value"
            >

                --

            </strong>

        </div>

    `;

}


/**
 * Initialize assessment behavior.
 */
export function initializeSituationAssessment():void {

    initializeCurrentValueInputs();

    initializeCalculateButton();

    restoreHistoricalDisplay();

    updateEsiTotalSummary();

    updateInitialAssessmentMessage();


    subscribeToHistoricalDataChanges();

}


/**
 * Initialize current-value input fields.
 *
 * If a committed assessment exists, restore
 * its values after a page refresh.
 */
function initializeCurrentValueInputs():void {

    const committedState = getState();


    const restoreCommittedValues =

        hasCommittedAssessment();


    CURRENT_VALUE_FIELDS.forEach(

        field => {

            const element = document.getElementById(

                field

            ) as HTMLInputElement | null;


            if(!element){

                console.warn(

                    `SituationAssessment could not find input: ${field}`

                );


                return;

            }


            const initialValue = restoreCommittedValues

                ? getNumericFieldValue(

                    committedState,

                    field

                )

                : parseInputValue(

                    element.value

                );


            element.value = String(

                initialValue

            );


            updateDraft(

                field,

                initialValue

            );


            element.addEventListener(

                "input",

                () => {

                    const value = parseInputValue(

                        element.value

                    );


                    updateDraft(

                        field,

                        value

                    );


                    if(isEsiField(field)){

                        updateEsiTotalSummary();

                    }


                    showDraftChangedMessage();

                }

            );

        }

    );

}


/**
 * Initialize the Calculate EDORI button.
 */
function initializeCalculateButton():void {

    const button = document.getElementById(

        "calculateEdoriButton"

    ) as HTMLButtonElement | null;


    if(!button){

        console.warn(

            "SituationAssessment could not find calculateEdoriButton."

        );


        return;

    }


    button.addEventListener(

        "click",

        submitAndCalculateAssessment

    );

}


/**
 * Respond when historical expectations are
 * imported or restored.
 */
function subscribeToHistoricalDataChanges():void {

    /*
     * EventService callbacks do not receive payloads.
     * The display is reset so the user knows that
     * the next calculation will use the new dataset.
     */

    import(

        "../../services/EventService"

    )

        .then(

            module => {

                module.subscribe(

                    "historicalDataChanged",

                    () => {

                        resetHistoricalDisplay();


                        showAssessmentMessage(

                            "Historical expectations changed. Review the current values and select Calculate EDORI to create an updated result.",

                            "draft"

                        );

                    }

                );

            }

        )

        .catch(

            error => {

                console.error(

                    "Unable to subscribe to historical data changes:",

                    error

                );

            }

        );

}


/**
 * Submit and calculate one completed assessment.
 */
function submitAndCalculateAssessment():void {

    const button = document.getElementById(

        "calculateEdoriButton"

    ) as HTMLButtonElement | null;


    setSubmissionState(

        button,

        true

    );


    try {

        /*
         * Capture one authoritative calculation time.
         */

        const calculationTime = new Date();


        const period = getAssessmentPeriod(

            calculationTime

        );


        /*
         * Do not calculate with missing historical
         * expectations because zero defaults would
         * create a misleading EDORI score.
         */

        const historicalDataAvailable =

            hasHistoricalExpectation(

                period.day,

                period.hour

            );


        if(!historicalDataAvailable){

            updateHistoricalPeriodDisplay(

                period.day,

                period.hour

            );


            updateHistoricalDataStatus(

                false

            );


            clearExpectedValueDisplays();


            showAssessmentMessage(

                `Historical expectations are not available for ${period.day} at ${formatHour(period.hour)}. EDORI cannot be calculated until this record is available.`,

                "error"

            );


            return;

        }


        const expectedValues =

            getExpectedOperationalValues(

                period.day,

                period.hour

            );


        /*
         * Add automatically selected metadata and
         * historical expectations to the draft.
         */

        applyHistoricalValuesToDraft(

            period.day,

            period.hour,

            calculationTime,

            expectedValues

        );


        updateHistoricalDisplay(

            period.day,

            period.hour,

            expectedValues

        );


        updateHistoricalDataStatus(

            true

        );


        const assessment = submitAssessment();


        if(!assessment){

            showAssessmentMessage(

                "Please complete all assessment fields before calculating.",

                "error"

            );


            return;

        }


        /*
         * Assign metadata explicitly so the final
         * committed assessment uses the same time
         * that selected the historical record.
         */

        assessment.assessmentTime =

            calculationTime.toISOString();


        assessment.day =

            period.day;


        assessment.hour =

            period.hour;


        assessment.expectedVolume =

            expectedValues.expectedVolume;


        assessment.expectedBoarders =

            expectedValues.expectedBoarders;


        assessment.expectedArrivals =

            expectedValues.expectedArrivals;


        assessment.expectedDepartures =

            expectedValues.expectedDepartures;


        const validation = validateState(

            assessment

        );


        if(!validation.valid){

            showAssessmentMessage(

                validation.errors.join(

                    " | "

                ),

                "error"

            );


            return;

        }


        /*
         * Commit the assessment.
         */

        updateState(

            assessment

        );


        /*
         * Calculate EDORI exactly once.
         */

        const result = calculateEdori(

            assessment

        );


        /*
         * Store and persist the authoritative result.
         *
         * This also clears any existing result
         * invalidation reason.
         */

        setLatestResult(

            result

        );


        /*
         * Create one historical snapshot.
         */

        const snapshot = {

            score:
                result.score,

            status:
                result.status,

            operationalState:
                result.operationalState,

            timestamp:
                calculationTime

        };


        if(

            shouldCreateSnapshot(

                snapshot

            )

        ){

            saveSnapshot(

                snapshot

            );

        }


        /*
         * Notify every result-driven component.
         */

        emit(

            "resultChanged"

        );


        showAssessmentMessage(

            `EDORI calculated successfully for ${period.day} at ${formatHour(period.hour)}. Score: ${Math.round(result.score)}.`,

            "success"

        );

    }
    catch(error){

        console.error(

            "Unable to calculate EDORI:",

            error

        );


        showAssessmentMessage(

            "Unable to calculate EDORI. Check the browser console for details.",

            "error"

        );

    }
    finally {

        setSubmissionState(

            button,

            false

        );

    }

}


/**
 * Apply metadata and historical expectations
 * to the draft assessment.
 */
function applyHistoricalValuesToDraft(

    day:DayOfWeek,

    hour:number,

    calculationTime:Date,

    values:ExpectedOperationalValues

):void {

    updateDraft(

        "assessmentTime",

        calculationTime.toISOString()

    );


    updateDraft(

        "day",

        day

    );


    updateDraft(

        "hour",

        hour

    );


    updateDraft(

        "expectedVolume",

        values.expectedVolume

    );


    updateDraft(

        "expectedBoarders",

        values.expectedBoarders

    );


    updateDraft(

        "expectedArrivals",

        values.expectedArrivals

    );


    updateDraft(

        "expectedDepartures",

        values.expectedDepartures

    );

}


/**
 * Restore historical values from the most
 * recently committed assessment.
 */
function restoreHistoricalDisplay():void {

    if(!hasCommittedAssessment()){

        resetHistoricalDisplay();


        return;

    }


    const state = getState();


    const normalizedDay = normalizeDay(

        state.day

    );


    if(!normalizedDay){

        resetHistoricalDisplay();


        return;

    }


    const values:ExpectedOperationalValues = {

        expectedVolume:
            state.expectedVolume,

        expectedBoarders:
            state.expectedBoarders,

        expectedArrivals:
            state.expectedArrivals,

        expectedDepartures:
            state.expectedDepartures

    };


    updateHistoricalDisplay(

        normalizedDay,

        state.hour,

        values

    );


    updateHistoricalDataStatus(

        hasHistoricalExpectation(

            normalizedDay,

            state.hour

        )

    );

}


/**
 * Update historical period and values.
 */
function updateHistoricalDisplay(

    day:DayOfWeek,

    hour:number,

    values:ExpectedOperationalValues

):void {

    updateHistoricalPeriodDisplay(

        day,

        hour

    );


    setElementText(

        "expectedVolumeDisplay",

        formatHistoricalValue(

            values.expectedVolume

        )

    );


    setElementText(

        "expectedBoardersDisplay",

        formatHistoricalValue(

            values.expectedBoarders

        )

    );


    setElementText(

        "expectedArrivalsDisplay",

        formatHistoricalValue(

            values.expectedArrivals

        )

    );


    setElementText(

        "expectedDeparturesDisplay",

        formatHistoricalValue(

            values.expectedDepartures

        )

    );

}


/**
 * Update the historical lookup period.
 */
function updateHistoricalPeriodDisplay(

    day:DayOfWeek,

    hour:number

):void {

    setElementText(

        "historicalPeriodDisplay",

        `Based on ${day} at ${formatHour(hour)}`

    );

}


/**
 * Update historical-data availability status.
 */
function updateHistoricalDataStatus(

    available:boolean

):void {

    const element = document.getElementById(

        "historicalDataStatus"

    );


    if(!element){

        return;

    }


    element.classList.remove(

        "historical-data-available",

        "historical-data-missing"

    );


    if(available){

        element.textContent =

            "Historical data available";


        element.classList.add(

            "historical-data-available"

        );


        return;

    }


    element.textContent =

        "No historical record";


    element.classList.add(

        "historical-data-missing"

    );

}


/**
 * Reset historical values before a calculation
 * or after the active dataset changes.
 */
function resetHistoricalDisplay():void {

    setElementText(

        "historicalPeriodDisplay",

        "Based on the weekday and hour when EDORI is calculated."

    );


    clearExpectedValueDisplays();


    const statusElement = document.getElementById(

        "historicalDataStatus"

    );


    if(!statusElement){

        return;

    }


    statusElement.textContent =

        "Awaiting calculation";


    statusElement.classList.remove(

        "historical-data-available",

        "historical-data-missing"

    );

}


/**
 * Clear historical expectation values.
 */
function clearExpectedValueDisplays():void {

    [

        "expectedVolumeDisplay",

        "expectedBoardersDisplay",

        "expectedArrivalsDisplay",

        "expectedDeparturesDisplay"

    ].forEach(

        elementId => {

            setElementText(

                elementId,

                "--"

            );

        }

    );

}


/**
 * Update the displayed ESI patient total.
 */
function updateEsiTotalSummary():void {

    const total =

        getInputNumericValue(

            "esi1"

        )

        +

        getInputNumericValue(

            "esi2"

        )

        +

        getInputNumericValue(

            "esi3"

        )

        +

        getInputNumericValue(

            "esi4"

        )

        +

        getInputNumericValue(

            "esi5"

        );


    const totalEdVolume =

        getInputNumericValue(

            "totalEDVolume"

        );


    const element = document.getElementById(

        "esiTotalSummary"

    );


    if(!element){

        return;

    }


    element.classList.remove(

        "esi-total-matched",

        "esi-total-mismatch"

    );


    element.textContent =

        `ESI Total: ${total}`;


    if(totalEdVolume <= 0){

        return;

    }


    if(total === totalEdVolume){

        element.classList.add(

            "esi-total-matched"

        );


        element.textContent =

            `ESI Total: ${total} — matches total ED volume`;


        return;

    }


    element.classList.add(

        "esi-total-mismatch"

    );


    element.textContent =

        `ESI Total: ${total} — total ED volume is ${totalEdVolume}`;

}


/**
 * Display the appropriate initial message.
 */
function updateInitialAssessmentMessage():void {

    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        showAssessmentMessage(

            "Historical expectations changed. Review the current values and select Calculate EDORI to create an updated result.",

            "draft"

        );


        return;

    }


    if(hasCommittedAssessment()){

        showAssessmentMessage(

            "The most recently submitted assessment has been restored. Change values as needed, then select Calculate EDORI.",

            "default"

        );


        return;

    }


    showAssessmentMessage(

        "Enter all operational data, then calculate.",

        "default"

    );

}


/**
 * Safely read a numeric assessment property.
 */
function getNumericFieldValue(

    assessment:SituationAssessmentType,

    field:keyof SituationAssessmentType

):number {

    const value = assessment[field];


    if(

        typeof value !== "number"

        ||

        !Number.isFinite(

            value

        )

    ){

        return 0;

    }


    return value;

}


/**
 * Return a numeric value from a form input.
 */
function getInputNumericValue(

    elementId:string

):number {

    const element = document.getElementById(

        elementId

    ) as HTMLInputElement | null;


    if(!element){

        return 0;

    }


    return parseInputValue(

        element.value

    );

}


/**
 * Determine whether a field is an ESI field.
 */
function isEsiField(

    field:keyof SituationAssessmentType

):boolean {

    return [

        "esi1",

        "esi2",

        "esi3",

        "esi4",

        "esi5",

        "totalEDVolume"

    ].includes(

        field

    );

}


/**
 * Normalize a stored weekday string.
 */
function normalizeDay(

    value:string

):DayOfWeek | null {

    const days:DayOfWeek[] = [

        "Sunday",

        "Monday",

        "Tuesday",

        "Wednesday",

        "Thursday",

        "Friday",

        "Saturday"

    ];


    const match = days.find(

        day => day === value

    );


    return match ?? null;

}


/**
 * Format an hourly historical bucket.
 */
function formatHour(

    hour:number

):string {

    const normalizedHour = Math.min(

        23,

        Math.max(

            0,

            Math.floor(

                hour

            )

        )

    );


    const date = new Date();


    date.setHours(

        normalizedHour,

        0,

        0,

        0

    );


    const clockTime = date.toLocaleTimeString(

        [],

        {

            hour:"numeric",

            minute:"2-digit"

        }

    );


    return `${String(normalizedHour).padStart(2, "0")}:00 (${clockTime})`;

}


/**
 * Format historical values while preserving
 * meaningful decimal values.
 */
function formatHistoricalValue(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(Number.isInteger(value)){

        return String(value);

    }


    return value.toFixed(

        2

    )

        .replace(

            /\.?0+$/,

            ""

        );

}


/**
 * Convert an input string into a safe number.
 */
function parseInputValue(

    value:string

):number {

    const parsedValue = Number(

        value

    );


    if(!Number.isFinite(parsedValue)){

        return 0;

    }


    return Math.max(

        0,

        parsedValue

    );

}


/**
 * Safely update an element's text.
 */
function setElementText(

    elementId:string,

    value:string

):void {

    const element = document.getElementById(

        elementId

    );


    if(element){

        element.textContent = value;

    }

}


/**
 * Indicate that draft values changed without
 * recalculating the dashboard.
 */
function showDraftChangedMessage():void {

    showAssessmentMessage(

        "Assessment values changed. Select Calculate EDORI to update the dashboard.",

        "draft"

    );

}


/**
 * Update the assessment message.
 */
function showAssessmentMessage(

    message:string,

    type:

        | "default"

        | "draft"

        | "success"

        | "error"

):void {

    const element = document.getElementById(

        "assessmentMessage"

    );


    if(!element){

        return;

    }


    element.textContent = message;


    element.classList.remove(

        "assessment-message-default",

        "assessment-message-draft",

        "assessment-message-success",

        "assessment-message-error"

    );


    element.classList.add(

        `assessment-message-${type}`

    );

}


/**
 * Disable or enable the Calculate button.
 */
function setSubmissionState(

    button:HTMLButtonElement | null,

    submitting:boolean

):void {

    if(!button){

        return;

    }


    button.disabled = submitting;


    button.textContent = submitting

        ? "Calculating..."

        : "Calculate EDORI";

}