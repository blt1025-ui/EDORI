/**
 * EDORI scoring-domain weights.
 *
 * Staffing is intentionally excluded from
 * the EDORI scoring model.
 *
 * Active domains:
 *
 * - ED demand
 * - Boarding
 * - Hospital capacity
 * - Patient acuity
 * - Near-term forecast
 */

export const WEIGHTS = {

    demand:0.20,

    boarding:0.25,

    hospital:0.20,

    acuity:0.15,

    forecast:0.20

} as const;


/**
 * Sum of all active EDORI weights.
 */
export const TOTAL_WEIGHT =

    WEIGHTS.demand

    +

    WEIGHTS.boarding

    +

    WEIGHTS.hospital

    +

    WEIGHTS.acuity

    +

    WEIGHTS.forecast;


/**
 * Determine whether the configured weights
 * total exactly 1.00 within floating-point
 * tolerance.
 */
export function areWeightsValid():boolean {

    return Math.abs(

        TOTAL_WEIGHT - 1

    ) < 0.000001;

}