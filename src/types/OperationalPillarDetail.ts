/**
 * OperationalPillarDetail
 *
 * Version 2 Hospital Readiness Model
 *
 * Provides the explanation behind each authoritative
 * Hospital Readiness domain and the separate
 * Operational Momentum trend measure.
 */


/**
 * One measurable factor contributing to a Hospital
 * Readiness domain or momentum assessment.
 */
export interface OperationalPillarFactor {

    /**
     * Unique factor identifier.
     */
    id:string;


    /**
     * Readable factor name.
     */
    label:string;


    /**
     * Current measured value.
     */
    currentValue:number;


    /**
     * Baseline, expected, or threshold value used for
     * comparison.
     *
     * Null is permitted when no meaningful comparison
     * value exists.
     */
    comparisonValue:number | null;


    /**
     * Difference between current and comparison values
     * when available.
     */
    difference:number | null;


    /**
     * Normalized factor severity from 0 through 100.
     */
    severity:number;


    /**
     * Human-readable explanation.
     */
    explanation:string;

}


/**
 * One Hospital Readiness domain explanation.
 */
export interface OperationalPillarDetail {

    /**
     * Machine-readable domain identifier.
     */
    id:

        | "edOperationalPressure"

        | "acuteCareCapacity"

        | "criticalCareCapacity"

        | "hospitalInflow"

        | "projectedCapacity"

        | "operationalMomentum";


    /**
     * User-facing domain title.
     */
    title:string;


    /**
     * Final normalized domain score.
     *
     * Operational Momentum may be null when there is
     * insufficient historical assessment data.
     */
    score:number | null;


    /**
     * Summary of the domain's current meaning.
     */
    summary:string;


    /**
     * Factors contributing to the domain.
     */
    factors:OperationalPillarFactor[];

}