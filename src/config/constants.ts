/**
 * Hospital constants used throughout the application.
 *
 * These values describe stable hospital reference
 * characteristics rather than operational capacity
 * values that may change from assessment to assessment.
 */

export const HOSPITAL = {

    /**
     * Total licensed hospital beds.
     */
    TOTAL_BEDS:
        308,

    /**
     * Approximate annual Emergency Department volume.
     */
    ANNUAL_ED_VISITS:
        70000

} as const;


/**
 * Default operating assumptions.
 *
 * These values are retained for built-in model
 * defaults and calibration support.
 */
export const BASELINE = {

    /**
     * Typical ED boarding baseline.
     */
    BOARDERS:
        35,

    /**
     * Maximum Hospital Readiness score.
     */
    MAX_SCORE:
        100,

    /**
     * Minimum Hospital Readiness score.
     */
    MIN_SCORE:
        0

} as const;