/**
 * SituationAssessment
 *
 * Version 2 Hospital Readiness Model
 *
 * Main hospital-readiness operational data-entry panel.
 *
 * Responsibilities:
 *
 * - Render current operational inputs
 * - Restore the latest committed values
 * - Maintain draft input values
 * - Display high-acuity ED context
 * - Display automatic historical expectations
 * - Call EdoriEngine when the user calculates
 *
 * Historical values are never entered manually.
 */

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


/*
 * =====================================================
 * Current operational fields
 * =====================================================
 */

const CURRENT_VALUE_FIELDS:Array<

    keyof EdoriAssessmentInput

> = [

    "totalEDVolume",

    "boardedPatients",

    "esi1",

    "esi2",

    "staffedAcuteCareBeds",

    "occupiedAcuteCareBeds",

    "staffedCriticalCareBeds",

    "occupiedCriticalCareBeds",

    "currentEDAdmissions",

    "currentDirectAdmissions",

    "currentSurgicalAdmissions"

];


/*
 * Every current operational field must contain a
 * valid numeric value before calculation.
 *
 * Zero is valid for census/admission values.
 *
 * Staffed bed counts must be greater than zero.
 */
const REQUIRED_ASSESSMENT_FIELD_IDS:string[] = [

    "totalEDVolume",

    "boardedPatients",

    "esi1",

    "esi2",

    "staffedAcuteCareBeds",

    "occupiedAcuteCareBeds",

    "staffedCriticalCareBeds",

    "occupiedCriticalCareBeds",

    "currentEDAdmissions",

    "currentDirectAdmissions",

    "currentSurgicalAdmissions"

];


const CHANGED_FIELD_CLASS =

    "assessment-input-changed";


/*
 * =====================================================
 * Draft state
 * =====================================================
 */

let draftInput:EdoriAssessmentInput =

    createEmptyDraft();


/*
 * =====================================================
 * Rendering
 * =====================================================
 */

export function SituationAssessment():string {

    return `

        <section class="situation-assessment">

            <div class="section-header">

                <h2>
                    Hospital Readiness Assessment
                </h2>

                <p>
                    Enter current hospital operational conditions, then calculate the Hospital Readiness Index.
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


            ${createEmergencyDepartmentSection()}

            ${createAcuteCareSection()}

            ${createCriticalCareSection()}

            ${createKnownInflowSection()}

            ${createHistoricalSection()}


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
                            Complete the operational inputs before calculating Hospital Readiness.
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
                    Calculate Hospital Readiness
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


/*
 * =====================================================
 * Form sections
 * =====================================================
 */

function createEmergencyDepartmentSection():string {

    return `

        <div class="assessment-section">

            <div class="assessment-section-heading">

                <div class="assessment-section-icon">
                    🚑
                </div>

                <div>

                    <h3>
                        Emergency Department
                    </h3>

                    <p>
                        Enter the current ED census, boarding population, and high-acuity patient counts.
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


                ${createNumberInput(

                    "esi1",

                    "ESI 1 Patients",

                    0

                )}


                ${createNumberInput(

                    "esi2",

                    "ESI 2 Patients",

                    0

                )}

            </div>


            <div
                id="esiTotalSummary"
                class="esi-total-summary"
                aria-live="polite"
            >
                High-acuity ED patients: 0
            </div>

        </div>

    `;

}


function createAcuteCareSection():string {

    return `

        <div class="assessment-section">

            <div class="assessment-section-heading">

                <div class="assessment-section-icon">
                    🏥
                </div>

                <div>

                    <h3>
                        Acute-Care Capacity
                    </h3>

                    <p>
                        Enter currently staffed acute-care capacity and the number of those beds currently occupied.
                    </p>

                </div>

            </div>


            <div class="input-grid">

                ${createNumberInput(

                    "staffedAcuteCareBeds",

                    "Staffed Acute-Care Beds",

                    1

                )}


                ${createNumberInput(

                    "occupiedAcuteCareBeds",

                    "Occupied Acute-Care Beds",

                    0

                )}

            </div>

        </div>

    `;

}


function createCriticalCareSection():string {

    return `

        <div class="assessment-section">

            <div class="assessment-section-heading">

                <div class="assessment-section-icon">
                    🫀
                </div>

                <div>

                    <h3>
                        Critical-Care Capacity
                    </h3>

                    <p>
                        Enter currently staffed critical-care capacity and the number of those beds currently occupied.
                    </p>

                </div>

            </div>


            <div class="input-grid">

                ${createNumberInput(

                    "staffedCriticalCareBeds",

                    "Staffed Critical-Care Beds",

                    1

                )}


                ${createNumberInput(

                    "occupiedCriticalCareBeds",

                    "Occupied Critical-Care Beds",

                    0

                )}

            </div>

        </div>

    `;

}


function createKnownInflowSection():string {

    return `

        <div class="assessment-section">

            <div class="assessment-section-heading">

                <div class="assessment-section-icon">
                    ↘
                </div>

                <div>

                    <h3>
                        Known Hospital Inflow
                    </h3>

                    <p>
                        Enter patients currently known or anticipated to require inpatient beds during the assessment horizon.
                    </p>

                </div>

            </div>


            <div class="input-grid">

                ${createNumberInput(

                    "currentEDAdmissions",

                    "Current ED Admissions",

                    0

                )}


                ${createNumberInput(

                    "currentDirectAdmissions",

                    "Current Direct Admissions",

                    0

                )}


                ${createNumberInput(

                    "currentSurgicalAdmissions",

                    "Current Surgical / Procedural Admissions",

                    0

                )}

            </div>

        </div>

    `;

}


function createHistoricalSection():string {

    return `

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
                            Automatic Historical Context
                        </h3>

                        <p id="historicalPeriodDisplay">
                            Based on the weekday and hour when Hospital Readiness is calculated.
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

                    "expectedEDVolumeDisplay",

                    "Expected ED Volume"

                )}


                ${createExpectationDisplay(

                    "expectedEDBoardersDisplay",

                    "Expected ED Boarders"

                )}


                ${createExpectationDisplay(

                    "expectedEDAdmissions4hDisplay",

                    "Expected ED Admissions — Next 4 Hours"

                )}


                ${createExpectationDisplay(

                    "expectedDirectAdmissions4hDisplay",

                    "Expected Direct Admissions — Next 4 Hours"

                )}


                ${createExpectationDisplay(

                    "expectedSurgicalAdmissions4hDisplay",

                    "Expected Surgical / Procedural Admissions — Next 4 Hours"

                )}


                ${createExpectationDisplay(

                    "expectedHospitalInflow4hDisplay",

                    "Expected Total Hospital Inflow — Next 4 Hours"

                )}


                ${createExpectationDisplay(

                    "expectedInpatientDepartures4hDisplay",

                    "Expected Inpatient Departures — Next 4 Hours"

                )}

            </div>


            <p class="historical-expectation-note">
                Historical expectations are loaded automatically and are not entered by the user.
            </p>

        </div>

    `;

}


/*
 * =====================================================
 * Reusable rendering
 * =====================================================
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


/*
 * =====================================================
 * Initialization
 * =====================================================
 */

export function initializeSituationAssessment():void {

    restoreDraftInput();

    initializeCurrentValueInputs();

    initializeCalculateButton();

    restoreHistoricalDisplay();

    updateHighAcuitySummary();

    updateInitialAssessmentMessage();

    subscribeToHistoricalDataChanges();

    initializeAssessmentProgress();

}


/*
 * =====================================================
 * Draft restoration
 * =====================================================
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

        esi1:
            normalizeStoredNumber(

                state.esi1

            ),

        esi2:
            normalizeStoredNumber(

                state.esi2

            ),

        staffedAcuteCareBeds:
            normalizeStoredPositiveNumber(

                state.staffedAcuteCareBeds,

                1

            ),

        occupiedAcuteCareBeds:
            normalizeStoredNumber(

                state.occupiedAcuteCareBeds

            ),

        staffedCriticalCareBeds:
            normalizeStoredPositiveNumber(

                state.staffedCriticalCareBeds,

                1

            ),

        occupiedCriticalCareBeds:
            normalizeStoredNumber(

                state.occupiedCriticalCareBeds

            ),

        currentEDAdmissions:
            normalizeStoredNumber(

                state.currentEDAdmissions

            ),

        currentDirectAdmissions:
            normalizeStoredNumber(

                state.currentDirectAdmissions

            ),

        currentSurgicalAdmissions:
            normalizeStoredNumber(

                state.currentSurgicalAdmissions

            )

    };

}


/*
 * =====================================================
 * Input behavior
 * =====================================================
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


                    if(isHighAcuityRelatedField(field)){

                        updateHighAcuitySummary();

                    }


                    showDraftChangedMessage();

                }

            );

        }

    );

}


/*
 * =====================================================
 * Calculation
 * =====================================================
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


function submitAssessmentToEngine():void {

    const button = document.getElementById(

        "calculateEdoriButton"

    ) as HTMLButtonElement | null;


    setSubmissionState(

        button,

        true

    );


    try {

        const calculationTime = new Date();


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


        draftInput = {

            totalEDVolume:
                engineResult.assessment.totalEDVolume,

            boardedPatients:
                engineResult.assessment.boardedPatients,

            esi1:
                engineResult.assessment.esi1,

            esi2:
                engineResult.assessment.esi2,

            staffedAcuteCareBeds:
                engineResult.assessment.staffedAcuteCareBeds,

            occupiedAcuteCareBeds:
                engineResult.assessment.occupiedAcuteCareBeds,

            staffedCriticalCareBeds:
                engineResult.assessment.staffedCriticalCareBeds,

            occupiedCriticalCareBeds:
                engineResult.assessment.occupiedCriticalCareBeds,

            currentEDAdmissions:
                engineResult.assessment.currentEDAdmissions,

            currentDirectAdmissions:
                engineResult.assessment.currentDirectAdmissions,

            currentSurgicalAdmissions:
                engineResult.assessment.currentSurgicalAdmissions

        };


        const snapshotMessage =

            engineResult.snapshotSaved

                ? " A new trend snapshot was saved."

                : " No duplicate trend snapshot was needed.";


        showAssessmentMessage(

            `Hospital Readiness calculated successfully for ${engineResult.assessment.day} at ${formatHour(engineResult.assessment.hour)}. Score: ${Math.round(engineResult.result.score)}.${snapshotMessage}`,

            "success"

        );


        showAssessmentCalculatedStatus();

        clearChangedFieldIndicators();

    }
    catch(error){

        console.error(

            "Unable to submit Hospital Readiness assessment:",

            error

        );


        showAssessmentMessage(

            "Unable to calculate Hospital Readiness. Check the browser console for details.",

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


/*
 * =====================================================
 * Historical display
 * =====================================================
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

        "expectedEDVolumeDisplay",

        formatHistoricalValue(

            expectedValues.expectedEDVolume

        )

    );


    setElementText(

        "expectedEDBoardersDisplay",

        formatHistoricalValue(

            expectedValues.expectedEDBoarders

        )

    );


    setElementText(

        "expectedEDAdmissions4hDisplay",

        formatHistoricalValue(

            expectedValues.expectedEDAdmissions4h

        )

    );


    setElementText(

        "expectedDirectAdmissions4hDisplay",

        formatHistoricalValue(

            expectedValues.expectedDirectAdmissions4h

        )

    );


    setElementText(

        "expectedSurgicalAdmissions4hDisplay",

        formatHistoricalValue(

            expectedValues.expectedSurgicalAdmissions4h

        )

    );


    setElementText(

        "expectedHospitalInflow4hDisplay",

        formatHistoricalValue(

            expectedValues.expectedHospitalInflow4h

        )

    );


    setElementText(

        "expectedInpatientDepartures4hDisplay",

        formatHistoricalValue(

            expectedValues.expectedInpatientDepartures4h

        )

    );

}


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

        "expectedEDVolumeDisplay",

        formatHistoricalValue(

            state.expectedEDVolume

        )

    );


    setElementText(

        "expectedEDBoardersDisplay",

        formatHistoricalValue(

            state.expectedEDBoarders

        )

    );


    setElementText(

        "expectedEDAdmissions4hDisplay",

        formatHistoricalValue(

            state.expectedEDAdmissions4h

        )

    );


    setElementText(

        "expectedDirectAdmissions4hDisplay",

        formatHistoricalValue(

            state.expectedDirectAdmissions4h

        )

    );


    setElementText(

        "expectedSurgicalAdmissions4hDisplay",

        formatHistoricalValue(

            state.expectedSurgicalAdmissions4h

        )

    );


    setElementText(

        "expectedHospitalInflow4hDisplay",

        formatHistoricalValue(

            state.expectedHospitalInflow4h

        )

    );


    setElementText(

        "expectedInpatientDepartures4hDisplay",

        formatHistoricalValue(

            state.expectedInpatientDepartures4h

        )

    );


    updateHistoricalDataStatus(

        hasHistoricalExpectation(

            day,

            state.hour

        )

    );

}


function subscribeToHistoricalDataChanges():void {

    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        () => {

            resetHistoricalDisplay();


            showAssessmentMessage(

                "Historical expectations changed. Review the current values and calculate Hospital Readiness to create an updated result.",

                "draft"

            );


            showAssessmentDraftStatus();

        }

    );

}


function updateHistoricalPeriodDisplay(

    day:DayOfWeek,

    hour:number

):void {

    setElementText(

        "historicalPeriodDisplay",

        `Based on ${day} at ${formatHour(hour)} with a four-hour hospital-flow forecast`

    );

}


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


function resetHistoricalDisplay():void {

    setElementText(

        "historicalPeriodDisplay",

        "Based on the weekday and hour when Hospital Readiness is calculated."

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


function clearExpectedValueDisplays():void {

    [

        "expectedEDVolumeDisplay",

        "expectedEDBoardersDisplay",

        "expectedEDAdmissions4hDisplay",

        "expectedDirectAdmissions4hDisplay",

        "expectedSurgicalAdmissions4hDisplay",

        "expectedHospitalInflow4hDisplay",

        "expectedInpatientDepartures4hDisplay"

    ].forEach(

        elementId => {

            setElementText(

                elementId,

                "--"

            );

        }

    );

}


/*
 * =====================================================
 * High-acuity summary
 * =====================================================
 */

function updateHighAcuitySummary():void {

    const highAcuityTotal =

        draftInput.esi1

        +

        draftInput.esi2;


    const lowerAcuityTotal = Math.max(

        0,

        draftInput.totalEDVolume

        -

        highAcuityTotal

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


    if(

        highAcuityTotal

        >

        draftInput.totalEDVolume

    ){

        element.classList.add(

            "esi-total-mismatch"

        );


        element.textContent =

            `ESI 1 + ESI 2 = ${highAcuityTotal}, which exceeds the total ED volume of ${draftInput.totalEDVolume}.`;


        return;

    }


    element.classList.add(

        "esi-total-matched"

    );


    element.textContent =

        `High acuity: ${highAcuityTotal} ESI 1–2 patients. Remaining ED census: ${lowerAcuityTotal} patients assumed ESI 3–5.`;

}


/*
 * =====================================================
 * Initial messaging
 * =====================================================
 */

function updateInitialAssessmentMessage():void {

    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        showAssessmentMessage(

            "Historical expectations changed. Review the current values and calculate Hospital Readiness to create an updated result.",

            "draft"

        );


        return;

    }


    if(hasCommittedAssessment()){

        showAssessmentMessage(

            "The most recently submitted assessment has been restored. Change values as needed, then calculate Hospital Readiness.",

            "default"

        );


        return;

    }


    showAssessmentMessage(

        "Enter all current operational data, then calculate.",

        "default"

    );

}


/*
 * =====================================================
 * Draft creation and normalization
 * =====================================================
 */

function createEmptyDraft():EdoriAssessmentInput {

    return {

        totalEDVolume:0,

        boardedPatients:0,

        esi1:0,

        esi2:0,

        staffedAcuteCareBeds:1,

        occupiedAcuteCareBeds:0,

        staffedCriticalCareBeds:1,

        occupiedCriticalCareBeds:0,

        currentEDAdmissions:0,

        currentDirectAdmissions:0,

        currentSurgicalAdmissions:0

    };

}


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


function isHighAcuityRelatedField(

    field:keyof EdoriAssessmentInput

):boolean {

    return field === "totalEDVolume"

        ||

        field === "esi1"

        ||

        field === "esi2";

}


/*
 * =====================================================
 * Formatting
 * =====================================================
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


/*
 * =====================================================
 * Draft status
 * =====================================================
 */

function showDraftChangedMessage():void {

    showAssessmentMessage(

        "Assessment values changed. Select Calculate Hospital Readiness to update the dashboard.",

        "draft"

    );


    showAssessmentDraftStatus();

}


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


/*
 * =====================================================
 * Completion monitoring
 * =====================================================
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


    if(

        fieldId === "staffedAcuteCareBeds"

        ||

        fieldId === "staffedCriticalCareBeds"

    ){

        return Number.isFinite(value)

            &&

            value > 0;

    }


    return Number.isFinite(value)

        &&

        value >= 0;

}


/*
 * =====================================================
 * Action status
 * =====================================================
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

                "Review the entered values, then calculate the current Hospital Readiness result.",

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

        "Complete all required operational inputs before calculating Hospital Readiness.",

        "incomplete"

    );


    if(button){

        button.disabled = true;

    }

}


function showAssessmentCalculatedStatus():void {

    setAssessmentActionStatus(

        "✓",

        "Assessment calculated",

        "The dashboard now reflects the committed Hospital Readiness assessment.",

        "calculated"

    );


    setDraftIndicatorVisibility(

        false

    );

}


function showAssessmentDraftStatus():void {

    setAssessmentActionStatus(

        "↻",

        "Changes not calculated",

        "Select Calculate Hospital Readiness to update the dashboard with the current values.",

        "draft"

    );


    setDraftIndicatorVisibility(

        true

    );

}


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


/*
 * =====================================================
 * Changed-field state
 * =====================================================
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


/*
 * =====================================================
 * Submission state
 * =====================================================
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

        : "Calculate Hospital Readiness";

}