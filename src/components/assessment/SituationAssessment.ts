/**
 * SituationAssessment
 *
 * Main EDORI data-entry panel.
 *
 * Workflow:
 *
 * User enters current operational values
 *        ↓
 * Clicks Calculate EDORI
 *        ↓
 * Current date and hour are captured
 *        ↓
 * Historical expectations are loaded
 *        ↓
 * Assessment is validated and committed
 *        ↓
 * EDORI calculates once
 *        ↓
 * Result and snapshot are stored
 *        ↓
 * resultChanged is emitted
 */

import {

    updateDraft,

    submitAssessment

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

    SituationAssessment as SituationAssessmentType

}

from "../../types/SituationAssessment";


const CURRENT_VALUE_FIELDS:[

    keyof SituationAssessmentType,

    ...Array<keyof SituationAssessmentType>

] = [

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
 * Render the assessment form.
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

            </div>


            <div class="assessment-section historical-expectations-section">

                <div class="historical-section-header">

                    <div>

                        <h3>
                            Historical Expectations
                        </h3>

                        <p id="historicalPeriodDisplay">
                            Based on the date and hour when EDORI is calculated.
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
 * Create a numeric input.
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

    updateInitialAssessmentMessage();

}


/**
 * Initialize current operational-value inputs.
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

                    updateDraft(

                        field,

                        parseInputValue(

                            element.value

                        )

                    );


                    showDraftChangedMessage();

                }

            );

        }

    );

}


/**
 * Initialize Calculate EDORI button.
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

        const calculationTime = new Date();


        const period = getAssessmentPeriod(

            calculationTime

        );


        const expectedValues =

            getExpectedOperationalValues(

                period.day,

                period.hour

            );


        applyHistoricalValuesToDraft(

            period.day,

            period.hour,

            expectedValues

        );


        updateHistoricalDisplay(

            period.day,

            period.hour,

            expectedValues

        );


        updateHistoricalDataStatus(

            hasHistoricalExpectation(

                period.day,

                period.hour

            )

        );


        const assessment = submitAssessment();


        if(!assessment){

            showAssessmentMessage(

                "Please complete all assessment fields before calculating.",

                "error"

            );

            return;

        }


        assessment.day = period.day;

        assessment.hour = period.hour;

        assessment.assessmentTime =

            calculationTime.toISOString();


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


        updateState(

            assessment

        );


        const result = calculateEdori(

            assessment

        );


        setLatestResult(

            result

        );


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
 * Restore historical values from the last
 * committed assessment after page refresh.
 */
function restoreHistoricalDisplay():void {

    if(!hasCommittedAssessment()){

        resetHistoricalDisplay();

        return;

    }


    const state = getState();


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

        state.day,

        state.hour,

        values

    );


    updateHistoricalDataStatus(

        hasHistoricalExpectation(

            normalizeDay(

                state.day

            ),

            state.hour

        )

    );

}


/**
 * Apply historical values to draft state.
 */
function applyHistoricalValuesToDraft(

    day:string,

    hour:number,

    values:ExpectedOperationalValues

):void {

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
 * Update historical expectation values and period.
 */
function updateHistoricalDisplay(

    day:string,

    hour:number,

    values:ExpectedOperationalValues

):void {

    setElementText(

        "historicalPeriodDisplay",

        `Based on ${day} at ${formatHour(hour)}`

    );


    setElementText(

        "expectedVolumeDisplay",

        String(

            values.expectedVolume

        )

    );


    setElementText(

        "expectedBoardersDisplay",

        String(

            values.expectedBoarders

        )

    );


    


    setElementText(

        "expectedArrivalsDisplay",

        String(

            values.expectedArrivals

        )

    );


    setElementText(

        "expectedDeparturesDisplay",

        String(

            values.expectedDepartures

        )

    );

}


/**
 * Reset historical displays before calculation.
 */
function resetHistoricalDisplay():void {

    setElementText(

        "historicalPeriodDisplay",

        "Based on the date and hour when EDORI is calculated."

    );


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


    const statusElement = document.getElementById(

        "historicalDataStatus"

    );


    if(statusElement){

        statusElement.textContent =

            "Awaiting calculation";


        statusElement.classList.remove(

            "historical-data-available",

            "historical-data-missing"

        );

    }

}


/**
 * Update availability status.
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
 * Display initial form status.
 */
function updateInitialAssessmentMessage():void {

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

        !Number.isFinite(value)

    ){

        return 0;

    }


    return value;

}


/**
 * Normalize a stored day string.
 */
function normalizeDay(

    value:string

):

    | "Sunday"

    | "Monday"

    | "Tuesday"

    | "Wednesday"

    | "Thursday"

    | "Friday"

    | "Saturday" {

    const days = [

        "Sunday",

        "Monday",

        "Tuesday",

        "Wednesday",

        "Thursday",

        "Friday",

        "Saturday"

    ] as const;


    return days.includes(

        value as typeof days[number]

    )

        ? value as typeof days[number]

        : "Sunday";

}


/**
 * Format hour as a readable hourly bucket.
 */
function formatHour(

    hour:number

):string {

    const normalizedHour = Math.min(

        23,

        Math.max(

            0,

            Math.floor(hour)

        )

    );


    const date = new Date();


    date.setHours(

        normalizedHour,

        0,

        0,

        0

    );


    return `${String(normalizedHour).padStart(2, "0")}:00 (${date.toLocaleTimeString(

        [],

        {

            hour:"numeric",

            minute:"2-digit"

        }

    )})`;

}


/**
 * Convert input value into a safe number.
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


    return parsedValue;

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


    if(!element){

        return;

    }


    element.textContent = value;

}


/**
 * Indicate draft values have changed.
 */
function showDraftChangedMessage():void {

    showAssessmentMessage(

        "Assessment values changed. Select Calculate EDORI to update the dashboard.",

        "draft"

    );

}


/**
 * Update assessment status message.
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