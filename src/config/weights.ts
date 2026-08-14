/**
 * Hospital Readiness scoring-domain weights.
 *
 * Version 2
 *
 * Overall Hospital Readiness:
 *
 * 35% Emergency Department Operational Pressure
 * 20% Acute-Care Capacity
 * 15% Critical-Care Capacity
 * 15% Hospital Inflow
 * 15% Projected Capacity
 */

export const WEIGHTS = {

    edPressure:
        0.35,

    acuteCapacity:
        0.20,

    criticalCapacity:
        0.15,

    inflow:
        0.15,

    projectedCapacity:
        0.15

} as const;


/**
 * ED Operational Pressure is itself composed of:
 *
 * 30% ED census pressure
 * 50% ED boarding pressure
 * 20% high-acuity pressure
 */
export const ED_PRESSURE_WEIGHTS = {

    volume:
        0.30,

    boarding:
        0.50,

    acuity:
        0.20

} as const;


/**
 * Sum of all Hospital Readiness domain weights.
 */
export const TOTAL_WEIGHT =

    WEIGHTS.edPressure

    +

    WEIGHTS.acuteCapacity

    +

    WEIGHTS.criticalCapacity

    +

    WEIGHTS.inflow

    +

    WEIGHTS.projectedCapacity;


/**
 * Sum of all ED Operational Pressure
 * subdomain weights.
 */
export const TOTAL_ED_PRESSURE_WEIGHT =

    ED_PRESSURE_WEIGHTS.volume

    +

    ED_PRESSURE_WEIGHTS.boarding

    +

    ED_PRESSURE_WEIGHTS.acuity;


/**
 * Determine whether all configured weights
 * total exactly 1.00 within floating-point
 * tolerance.
 */
export function areWeightsValid():boolean {

    return (

        Math.abs(

            TOTAL_WEIGHT - 1

        ) < 0.000001

        &&

        Math.abs(

            TOTAL_ED_PRESSURE_WEIGHT - 1

        ) < 0.000001

    );

}