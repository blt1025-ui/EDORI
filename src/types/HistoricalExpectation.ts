/**
 * HistoricalExpectation
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Represents one hourly historical baseline record.
 *
 * Rolling four-hour flow expectations are calculated
 * dynamically by HistoricalDataService by summing
 * four consecutive hourly records.
 */

export type DayOfWeek =

    | "Sunday"
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday";


export interface HistoricalExpectation {

    /*
     * Historical bucket
     */

    day:DayOfWeek;

    hour:number;


    /*
     * =================================================
     * Emergency Department baseline
     * =================================================
     */

    /**
     * Historical ED census for this weekday/hour.
     */
    expectedEDVolume:number;


    /**
     * Historical admitted ED boarding population
     * physically present at the START of this
     * weekday/hour bucket.
     *
     * This is a census/backlog measure.
     */
    expectedEDBoarders:number;


    /*
     * =================================================
     * Acute-care baseline
     * =================================================
     */

    /**
     * Historical staffed acute-care beds for this
     * weekday/hour.
     */
    expectedStaffedAcuteCareBeds:number;


    /**
     * Historical occupied acute-care beds for this
     * weekday/hour.
     */
    expectedOccupiedAcuteCareBeds:number;


    /*
     * =================================================
     * Hourly hospital inflow
     * =================================================
     */

    /**
     * NEW ED-origin inpatient admissions occurring
     * DURING this hourly interval.
     *
     * IMPORTANT:
     *
     * This does NOT mean ED arrivals.
     *
     * It also does NOT include patients who were
     * already admitted and boarding in the ED at the
     * beginning of the interval. Those patients are
     * represented separately by expectedEDBoarders.
     */
    expectedEDAdmissions:number;


    /**
     * New direct inpatient admissions occurring
     * during this hourly interval.
     */
    expectedDirectAdmissions:number;


    /**
     * New inpatient admissions originating from
     * surgical/procedural areas during this hourly
     * interval.
     */
    expectedSurgicalAdmissions:number;


    /*
     * =================================================
     * Hourly inpatient outflow
     * =================================================
     */

    /**
     * Inpatient hospital departures occurring during
     * this hourly interval.
     *
     * Historical-only; never estimated by the user.
     */
    expectedInpatientDepartures:number;

}