/**
 * ForecastService
 *
 * Calculates expected near-term ED operational pressure.
 *
 * Current version:
 * Simple one-hour forecast model.
 *
 * Future versions:
 * - Machine learning prediction
 * - Seasonal adjustment
 * - Admission prediction
 * - EHR integration
 */


import type { SituationAssessment }
from "../types/SituationAssessment";



/**
 * Forecast result returned to EDORI engine.
 */
export interface ForecastResult {


    /**
     * Projected ED census after expected arrivals
     * and departures.
     */
    projectedVolume: number;



    /**
     * Difference between projected volume
     * and expected historical volume.
     */
    volumeDifference: number;



    /**
     * Forecast strain score 0-100.
     */
    forecastScore: number;

}



/**
 * Calculates the projected operational state.
 */
export function calculateForecast(

    assessment: SituationAssessment

): ForecastResult {



    /*
     * Calculate projected census
     */

    const projectedVolume =

        assessment.totalEDVolume

        +

        assessment.expectedArrivals

        -

        assessment.expectedDepartures;



    /*
     * Compare projected volume
     * against historical expectation.
     */

    const volumeDifference =

        projectedVolume

        -

        assessment.expectedVolume;



    /*
     * Convert difference into a 0-100 score.
     *
     * Assumption:
     * +25 patients above expected represents
     * extreme forecast pressure.
     */

    let forecastScore =

        (volumeDifference / 25) * 100;



    /*
     * Keep score between 0 and 100.
     */

    forecastScore = Math.max(

        0,

        Math.min(

            100,

            forecastScore

        )

    );



    return {

        projectedVolume,

        volumeDifference,

        forecastScore

    };

}