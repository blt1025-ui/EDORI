/**
 * StateService
 *
 * Stores the current committed EDORI assessment.
 *
 * The most recently submitted assessment is
 * persisted in browser localStorage so the
 * dashboard can restore after a page refresh.
 */

import type { SituationAssessment }
from "../types/SituationAssessment";


const STORAGE_KEY =

    "edori_current_assessment";


const DEFAULT_STATE:SituationAssessment = {

    assessmentTime:"",

    day:"",

    hour:0,

    totalEDVolume:0,

    boardedPatients:0,

    occupiedMedicalBeds:0,

    currentRN:0,

    currentMD:0,

    esi1:0,

    esi2:0,

    esi3:0,

    esi4:0,

    esi5:0,

    expectedVolume:0,

    expectedBoarders:0,

    expectedRN:0,

    expectedMD:0,

    expectedArrivals:0,

    expectedDepartures:0

};


let state:SituationAssessment =

    loadStoredState();


/**
 * Return a copy of the current committed assessment.
 */
export function getState():

SituationAssessment {

    return {

        ...state

    };

}


/**
 * Update and persist the committed assessment.
 */
export function updateState(

    updates:Partial<SituationAssessment>

):void {

    state = {

        ...state,

        ...updates

    };


    saveState();

}


/**
 * Replace the complete committed assessment.
 */
export function setState(

    assessment:SituationAssessment

):void {

    state = {

        ...assessment

    };


    saveState();

}


/**
 * Reset the committed assessment.
 */
export function clearState():void {

    state = {

        ...DEFAULT_STATE

    };


    localStorage.removeItem(

        STORAGE_KEY

    );

}


/**
 * Determine whether a submitted assessment exists.
 */
export function hasCommittedAssessment():boolean {

    return Boolean(

        state.assessmentTime

    );

}


/**
 * Save the current assessment.
 */
function saveState():void {

    try {

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(

                state

            )

        );

    }
    catch(error){

        console.error(

            "Unable to save the current EDORI assessment:",

            error

        );

    }

}


/**
 * Restore the most recent committed assessment.
 */
function loadStoredState():

SituationAssessment {

    try {

        const stored = localStorage.getItem(

            STORAGE_KEY

        );


        if(!stored){

            return {

                ...DEFAULT_STATE

            };

        }


        const parsed = JSON.parse(

            stored

        ) as Partial<SituationAssessment>;


        return {

            ...DEFAULT_STATE,

            ...parsed

        };

    }
    catch(error){

        console.error(

            "Unable to restore the current EDORI assessment:",

            error

        );


        localStorage.removeItem(

            STORAGE_KEY

        );


        return {

            ...DEFAULT_STATE

        };

    }

}