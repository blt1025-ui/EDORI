/**
 * EdoriAssessmentInput
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Represents only operational values entered directly
 * by the end user.
 *
 * Current ED Admissions is intentionally NOT a user
 * input. Existing ED-origin inpatient demand is
 * represented by boardedPatients, while additional
 * ED-origin admissions expected over the next four
 * hours come exclusively from historical data.
 */

export interface EdoriAssessmentInput {

    /*
     * Emergency Department
     */

    totalEDVolume:number;

    boardedPatients:number;

    esi1:number;

    esi2:number;


    /*
     * Acute-care hospital capacity
     */

    staffedAcuteCareBeds:number;

    occupiedAcuteCareBeds:number;


    /*
     * Critical-care hospital capacity
     */

    staffedCriticalCareBeds:number;

    occupiedCriticalCareBeds:number;


    /*
     * Known non-ED inpatient demand
     */

    currentDirectAdmissions:number;

    currentSurgicalAdmissions:number;


    /**
     * Temporary compatibility field.
     *
     * Older forms may still submit it during the UI
     * migration, but Version 2.1 ignores the value.
     */
    currentEDAdmissions?:number;

}