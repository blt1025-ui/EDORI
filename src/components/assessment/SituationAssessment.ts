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

    "staffedMedicalBeds",

    "esi1",

    "esi2",

    "esi3",

    "esi4",

    "esi5"

];


/**
 * Assessment fields monitored for completion.
 *
 * Historical expectations are read automatically
 * when EDORI is calculated and are not editable
 * required fields.
 */
const REQUIRED_ASSESSMENT_FIELD_IDS:string[] = [

    "totalEDVolume",

    "boardedPatients",

    "occupiedMedicalBeds",

    "staffedMedicalBeds",

    "esi1",

    "esi2",

    "esi3",

    "esi4",

    "esi5"

];


/**
 * CSS class applied to inputs that have changed
 * since the most recent successful calculation.
 */
const CHANGED_FIELD_CLASS =

    "assessment-input-changed";


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

    staffedMedicalBeds:273,

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


            <div
                id="assessmentProgress"
                class="assessment-progress"
                aria-live="polite"
            >

                <div class="assessment-progress-header">

                    <div>

                        <span class="assessment-progress-label">
                            Assessment Completion
                        </span>

                        <strong id="assessmentProgressText">
                            Review required fields
                        </strong>

                    </div>


                    <span id="assessmentProgressPercent">
                        0%
                    </span>

                </div>


                <div class="assessment-progress-track">

                    <div
                        id="assessmentProgressFill"
                        class="assessment-progress-fill"
                        style="width:0%;"
                    >
                    </div>

                </div>

            </div>


            <div class="assessment-section">

                <div class="assessment-section-heading">

                    <div class="assessment-section-icon">
                        🚑
                    </div>

                    <div>

                        <h3>
                            ED Demand
                        </h3>

                        <p>
                            Enter the total number of patients currently in the emergency department, including admitted boarders.
                        </p>

                    </div>

                </div>


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

                <div class="assessment-section-heading">

                    <div class="assessment-section-icon">
                        🏥
                    </div>

                    <div>

                        <h3>
                            Hospital Capacity
                        </h3>

                        <p>
                            Enter the number of occupied medical beds out of the configured 273-bed medical capacity.
                        </p>

                    </div>

                </div>


                <div class="input-grid">

                    ${createNumberInput(

                        "occupiedMedicalBeds",

                        "Occupied Medical Beds",

                        0

                    )}


                    ${createNumberInput(

                        "staffedMedicalBeds",

                        "Staffed Medical Beds",

                        1

                    )}

                </div>

            </div>


            <div class="assessment-section">

                <div class="assessment-section-heading">

                    <div class="assessment-section-icon">
                        🩺
                    </div>

                    <div>

                        <h3>
                            Patient Acuity Distribution
                        </h3>

                        <p>
                            Enter the number of current ED patients in each Emergency Severity Index category.
                        </p>

                    </div>

                </div>


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

                    <div class="assessment-section-heading">

                        <div class="assessment-section-icon">
                            📈
                        </div>

                        <div>

                            <h3>
                                Historical Expectations
                            </h3>

                            <p id="historicalPeriodDisplay">
                                Based on the weekday and hour when EDORI is calculated.
                            </p>

                        </div>

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


            <div class="assessment-action-footer">

                <div
                    id="assessmentActionStatus"
                    class="assessment-action-status"
                >

                    <span id="assessmentActionStatusIcon">
                        ◯
                    </span>


                    <div>

                        <strong id="assessmentActionStatusTitle">
                            Assessment not calculated
                        </strong>

                        <small id="assessmentActionStatusDescription">
                            Complete the operational inputs before calculating EDORI.
                        </small>

                    </div>


                    <span
                        id="assessmentDraftIndicator"
                        class="assessment-draft-indicator"
                        hidden
                    >
                        Draft changed
                    </span>

                </div>


                <button
                    id="calculateEdoriButton"
                    class="calculate-button assessment-calculate-button"
                    type="button"
                >
                    Calculate EDORI
                </button>

            </div>


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

    initializeAssessmentProgress();

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

        staffedMedicalBeds:
            normalizeStoredPositiveNumber(

                state.staffedMedicalBeds,

                273

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

                    element.classList.add(

                        CHANGED_FIELD_CLASS

                    );


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

            staffedMedicalBeds:
                engineResult.assessment.staffedMedicalBeds,

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


        showAssessmentCalculatedStatus();


        clearChangedFieldIndicators();

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


            showAssessmentDraftStatus();

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

        staffedMedicalBeds:273,

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
 * Normalize a stored positive number with a
 * fallback value.
 */
function normalizeStoredPositiveNumber(

    value:unknown,

    fallback:number

):number {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(value)

        ||

        value <= 0

    ){

        return fallback;

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


    showAssessmentDraftStatus();

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
 * Initialize assessment-completion monitoring.
 */
function initializeAssessmentProgress():void {

    REQUIRED_ASSESSMENT_FIELD_IDS.forEach(

        fieldId => {

            const field = document.getElementById(

                fieldId

            );


            if(

                !(field instanceof HTMLInputElement)

            ){

                return;

            }


            field.addEventListener(

                "input",

                updateAssessmentProgress

            );


            field.addEventListener(

                "change",

                updateAssessmentProgress

            );

        }

    );


    updateAssessmentProgress();

}


/**
 * Update the completion display and calculation
 * action state.
 */
function updateAssessmentProgress():void {

    const completedFieldCount =

        REQUIRED_ASSESSMENT_FIELD_IDS.filter(

            fieldId =>

                isAssessmentFieldComplete(

                    fieldId

                )

        ).length;


    const completionPercent = Math.round(

        completedFieldCount

        /

        REQUIRED_ASSESSMENT_FIELD_IDS.length

        *

        100

    );


    setElementText(

        "assessmentProgressText",

        completionPercent === 100

            ? "Ready to calculate"

            : `${completedFieldCount} of ${REQUIRED_ASSESSMENT_FIELD_IDS.length} required fields complete`

    );


    setElementText(

        "assessmentProgressPercent",

        `${completionPercent}%`

    );


    const progressFill = document.getElementById(

        "assessmentProgressFill"

    );


    if(progressFill){

        progressFill.style.width =

            `${completionPercent}%`;

    }


    updateAssessmentActionStatus(

        completionPercent

    );

}


/**
 * Determine whether one required input contains a
 * valid nonnegative number.
 */
function isAssessmentFieldComplete(

    fieldId:string

):boolean {

    const field = document.getElementById(

        fieldId

    );


    if(

        !(field instanceof HTMLInputElement)

    ){

        return false;

    }


    if(field.value.trim().length === 0){

        return false;

    }


    const value = Number(

        field.value

    );


    if(fieldId === "staffedMedicalBeds"){

        return Number.isFinite(value)

            &&

            value > 0;

    }


    return Number.isFinite(value)

        &&

        value >= 0;

}


/**
 * Update the persistent calculation-area status.
 */
function updateAssessmentActionStatus(

    completionPercent:number

):void {

    const button = document.getElementById(

        "calculateEdoriButton"

    ) as HTMLButtonElement | null;


    if(completionPercent === 100){

        if(!hasCommittedAssessment()){

            setAssessmentActionStatus(

                "✓",

                "Assessment ready",

                "Review the entered values, then calculate the current EDORI result.",

                "ready"

            );


            setDraftIndicatorVisibility(

                false

            );

        }


        if(button){

            button.disabled = false;

        }


        return;

    }


    setAssessmentActionStatus(

        "◯",

        "Assessment incomplete",

        "Complete all required operational inputs before calculating EDORI.",

        "incomplete"

    );


    if(button){

        button.disabled = true;

    }

}


/**
 * Display a successful committed-assessment state.
 */
function showAssessmentCalculatedStatus():void {

    setAssessmentActionStatus(

        "✓",

        "Assessment calculated",

        "The dashboard now reflects the committed operational assessment.",

        "calculated"

    );


    setDraftIndicatorVisibility(

        false

    );

}


/**
 * Display a changed-draft state.
 */
function showAssessmentDraftStatus():void {

    setAssessmentActionStatus(

        "↻",

        "Changes not calculated",

        "Select Calculate EDORI to update the dashboard with the current values.",

        "draft"

    );


    setDraftIndicatorVisibility(

        true

    );

}


/**
 * Apply action-status content and visual state.
 */
function setAssessmentActionStatus(

    icon:string,

    title:string,

    description:string,

    status:

        | "ready"

        | "calculated"

        | "draft"

        | "incomplete"

):void {

    setElementText(

        "assessmentActionStatusIcon",

        icon

    );


    setElementText(

        "assessmentActionStatusTitle",

        title

    );


    setElementText(

        "assessmentActionStatusDescription",

        description

    );


    const statusElement = document.getElementById(

        "assessmentActionStatus"

    );


    if(!statusElement){

        return;

    }


    statusElement.classList.remove(

        "status-ready",

        "status-calculated",

        "status-draft",

        "status-incomplete"

    );


    statusElement.classList.add(

        `status-${status}`

    );

}


/**
 * Show or hide the draft-change indicator.
 */
function setDraftIndicatorVisibility(

    visible:boolean

):void {

    const draftIndicator = document.getElementById(

        "assessmentDraftIndicator"

    );


    if(draftIndicator){

        draftIndicator.hidden = !visible;

    }

}


/**
 * Remove changed-field highlighting after a
 * successful committed calculation.
 */
function clearChangedFieldIndicators():void {

    CURRENT_VALUE_FIELDS.forEach(

        field => {

            const element = document.getElementById(

                field

            );


            if(

                element instanceof HTMLInputElement

            ){

                element.classList.remove(

                    CHANGED_FIELD_CLASS

                );

            }

        }

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