/**
 * Operational Trigger Configuration
 *
 * Version 2 Hospital Readiness Model
 *
 * Initial hospital-wide operational trigger
 * library.
 *
 * Operational level hierarchy:
 *
 * Alpha   -> Lowest
 * Bravo
 * Charlie
 * Delta
 * Echo    -> Highest
 *
 * IMPORTANT:
 *
 * These thresholds are configurable design
 * defaults and have not yet been clinically
 * validated.
 */

import type {

    OperationalTrigger

}

from "../types/OperationalTrigger";


export const OPERATIONAL_TRIGGERS:

OperationalTrigger[] = [

    /*
     * =====================================================
     * ED OPERATIONAL PRESSURE
     * =====================================================
     */

    {

        id:
            "ed-treatment-capacity-exceeded",

        title:
            "ED Treatment Capacity Exceeded",

        description:
            "Total emergency department census exceeds the configured 63-bed treatment capacity.",

        enabled:
            true,

        category:
            "ED Operational Pressure",

        priority:
            "Moderate",

        conditions:[

            {

                metric:
                    "totalEDVolume",

                operator:
                    "greaterThan",

                threshold:
                    63

            }

        ],

        minimumOperationalState:
            "Bravo",

        reassessmentMinutes:
            60,

        interventionIds:[

            "review-ed-capacity",

            "evaluate-overflow-space"

        ],

        rationale:
            "Census above physical ED treatment capacity reduces operational reserve and may increase reliance on nontraditional care spaces."

    },


    {

        id:
            "high-ed-occupancy",

        title:
            "High ED Occupancy",

        description:
            "Emergency department census is at least 120% of configured treatment-bed capacity.",

        enabled:
            true,

        category:
            "ED Operational Pressure",

        priority:
            "High",

        conditions:[

            {

                metric:
                    "edOccupancyPercent",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    120

            }

        ],

        minimumOperationalState:
            "Charlie",

        reassessmentMinutes:
            30,

        interventionIds:[

            "evaluate-overflow-space",

            "review-ed-flow",

            "notify-ed-leadership"

        ],

        rationale:
            "Census substantially above ED treatment capacity indicates crowding and reduced ability to absorb additional emergency demand."

    },


    {

        id:
            "ed-volume-above-expected",

        title:
            "ED Volume Significantly Above Expected",

        description:
            "Current ED census is at least 15 patients above the historical weekday and hour expectation.",

        enabled:
            true,

        category:
            "ED Operational Pressure",

        priority:
            "Moderate",

        conditions:[

            {

                metric:
                    "volumeAboveExpected",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    15

            }

        ],

        minimumOperationalState:
            "Charlie",

        reassessmentMinutes:
            60,

        interventionIds:[

            "review-ed-flow",

            "evaluate-overflow-space"

        ],

        rationale:
            "Historical comparison identifies ED demand that is unusually high for the current weekday and hour."

    },


    {

        id:
            "significant-boarding",

        title:
            "Significant ED Boarding",

        description:
            "At least 30 admitted patients are boarding in the emergency department.",

        enabled:
            true,

        category:
            "ED Operational Pressure",

        priority:
            "Moderate",

        conditions:[

            {

                metric:
                    "boardedPatients",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    30

            }

        ],

        minimumOperationalState:
            "Bravo",

        reassessmentMinutes:
            60,

        interventionIds:[

            "notify-bed-management",

            "review-boarding-barriers"

        ],

        rationale:
            "A large ED boarding population reduces functional emergency treatment capacity and reflects hospital throughput pressure."

    },


    {

        id:
            "boarding-crisis",

        title:
            "Severe ED Boarding",

        description:
            "At least 40 admitted patients are boarding in the emergency department.",

        enabled:
            true,

        category:
            "ED Operational Pressure",

        priority:
            "Critical",

        conditions:[

            {

                metric:
                    "boardedPatients",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    40

            }

        ],

        minimumOperationalState:
            "Delta",

        reassessmentMinutes:
            30,

        interventionIds:[

            "activate-hospital-surge",

            "notify-bed-management",

            "escalate-inpatient-throughput",

            "notify-hospital-operations"

        ],

        rationale:
            "Boarding at this level consumes a substantial portion of ED capacity and warrants coordinated hospital intervention."

    },


    {

        id:
            "boarding-above-expectation",

        title:
            "Boarding Significantly Above Expected",

        description:
            "ED boarding is at least 10 patients above the historical weekday and hour expectation.",

        enabled:
            true,

        category:
            "ED Operational Pressure",

        priority:
            "High",

        conditions:[

            {

                metric:
                    "boardingAboveExpected",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    10

            }

        ],

        minimumOperationalState:
            "Charlie",

        reassessmentMinutes:
            30,

        interventionIds:[

            "review-boarding-barriers",

            "escalate-inpatient-throughput"

        ],

        rationale:
            "Historical normalization distinguishes expected baseline boarding from an unusually high boarding burden."

    },


    {

        id:
            "boarders-majority-of-census",

        title:
            "Boarders Occupy Majority of ED Census",

        description:
            "Boarding patients represent at least 50% of total emergency department census.",

        enabled:
            true,

        category:
            "ED Operational Pressure",

        priority:
            "High",

        conditions:[

            {

                metric:
                    "boardingPercentOfVolume",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    50

            }

        ],

        minimumOperationalState:
            "Charlie",

        reassessmentMinutes:
            30,

        interventionIds:[

            "notify-bed-management",

            "review-boarding-barriers",

            "escalate-inpatient-throughput"

        ],

        rationale:
            "When admitted boarders comprise most of the ED census, emergency treatment capacity is substantially impaired."

    },


    {

        id:
            "high-acuity-burden",

        title:
            "High-Acuity ED Burden",

        description:
            "At least 30% of the current ED census consists of ESI 1 or ESI 2 patients.",

        enabled:
            true,

        category:
            "ED Operational Pressure",

        priority:
            "High",

        conditions:[

            {

                metric:
                    "highAcuityPercent",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    30

            }

        ],

        minimumOperationalState:
            null,

        reassessmentMinutes:
            60,

        interventionIds:[

            "review-clinical-assignments",

            "notify-ed-leadership"

        ],

        rationale:
            "A high proportion of ESI 1 and ESI 2 patients increases clinical workload and reduces ED operational reserve."

    },


    /*
     * =====================================================
     * ACUTE-CARE CAPACITY
     * =====================================================
     */

    {

        id:
            "acute-care-near-capacity",

        title:
            "Acute-Care Capacity Constrained",

        description:
            "Staffed acute-care occupancy is at least 95%.",

        enabled:
            true,

        category:
            "Acute-Care Capacity",

        priority:
            "High",

        conditions:[

            {

                metric:
                    "acuteCareOccupancyPercent",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    95

            }

        ],

        minimumOperationalState:
            "Charlie",

        reassessmentMinutes:
            60,

        interventionIds:[

            "review-pending-discharges",

            "notify-bed-management"

        ],

        rationale:
            "Very high staffed acute-care occupancy leaves limited reserve for new inpatient demand."

    },


    {

        id:
            "acute-care-no-available-beds",

        title:
            "No Available Acute-Care Beds",

        description:
            "No currently staffed acute-care beds remain available.",

        enabled:
            true,

        category:
            "Acute-Care Capacity",

        priority:
            "Critical",

        conditions:[

            {

                metric:
                    "availableAcuteCareBeds",

                operator:
                    "lessThanOrEqual",

                threshold:
                    0

            }

        ],

        minimumOperationalState:
            "Delta",

        reassessmentMinutes:
            30,

        interventionIds:[

            "activate-hospital-surge",

            "notify-bed-management",

            "escalate-inpatient-throughput",

            "notify-hospital-operations"

        ],

        rationale:
            "Absence of currently available staffed acute-care beds substantially limits the hospital's ability to absorb new admissions."

    },


    /*
     * =====================================================
     * CRITICAL-CARE CAPACITY
     * =====================================================
     */

    {

        id:
            "critical-care-near-capacity",

        title:
            "Critical-Care Capacity Constrained",

        description:
            "Staffed critical-care occupancy is at least 90%.",

        enabled:
            true,

        category:
            "Critical-Care Capacity",

        priority:
            "High",

        conditions:[

            {

                metric:
                    "criticalCareOccupancyPercent",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    90

            }

        ],

        minimumOperationalState:
            "Charlie",

        reassessmentMinutes:
            30,

        interventionIds:[

            "notify-bed-management",

            "notify-hospital-operations"

        ],

        rationale:
            "Limited staffed critical-care reserve may constrain placement of high-acuity patients and downstream hospital flow."

    },


    {

        id:
            "critical-care-no-available-beds",

        title:
            "No Available Critical-Care Beds",

        description:
            "No currently staffed critical-care beds remain available.",

        enabled:
            true,

        category:
            "Critical-Care Capacity",

        priority:
            "Critical",

        conditions:[

            {

                metric:
                    "availableCriticalCareBeds",

                operator:
                    "lessThanOrEqual",

                threshold:
                    0

            }

        ],

        minimumOperationalState:
            "Delta",

        reassessmentMinutes:
            30,

        interventionIds:[

            "notify-bed-management",

            "notify-hospital-operations",

            "activate-hospital-surge"

        ],

        rationale:
            "Loss of all staffed critical-care reserve creates an immediate hospital-wide capacity constraint."

    },


    /*
     * =====================================================
     * HOSPITAL FLOW
     * =====================================================
     */

    {

        id:
            "hospital-inflow-above-expected",

        title:
            "Hospital Inflow Above Historical Expectation",

        description:
            "Known hospital inflow is at least five patients above the historical four-hour expectation.",

        enabled:
            true,

        category:
            "Hospital Flow",

        priority:
            "Moderate",

        conditions:[

            {

                metric:
                    "hospitalInflowAboveExpected",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    5

            }

        ],

        minimumOperationalState:
            null,

        reassessmentMinutes:
            60,

        interventionIds:[

            "notify-bed-management",

            "prepare-for-demand-growth"

        ],

        rationale:
            "Known ED, direct, and surgical/procedural admissions above historical expectation may consume inpatient capacity faster than normally anticipated."

    },


    {

        id:
            "hospital-inflow-substantially-above-expected",

        title:
            "Hospital Inflow Substantially Above Expected",

        description:
            "Known hospital inflow is at least 150% of the historical four-hour expectation.",

        enabled:
            true,

        category:
            "Hospital Flow",

        priority:
            "High",

        conditions:[

            {

                metric:
                    "hospitalInflowPercentOfExpected",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    150

            }

        ],

        minimumOperationalState:
            "Charlie",

        reassessmentMinutes:
            30,

        interventionIds:[

            "notify-bed-management",

            "prepare-for-demand-growth",

            "notify-hospital-operations"

        ],

        rationale:
            "Hospital inflow substantially above historical norms may rapidly consume available inpatient capacity."

    },


    /*
     * =====================================================
     * PROJECTED CAPACITY
     * =====================================================
     */

    {

        id:
            "projected-acute-capacity-low",

        title:
            "Projected Acute-Care Capacity Low",

        description:
            "The four-hour forecast projects five or fewer staffed acute-care beds remaining available.",

        enabled:
            true,

        category:
            "Projected Capacity",

        priority:
            "High",

        conditions:[

            {

                metric:
                    "projectedAvailableAcuteCareBeds",

                operator:
                    "lessThanOrEqual",

                threshold:
                    5

            }

        ],

        minimumOperationalState:
            "Charlie",

        reassessmentMinutes:
            30,

        interventionIds:[

            "review-pending-discharges",

            "notify-bed-management",

            "prepare-for-demand-growth"

        ],

        rationale:
            "Very limited projected acute-care reserve indicates that expected hospital flow may soon create a capacity constraint."

    },


    {

        id:
            "projected-acute-capacity-exhausted",

        title:
            "Projected Acute-Care Capacity Exhausted",

        description:
            "The four-hour forecast projects no staffed acute-care beds remaining available.",

        enabled:
            true,

        category:
            "Projected Capacity",

        priority:
            "Critical",

        conditions:[

            {

                metric:
                    "projectedAvailableAcuteCareBeds",

                operator:
                    "equal",

                threshold:
                    0

            }

        ],

        minimumOperationalState:
            "Delta",

        reassessmentMinutes:
            30,

        interventionIds:[

            "activate-hospital-surge",

            "notify-bed-management",

            "escalate-inpatient-throughput",

            "notify-hospital-operations"

        ],

        rationale:
            "The four-hour forecast indicates that expected demand will consume all currently available staffed acute-care capacity."

    },


    {

        id:
            "projected-acute-capacity-deficit",

        title:
            "Projected Acute-Care Capacity Deficit",

        description:
            "The four-hour forecast projects hospital demand exceeding staffed acute-care capacity.",

        enabled:
            true,

        category:
            "Projected Capacity",

        priority:
            "Critical",

        conditions:[

            {

                metric:
                    "projectedAvailableAcuteCareBeds",

                operator:
                    "lessThan",

                threshold:
                    0

            }

        ],

        minimumOperationalState:
            "Delta",

        reassessmentMinutes:
            30,

        interventionIds:[

            "activate-hospital-surge",

            "notify-bed-management",

            "escalate-inpatient-throughput",

            "notify-hospital-operations"

        ],

        rationale:
            "Negative projected bed availability indicates that expected four-hour demand exceeds staffed acute-care capacity."

    },


    {

        id:
            "severe-projected-acute-capacity-deficit",

        title:
            "Severe Projected Acute-Care Capacity Deficit",

        description:
            "The four-hour forecast projects demand exceeding staffed acute-care capacity by at least 10 beds.",

        enabled:
            true,

        category:
            "Projected Capacity",

        priority:
            "Critical",

        conditions:[

            {

                metric:
                    "projectedAvailableAcuteCareBeds",

                operator:
                    "lessThanOrEqual",

                threshold:
                    -10

            }

        ],

        minimumOperationalState:
            "Echo",

        reassessmentMinutes:
            30,

        interventionIds:[

            "activate-hospital-surge",

            "notify-bed-management",

            "escalate-inpatient-throughput",

            "notify-hospital-operations"

        ],

        rationale:
            "A projected deficit of at least 10 staffed acute-care beds represents severe near-term capacity risk."

    },


    /*
     * =====================================================
     * OPERATIONAL MOMENTUM
     * =====================================================
     */

    {

        id:
            "consecutive-score-increases",

        title:
            "Sustained Operational Deterioration",

        description:
            "Hospital Readiness pressure has increased across at least three consecutive assessment transitions.",

        enabled:
            true,

        category:
            "Operational Momentum",

        priority:
            "High",

        conditions:[

            {

                metric:
                    "consecutiveScoreIncreases",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    3

            }

        ],

        minimumOperationalState:
            "Charlie",

        reassessmentMinutes:
            30,

        interventionIds:[

            "notify-hospital-operations",

            "increase-reassessment-frequency",

            "review-active-triggers"

        ],

        rationale:
            "Sustained deterioration may warrant escalation even before a single absolute capacity threshold becomes critical."

    },


    {

        id:
            "rapid-score-increase",

        title:
            "Rapid Hospital Readiness Deterioration",

        description:
            "The current Hospital Readiness score is at least 10 points higher than the previous stored assessment.",

        enabled:
            true,

        category:
            "Operational Momentum",

        priority:
            "High",

        conditions:[

            {

                metric:
                    "scoreChange",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    10

            }

        ],

        minimumOperationalState:
            "Charlie",

        reassessmentMinutes:
            30,

        interventionIds:[

            "notify-hospital-operations",

            "increase-reassessment-frequency",

            "review-active-triggers"

        ],

        rationale:
            "Rapid deterioration may represent an acute operational change not fully conveyed by the absolute Hospital Readiness score alone."

    }

];