/**
 * Hospital constants used throughout the EDORI application.
 * These values describe the physical hospital and should only
 * change if the hospital configuration changes.
 */

export const HOSPITAL = {

    /**
     * Licensed ED treatment spaces.
     */
    ED_BEDS: 63,

    /**
     * Total licensed hospital beds.
     */
    TOTAL_BEDS: 308,

    /**
     * Medical/Surgical beds used for occupancy calculations.
     */
    MEDICAL_BEDS: 273,

    /**
     * Approximate annual ED volume.
     */
    ANNUAL_ED_VISITS: 70000

} as const;


/**
 * Default operating assumptions.
 * These are used for calibration and can be adjusted later if
 * historical data supports different baseline values.
 */
export const BASELINE = {

    /**
     * Typical boarded patients.
     */
    BOARDERS: 35,

    /**
     * Maximum EDORI score.
     */
    MAX_SCORE: 100,

    /**
     * Minimum EDORI score.
     */
    MIN_SCORE: 0

} as const;