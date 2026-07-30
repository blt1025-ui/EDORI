import type { Driver } from "./Driver";

/**
 * Result returned by the EDORI calculation engine.
 */
export interface EdoriResult {

    /**
     * Overall EDORI score (0-100)
     */
    score: number;

    /**
     * Operational status.
     */
    status:
        | "Normal Operations"
        | "Elevated Awareness"
        | "Capacity Strain"
        | "High Surge"
        | "Severe Surge"
        | "Critical Operations";

    /**
     * Individual domain scores.
     */
    demandScore: number;
    boardingScore: number;
    hospitalScore: number;
    capacityScore: number;
    acuityScore: number;
    forecastScore: number;

    /**
     * Major contributors to the score.
     */
    drivers: Driver[];

    /**
     * Recommended operational actions.
     */
    recommendations: string[];

    /**
     * Time the score was calculated.
     */
    timestamp: Date;

}