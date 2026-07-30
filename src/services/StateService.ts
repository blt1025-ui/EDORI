/**
 * StateService
 *
 * Stores current EDORI operational state.
 */


import type { SituationAssessment }
from "../types/SituationAssessment";




let state:SituationAssessment = {


    day:

        "",


    hour:

        0,



    totalEDVolume:

        0,



    boardedPatients:

        0,



    expectedBoarders:

        0,



    expectedVolume:

        0,



    occupiedMedicalBeds:

        0,



    currentRN:

        0,



    currentMD:

        0,



    esi1:

        0,



    esi2:

        0,



    esi3:

        0,



    esi4:

        0,



    esi5:

        0,


    expectedArrivals:

        0,


    expectedDepartures:

        0

};







export function getState():

SituationAssessment {


    return state;


}







export function updateState(

    updates:Partial<SituationAssessment>

):void {


    state = {


        ...state,


        ...updates


    };


}