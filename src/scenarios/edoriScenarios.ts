/**
 * EDORI Scenario Library
 *
 * Initial operational scenarios used to evaluate
 * and calibrate the scoring model.
 *
 * These are development scenarios, not validated
 * clinical standards.
 *
 * Expected ranges should be refined using local
 * operational experience and retrospective data.
 */

import type {

    EdoriScenario

}

from "../types/EdoriScenario";


export const EDORI_SCENARIOS:

EdoriScenario[] = [

    /*
     * Scenario 1
     *
     * Quiet overnight environment with volume and
     * boarding close to the historical baseline.
     */

    {

        id:
            "quiet-overnight",

        name:
            "Quiet Overnight Operations",

        description:
            "Low ED volume, limited boarding, moderate hospital occupancy, and expected departures exceeding arrivals.",

        assessment:{

            assessmentTime:
                "2026-08-02T03:00:00.000Z",

            day:
                "Sunday",

            hour:
                3,

            totalEDVolume:
                32,

            boardedPatients:
                8,

            occupiedMedicalBeds:
                205,

            esi1:
                0,

            esi2:
                3,

            esi3:
                18,

            esi4:
                8,

            esi5:
                3,

            expectedVolume:
                30,

            expectedBoarders:
                7,

            expectedArrivals:
                3,

            expectedDepartures:
                5

        },

        expectedScore:{

            minimum:
                15,

            maximum:
                35

        },

        expectedOperationalState:
            "Bravo",

        rationale:
            "Demand and boarding are near baseline. Hospital occupancy and average acuity should contribute some score, but the environment should not be classified as surge."

    },


    /*
     * Scenario 2
     *
     * Typical daytime operations with moderate
     * volume and boarding.
     */

    {

        id:
            "typical-daytime",

        name:
            "Typical Daytime Operations",

        description:
            "ED volume and boarding are moderately above historical expectations with balanced hourly flow.",

        assessment:{

            assessmentTime:
                "2026-08-03T14:00:00.000Z",

            day:
                "Monday",

            hour:
                14,

            totalEDVolume:
                58,

            boardedPatients:
                22,

            occupiedMedicalBeds:
                230,

            esi1:
                1,

            esi2:
                8,

            esi3:
                34,

            esi4:
                12,

            esi5:
                3,

            expectedVolume:
                52,

            expectedBoarders:
                17,

            expectedArrivals:
                7,

            expectedDepartures:
                7

        },

        expectedScore:{

            minimum:
                30,

            maximum:
                50

        },

        expectedOperationalState:
            "Bravo",

        rationale:
            "The department is above baseline but not experiencing marked crowding. EDORI should show increased awareness without triggering a high-level surge response."

    },


    /*
     * Scenario 3
     *
     * ED is near physical capacity with significant
     * boarding and increasing expected flow.
     */

    {

        id:
            "developing-surge",

        name:
            "Developing Surge",

        description:
            "ED volume is above staffed bed capacity, boarding is substantially above baseline, and arrivals are expected to exceed departures.",

        assessment:{

            assessmentTime:
                "2026-08-07T22:00:00.000Z",

            day:
                "Friday",

            hour:
                18,

            totalEDVolume:
                70,

            boardedPatients:
                34,

            occupiedMedicalBeds:
                250,

            esi1:
                2,

            esi2:
                12,

            esi3:
                40,

            esi4:
                13,

            esi5:
                3,

            expectedVolume:
                58,

            expectedBoarders:
                24,

            expectedArrivals:
                10,

            expectedDepartures:
                6

        },

        expectedScore:{

            minimum:
                50,

            maximum:
                70

        },

        expectedOperationalState:
            "Charlie",

        rationale:
            "Multiple domains show strain, but the scenario remains below a severe boarding crisis. EDORI should identify an emerging or active surge environment."

    },


    /*
     * Scenario 4
     *
     * Prolonged boarding crisis with high hospital
     * occupancy.
     */

    {

        id:
            "boarding-crisis",

        name:
            "Boarding Crisis",

        description:
            "Very high boarding, ED volume substantially above baseline, near-full medical beds, and continued positive hourly flow.",

        assessment:{

            assessmentTime:
                "2026-08-04T19:00:00.000Z",

            day:
                "Tuesday",

            hour:
                15,

            totalEDVolume:
                82,

            boardedPatients:
                48,

            occupiedMedicalBeds:
                267,

            esi1:
                2,

            esi2:
                14,

            esi3:
                48,

            esi4:
                15,

            esi5:
                3,

            expectedVolume:
                57,

            expectedBoarders:
                28,

            expectedArrivals:
                11,

            expectedDepartures:
                5

        },

        expectedScore:{

            minimum:
                70,

            maximum:
                90

        },

        expectedOperationalState:
            "Delta",

        rationale:
            "ED demand, excess boarding, hospital occupancy, and forecast flow are all severely strained. A high-level surge classification is expected."

    },


    /*
     * Scenario 5
     *
     * Extremely high volume and boarding with
     * maximum hospital capacity pressure.
     */

    {

        id:
            "critical-operations",

        name:
            "Critical Operations",

        description:
            "Extreme ED volume, very high boarding, full medical-bed occupancy, high acuity, and strong expected net growth.",

        assessment:{

            assessmentTime:
                "2026-08-08T01:00:00.000Z",

            day:
                "Friday",

            hour:
                21,

            totalEDVolume:
                95,

            boardedPatients:
                58,

            occupiedMedicalBeds:
                273,

            esi1:
                5,

            esi2:
                22,

            esi3:
                50,

            esi4:
                15,

            esi5:
                3,

            expectedVolume:
                60,

            expectedBoarders:
                30,

            expectedArrivals:
                15,

            expectedDepartures:
                4

        },

        expectedScore:{

            minimum:
                82,

            maximum:
                100

        },

        expectedOperationalState:
            "Echo",

        rationale:
            "Every active EDORI domain is severely strained. The score should trigger the highest operational response."

    },


    /*
     * Scenario 6
     *
     * Moderate volume with unusually high acuity.
     */

    {

        id:
            "high-acuity-moderate-volume",

        name:
            "High Acuity With Moderate Volume",

        description:
            "ED volume and boarding are near expected levels, but the ESI distribution contains an unusually high proportion of ESI 1 and ESI 2 patients.",

        assessment:{

            assessmentTime:
                "2026-08-05T17:00:00.000Z",

            day:
                "Wednesday",

            hour:
                13,

            totalEDVolume:
                52,

            boardedPatients:
                18,

            occupiedMedicalBeds:
                225,

            esi1:
                5,

            esi2:
                20,

            esi3:
                22,

            esi4:
                4,

            esi5:
                1,

            expectedVolume:
                50,

            expectedBoarders:
                17,

            expectedArrivals:
                7,

            expectedDepartures:
                7

        },

        expectedScore:{

            minimum:
                30,

            maximum:
                55

        },

        rationale:
            "High acuity should meaningfully increase the score, but acuity alone should not automatically produce a severe surge classification when demand and boarding remain near baseline."

    },


    /*
     * Scenario 7
     *
     * Hospital capacity constraint without major
     * ED demand excess.
     */

    {

        id:
            "hospital-capacity-constrained",

        name:
            "Hospital Capacity Constraint",

        description:
            "ED volume and boarding are close to expected levels, but medical-bed occupancy is nearly complete.",

        assessment:{

            assessmentTime:
                "2026-08-06T16:00:00.000Z",

            day:
                "Thursday",

            hour:
                12,

            totalEDVolume:
                55,

            boardedPatients:
                25,

            occupiedMedicalBeds:
                270,

            esi1:
                1,

            esi2:
                7,

            esi3:
                33,

            esi4:
                11,

            esi5:
                3,

            expectedVolume:
                53,

            expectedBoarders:
                23,

            expectedArrivals:
                7,

            expectedDepartures:
                7

        },

        expectedScore:{

            minimum:
                25,

            maximum:
                50

        },

        rationale:
            "High hospital occupancy should increase operational concern, but it should not by itself create a severe EDORI score when current ED conditions remain close to baseline."

    },


    /*
     * Scenario 8
     *
     * Large ED census but matching a similarly high
     * historical expectation.
     */

    {

        id:
            "high-but-expected",

        name:
            "High Volume but Historically Expected",

        description:
            "The ED census and boarding count are high in absolute terms but closely match the expected weekday and hour baseline.",

        assessment:{

            assessmentTime:
                "2026-08-03T23:00:00.000Z",

            day:
                "Monday",

            hour:
                19,

            totalEDVolume:
                74,

            boardedPatients:
                36,

            occupiedMedicalBeds:
                245,

            esi1:
                2,

            esi2:
                11,

            esi3:
                43,

            esi4:
                15,

            esi5:
                3,

            expectedVolume:
                72,

            expectedBoarders:
                34,

            expectedArrivals:
                9,

            expectedDepartures:
                8

        },

        expectedScore:{

            minimum:
                25,

            maximum:
                50

        },

        rationale:
            "Historical normalization should prevent a predictable high-volume period from automatically appearing critical, while hospital occupancy and acuity still contribute baseline operational pressure."

    }

];