/**
 * HistoricalService
 *
 * Responsible for retrieving expected ED operational values
 * based on day of week and hour of day.
 */

import type { HistoricalRecord } from "../types/HistoricalRecord";

import historicalData from "../data/historical.json";



/**
 * Returns the historical operational baseline
 * for a specific day and hour.
 *
 * @param day Day of week
 * @param hour Hour of day (0-23)
 */
export function getHistoricalRecord(
    day: string,
    hour: number
): HistoricalRecord | null {


    const record = historicalData.find(

        (item) =>
            item.day === day &&
            item.hour === hour

    );


    if (!record) {

        return null;

    }


    return record as HistoricalRecord;

}