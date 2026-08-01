/**
 * OperationalPillarDetail
 *
 * Provides the explanation behind one
 * operational pillar score.
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
     * Baseline, expected, or threshold value
     * used for comparison.
     */
    comparisonValue:number | null;


    /**
     * Difference between current and comparison
     * values when available.
     */
    difference:number | null;


    /**
     * Normalized factor severity from 0–100.
     */
    severity:number;


    /**
     * Human-readable explanation.
     */
    explanation:string;

}


export interface OperationalPillarDetail {

    /**
     * Machine-readable pillar identifier.
     */
    id:

        | "operationalDemand"

        | "clinicalComplexity"

        | "hospitalThroughput"

        | "operationalMomentum";


    /**
     * User-facing pillar title.
     */
    title:string;


    /**
     * Final normalized pillar score.
     *
     * Null is permitted when the pillar cannot
     * be calculated due to insufficient data.
     */
    score:number | null;


    /**
     * Summary of the pillar's current meaning.
     */
    summary:string;


    /**
     * Factors contributing to the pillar.
     */
    factors:OperationalPillarFactor[];

}