/**
 * Relative contribution of each EDORI domain.
 * The values should total 1.00 (100%).
 */

export const WEIGHTS = {

    /**
     * Current ED demand compared with expected demand.
     */
    demand: 0.25,

    /**
     * Boarding compared with historical expectation.
     */
    boarding: 0.20,

    /**
     * Medical bed occupancy.
     */
    hospital: 0.15,

    /**
     * RN and physician capacity relative to workload.
     */
    capacity: 0.15,

    /**
     * Overall patient acuity.
     */
    acuity: 0.15,

    /**
     * Expected near-term operational trajectory.
     */
    forecast: 0.10

} as const;