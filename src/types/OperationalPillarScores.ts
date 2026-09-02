/**
 * OperationalPillarScores
 *
 * Version 2.2 Hospital Readiness Model
 *
 * Authoritative weighted HRI domains:
 *
 * - ED Operational Pressure           45%
 * - Critical-Care Capacity            20%
 * - Projected Acute-Care Capacity     35%
 *
 * Acute-care capacity and hospital inflow are retained
 * temporarily as zero-valued compatibility properties so
 * older consumers can continue compiling while the UI and
 * persistence layers are migrated. They are not weighted HRI
 * domains in Version 2.2.
 *
 * Operational Momentum remains explanatory only and is not
 * part of the weighted Hospital Readiness score.
 */
export interface OperationalPillarScores {

    /** Authoritative HRI weight: 45%. */
    edOperationalPressure:number;

    /**
     * Deprecated compatibility property.
     * Version 2.2 HRI weight: 0%.
     */
    acuteCareCapacity:number;

    /** Authoritative HRI weight: 20%. */
    criticalCareCapacity:number;

    /**
     * Deprecated compatibility property.
     * Version 2.2 HRI weight: 0%.
     */
    hospitalInflow:number;

    /** Authoritative HRI weight: 35%. */
    projectedCapacity:number;

    /** Explanatory only; not included in HRI. */
    operationalMomentum:number | null;
}
