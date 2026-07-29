import type { SituationAssessment } 
from "../types/SituationAssessment";


let currentState: SituationAssessment = {


    day: "Monday",

    hour: 0,


    totalEDVolume: 0,

    boardedPatients: 0,


    occupiedMedicalBeds: 0,


    currentRN: 0,

    currentMD: 0,


    esi1: 0,

    esi2: 0,

    esi3: 0,

    esi4: 0,

    esi5: 0,


    expectedArrivals: 0,

    expectedDepartures: 0

};



export function getState(){

    return currentState;

}



export function updateState(

    updates:
    Partial<SituationAssessment>

){

    currentState = {

        ...currentState,

        ...updates

    };

}