/**
 * Operational Trigger Configuration
 *
 * Initial EDORI 2.0 operational trigger library.
 *
 * These thresholds are design defaults and have
 * not yet been clinically or operationally
 * validated.
 *
 * Trigger rules are intentionally stored in
 * configuration rather than hard-coded inside
 * OperationalTriggerService.
 */

import type {

    OperationalTrigger

}

from "../types/OperationalTrigger";


export const OPERATIONAL_TRIGGERS:

OperationalTrigger[] = [

    /*
     * ED Demand
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
            "Demand",

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
            "Elevated Awareness",

        reassessmentMinutes:
            60,

        interventionIds:[

            "review-ed-capacity",

            "evaluate-overflow-space"

        ],

        rationale:
            "Census above physical treatment capacity reduces operational reserve and may increase reliance on nontraditional care spaces."

    },


    {

        id:
            "high-ed-occupancy",

        title:
            "High ED Occupancy",

        description:
            "Emergency department census is at least 120% of treatment-bed capacity.",

        enabled:
            true,

        category:
            "Demand",

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
            "Capacity Strain",

        reassessmentMinutes:
            30,

        interventionIds:[

            "evaluate-overflow-space",

            "review-ed-flow",

            "notify-ed-leadership"

        ],

        rationale:
            "Sustained census well above treatment capacity indicates substantial crowding and reduced ability to absorb new demand."

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
        "Demand",

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
        "Capacity Strain",

    reassessmentMinutes:
        60,

    interventionIds:[

        "review-ed-flow",

        "evaluate-overflow-space"

    ],

    rationale:
        "Historical comparison identifies demand that is unusually high for the selected weekday and hour."

},


    /*
     * Boarding
     */

    {

        id:
            "significant-boarding",

        title:
            "Significant Boarding",

        description:
            "At least 30 admitted patients are boarding in the emergency department.",

        enabled:
            true,

        category:
            "Boarding",

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
            "Elevated Awareness",

        reassessmentMinutes:
            60,

        interventionIds:[

            "notify-bed-management",

            "review-boarding-barriers"

        ],

        rationale:
            "Thirty boarders represent substantial loss of functional ED treatment capacity, even when this burden is frequently experienced."

    },


    {

        id:
            "boarding-crisis",

        title:
            "Boarding Crisis",

        description:
            "At least 40 admitted patients are boarding in the emergency department.",

        enabled:
            true,

        category:
            "Boarding",

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
            "High Surge",

        reassessmentMinutes:
            30,

        interventionIds:[

            "activate-hospital-surge",

            "notify-bed-management",

            "escalate-inpatient-throughput",

            "notify-hospital-operations"

        ],

        rationale:
            "Boarding at this level consumes a large percentage of ED capacity and requires coordinated hospital intervention."

    },


    {

        id:
            "boarding-above-expectation",

        title:
            "Boarding Significantly Above Expected",

        description:
            "Boarding is at least 10 patients above the expected weekday and hour baseline.",

        enabled:
            true,

        category:
            "Boarding",

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
            "Capacity Strain",

        reassessmentMinutes:
            30,

        interventionIds:[

            "review-boarding-barriers",

            "escalate-inpatient-throughput"

        ],

        rationale:
            "Historical normalization distinguishes routine baseline boarding from an unusual boarding burden."

    },


    {

        id:
            "boarders-majority-of-census",

        title:
            "Boarders Occupy Majority of ED Census",

        description:
            "Boarding patients represent at least 50% of the total emergency department census.",

        enabled:
            true,

        category:
            "Boarding",

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
            "Capacity Strain",

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


    /*
     * Hospital Throughput
     */

    {

        id:
            "hospital-near-capacity",

        title:
            "Hospital Near Capacity",

        description:
            "Medical-bed occupancy is at least 95%.",

        enabled:
            true,

        category:
            "Hospital Throughput",

        priority:
            "Moderate",

        conditions:[

            {

                metric:
                    "hospitalOccupancyPercent",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    95

            }

        ],

        minimumOperationalState:
            null,

        reassessmentMinutes:
            60,

        interventionIds:[

            "review-pending-discharges",

            "notify-bed-management"

        ],

        rationale:
            "Near-complete hospital occupancy reduces the ability to move admitted patients out of the ED."

    },


    {

        id:
            "hospital-capacity-and-boarding-crisis",

        title:
            "Hospital Capacity With Significant Boarding",

        description:
            "Medical-bed occupancy is at least 95% while at least 30 patients are boarding in the ED.",

        enabled:
            true,

        category:
            "Hospital Throughput",

        priority:
            "Critical",

        conditions:[

            {

                metric:
                    "hospitalOccupancyPercent",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    95

            },

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
            "High Surge",

        reassessmentMinutes:
            30,

        interventionIds:[

            "activate-hospital-surge",

            "escalate-inpatient-throughput",

            "notify-hospital-operations",

            "review-pending-discharges"

        ],

        rationale:
            "High hospital occupancy combined with substantial ED boarding indicates a hospital-wide throughput constraint."

    },


    /*
     * Expected Flow
     */

    {

        id:
            "worsening-expected-flow",

        title:
            "Worsening Expected Flow",

        description:
            "Expected arrivals exceed expected departures by at least five patients during the current hourly period.",

        enabled:
            true,

        category:
            "Hospital Throughput",

        priority:
            "Moderate",

        conditions:[

            {

                metric:
                    "expectedNetFlow",

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

            "review-ed-flow",

            "prepare-for-demand-growth"

        ],

        rationale:
            "Positive expected net flow suggests that ED census may increase if no countervailing operational changes occur."

    },


    /*
     * Clinical Complexity
     */

    {

        id:
            "high-acuity-burden",

        title:
            "High-Acuity Burden",

        description:
            "At least 25% of the current ED census consists of ESI 1 or ESI 2 patients.",

        enabled:
            true,

        category:
            "Clinical Complexity",

        priority:
            "High",

        conditions:[

            {

                metric:
                    "highAcuityPercent",

                operator:
                    "greaterThanOrEqual",

                threshold:
                    25

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
            "A high proportion of ESI 1 and ESI 2 patients may substantially increase workload and reduce operational reserve."

    },


    /*
     * Momentum
     */

    {

        id:
            "consecutive-score-increases",

        title:
            "Sustained Operational Deterioration",

        description:
            "EDORI has increased across at least three consecutive assessment transitions.",

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
            "Capacity Strain",

        reassessmentMinutes:
            30,

        interventionIds:[

            "notify-ed-leadership",

            "increase-reassessment-frequency",

            "review-active-triggers"

        ],

        rationale:
            "Sustained worsening may require escalation even before any single absolute threshold becomes critical."

    },


    {

        id:
            "rapid-score-increase",

        title:
            "Rapid EDORI Increase",

        description:
            "The current EDORI score is at least 10 points higher than the previous stored assessment.",

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
            "Capacity Strain",

        reassessmentMinutes:
            30,

        interventionIds:[

            "notify-ed-leadership",

            "increase-reassessment-frequency",

            "review-active-triggers"

        ],

        rationale:
            "A rapid change may indicate acute deterioration that is not fully represented by the current absolute score."

    }

];