/**
 * AssessmentAccessController
 *
 * Applies current-user authorization to the
 * Hospital Readiness assessment workspace.
 *
 * Viewer:
 * - May view assessment information
 * - May view current input values
 * - May not modify assessment inputs
 * - May not calculate/save a new assessment
 *
 * Operator / Administrator:
 * - May modify assessment inputs
 * - May calculate/save assessments
 *
 * This controller does not duplicate assessment
 * validation. SituationAssessment remains responsible
 * for determining whether the assessment is complete.
 */

import {

    APP_EVENTS

}

from "../../config/appEvents";


import {

    hasPermission

}

from "../../services/AuthorizationService";


import {

    subscribe

}

from "../../services/EventService";


/**
 * IDs of user-editable Situation Assessment inputs.
 */
const ASSESSMENT_INPUT_IDS:string[] = [

    "totalEDVolume",

    "boardedPatients",

    "esi1",

    "esi2",

    "staffedAcuteCareBeds",

    "occupiedAcuteCareBeds",

    "staffedCriticalCareBeds",

    "occupiedCriticalCareBeds",

    "currentDirectAdmissions",

    "currentSurgicalAdmissions"

];


/**
 * Prevent duplicate USERS_CHANGED subscriptions.
 */
let subscribed = false;


/**
 * Preserve the assessment button's validation state
 * while Viewer authorization temporarily disables it.
 */
let buttonWasDisabledBeforeAuthorization = false;


/**
 * Initialize assessment authorization behavior.
 */
export function initializeAssessmentAccessController():void {

    applyAssessmentAccess();


    if(subscribed){

        return;

    }


    subscribed = true;


    subscribe(

        APP_EVENTS.USERS_CHANGED,

        () => {

            applyAssessmentAccess();

        }

    );

}


/**
 * Apply current permissions to the assessment
 * workspace.
 */
export function applyAssessmentAccess():void {

    const canCreate =

        hasPermission(
            "assessment.create"
        );


    const canSave =

        hasPermission(
            "assessment.save"
        );


    const canModifyAssessment =

        canCreate

        &&

        canSave;


    updateAssessmentInputs(
        canModifyAssessment
    );


    updateAssessmentButton(
        canModifyAssessment
    );


    updateAssessmentAccessNotice(
        canModifyAssessment
    );

}


/**
 * Enable or disable current operational inputs.
 */
function updateAssessmentInputs(

    editable:boolean

):void {

    ASSESSMENT_INPUT_IDS.forEach(

        inputId => {

            const input =

                document.getElementById(
                    inputId
                );


            if(

                !(

                    input

                    instanceof

                    HTMLInputElement

                )

            ){

                return;

            }


            /*
             * Use readOnly rather than disabled.
             *
             * This keeps current values visually available
             * and avoids changing form semantics while still
             * preventing Viewer edits.
             */
            input.readOnly =

                !editable;


            input.setAttribute(

                "aria-readonly",

                editable
                    ? "false"
                    : "true"

            );


            input.classList.toggle(

                "assessment-input-readonly",

                !editable

            );

        }

    );

}


/**
 * Apply authorization to Calculate & Save.
 *
 * SituationAssessment owns normal validation state.
 * We preserve that state when entering Viewer mode and
 * restore it when returning to an editable role.
 */
function updateAssessmentButton(

    editable:boolean

):void {

    const button =

        document.getElementById(
            "calculateEdoriButton"
        );


    if(

        !(

            button

            instanceof

            HTMLButtonElement

        )

    ){

        return;

    }


    if(!editable){

        /*
         * Capture validation state only when transitioning
         * into authorization-disabled mode.
         */
        if(

            !button.dataset.authorizationDisabled

        ){

            buttonWasDisabledBeforeAuthorization =

                button.disabled;

        }


        button.disabled =

            true;


        button.dataset.authorizationDisabled =

            "true";


        button.setAttribute(

            "aria-disabled",

            "true"

        );


        button.title =

            "Your EDORI role allows viewing assessments but does not allow calculating or saving a new assessment.";


        return;

    }


    /*
     * Remove only the authorization restriction.
     *
     * Restore the button state that existed immediately
     * before Viewer authorization was applied. Normal
     * assessment validation remains authoritative.
     */
    if(

        button.dataset.authorizationDisabled

        ===

        "true"

    ){

        button.disabled =

            buttonWasDisabledBeforeAuthorization;

    }


    delete button.dataset.authorizationDisabled;


    button.removeAttribute(
        "aria-disabled"
    );


    button.removeAttribute(
        "title"
    );

}


/**
 * Display a clear read-only notice for Viewers.
 */
function updateAssessmentAccessNotice(

    editable:boolean

):void {

    const assessment =

        document.querySelector<HTMLElement>(

            ".situation-assessment"

        );


    if(!assessment){

        return;

    }


    let notice =

        document.getElementById(
            "assessmentAccessNotice"
        );


    if(editable){

        notice?.remove();


        assessment.classList.remove(

            "assessment-readonly-mode"

        );


        return;

    }


    assessment.classList.add(

        "assessment-readonly-mode"

    );


    if(notice){

        return;

    }


    notice =

        document.createElement(
            "div"
        );


    notice.id =

        "assessmentAccessNotice";


    notice.className =

        "assessment-access-notice";


    notice.setAttribute(

        "role",

        "status"

    );


    notice.innerHTML = `

        <div class="assessment-access-notice-icon">
            👁
        </div>

        <div>

            <strong>
                View-only assessment access
            </strong>

            <p>
                Your EDORI role can review the current assessment
                and assessment history, but cannot change operational
                inputs or calculate and save a new assessment.
            </p>

        </div>

    `;


    const header =

        assessment.querySelector(

            ".assessment-workspace-header"

        );


    if(header){

        header.insertAdjacentElement(

            "afterend",

            notice

        );

    }
    else {

        assessment.prepend(

            notice

        );

    }

}