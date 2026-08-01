/**
 * OperationalRecommendation
 *
 * One prioritized operational action generated
 * from state, drivers, or active triggers.
 */

export type OperationalRecommendationPriority =

    | "Routine"

    | "Moderate"

    | "High"

    | "Immediate";


export interface OperationalRecommendation {

    /**
     * Unique recommendation identifier.
     */
    id:string;


    /**
     * User-facing action title.
     */
    title:string;


    /**
     * More detailed operational instruction.
     */
    description:string;


    /**
     * Recommendation urgency.
     */
    priority:OperationalRecommendationPriority;


    /**
     * Why this action is being recommended.
     */
    rationale:string;


    /**
     * Trigger or driver IDs that produced the
     * recommendation.
     */
    sourceIds:string[];


    /**
     * Suggested responsible team or role.
     *
     * Examples:
     *
     * - ED Leadership
     * - Bed Management
     * - Hospital Operations
     * - Nursing Supervisor
     */
    responsibleGroup:string | null;


    /**
     * Suggested reassessment period after the
     * intervention is initiated.
     */
    reassessmentMinutes:number | null;

}