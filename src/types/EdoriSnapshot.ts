/**
 * EdoriSnapshot
 *
 * Persisted historical record of one completed
 * EDORI operational assessment.
 *
 * Snapshots support:
 *
 * - Assessment history
 * - Trend charts
 * - Operational timelines
 * - Data export
 * - Backup and restore
 * - Historical analytics
 */

import type { OperationalState }
from "../config/operationalStates";


/**
 * One saved EDORI assessment snapshot.
 */
export interface EdoriSnapshot {

    /**
     * Unique snapshot identifier.
     */
    id:string;


    /**
     * Date and time the assessment was calculated.
     *
     * Stored snapshots may contain either a Date
     * object or an ISO date string after JSON restore.
     */
    timestamp:Date | string;


    /**
     * Final EDORI score.
     */
    score:number;


    demandScore:number;

boardingScore:number;

hospitalScore:number;

acuityScore:number;

forecastScore:number;

    /**
     * Human-readable score status.
     */
    status:string;


    /**
     * Final Alpha–Echo operational state.
     */
    operationalState:OperationalState;


    /**
     * Day associated with the assessment.
     */
    day:string;


    /**
     * Hour bucket associated with the assessment.
     */
    hour:number;


    /**
     * Total number of patients currently in the ED.
     */
    totalEDVolume:number;


    /**
     * Number of admitted patients boarding in the ED.
     */
    boardedPatients:number;


    /**
     * Number of currently occupied medical beds.
     */
    occupiedMedicalBeds:number;


    /**
     * Number of medical beds currently available for
     * occupancy based on staffing and operations.
     *
     * This is the denominator used for hospital
     * medical-bed occupancy calculations.
     */
    staffedMedicalBeds:number;


    /**
     * Current ESI distribution.
     */
    esi1:number;

    esi2:number;

    esi3:number;

    esi4:number;

    esi5:number;


    /**
     * Historical expected ED volume for the selected
     * day and hour.
     */
    expectedVolume:number;


    /**
     * Historical expected boarding count.
     */
    expectedBoarders:number;


    /**
     * Historical expected arrivals.
     */
    expectedArrivals:number;


    /**
     * Historical expected departures.
     */
    expectedDepartures:number;


    /**
     * Optional current RN staffing value.
     *
     * Retained for compatibility with assessments
     * that include staffing inputs.
     */
    currentRN?:number;


    /**
     * Optional current physician staffing value.
     */
    currentMD?:number;


    /**
     * Optional historical expected RN staffing.
     */
    expectedRN?:number;


    /**
     * Optional historical expected physician staffing.
     */
    expectedMD?:number;


    /**
     * Optional calculated medical-bed occupancy.
     *
     * New calculations should derive this value from:
     *
     * occupiedMedicalBeds / staffedMedicalBeds * 100
     */
    medicalOccupancyPercent?:number;


    /**
     * Optional ED occupancy percentage.
     */
    edOccupancyPercent?:number;


    /**
     * Optional boarding percentage of ED census.
     */
    boardingPercent?:number;


    /**
     * Optional total weighted acuity value.
     */
   


    /**
     * Optional change from the previous score.
     */
    scoreChange?:number;


    /**
     * Optional directional trend description.
     */
    trendDirection?:string;


    /**
     * Optional list of active operational trigger IDs.
     */
    activeTriggerIds?:string[];


    /**
     * Optional list of active operational trigger
     * titles.
     */
    activeTriggerTitles?:string[];


    /**
     * Optional snapshot schema version.
     *
     * This supports future backup migration.
     */
    schemaVersion?:number;

}