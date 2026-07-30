/**
 * Represents one operational factor that is
 * contributing to the current EDORI score.
 */
export interface Driver {

    /**
     * Short title displayed on the dashboard.
     * Example: "Boarding"
     */
    title: string;

    /**
     * Human-readable explanation.
     */
    description: string;

    /**
     * Severity (0-100)
     */
    severity: number;

    /**
     * Current observed value.
     */
    currentValue: number;

    /**
     * Historical expected value.
     */
    expectedValue: number;

}