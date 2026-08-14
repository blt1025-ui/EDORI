/**
 * OperationalPillarScores
 *
 * Version 2 Hospital Readiness Model
 *
 * Exposes the five authoritative weighted Hospital
 * Readiness domains directly, plus Operational
 * Momentum as a separate non-weighted trend measure.
 *
 * Authoritative HRI domains:
 *
 * - ED Operational Pressure      35%
 * - Acute-Care Capacity          20%
 * - Critical-Care Capacity       15%
 * - Hospital Inflow              15%
 * - Projected Capacity           15%
 *
 * Operational Momentum is NOT part of the weighted
 * Hospital Readiness score.
 */

export interface OperationalPillarScores {

    /**
     * Emergency Department operational pressure.
     *
     * Authoritative HRI weight: 35%
     */
    edOperationalPressure:number;


    /**
     * Acute-care inpatient capacity pressure.
     *
     * Authoritative HRI weight: 20%
     */
    acuteCareCapacity:number;


    /**
     * Critical-care inpatient capacity pressure.
     *
     * Authoritative HRI weight: 15%
     */
    criticalCareCapacity:number;


    /**
     * Current hospital inflow pressure relative to
     * historical four-hour expectations.
     *
     * Authoritative HRI weight: 15%
     */
    hospitalInflow:number;


    /**
     * Four-hour projected acute-care capacity
     * pressure.
     *
     * Authoritative HRI weight: 15%
     */
    projectedCapacity:number;


    /**
     * Direction and rate of Hospital Readiness change
     * over time.
     *
     * This is explanatory only and is not included in
     * the weighted Hospital Readiness score.
     */
    operationalMomentum:number | null;

}