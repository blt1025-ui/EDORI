/**
 * SituationAssessment
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Represents one completed hospital operational
 * readiness assessment.
 *
 * Historical values are added automatically by
 * EdoriEngine and are never entered manually by the
 * end user.
 */

export interface SituationAssessment {

    /*
     * =================================================
     * Assessment metadata
     * =================================================
     */

    assessmentTime:string;

    day:string;

    hour:number;

    forecastHours:number;


    /*
     * =================================================
     * Emergency Department
     * =================================================
     */

    totalEDVolume:number;

    /**
     * Current admitted ED patients physically boarding
     * and already requiring inpatient beds.
     */
    boardedPatients:number;

    esi1:number;

    esi2:number;


    /*
     * =================================================
     * Acute-Care Hospital Capacity
     * =================================================
     */

    staffedAcuteCareBeds:number;

    occupiedAcuteCareBeds:number;


    /*
     * =================================================
     * Critical-Care Hospital Capacity
     * =================================================
     */

    staffedCriticalCareBeds:number;

    occupiedCriticalCareBeds:number;


    /*
     * =================================================
     * Known Non-ED Inflow
     * =================================================
     */

    currentDirectAdmissions:number;

    currentSurgicalAdmissions:number;


    /**
     * Compatibility field retained temporarily while
     * older UI/report components are migrated.
     *
     * Version 2.1 does NOT collect Current ED
     * Admissions from the user. EdoriEngine always
     * sets this value to zero.
     */
    currentEDAdmissions:number;


    /*
     * =================================================
     * Historical ED Expectations
     * =================================================
     */

    expectedEDVolume:number;

    expectedEDBoarders:number;


    /*
     * =================================================
     * Historical Acute-Care Baseline
     * =================================================
     */

    expectedStaffedAcuteCareBeds:number;

    expectedOccupiedAcuteCareBeds:number;

    expectedAvailableAcuteCareBeds:number;


    /*
     * =================================================
     * Historical Four-Hour Hospital Flow
     * =================================================
     */

    /**
     * NEW ED-origin inpatient admissions expected
     * during the next four hours.
     *
     * This does not include patients already counted
     * as current ED boarders.
     */
    expectedEDAdmissions4h:number;

    expectedDirectAdmissions4h:number;

    expectedSurgicalAdmissions4h:number;

    expectedHospitalInflow4h:number;

    expectedInpatientDepartures4h:number;


    /*
     * =================================================
     * Historical Four-Hour Bed-Balance Baseline
     * =================================================
     */

    /**
     * Historical projected bed demand:
     *
     * expected ED boarders
     * + new expected ED admissions
     * + expected direct admissions
     * + expected surgical/procedural admissions
     */
    historicalProjectedBedDemand4h:number;


    /**
     * Historical expected staffed acute-care bed
     * balance at the end of the four-hour horizon.
     *
     * Negative values are valid and expected when a
     * bed deficit is historically normal.
     */
    historicalProjectedBedBalance4h:number;

}