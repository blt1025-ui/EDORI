/**
 * EdoriAssessmentInput
 *
 * Represents only the current operational values
 * entered by the end user.
 *
 * Historical expectations, assessment time,
 * weekday, and hour are added automatically by
 * EdoriEngine.
 */

export interface EdoriAssessmentInput {

    totalEDVolume:number;

    boardedPatients:number;

    occupiedMedicalBeds:number;

    staffedMedicalBeds:number;

    esi1:number;

    esi2:number;

    esi3:number;

    esi4:number;

    esi5:number;

}