/**
 * Hospital Readiness Scenario Library
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Development scenarios used to evaluate and
 * calibrate the scoring model.
 *
 * These are development scenarios, not validated
 * clinical standards.
 *
 * Expected ranges should be refined using local
 * operational experience and retrospective data.
 *
 * Version 2.1 calibration rule:
 *
 * currentEDAdmissions is retained only as a
 * compatibility field and is always 0.
 *
 * Existing ED inpatient demand is represented by
 * boardedPatients. expectedEDAdmissions4h represents
 * NEW ED-origin admissions expected during the
 * four-hour forecast horizon.
 */

import type {

    EdoriScenario

}

from "../types/EdoriScenario";


export const EDORI_SCENARIOS:

EdoriScenario[] = [

    /*
     * Scenario 1
     */

    {

        id:
            "quiet-overnight",

        name:
            "Quiet Overnight Operations",

        description:
            "Low ED volume, limited boarding, available hospital capacity, and expected four-hour departures exceeding hospital inflow.",

        assessment:{

            assessmentTime:
                "2026-08-02T03:00:00.000Z",

            day:
                "Sunday",

            hour:
                3,

            forecastHours:
                4,

            totalEDVolume:
                32,

            boardedPatients:
                8,

            esi1:
                0,

            esi2:
                3,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                205,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                16,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                1,

            currentSurgicalAdmissions:
                1,

            expectedEDVolume:
                30,

            expectedEDBoarders:
                7,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                205,

            expectedAvailableAcuteCareBeds:
                68,

            historicalProjectedBedDemand4h:
                13,

            historicalProjectedBedBalance4h:
                63,

            expectedEDAdmissions4h:
                4,

            expectedDirectAdmissions4h:
                1,

            expectedSurgicalAdmissions4h:
                1,

            expectedHospitalInflow4h:
                6,

            expectedInpatientDepartures4h:
                8

        },

        expectedScore:{

            minimum:
                0,

            maximum:
                19

        },
        expectedOperationalState:
            "Alpha",

        rationale:
            "ED pressure is close to baseline, acute- and critical-care capacity remain available, and expected inpatient departures exceed expected four-hour inflow. The environment should not be classified as surge."

    },

    /*
     * Scenario 2
     */

    {

        id:
            "typical-daytime",

        name:
            "Typical Daytime Operations",

        description:
            "ED volume and boarding are moderately above historical expectations with balanced four-hour hospital flow.",

        assessment:{

            assessmentTime:
                "2026-08-03T14:00:00.000Z",

            day:
                "Monday",

            hour:
                14,

            forecastHours:
                4,

            totalEDVolume:
                58,

            boardedPatients:
                22,

            esi1:
                1,

            esi2:
                8,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                230,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                19,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                3,

            currentSurgicalAdmissions:
                4,

            expectedEDVolume:
                52,

            expectedEDBoarders:
                17,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                230,

            expectedAvailableAcuteCareBeds:
                43,

            historicalProjectedBedDemand4h:
                35,

            historicalProjectedBedBalance4h:
                26,

            expectedEDAdmissions4h:
                11,

            expectedDirectAdmissions4h:
                3,

            expectedSurgicalAdmissions4h:
                4,

            expectedHospitalInflow4h:
                18,

            expectedInpatientDepartures4h:
                18

        },

        expectedScore:{

            minimum:
                20,

            maximum:
                39

        },
        expectedOperationalState:
            "Bravo",

        rationale:
            "The ED is above baseline but hospital capacity and four-hour flow remain manageable. Hospital Readiness should show increased awareness without a high-level surge response."

    },

    /*
     * Scenario 3
     */

    {

        id:
            "developing-surge",

        name:
            "Developing Surge",

        description:
            "ED volume exceeds treatment capacity, boarding is substantially above baseline, and projected hospital inflow is greater than expected inpatient departures.",

        assessment:{

            assessmentTime:
                "2026-08-07T22:00:00.000Z",

            day:
                "Friday",

            hour:
                18,

            forecastHours:
                4,

            totalEDVolume:
                70,

            boardedPatients:
                34,

            esi1:
                2,

            esi2:
                12,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                250,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                21,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                4,

            currentSurgicalAdmissions:
                3,

            expectedEDVolume:
                58,

            expectedEDBoarders:
                24,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                240,

            expectedAvailableAcuteCareBeds:
                33,

            historicalProjectedBedDemand4h:
                47,

            historicalProjectedBedBalance4h:
                2,

            expectedEDAdmissions4h:
                16,

            expectedDirectAdmissions4h:
                4,

            expectedSurgicalAdmissions4h:
                3,

            expectedHospitalInflow4h:
                23,

            expectedInpatientDepartures4h:
                16

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
            "ED pressure, boarding, hospital capacity, and four-hour flow all show developing strain. Hospital Readiness should identify an emerging or active surge environment."

    },

    /*
     * Scenario 4
     */

    {

        id:
            "boarding-crisis",

        name:
            "Boarding Crisis",

        description:
            "Very high boarding, ED volume substantially above baseline, near-full acute-care capacity, and projected four-hour inflow exceeding expected inpatient departures.",

        assessment:{

            assessmentTime:
                "2026-08-04T19:00:00.000Z",

            day:
                "Tuesday",

            hour:
                15,

            forecastHours:
                4,

            totalEDVolume:
                82,

            boardedPatients:
                48,

            esi1:
                2,

            esi2:
                14,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                267,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                23,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                5,

            currentSurgicalAdmissions:
                4,

            expectedEDVolume:
                57,

            expectedEDBoarders:
                28,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                245,

            expectedAvailableAcuteCareBeds:
                28,

            historicalProjectedBedDemand4h:
                56,

            historicalProjectedBedBalance4h:
                -14,

            expectedEDAdmissions4h:
                19,

            expectedDirectAdmissions4h:
                5,

            expectedSurgicalAdmissions4h:
                4,

            expectedHospitalInflow4h:
                28,

            expectedInpatientDepartures4h:
                14

        },

        expectedScore:{

            minimum:
                80,

            maximum:
                100

        },
        expectedOperationalState:
            "Echo",

        rationale:
            "ED pressure, excess boarding, acute-care occupancy, critical-care occupancy, and projected hospital flow are all severely strained. A high-level surge classification is expected."

    },

    /*
     * Scenario 5
     */

    {

        id:
            "critical-operations",

        name:
            "Critical Operations",

        description:
            "Extreme ED volume, very high boarding, full acute-care capacity, high acuity, constrained critical-care capacity, and a projected four-hour bed deficit.",

        assessment:{

            assessmentTime:
                "2026-08-08T01:00:00.000Z",

            day:
                "Friday",

            hour:
                21,

            forecastHours:
                4,

            totalEDVolume:
                95,

            boardedPatients:
                58,

            esi1:
                5,

            esi2:
                22,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                273,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                24,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                6,

            currentSurgicalAdmissions:
                5,

            expectedEDVolume:
                60,

            expectedEDBoarders:
                30,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                250,

            expectedAvailableAcuteCareBeds:
                23,

            historicalProjectedBedDemand4h:
                63,

            historicalProjectedBedBalance4h:
                -30,

            expectedEDAdmissions4h:
                22,

            expectedDirectAdmissions4h:
                6,

            expectedSurgicalAdmissions4h:
                5,

            expectedHospitalInflow4h:
                33,

            expectedInpatientDepartures4h:
                10

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
            "Every major Hospital Readiness domain is severely strained, including a projected acute-care capacity deficit. The score should trigger the highest operational response."

    },

    /*
     * Scenario 6
     */

    {

        id:
            "high-acuity-moderate-volume",

        name:
            "High Acuity With Moderate Volume",

        description:
            "ED volume and boarding are near expected levels, but an unusually large share of the ED census is ESI 1 or ESI 2.",

        assessment:{

            assessmentTime:
                "2026-08-05T17:00:00.000Z",

            day:
                "Wednesday",

            hour:
                13,

            forecastHours:
                4,

            totalEDVolume:
                52,

            boardedPatients:
                18,

            esi1:
                5,

            esi2:
                20,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                225,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                18,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                3,

            currentSurgicalAdmissions:
                4,

            expectedEDVolume:
                50,

            expectedEDBoarders:
                17,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                225,

            expectedAvailableAcuteCareBeds:
                48,

            historicalProjectedBedDemand4h:
                34,

            historicalProjectedBedBalance4h:
                31,

            expectedEDAdmissions4h:
                10,

            expectedDirectAdmissions4h:
                3,

            expectedSurgicalAdmissions4h:
                4,

            expectedHospitalInflow4h:
                17,

            expectedInpatientDepartures4h:
                17

        },

        expectedScore:{

            minimum:
                15,

            maximum:
                30

        },

        rationale:
            "High acuity should meaningfully increase ED operational pressure, but acuity alone should not automatically produce a severe surge classification when demand, boarding, hospital capacity, and flow remain near baseline."

    },

    /*
     * Scenario 7
     */

    {

        id:
            "hospital-capacity-constrained",

        name:
            "Hospital Capacity Constraint",

        description:
            "ED volume and boarding are close to expected levels, but acute-care capacity is nearly full and critical-care capacity is constrained.",

        assessment:{

            assessmentTime:
                "2026-08-06T16:00:00.000Z",

            day:
                "Thursday",

            hour:
                12,

            forecastHours:
                4,

            totalEDVolume:
                55,

            boardedPatients:
                25,

            esi1:
                1,

            esi2:
                7,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                270,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                23,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                3,

            currentSurgicalAdmissions:
                4,

            expectedEDVolume:
                53,

            expectedEDBoarders:
                23,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                240,

            expectedAvailableAcuteCareBeds:
                33,

            historicalProjectedBedDemand4h:
                40,

            historicalProjectedBedBalance4h:
                10,

            expectedEDAdmissions4h:
                10,

            expectedDirectAdmissions4h:
                3,

            expectedSurgicalAdmissions4h:
                4,

            expectedHospitalInflow4h:
                17,

            expectedInpatientDepartures4h:
                17

        },

        expectedScore:{

            minimum:
                60,

            maximum:
                79

        },
        expectedOperationalState:
            "Delta",


        rationale:
            "High hospital occupancy should increase operational concern, but it should not by itself create a severe Hospital Readiness score when current ED conditions and hospital flow remain close to baseline."

    },

    /*
     * Scenario 8
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

            forecastHours:
                4,

            totalEDVolume:
                74,

            boardedPatients:
                36,

            esi1:
                2,

            esi2:
                11,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                245,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                20,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                3,

            currentSurgicalAdmissions:
                3,

            expectedEDVolume:
                72,

            expectedEDBoarders:
                34,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                245,

            expectedAvailableAcuteCareBeds:
                28,

            historicalProjectedBedDemand4h:
                54,

            historicalProjectedBedBalance4h:
                -7,

            expectedEDAdmissions4h:
                14,

            expectedDirectAdmissions4h:
                3,

            expectedSurgicalAdmissions4h:
                3,

            expectedHospitalInflow4h:
                20,

            expectedInpatientDepartures4h:
                19

        },

        expectedScore:{

            minimum:
                25,

            maximum:
                50

        },

        rationale:
            "Historical normalization should prevent a predictable high-volume period from automatically appearing critical, while hospital capacity, acuity, and projected flow still contribute operational pressure."

    },
    /*
     * Scenario 9
     *
     * Targeted calibration: isolated acute-care exhaustion.
     */

    {

        id:
            "acute-capacity-max",

        name:
            "Acute-Care Capacity at 100%",

        description:
            "Acute-care staffed capacity is completely occupied while ED conditions, critical-care occupancy, known non-ED inflow, and projected capacity remain near their comparison baselines.",

        assessment:{

            assessmentTime:
                "2026-08-10T12:00:00.000Z",

            day:
                "Monday",

            hour:
                12,

            forecastHours:
                4,

            totalEDVolume:
                50,

            boardedPatients:
                0,

            esi1:
                0,

            esi2:
                0,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                273,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                12,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                2,

            currentSurgicalAdmissions:
                2,

            expectedEDVolume:
                50,

            expectedEDBoarders:
                0,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                273,

            expectedAvailableAcuteCareBeds:
                0,

            historicalProjectedBedDemand4h:
                8,

            historicalProjectedBedBalance4h:
                4,

            expectedEDAdmissions4h:
                4,

            expectedDirectAdmissions4h:
                2,

            expectedSurgicalAdmissions4h:
                2,

            expectedHospitalInflow4h:
                8,

            expectedInpatientDepartures4h:
                12

        },

        expectedScore:{

            minimum:
                20,

            maximum:
                40

        },

        expectedOperationalState:
            "Bravo",

        rationale:
            "One completely exhausted major domain should materially raise the HRI even when unrelated domains are stable. The severe-domain adjustment should prevent 100% acute-care occupancy from being diluted to an Alpha score."

    },

    /*
     * Scenario 10
     *
     * Targeted calibration: isolated critical-care exhaustion.
     */

    {

        id:
            "critical-capacity-max",

        name:
            "Critical-Care Capacity at 100%",

        description:
            "Critical-care staffed capacity is completely occupied while acute-care capacity, ED conditions, inflow, and projected acute-care capacity remain otherwise stable.",

        assessment:{

            assessmentTime:
                "2026-08-10T13:00:00.000Z",

            day:
                "Monday",

            hour:
                13,

            forecastHours:
                4,

            totalEDVolume:
                50,

            boardedPatients:
                0,

            esi1:
                0,

            esi2:
                0,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                205,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                24,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                1,

            currentSurgicalAdmissions:
                1,

            expectedEDVolume:
                50,

            expectedEDBoarders:
                0,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                205,

            expectedAvailableAcuteCareBeds:
                68,

            historicalProjectedBedDemand4h:
                6,

            historicalProjectedBedBalance4h:
                70,

            expectedEDAdmissions4h:
                4,

            expectedDirectAdmissions4h:
                1,

            expectedSurgicalAdmissions4h:
                1,

            expectedHospitalInflow4h:
                6,

            expectedInpatientDepartures4h:
                8

        },

        expectedScore:{

            minimum:
                20,

            maximum:
                40

        },

        expectedOperationalState:
            "Bravo",

        rationale:
            "Complete critical-care occupancy should be clearly visible in the HRI even when the rest of the hospital is stable, but one isolated domain should not automatically force the highest operational state."

    },

    /*
     * Scenario 11
     *
     * Targeted calibration: maximum ED operational pressure.
     */

    {

        id:
            "ed-pressure-max",

        name:
            "Maximum ED Operational Pressure",

        description:
            "ED volume is 50% above baseline, boarding is extreme, and ESI 1 plus ESI 2 patients represent at least 30% of the ED census.",

        assessment:{

            assessmentTime:
                "2026-08-10T14:00:00.000Z",

            day:
                "Monday",

            hour:
                14,

            forecastHours:
                4,

            totalEDVolume:
                90,

            boardedPatients:
                60,

            esi1:
                5,

            esi2:
                22,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                210,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                12,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                2,

            currentSurgicalAdmissions:
                2,

            expectedEDVolume:
                60,

            expectedEDBoarders:
                30,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                210,

            expectedAvailableAcuteCareBeds:
                63,

            historicalProjectedBedDemand4h:
                70,

            historicalProjectedBedBalance4h:
                3,

            expectedEDAdmissions4h:
                6,

            expectedDirectAdmissions4h:
                2,

            expectedSurgicalAdmissions4h:
                2,

            expectedHospitalInflow4h:
                10,

            expectedInpatientDepartures4h:
                10

        },

        expectedScore:{

            minimum:
                40,

            maximum:
                65

        },

        expectedOperationalState:
            "Charlie",

        rationale:
            "A maximum ED domain should move the overall HRI well beyond routine operations. Current boarders also remain part of projected bed demand, so this scenario intentionally captures that real interaction."

    },

    /*
     * Scenario 12
     *
     * Targeted calibration: maximum known non-ED inflow.
     */

    {

        id:
            "inflow-max",

        name:
            "Maximum Known Non-ED Inflow",

        description:
            "Known direct and surgical/procedural admissions exceed their historical four-hour expectation by eight patients, producing maximum inflow pressure and a downstream projected-capacity effect.",

        assessment:{

            assessmentTime:
                "2026-08-10T15:00:00.000Z",

            day:
                "Monday",

            hour:
                15,

            forecastHours:
                4,

            totalEDVolume:
                50,

            boardedPatients:
                0,

            esi1:
                0,

            esi2:
                0,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                205,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                12,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                6,

            currentSurgicalAdmissions:
                6,

            expectedEDVolume:
                50,

            expectedEDBoarders:
                0,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                205,

            expectedAvailableAcuteCareBeds:
                68,

            historicalProjectedBedDemand4h:
                8,

            historicalProjectedBedBalance4h:
                68,

            expectedEDAdmissions4h:
                4,

            expectedDirectAdmissions4h:
                2,

            expectedSurgicalAdmissions4h:
                2,

            expectedHospitalInflow4h:
                8,

            expectedInpatientDepartures4h:
                8

        },

        expectedScore:{

            minimum:
                20,

            maximum:
                55

        },

        rationale:
            "Maximum inflow pressure should not be evaluated independently from its downstream bed-demand effect. This scenario preserves that causal relationship."

    },

    /*
     * Scenario 13
     *
     * Targeted calibration: projected capacity 30 beds worse than historical normal.
     */

    {

        id:
            "projected-capacity-max",

        name:
            "Projected Capacity 30 Beds Worse Than Historical",

        description:
            "Current and projected bed demand produce a four-hour acute-care bed balance approximately 30 beds worse than the historical projected balance for the same period.",

        assessment:{

            assessmentTime:
                "2026-08-10T16:00:00.000Z",

            day:
                "Monday",

            hour:
                16,

            forecastHours:
                4,

            totalEDVolume:
                60,

            boardedPatients:
                30,

            esi1:
                1,

            esi2:
                7,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                240,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                16,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                2,

            currentSurgicalAdmissions:
                2,

            expectedEDVolume:
                60,

            expectedEDBoarders:
                30,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                210,

            expectedAvailableAcuteCareBeds:
                63,

            historicalProjectedBedDemand4h:
                40,

            historicalProjectedBedBalance4h:
                33,

            expectedEDAdmissions4h:
                6,

            expectedDirectAdmissions4h:
                2,

            expectedSurgicalAdmissions4h:
                2,

            expectedHospitalInflow4h:
                10,

            expectedInpatientDepartures4h:
                10

        },

        expectedScore:{

            minimum:
                25,

            maximum:
                60

        },

        rationale:
            "Projected capacity should reach maximum pressure when today's four-hour bed balance is about 30 beds worse than the historical projection."

    },

    /*
     * Scenario 14
     *
     * Targeted calibration: two major domains at maximum.
     */

    {

        id:
            "two-domains-max",

        name:
            "Acute and Critical Capacity Both at 100%",

        description:
            "Both acute-care and critical-care staffed capacity are completely occupied while ED conditions and known inflow remain close to their comparison baselines.",

        assessment:{

            assessmentTime:
                "2026-08-10T17:00:00.000Z",

            day:
                "Monday",

            hour:
                17,

            forecastHours:
                4,

            totalEDVolume:
                55,

            boardedPatients:
                20,

            esi1:
                1,

            esi2:
                5,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                273,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                24,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                2,

            currentSurgicalAdmissions:
                2,

            expectedEDVolume:
                55,

            expectedEDBoarders:
                20,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                273,

            expectedAvailableAcuteCareBeds:
                0,

            historicalProjectedBedDemand4h:
                30,

            historicalProjectedBedBalance4h:
                -20,

            expectedEDAdmissions4h:
                6,

            expectedDirectAdmissions4h:
                2,

            expectedSurgicalAdmissions4h:
                2,

            expectedHospitalInflow4h:
                10,

            expectedInpatientDepartures4h:
                10

        },

        expectedScore:{

            minimum:
                45,

            maximum:
                70

        },

        rationale:
            "Two exhausted major capacity domains should receive both individual severe-domain adjustments and the additional multi-domain adjustment. This tests whether extreme capacity constraints are averaged down too aggressively."

    },

    /*
     * Scenario 15
     *
     * Targeted calibration: three major domains at maximum.
     */

    {

        id:
            "three-domains-max",

        name:
            "Three Major Domains at Maximum",

        description:
            "ED operational pressure, acute-care capacity, and critical-care capacity are simultaneously at or near maximum, providing a direct test of the three-domain severe adjustment.",

        assessment:{

            assessmentTime:
                "2026-08-10T18:00:00.000Z",

            day:
                "Monday",

            hour:
                18,

            forecastHours:
                4,

            totalEDVolume:
                90,

            boardedPatients:
                60,

            esi1:
                5,

            esi2:
                22,

            staffedAcuteCareBeds:
                273,

            occupiedAcuteCareBeds:
                273,

            staffedCriticalCareBeds:
                24,

            occupiedCriticalCareBeds:
                24,

            currentEDAdmissions:
                0,

            currentDirectAdmissions:
                2,

            currentSurgicalAdmissions:
                2,

            expectedEDVolume:
                60,

            expectedEDBoarders:
                30,

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                273,

            expectedAvailableAcuteCareBeds:
                0,

            historicalProjectedBedDemand4h:
                70,

            historicalProjectedBedBalance4h:
                -60,

            expectedEDAdmissions4h:
                6,

            expectedDirectAdmissions4h:
                2,

            expectedSurgicalAdmissions4h:
                2,

            expectedHospitalInflow4h:
                10,

            expectedInpatientDepartures4h:
                10

        },

        expectedScore:{

            minimum:
                81,

            maximum:
                100

        },

        expectedOperationalState:
            "Echo",

        rationale:
            "Three simultaneously extreme major domains should produce the highest readiness range after individual and multi-domain severe adjustments are applied."

    }

];