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

    /**
     * Current total emergency department census.
     */
    totalEDVolume:number;


    /**
     * Current number of admitted patients
     * boarding in the emergency department.
     */
    boardedPatients:number;


    /**
     * Current occupied medical beds.
     *
     * EDORI uses 273 medical beds as the
     * configured denominator.
     */
    occupiedMedicalBeds:number;


    /**
     * Current Emergency Severity Index
     * distribution.
     */
    esi1:number;

    esi2:number;

    esi3:number;

    esi4:number;

    esi5:number;

}