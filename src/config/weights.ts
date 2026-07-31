/**
 * EDORI domain weights
 *
 * Staffing is intentionally excluded from the
 * EDORI calculation.
 *
 * All active weights must total 1.00.
 */

export const WEIGHTS = {

    /**
     * Current ED volume compared with the
     * expected volume for the weekday and hour.
     */
    demand:0.20,


    /**
     * Current boarding compared with expected
     * boarding for the weekday and hour.
     */
    boarding:0.25,


    /**
     * Medical-bed occupancy within the hospital.
     */
    hospital:0.20,


    /**
     * Weighted ESI acuity distribution.
     */
    acuity:0.15,


    /**
     * Expected near-term operational conditions.
     */
    forecast:0.20

} as const;


/**
 * Development safeguard.
 */
const TOTAL_WEIGHT =

    WEIGHTS.demand

    +

    WEIGHTS.boarding

    +

    WEIGHTS.hospital

    +

    WEIGHTS.acuity

    +

    WEIGHTS.forecast;


if(

    Math.abs(

        TOTAL_WEIGHT - 1

    ) > 0.0001

){

    console.warn(

        `EDORI weights total ${TOTAL_WEIGHT}, but should total 1.00.`

    );

}