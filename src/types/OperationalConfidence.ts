/**
 * OperationalConfidence
 *
 * Describes the amount and quality of
 * information supporting an operational
 * assessment.
 *
 * This is not yet a statistical confidence
 * estimate.
 */

export type OperationalConfidence =

    | "High"

    | "Moderate"

    | "Low"

    | "Insufficient Data";