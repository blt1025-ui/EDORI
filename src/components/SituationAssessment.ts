export interface SituationAssessment {
    /*
     * Time
     */
    day: string;
    hour: number;

    /*
     * ED Demand
     */
    totalEDVolume: number;
    boardedPatients: number;

    /*
     * Hospital Capacity
     */
    occupiedMedicalBeds: number;

    /*
     * Clinical Capacity
     */


    /*
     * Patient Acuity (ESI Distribution)
     */
    esi1: number;
    esi2: number;
    esi3: number;
    esi4: number;
    esi5: number;

    /*
     * Historical Expectations
     */
    expectedVolume: number;
    expectedBoarders: number;
    expectedRN: number;
    expectedMD: number;
    expectedArrivals: number;
    expectedDepartures: number;
}