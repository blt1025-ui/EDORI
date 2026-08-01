/**
 * OperationalStateTitle
 *
 * Supports the current EDORI 1.0 labels and
 * the proposed EDORI 2.0 labels during the
 * transition period.
 */

export type OperationalStateTitle =

    | "Normal Operations"

    | "Elevated Activity"

    | "Busy"

    | "Surge"

    | "Severe Surge"

    | "Elevated Awareness"

    | "Capacity Strain"

    | "High Surge"

    | "Critical Operations";