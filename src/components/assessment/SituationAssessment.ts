/**
 * SituationAssessment
 *
 * Main EDORI data-entry panel.
 *
 * Submission flow:
 *
 * User enters values
 *        ↓
 * Draft assessment
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
 * Notify dashboard components
 */

import {

    updateDraft,

    submitAssessment

}

from "../../services/AssessmentService";


import {

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
 * IDs for all assessment input fields.
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

                    class="assessment-message"

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
 * Initialize draft input listeners and the
 * Calculate EDORI submission button.
 */
export function initializeSituationAssessment():void {

    initializeDraftInputs();

    initializeCalculateButton();

}


/**
 * Store input changes as draft data only.
 *
 * No stateChanged or resultChanged event occurs
 * while the user is typing.
 */
function initializeDraftInputs():void {

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


            /*
             * Initialize the draft with the displayed
             * input value. This allows zero to be treated
             * as a completed value rather than an omitted field.
             */

            updateDraft(

                field,

                parseInputValue(

                    element.value

                )

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
 * Commit, calculate, store, and publish one
 * completed EDORI assessment.
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
         * Store the authoritative result for
         * dashboard display components.
         */

        setLatestResult(

            result

        );


        /*
         * Save a single historical snapshot.
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
         * Maintain stateChanged temporarily for
         * components that have not yet migrated
         * to ResultService.
         */

        emit(

            "stateChanged"

        );


        /*
         * Notify components that consume the
         * authoritative EdoriResult.
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
 * Indicate that draft values have changed but
 * the score has not yet been recalculated.
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
 * Disable the calculation button while a
 * submission is being processed.
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