/**
 * AssessmentService
 *
 * Maintains draft assessment data
 * separately from committed EDORI data.
 *
 * Draft:
 * - Changes while typing
 * - Does not trigger calculations
 *
 * Submitted:
 * - Used by EDORI engine
 */


import type { SituationAssessment }
from "../types/SituationAssessment";



let draftAssessment:

Partial<SituationAssessment> = {};




/**
 * Update temporary form values
 */
export function updateDraft(

    field:string,

    value:number

):void {


    draftAssessment = {

        ...draftAssessment,

        [field]:value

    };

}



/**
 * Return current draft
 */
export function getDraft():

Partial<SituationAssessment>{

    return draftAssessment;

}



/**
 * Create completed assessment
 */
export function submitAssessment():

SituationAssessment | null {



    const requiredFields = [

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



    for(

        const field of requiredFields

    ){


        if(

            draftAssessment[field as keyof SituationAssessment]

            ===

            undefined

        ){

            return null;

        }


    }



    return {


    assessmentTime:

        new Date().toISOString(),


    day:

        new Date()

        .toISOString()

        .split("T")[0],



        hour:

            new Date()

            .getHours(),



        totalEDVolume:

            draftAssessment.totalEDVolume || 0,


        boardedPatients:

            draftAssessment.boardedPatients || 0,


        occupiedMedicalBeds:

            draftAssessment.occupiedMedicalBeds || 0,


        currentRN:

            draftAssessment.currentRN || 0,


        currentMD:

            draftAssessment.currentMD || 0,


        esi1:

            draftAssessment.esi1 || 0,


        esi2:

            draftAssessment.esi2 || 0,


        esi3:

            draftAssessment.esi3 || 0,


        esi4:

            draftAssessment.esi4 || 0,


        esi5:

            draftAssessment.esi5 || 0,



        expectedVolume:0,

        expectedBoarders:0,

        expectedRN:0,

        expectedMD:0,

        expectedArrivals:0,

        expectedDepartures:0


    };


}