/**
 * HistoricalExpectation
 *
 * Represents expected operational conditions
 * for a specific weekday and hour.
 *
 * Staffing is intentionally excluded from the
 * historical expectation model.
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

    /**
     * Day of week.
     */
    day:DayOfWeek;


    /**
     * Hour of day from 0 through 23.
     */
    hour:number;


    /**
     * Expected total emergency department census.
     */
    expectedVolume:number;


    /**
     * Expected number of boarded patients.
     */
    expectedBoarders:number;


    /**
     * Expected arrivals during the hourly period.
     */
    expectedArrivals:number;


    /**
     * Expected departures during the hourly period.
     */
    expectedDepartures:number;

}