/**
 * SituationAssessment
 *
 * Represents one completed EDORI operational
 * assessment.
 *
 * Staffing is intentionally excluded from the
 * EDORI assessment and scoring model.
 */

export interface SituationAssessment {

    /*
     * Assessment metadata
     */

    assessmentTime:string;


    /*
     * Assessment period
     */

    day:string;

    hour:number;


    /*
     * ED demand
     */

    totalEDVolume:number;

    boardedPatients:number;


    /*
     * Hospital capacity
     */

    occupiedMedicalBeds:number;

staffedMedicalBeds:number;
    /*
     * Patient acuity distribution
     */

    esi1:number;

    esi2:number;

    esi3:number;

    esi4:number;

    esi5:number;


    /*
     * Historical expectations
     */

    expectedVolume:number;

    expectedBoarders:number;

    expectedArrivals:number;

    expectedDepartures:number;

}