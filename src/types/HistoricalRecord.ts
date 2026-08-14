/**
 * HistoricalRecord
 *
 * Version 2 Hospital Readiness Model
 *
 * Represents one hourly historical baseline record.
 *
 * This type mirrors the historical data fields used
 * by the Hospital Readiness calculation model.
 */

export interface HistoricalRecord {

    /**
     * Monday, Tuesday, etc.
     */
    day:string;


    /**
     * Hour of day from 0 through 23.
     */
    hour:number;


    /**
     * Historical average total ED census during
     * this weekday/hour period.
     */
    expectedEDVolume:number;


    /**
     * Historical average ED boarding population
     * during this weekday/hour period.
     */
    expectedEDBoarders:number;


    /**
     * Historical average number of inpatient
     * admissions originating from the ED during
     * this hour.
     */
    expectedEDAdmissions:number;


    /**
     * Historical average number of direct hospital
     * admissions during this hour.
     */
    expectedDirectAdmissions:number;


    /**
     * Historical average number of inpatient
     * admissions originating from surgical or
     * procedural areas during this hour.
     */
    expectedSurgicalAdmissions:number;


    /**
     * Historical average number of inpatient
     * hospital departures during this hour.
     */
    expectedInpatientDepartures:number;

}