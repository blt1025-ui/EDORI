/**
 * StateService
 *
 * Stores the most recently committed EDORI
 * operational assessment.
 *
 * The committed assessment is persisted in
 * browser localStorage so the dashboard can
 * restore after a page refresh.
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

    esi1:0,

    esi2:0,

    esi3:0,

    esi4:0,

    esi5:0,

    expectedVolume:0,

    expectedBoarders:0,

    expectedArrivals:0,

    expectedDepartures:0

};


let state:SituationAssessment =

    loadStoredState();


/**
 * Return a defensive copy of the current
 * committed assessment.
 */
export function getState():

SituationAssessment {

    return {

        ...state

    };

}


/**
 * Update and persist part or all of the
 * committed assessment.
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
 * Determine whether a committed assessment
 * currently exists.
 */
export function hasCommittedAssessment():boolean {

    return Boolean(

        state.assessmentTime

    );

}


/**
 * Clear the committed assessment.
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
 * Persist the current committed assessment.
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
 * Restore the most recently committed
 * assessment from localStorage.
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


        /*
         * Only copy properties that remain part
         * of the current assessment model.
         *
         * Older stored assessments may still contain
         * currentRN, currentMD, expectedRN, or
         * expectedMD. Those properties are ignored.
         */

        return {

            assessmentTime:
                normalizeString(

                    parsed.assessmentTime

                ),

            day:
                normalizeString(

                    parsed.day

                ),

            hour:
                normalizeNumber(

                    parsed.hour

                ),

            totalEDVolume:
                normalizeNumber(

                    parsed.totalEDVolume

                ),

            boardedPatients:
                normalizeNumber(

                    parsed.boardedPatients

                ),

            occupiedMedicalBeds:
                normalizeNumber(

                    parsed.occupiedMedicalBeds

                ),

            esi1:
                normalizeNumber(

                    parsed.esi1

                ),

            esi2:
                normalizeNumber(

                    parsed.esi2

                ),

            esi3:
                normalizeNumber(

                    parsed.esi3

                ),

            esi4:
                normalizeNumber(

                    parsed.esi4

                ),

            esi5:
                normalizeNumber(

                    parsed.esi5

                ),

            expectedVolume:
                normalizeNumber(

                    parsed.expectedVolume

                ),

            expectedBoarders:
                normalizeNumber(

                    parsed.expectedBoarders

                ),

            expectedArrivals:
                normalizeNumber(

                    parsed.expectedArrivals

                ),

            expectedDepartures:
                normalizeNumber(

                    parsed.expectedDepartures

                )

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


/**
 * Normalize a stored numeric value.
 */
function normalizeNumber(

    value:unknown

):number {

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
 * Normalize a stored string value.
 */
function normalizeString(

    value:unknown

):string {

    if(typeof value !== "string"){

        return "";

    }


    return value;

}