/**
 * One historical baseline record.
 * These values are loaded from historical.json
 * based on the selected day and hour.
 */

export interface HistoricalRecord {

    /**
     * Monday, Tuesday, etc.
     */
    day: string;

    /**
     * Hour of day (0-23)
     */
    hour: number;

    /**
     * Historical average total ED census
     */
    expectedVolume: number;

    /**
     * Historical average boarded patients
     */
    expectedBoarders: number;

    /**
     * Historical average RN staffing
     */
    expectedRN: number;

    /**
     * Historical average physician/APP staffing
     */
    expectedMD: number;

    /**
     * Historical average arrivals during this hour
     */
    expectedArrivals: number;

    /**
     * Historical average departures during this hour
     */
    expectedDepartures: number;

}