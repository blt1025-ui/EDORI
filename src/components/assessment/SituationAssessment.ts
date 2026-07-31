/**
 * SituationAssessment
 *
 * Main EDORI data-entry panel.
 *
 * Workflow:
 *
 * User enters values
 *        ↓
 * Draft assessment only
 *        ↓
 * Calculate EDORI
 *        ↓
 * Validate assessment
 *        ↓
 * Commit assessment to StateService
 *        ↓
 * Calculate EDORI once
 *        ↓
 * Store result in ResultService
 *        ↓
 * Save one historical snapshot
 *        ↓
 * Emit resultChanged
 *
 * On page reload:
 *
 * - The last committed assessment is restored.
 * - Draft fields are repopulated.
 * - No new calculation occurs.
 * - No new snapshot is created.
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


import type {

    SituationAssessment as SituationAssessmentType

}

from "../../types/SituationAssessment";


/**
 * Numeric fields displayed in the assessment form.
 */
const ASSESSMENT_FIELDS:[

    keyof SituationAssessmentType,

    ...Array<keyof SituationAssessmentType>

] = [

    "totalEDVolume",

    "boardedPatients",

    "occupiedMedicalBeds",

    "currentRN",

    "currentMD",

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
                    Enter the complete operational data set before calculating EDORI.
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
                    Clinical Resources
                </h3>


                <div class="input-grid">

                    ${createNumberInput(

                        "currentRN",

                        "Registered Nurses",

                        0

                    )}


                    ${createNumberInput(

                        "currentMD",

                        "Physicians / Providers",

                        0

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
 * Create a reusable numeric assessment input.
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
 * Initialize all assessment behavior.
 */
export function initializeSituationAssessment():void {

    initializeDraftInputs();

    initializeCalculateButton();

    updateInitialAssessmentMessage();

}


/**
 * Initialize assessment inputs.
 *
 * If a committed assessment exists, restore
 * its values into both the form and draft service.
 */
function initializeDraftInputs():void {

    const committedState = getState();


    const restoreCommittedValues =

        hasCommittedAssessment();


    ASSESSMENT_FIELDS.forEach(

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
 * Commit, validate, calculate, persist,
 * and publish one EDORI assessment.
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

        const assessment = submitAssessment();


        if(!assessment){

            showAssessmentMessage(

                "Please complete all assessment fields before calculating.",

                "error"

            );

            return;

        }


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
         * Commit the validated assessment.
         *
         * StateService also persists this assessment
         * to localStorage.
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
         */

        setLatestResult(

            result

        );


        /*
         * Save one historical snapshot.
         */

        const snapshotTimestamp =

            assessment.assessmentTime

                ? new Date(

                    assessment.assessmentTime

                )

                : new Date();


        const snapshot = {

            score:
                result.score,

            status:
                result.status,

            operationalState:
                result.operationalState,

            timestamp:
                snapshotTimestamp

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
         * Notify every dashboard display that a new
         * authoritative result is available.
         */

        emit(

            "resultChanged"

        );


        showAssessmentMessage(

            `EDORI calculated successfully. Score: ${Math.round(result.score)}.`,

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
 * Display an appropriate message when the
 * component first loads.
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
 * Read a numeric value from the committed
 * SituationAssessment safely.
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


    return parsedValue;

}


/**
 * Indicate that draft values have changed
 * without recalculating EDORI.
 */
function showDraftChangedMessage():void {

    showAssessmentMessage(

        "Assessment values changed. Select Calculate EDORI to update the dashboard.",

        "draft"

    );

}


/**
 * Update the assessment message and style.
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
 * Disable the button while submitting.
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