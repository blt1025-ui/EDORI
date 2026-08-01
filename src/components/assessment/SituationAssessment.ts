/**
 * SituationAssessment
 *
 * Main EDORI operational data-entry panel.
 *
 * Responsibilities:
 *
 * - Render assessment inputs
 * - Restore the latest committed values
 * - Maintain draft input values
 * - Display ESI totals
 * - Display historical expectations
 * - Call EdoriEngine when the user selects
 *   Calculate EDORI
 *
 * This component does not:
 *
 * - Validate the completed assessment
 * - Calculate EDORI
 * - Persist committed state
 * - Persist the result
 * - Save snapshots
 * - Emit resultChanged
 *
 * Those responsibilities belong to EdoriEngine.
 */


import {

    calculateEsiTotal,

    calculateUnassignedEsiCount

}

from "../../services/ValidationService";

import {

    APP_EVENTS

}

from "../../config/appEvents";

import {

    runEdoriAssessment

}

from "../../core/EdoriEngine";


import {

    subscribe

}

from "../../services/EventService";


import {

    getAssessmentPeriod,

    getExpectedOperationalValues,

    hasHistoricalExpectation

}

from "../../services/HistoricalDataService";


import {

    getResultInvalidationReason

}

from "../../services/ResultService";


import {

    getState,

    hasCommittedAssessment

}

from "../../services/StateService";


import type {

    EdoriAssessmentInput

}

from "../../types/EdoriAssessmentInput";


import type {

    DayOfWeek

}

from "../../types/HistoricalExpectation";




/**
 * Current operational inputs shown in the form.
 */
const CURRENT_VALUE_FIELDS:Array<

    keyof EdoriAssessmentInput

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
 * Local draft maintained by this component.
 *
 * The committed StateService assessment is not
 * modified while the user types.
 */
let draftInput:EdoriAssessmentInput = {

    totalEDVolume:0,

    boardedPatients:0,

    occupiedMedicalBeds:0,

    esi1:0,

    esi2:0,

    esi3:0,

    esi4:0,

    esi5:0

};


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
 * Create a reusable numeric input.
 */
function createNumberInput(

    id:keyof EdoriAssessmentInput,

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
 * Initialize all form behavior.
 */
export function initializeSituationAssessment():void {

    restoreDraftInput();

    initializeCurrentValueInputs();

    initializeCalculateButton();

    restoreHistoricalDisplay();

    updateEsiTotalSummary();

    updateInitialAssessmentMessage();

    subscribeToHistoricalDataChanges();

}


/**
 * Restore the last committed assessment into
 * the component draft.
 */
function restoreDraftInput():void {

    if(!hasCommittedAssessment()){

        draftInput = createEmptyDraft();

        return;

    }


    const state = getState();


    draftInput = {

        totalEDVolume:
            normalizeStoredNumber(

                state.totalEDVolume

            ),

        boardedPatients:
            normalizeStoredNumber(

                state.boardedPatients

            ),

        occupiedMedicalBeds:
            normalizeStoredNumber(

                state.occupiedMedicalBeds

            ),

        esi1:
            normalizeStoredNumber(

                state.esi1

            ),

        esi2:
            normalizeStoredNumber(

                state.esi2

            ),

        esi3:
            normalizeStoredNumber(

                state.esi3

            ),

        esi4:
            normalizeStoredNumber(

                state.esi4

            ),

        esi5:
            normalizeStoredNumber(

                state.esi5

            )

    };

}


/**
 * Initialize form fields and local draft updates.
 */
function initializeCurrentValueInputs():void {

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


            element.value = String(

                draftInput[field]

            );


            element.addEventListener(

                "input",

                () => {

                    const value = parseInputValue(

                        element.value

                    );


                    draftInput = {

                        ...draftInput,

                        [field]:
                            value

                    };


                    if(isEsiRelatedField(field)){

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

        submitAssessmentToEngine

    );

}


/**
 * Send the current local draft to EdoriEngine.
 */
function submitAssessmentToEngine():void {

    const button = document.getElementById(

        "calculateEdoriButton"

    ) as HTMLButtonElement | null;


    setSubmissionState(

        button,

        true

    );


    try {

        /*
         * Capture one timestamp for:
         *
         * - weekday/hour lookup
         * - assessmentTime
         * - snapshot timestamp
         */

        const calculationTime = new Date();


        /*
         * Update the historical display before
         * calling the engine so the user can see
         * the period being evaluated.
         */

        previewHistoricalExpectation(

            calculationTime

        );


        const engineResult = runEdoriAssessment(

            {

                ...draftInput

            },

            calculationTime

        );


        if(!engineResult.success){

            showAssessmentMessage(

                engineResult.errors.join(

                    " | "

                ),

                "error"

            );


            return;

        }


        /*
         * Keep the draft synchronized with the
         * authoritative committed assessment.
         */

        draftInput = {

            totalEDVolume:
                engineResult.assessment.totalEDVolume,

            boardedPatients:
                engineResult.assessment.boardedPatients,

            occupiedMedicalBeds:
                engineResult.assessment.occupiedMedicalBeds,

            esi1:
                engineResult.assessment.esi1,

            esi2:
                engineResult.assessment.esi2,

            esi3:
                engineResult.assessment.esi3,

            esi4:
                engineResult.assessment.esi4,

            esi5:
                engineResult.assessment.esi5

        };


        const snapshotMessage =

            engineResult.snapshotSaved

                ? " A new trend snapshot was saved."

                : " No duplicate trend snapshot was needed.";


        showAssessmentMessage(

            `EDORI calculated successfully for ${engineResult.assessment.day} at ${formatHour(engineResult.assessment.hour)}. Score: ${Math.round(engineResult.result.score)}.${snapshotMessage}`,

            "success"

        );

    }
    catch(error){

        console.error(

            "Unable to submit EDORI assessment:",

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
 * Preview the historical expectation that the
 * engine will use for the submitted time.
 */
function previewHistoricalExpectation(

    calculationTime:Date

):void {

    const period = getAssessmentPeriod(

        calculationTime

    );


    updateHistoricalPeriodDisplay(

        period.day,

        period.hour

    );


    const available = hasHistoricalExpectation(

        period.day,

        period.hour

    );


    updateHistoricalDataStatus(

        available

    );


    if(!available){

        clearExpectedValueDisplays();

        return;

    }


    const expectedValues =

        getExpectedOperationalValues(

            period.day,

            period.hour

        );


    setElementText(

        "expectedVolumeDisplay",

        formatHistoricalValue(

            expectedValues.expectedVolume

        )

    );


    setElementText(

        "expectedBoardersDisplay",

        formatHistoricalValue(

            expectedValues.expectedBoarders

        )

    );


    setElementText(

        "expectedArrivalsDisplay",

        formatHistoricalValue(

            expectedValues.expectedArrivals

        )

    );


    setElementText(

        "expectedDeparturesDisplay",

        formatHistoricalValue(

            expectedValues.expectedDepartures

        )

    );

}


/**
 * Restore historical values associated with the
 * most recently committed assessment.
 */
function restoreHistoricalDisplay():void {

    if(!hasCommittedAssessment()){

        resetHistoricalDisplay();

        return;

    }


    const state = getState();


    const day = normalizeDay(

        state.day

    );


    if(!day){

        resetHistoricalDisplay();

        return;

    }


    updateHistoricalPeriodDisplay(

        day,

        state.hour

    );


    setElementText(

        "expectedVolumeDisplay",

        formatHistoricalValue(

            state.expectedVolume

        )

    );


    setElementText(

        "expectedBoardersDisplay",

        formatHistoricalValue(

            state.expectedBoarders

        )

    );


    setElementText(

        "expectedArrivalsDisplay",

        formatHistoricalValue(

            state.expectedArrivals

        )

    );


    setElementText(

        "expectedDeparturesDisplay",

        formatHistoricalValue(

            state.expectedDepartures

        )

    );


    updateHistoricalDataStatus(

        hasHistoricalExpectation(

            day,

            state.hour

        )

    );

}


/**
 * Respond when historical data are imported
 * or restored.
 */
function subscribeToHistoricalDataChanges():void {

    subscribe(

    APP_EVENTS.HISTORICAL_DATA_CHANGED,

    () => {

            resetHistoricalDisplay();


            showAssessmentMessage(

                "Historical expectations changed. Review the current values and select Calculate EDORI to create an updated result.",

                "draft"

            );

        }

    );

}


/**
 * Update the historical period label.
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
 * Update historical-data availability.
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
 * Reset the historical panel.
 */
function resetHistoricalDisplay():void {

    setElementText(

        "historicalPeriodDisplay",

        "Based on the weekday and hour when EDORI is calculated."

    );


    clearExpectedValueDisplays();


    const element = document.getElementById(

        "historicalDataStatus"

    );


    if(!element){

        return;

    }


    element.textContent =

        "Awaiting calculation";


    element.classList.remove(

        "historical-data-available",

        "historical-data-missing"

    );

}


/**
 * Clear expectation values.
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
 * Update the displayed ESI total.
 */
function updateEsiTotalSummary():void {

    const esiTotal = calculateEsiTotal(

    draftInput

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


    if(draftInput.totalEDVolume <= 0){

        element.textContent =

            `ESI Total: ${esiTotal}`;


        return;

    }


    if(esiTotal === draftInput.totalEDVolume){

        element.classList.add(

            "esi-total-matched"

        );


        element.textContent =

            `ESI Total: ${esiTotal} — matches total ED volume`;


        return;

    }


    element.classList.add(

        "esi-total-mismatch"

    );


    if(esiTotal > draftInput.totalEDVolume){

        element.textContent =

            `ESI Total: ${esiTotal} — exceeds total ED volume of ${draftInput.totalEDVolume}`;

        return;

    }


    element.textContent =

    `ESI Total: ${esiTotal} — ${calculateUnassignedEsiCount(draftInput)} patients do not have an entered ESI category`

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
 * Create an empty draft.
 */
function createEmptyDraft():EdoriAssessmentInput {

    return {

        totalEDVolume:0,

        boardedPatients:0,

        occupiedMedicalBeds:0,

        esi1:0,

        esi2:0,

        esi3:0,

        esi4:0,

        esi5:0

    };

}


/**
 * Normalize a stored numeric value.
 */
function normalizeStoredNumber(

    value:unknown

):number {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(value)

        ||

        value < 0

    ){

        return 0;

    }


    return value;

}


/**
 * Parse one numeric input.
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
 * Determine whether changing a field requires
 * recalculating the ESI summary.
 */
function isEsiRelatedField(

    field:keyof EdoriAssessmentInput

):boolean {

    return field === "totalEDVolume"

        ||

        field === "esi1"

        ||

        field === "esi2"

        ||

        field === "esi3"

        ||

        field === "esi4"

        ||

        field === "esi5";

}


/**
 * Normalize a stored weekday.
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


    return days.find(

        day => day === value

    )

        ?? null;

}


/**
 * Format an hourly bucket.
 */
function formatHour(

    hour:number

):string {

    const safeHour = Math.min(

        23,

        Math.max(

            0,

            Math.floor(hour)

        )

    );


    const meridiem =

        safeHour >= 12

            ? "PM"

            : "AM";


    const twelveHour =

        safeHour % 12 === 0

            ? 12

            : safeHour % 12;


    return `${String(safeHour).padStart(2, "0")}:00 (${twelveHour}:00 ${meridiem})`;

}


/**
 * Format an expectation value.
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


    return value

        .toFixed(

            2

        )

        .replace(

            /\.?0+$/,

            ""

        );

}


/**
 * Safely update element text.
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
 * Show that draft values changed.
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
 * Update Calculate button state.
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