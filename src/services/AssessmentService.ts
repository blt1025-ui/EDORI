/**
 * AssessmentService
 *
 * Maintains temporary draft assessment data
 * separately from the committed EDORI state.
 *
 * Draft changes do not trigger calculations.
 *
 * A completed SituationAssessment is created only
 * when the user selects Calculate EDORI.
 */

import type { SituationAssessment }
from "../types/SituationAssessment";


let draftAssessment:

Partial<SituationAssessment> = {};


/**
 * Update one draft field.
 */
export function updateDraft<

    Field extends keyof SituationAssessment

>(

    field:Field,

    value:SituationAssessment[Field]

):void {

    draftAssessment = {

        ...draftAssessment,

        [field]:value

    };

}


/**
 * Update multiple draft fields.
 */
export function updateDraftFields(

    updates:Partial<SituationAssessment>

):void {

    draftAssessment = {

        ...draftAssessment,

        ...updates

    };

}


/**
 * Return a defensive copy of the current draft.
 */
export function getDraft():

Partial<SituationAssessment> {

    return {

        ...draftAssessment

    };

}


/**
 * Clear all draft values.
 */
export function clearDraft():void {

    draftAssessment = {};

}


/**
 * Create a completed SituationAssessment.
 *
 * Returns null if required current-state inputs
 * have not been provided.
 */
export function submitAssessment():

SituationAssessment | null {

    const requiredFields:

    Array<keyof SituationAssessment> = [

        "totalEDVolume",

        "boardedPatients",

        "occupiedMedicalBeds",

        "esi1",

        "esi2",

        "esi3",

        "esi4",

        "esi5",

        "expectedVolume",

        "expectedBoarders",

        "expectedArrivals",

        "expectedDepartures"

    ];


    for(const field of requiredFields){

        if(

            draftAssessment[field]

            ===

            undefined

        ){

            return null;

        }

    }


    return {

        assessmentTime:
            normalizeString(

                draftAssessment.assessmentTime

            ),

        day:
            normalizeString(

                draftAssessment.day

            ),

        hour:
            normalizeNumber(

                draftAssessment.hour

            ),

        totalEDVolume:
            normalizeNumber(

                draftAssessment.totalEDVolume

            ),

        boardedPatients:
            normalizeNumber(

                draftAssessment.boardedPatients

            ),

        occupiedMedicalBeds:
            normalizeNumber(

                draftAssessment.occupiedMedicalBeds

            ),

        esi1:
            normalizeNumber(

                draftAssessment.esi1

            ),

        esi2:
            normalizeNumber(

                draftAssessment.esi2

            ),

        esi3:
            normalizeNumber(

                draftAssessment.esi3

            ),

        esi4:
            normalizeNumber(

                draftAssessment.esi4

            ),

        esi5:
            normalizeNumber(

                draftAssessment.esi5

            ),

        expectedVolume:
            normalizeNumber(

                draftAssessment.expectedVolume

            ),

        expectedBoarders:
            normalizeNumber(

                draftAssessment.expectedBoarders

            ),

        expectedArrivals:
            normalizeNumber(

                draftAssessment.expectedArrivals

            ),

        expectedDepartures:
            normalizeNumber(

                draftAssessment.expectedDepartures

            )

    };

}


/**
 * Convert a draft value into a safe number.
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
 * Convert a draft value into a safe string.
 */
function normalizeString(

    value:unknown

):string {

    if(typeof value !== "string"){

        return "";

    }


    return value;

}