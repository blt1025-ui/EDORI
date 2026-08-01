/**
 * ForecastService
 *
 * Pure near-term operational-flow calculation.
 *
 * The Version 1.0 forecast domain estimates
 * whether expected arrivals are likely to exceed
 * expected departures during the current hourly
 * historical period.
 *
 * This service does not:
 *
 * - Read current application state
 * - Save results
 * - Emit events
 * - Access localStorage
 * - Predict future EDORI scores
 */

import type {

    SituationAssessment

}

from "../types/SituationAssessment";


/**
 * A positive net flow of 10 patients or more
 * produces the maximum forecast score.
 *
 * This constant should be reviewed during
 * clinical calibration.
 */
const NET_FLOW_AT_MAXIMUM_SCORE = 10;


export interface ForecastResult {

    /**
     * Expected arrivals minus expected departures.
     */
    netExpectedFlow:number;


    /**
     * Forecast strain from 0 through 100.
     */
    forecastScore:number;


    /**
     * Readable direction of expected flow.
     */
    direction:

        | "Increasing"

        | "Stable"

        | "Improving";


    /**
     * Human-readable forecast explanation.
     */
    description:string;

}


/**
 * Calculate the near-term forecast domain.
 */
export function calculateForecast(

    assessment:SituationAssessment

):ForecastResult {

    const expectedArrivals =

        normalizeHistoricalValue(

            assessment.expectedArrivals

        );


    const expectedDepartures =

        normalizeHistoricalValue(

            assessment.expectedDepartures

        );


    const netExpectedFlow = roundValue(

        expectedArrivals

        -

        expectedDepartures

    );


    const forecastScore =

        calculateForecastScore(

            netExpectedFlow

        );


    const direction = getForecastDirection(

        netExpectedFlow

    );


    return {

        netExpectedFlow,

        forecastScore,

        direction,

        description:
            createForecastDescription(

                expectedArrivals,

                expectedDepartures,

                netExpectedFlow,

                direction

            )

    };

}


/**
 * Convert positive expected net flow to a
 * 0–100 forecast score.
 *
 * Zero or negative net flow contributes no
 * forecast-strain score.
 */
function calculateForecastScore(

    netExpectedFlow:number

):number {

    if(

        !Number.isFinite(

            netExpectedFlow

        )

        ||

        netExpectedFlow <= 0

    ){

        return 0;

    }


    return roundScore(

        clampScore(

            netExpectedFlow

            /

            NET_FLOW_AT_MAXIMUM_SCORE

            *

            100

        )

    );

}


/**
 * Determine expected operational direction.
 */
function getForecastDirection(

    netExpectedFlow:number

):

    | "Increasing"

    | "Stable"

    | "Improving" {

    if(netExpectedFlow > 0){

        return "Increasing";

    }


    if(netExpectedFlow < 0){

        return "Improving";

    }


    return "Stable";

}


/**
 * Create a readable explanation.
 */
function createForecastDescription(

    expectedArrivals:number,

    expectedDepartures:number,

    netExpectedFlow:number,

    direction:

        | "Increasing"

        | "Stable"

        | "Improving"

):string {

    if(direction === "Increasing"){

        return `Expected arrivals (${formatValue(expectedArrivals)}) exceed expected departures (${formatValue(expectedDepartures)}) by ${formatValue(netExpectedFlow)} patients during the current hourly period.`;

    }


    if(direction === "Improving"){

        return `Expected departures (${formatValue(expectedDepartures)}) exceed expected arrivals (${formatValue(expectedArrivals)}) by ${formatValue(Math.abs(netExpectedFlow))} patients during the current hourly period.`;

    }


    return `Expected arrivals and departures are balanced at ${formatValue(expectedArrivals)} patients during the current hourly period.`;

}


/**
 * Normalize a historical expectation.
 *
 * Historical values may contain decimals.
 */
function normalizeHistoricalValue(

    value:number

):number {

    if(

        !Number.isFinite(

            value

        )

        ||

        value < 0

    ){

        return 0;

    }


    return value;

}


/**
 * Keep a score between 0 and 100.
 */
function clampScore(

    value:number

):number {

    if(!Number.isFinite(value)){

        return 0;

    }


    return Math.min(

        100,

        Math.max(

            0,

            value

        )

    );

}


/**
 * Round a score to one decimal place.
 */
function roundScore(

    value:number

):number {

    return Math.round(

        value * 10

    ) / 10;

}


/**
 * Round a flow value to two decimal places.
 */
function roundValue(

    value:number

):number {

    return Math.round(

        value * 100

    ) / 100;

}


/**
 * Format a historical value for text.
 */
function formatValue(

    value:number

):string {

    if(Number.isInteger(value)){

        return String(

            value

        );

    }


    return value

        .toFixed(

            2

        )

        .replace(

            /\.?0+$/,

            ""

        );

}