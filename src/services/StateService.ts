import type { SituationAssessment } from "../types/SituationAssessment";

let state: SituationAssessment = {

    day: "Monday",

    hour: 0,

    occupiedBeds: 0,

    hallwayPatients: 0,

    waitingPatients: 0,

    boardedPatients: 0,

    occupiedMedicalBeds: 0,

    currentRN: 0,

    currentMD: 0,

    esi1: 0,

    esi2: 0,

    esi3: 0,

    esi4: 0,

    esi5: 0

};

export function getState() {

    return state;

}

export function updateState(
    partial: Partial<SituationAssessment>
) {

    state = {

        ...state,

        ...partial

    };

}