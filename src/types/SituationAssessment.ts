/**
 * Represents the complete operational state of the Emergency Department.
 * This object is passed throughout the application and is the primary
 * input to the EDORI calculation engine.
 */

export interface SituationAssessment {

    /* ============================================================
       TIME
       ============================================================ */

    /** Day of week selected by the user */
    day: string;

    /** Hour of day (0-23) */
    hour: number;


    /* ============================================================
       ED DEMAND
       ============================================================ */

    /** Total patients physically in the ED */
    totalEDVolume: number;

    /** Number of admitted patients boarding in the ED */
    boardedPatients: number;


    /* ============================================================
       HOSPITAL CAPACITY
       ============================================================ */

    /** Occupied medical/surgical beds (0-273) */
    occupiedMedicalBeds: number;


    /* ============================================================
       CLINICAL CAPACITY
       ============================================================ */

    /** Current RN staffing */
    currentRN: number;

    /** Current physician/APP staffing */
    currentMD: number;


    /* ============================================================
       PATIENT ACUITY
       ============================================================ */

    /** Number of ESI-1 patients */
    esi1: number;

    /** Number of ESI-2 patients */
    esi2: number;

    /** Number of ESI-3 patients */
    esi3: number;

    /** Number of ESI-4 patients */
    esi4: number;

    /** Number of ESI-5 patients */
    esi5: number;


    /* ============================================================
       HISTORICAL EXPECTATIONS
       These values are automatically populated from historical.json
       after the user selects the day and hour.
       ============================================================ */

    expectedVolume: number;

    expectedBoarders: number;

    expectedRN: number;

    expectedMD: number;

    expectedArrivals: number;

    expectedDepartures: number;

}