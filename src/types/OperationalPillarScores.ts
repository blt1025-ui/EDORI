/**
 * OperationalPillarScores
 *
 * EDORI 2.0 organizes operational strain into
 * four explainable pillars.
 *
 * Every pillar score is normalized from
 * 0 through 100.
 */

export interface OperationalPillarScores {

    /**
     * Current emergency department workload,
     * occupancy, and boarding burden.
     */
    operationalDemand:number;


    /**
     * Intensity and acuity of the current
     * patient population.
     */
    clinicalComplexity:number;


    /**
     * Hospital capacity and patient-flow
     * constraints affecting the ED.
     */
    hospitalThroughput:number;


    /**
     * Direction and rate of operational change.
     *
     * May be unavailable when insufficient
     * snapshot history exists.
     */
    operationalMomentum:number | null;

}