/**
 * EDORI operational thresholds.
 * These determine the displayed status and color
 * for a given EDORI score.
 */

export interface Threshold {

    min: number;
    max: number;

    status:
        | "Normal Operations"
        | "Elevated Awareness"
        | "Capacity Strain"
        | "High Surge"
        | "Severe Surge"
        | "Critical Operations";

    color: string;

    bannerClass: string;

}

export const THRESHOLDS: Threshold[] = [

    {
        min: 0,
        max: 24,
        status: "Normal Operations",
        color: "#2E7D32",
        bannerClass: "status-green"
    },

    {
        min: 25,
        max: 39,
        status: "Elevated Awareness",
        color: "#7CB342",
        bannerClass: "status-lime"
    },

    {
        min: 40,
        max: 54,
        status: "Capacity Strain",
        color: "#F9A825",
        bannerClass: "status-yellow"
    },

    {
        min: 55,
        max: 69,
        status: "High Surge",
        color: "#EF6C00",
        bannerClass: "status-orange"
    },

    {
        min: 70,
        max: 84,
        status: "Severe Surge",
        color: "#D84315",
        bannerClass: "status-dark-orange"
    },

    {
        min: 85,
        max: 100,
        status: "Critical Operations",
        color: "#C62828",
        bannerClass: "status-red"
    }

];


/**
 * Returns the threshold information
 * for a given EDORI score.
 */
export function getThreshold(score: number): Threshold {

    for (const threshold of THRESHOLDS) {

        if (
            score >= threshold.min &&
            score <= threshold.max
        ) {
            return threshold;
        }

    }

    return THRESHOLDS[0];

}