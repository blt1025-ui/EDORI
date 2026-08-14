/**
 * ForecastService
 *
 * Version 2 Hospital Readiness Model
 *
 * Pure four-hour hospital-capacity forecast.
 *
 * The forecast estimates acute-care bed availability
 * at the end of the current four-hour assessment
 * horizon.
 *
 * Forecast logic:
 *
 * currentAvailableBeds
 * =
 * staffedAcuteCareBeds
 * -
 * occupiedAcuteCareBeds
 *
 *
 * historicalNetFlow
 * =
 * expectedHospitalInflow4h
 * -
 * expectedInpatientDepartures4h
 *
 *
 * currentKnownHospitalInflow
 * =
 * currentEDAdmissions
 * +
 * currentDirectAdmissions
 * +
 * currentSurgicalAdmissions
 *
 *
 * projectedHospitalInflow
 * =
 * max(
 *     currentKnownHospitalInflow,
 *     expectedHospitalInflow4h
 * )
 *
 *
 * projectedAvailableBeds
 * =
 * currentAvailableBeds
 * +
 * expectedInpatientDepartures4h
 * -
 * projectedHospitalInflow
 *
 *
 * Negative projectedAvailableBeds values are
 * intentionally preserved.
 *
 * This service does not:
 *
 * - Read application state
 * - Save results
 * - Emit events
 * - Access localStorage
 * - Modify SituationAssessment
 */

import type {

    SituationAssessment

}

from "../types/SituationAssessment";


/**
 * Four-hour Hospital Readiness forecast.
 */
export interface ForecastResult {

    /**
     * Current staffed acute-care beds not occupied.
     */
    currentAvailableBeds:number;


    /**
     * Historical four-hour hospital inflow.
     */
    expectedHospitalInflow:number;


    /**
     * Historical four-hour inpatient departures.
     */
    expectedInpatientDepartures:number;


    /**
     * Historical expected net hospital flow:
     *
     * expected inflow - expected departures
     *
     * Positive values indicate expected net demand
     * for additional beds.
     *
     * Negative values indicate expected net release
     * of inpatient capacity.
     */
    historicalNetFlow:number;


    /**
     * Current known hospital inflow:
     *
     * ED admissions
     * +
     * direct admissions
     * +
     * surgical/procedural admissions.
     */
    currentKnownHospitalInflow:number;


    /**
     * Difference between currently known inflow
     * and historical expected inflow.
     *
     * Positive values mean current known inflow
     * exceeds the historical norm.
     */
    inflowVariance:number;


    /**
     * Hospital inflow used in the capacity forecast.
     *
     * This is the greater of:
     *
     * - current known hospital inflow
     * - historical expected four-hour hospital inflow
     */
    projectedHospitalInflow:number;


    /**
     * Projected staffed acute-care beds available
     * at the end of the four-hour forecast period.
     *
     * Negative values are valid and represent
     * projected demand beyond staffed capacity.
     */
    projectedAvailableBeds:number;


    /**
     * Forecast direction.
     */
    direction:

        | "Improving"

        | "Stable"

        | "Tightening"

        | "Deficit";


    /**
     * Human-readable forecast explanation.
     */
    description:string;

}


/**
 * Calculate the four-hour hospital-capacity forecast.
 */
export function calculateForecast(

    assessment:SituationAssessment

):ForecastResult {

    /*
     * Current acute-care capacity.
     */

    const staffedAcuteCareBeds =

        normalizeHistoricalValue(

            assessment.staffedAcuteCareBeds

        );


    const occupiedAcuteCareBeds =

        normalizeHistoricalValue(

            assessment.occupiedAcuteCareBeds

        );


    const currentAvailableBeds =

        roundValue(

            staffedAcuteCareBeds

            -

            occupiedAcuteCareBeds

        );


    /*
     * Historical four-hour flow.
     */

    const expectedHospitalInflow =

        normalizeHistoricalValue(

            assessment.expectedHospitalInflow4h

        );


    const expectedInpatientDepartures =

        normalizeHistoricalValue(

            assessment.expectedInpatientDepartures4h

        );


    const historicalNetFlow =

        roundValue(

            expectedHospitalInflow

            -

            expectedInpatientDepartures

        );


    /*
     * Current known hospital inflow.
     */

    const currentKnownHospitalInflow =

        roundValue(

            normalizeHistoricalValue(

                assessment.currentEDAdmissions

            )

            +

            normalizeHistoricalValue(

                assessment.currentDirectAdmissions

            )

            +

            normalizeHistoricalValue(

                assessment.currentSurgicalAdmissions

            )

        );


    /*
     * Compare current known inflow with historical
     * expected inflow.
     */

    const inflowVariance =

        roundValue(

            currentKnownHospitalInflow

            -

            expectedHospitalInflow

        );


    /*
     * Never assume future inflow will be lower than
     * the historical expectation solely because fewer
     * admissions are currently known.
     *
     * If current known inflow exceeds the historical
     * four-hour expectation, use the known value.
     *
     * Otherwise retain the historical expectation.
     */

    const projectedHospitalInflow =

        roundValue(

            Math.max(

                currentKnownHospitalInflow,

                expectedHospitalInflow

            )

        );


    /*
     * Four-hour acute-care bed projection.
     *
     * Negative values are intentionally preserved.
     */

    const projectedAvailableBeds =

        roundValue(

            currentAvailableBeds

            +

            expectedInpatientDepartures

            -

            projectedHospitalInflow

        );


    const direction =

        getForecastDirection(

            currentAvailableBeds,

            projectedAvailableBeds

        );


    return {

        currentAvailableBeds,

        expectedHospitalInflow,

        expectedInpatientDepartures,

        historicalNetFlow,

        currentKnownHospitalInflow,

        inflowVariance,

        projectedHospitalInflow,

        projectedAvailableBeds,

        direction,

        description:
            createForecastDescription(

                currentAvailableBeds,

                expectedHospitalInflow,

                expectedInpatientDepartures,

                currentKnownHospitalInflow,

                projectedHospitalInflow,

                projectedAvailableBeds,

                direction

            )

    };

}


/**
 * Determine the overall four-hour capacity direction.
 */
function getForecastDirection(

    currentAvailableBeds:number,

    projectedAvailableBeds:number

):

    | "Improving"

    | "Stable"

    | "Tightening"

    | "Deficit" {

    /*
     * A negative projected bed count means projected
     * demand exceeds staffed acute-care capacity.
     */

    if(projectedAvailableBeds < 0){

        return "Deficit";

    }


    const change =

        projectedAvailableBeds

        -

        currentAvailableBeds;


    /*
     * A meaningful increase in available beds.
     */

    if(change >= 2){

        return "Improving";

    }


    /*
     * A meaningful decrease in available beds.
     */

    if(change <= -2){

        return "Tightening";

    }


    return "Stable";

}


/**
 * Create a human-readable four-hour forecast.
 */
function createForecastDescription(

    currentAvailableBeds:number,

    expectedHospitalInflow:number,

    expectedInpatientDepartures:number,

    currentKnownHospitalInflow:number,

    projectedHospitalInflow:number,

    projectedAvailableBeds:number,

    direction:

        | "Improving"

        | "Stable"

        | "Tightening"

        | "Deficit"

):string {

    if(direction === "Deficit"){

        return [

            `Current acute-care availability is ${formatValue(currentAvailableBeds)} beds.`,

            `Historical four-hour inflow is ${formatValue(expectedHospitalInflow)} patients and historical inpatient departures are ${formatValue(expectedInpatientDepartures)}.`,

            `Current known hospital inflow is ${formatValue(currentKnownHospitalInflow)} patients.`,

            `The forecast therefore uses ${formatValue(projectedHospitalInflow)} projected admissions.`,

            `Projected acute-care availability is ${formatValue(projectedAvailableBeds)} beds, representing a projected capacity deficit of ${formatValue(Math.abs(projectedAvailableBeds))} beds.`

        ].join(

            " "

        );

    }


    if(direction === "Tightening"){

        return [

            `Current acute-care availability is ${formatValue(currentAvailableBeds)} beds.`,

            `Historical four-hour inflow is ${formatValue(expectedHospitalInflow)} patients and historical inpatient departures are ${formatValue(expectedInpatientDepartures)}.`,

            `The forecast uses ${formatValue(projectedHospitalInflow)} projected admissions.`,

            `Acute-care availability is expected to decrease to ${formatValue(projectedAvailableBeds)} beds during the next four hours.`

        ].join(

            " "

        );

    }


    if(direction === "Improving"){

        return [

            `Current acute-care availability is ${formatValue(currentAvailableBeds)} beds.`,

            `Historical four-hour inflow is ${formatValue(expectedHospitalInflow)} patients and historical inpatient departures are ${formatValue(expectedInpatientDepartures)}.`,

            `The forecast uses ${formatValue(projectedHospitalInflow)} projected admissions.`,

            `Acute-care availability is expected to improve to ${formatValue(projectedAvailableBeds)} beds during the next four hours.`

        ].join(

            " "

        );

    }


    return [

        `Current acute-care availability is ${formatValue(currentAvailableBeds)} beds.`,

        `Historical four-hour inflow is ${formatValue(expectedHospitalInflow)} patients and historical inpatient departures are ${formatValue(expectedInpatientDepartures)}.`,

        `The forecast uses ${formatValue(projectedHospitalInflow)} projected admissions.`,

        `Acute-care availability is expected to remain relatively stable at approximately ${formatValue(projectedAvailableBeds)} beds during the next four hours.`

    ].join(

        " "

    );

}


/**
 * Normalize a nonnegative operational or
 * historical value.
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
 * Round operational values to two decimal places.
 */
function roundValue(

    value:number

):number {

    return Math.round(

        value * 100

    ) / 100;

}


/**
 * Format a value for human-readable text.
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