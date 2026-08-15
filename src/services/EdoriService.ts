/**
 * EdoriService
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Pure calculation engine for one completed
 * hospital operational assessment.
 *
 * Overall Hospital Readiness:
 *
 * HRI =
 *
 * 0.35 × ED Operational Pressure
 * +
 * 0.20 × Acute-Care Capacity Pressure
 * +
 * 0.15 × Critical-Care Capacity Pressure
 * +
 * 0.15 × Hospital Inflow Pressure
 * +
 * 0.15 × Projected Capacity Pressure
 *
 * No application state is read or modified here.
 */

import {

    ED_PRESSURE_WEIGHTS,

    WEIGHTS,

    areWeightsValid

}

from "../config/weights";


import {

    getOperationalState

}

from "../config/operationalStates";


import type {

    Driver

}

from "../types/Driver";


import type {

    EdoriResult

}

from "../types/EdoriResult";


import type {

    SituationAssessment

}

from "../types/SituationAssessment";


/*
 * =====================================================
 * Calibration constants
 * =====================================================
 */


/**
 * Current ED census reaching 50% above its historical
 * expectation produces maximum ED volume pressure.
 */
const ED_VOLUME_EXCESS_AT_MAXIMUM_SCORE =

    0.50;


/**
 * ESI 1 + ESI 2 patients representing 30% of
 * the current ED population produces maximum
 * acuity pressure.
 */
const HIGH_ACUITY_SHARE_AT_MAXIMUM_SCORE =

    0.30;


/**
 * Known non-ED inflow eight patients above its
 * historical four-hour expectation produces maximum
 * inflow pressure.
 */
const INFLOW_EXCESS_AT_MAXIMUM_SCORE =

    8;


/*
 * =====================================================
 * Public calculation
 * =====================================================
 */


/**
 * Calculate one Hospital Readiness assessment.
 */
export function calculateEdori(

    assessment:SituationAssessment

):EdoriResult {

    if(!areWeightsValid()){

        throw new Error(

            "Hospital Readiness scoring weights are invalid."

        );

    }


    /*
     * Emergency Department subdomains.
     */

    const edVolumeScore =

        calculateRelativeExcessScore(

            assessment.totalEDVolume,

            assessment.expectedEDVolume,

            ED_VOLUME_EXCESS_AT_MAXIMUM_SCORE

        );


    const edBoardingScore =

        calculateEDBoardingScore(

            assessment.boardedPatients,

            assessment.expectedEDBoarders

        );


    const edAcuityScore =

        calculateEDAcuityScore(

            assessment

        );


    const edPressureScore =

        roundScore(

            (

                edVolumeScore

                *

                ED_PRESSURE_WEIGHTS.volume

            )

            +

            (

                edBoardingScore

                *

                ED_PRESSURE_WEIGHTS.boarding

            )

            +

            (

                edAcuityScore

                *

                ED_PRESSURE_WEIGHTS.acuity

            )

        );


    /*
     * Acute-care capacity.
     */

    const acuteOccupancy =

        calculateOccupancyRatio(

            assessment.occupiedAcuteCareBeds,

            assessment.staffedAcuteCareBeds

        );


    const acuteCapacityScore =

        calculateAcuteCapacityScore(

            acuteOccupancy

        );


    /*
     * Critical-care capacity.
     */

    const criticalOccupancy =

        calculateOccupancyRatio(

            assessment.occupiedCriticalCareBeds,

            assessment.staffedCriticalCareBeds

        );


    const criticalCapacityScore =

        calculateCriticalCapacityScore(

            criticalOccupancy

        );


    /*
     * =================================================
     * Known non-ED hospital inflow
     * =================================================
     *
     * Current ED boarders are NOT counted here.
     *
     * They are an existing inpatient-bed backlog and
     * are handled directly in the projected bed-demand
     * calculation below.
     */

    const knownNonEDInflow =

        roundValue(

            normalizeNonNegative(
                assessment.currentDirectAdmissions
            )

            +

            normalizeNonNegative(
                assessment.currentSurgicalAdmissions
            )

        );


    const expectedNonEDInflow =

        roundValue(

            normalizeNonNegative(
                assessment.expectedDirectAdmissions4h
            )

            +

            normalizeNonNegative(
                assessment.expectedSurgicalAdmissions4h
            )

        );


    const inflowScore =

        calculateInflowScore(

            knownNonEDInflow,

            expectedNonEDInflow

        );


    /*
     * =================================================
     * Four-hour acute-care capacity projection
     * =================================================
     */

    const currentAvailableAcuteCareBeds =

        roundValue(

            assessment.staffedAcuteCareBeds

            -

            assessment.occupiedAcuteCareBeds

        );


    const expectedInpatientDepartures =

        normalizeNonNegative(

            assessment.expectedInpatientDepartures4h

        );


    /*
     * Direct and surgical/procedural admissions use
     * the greater of currently known demand and the
     * historical four-hour expectation.
     */

    const projectedDirectAdmissions =

        roundValue(

            Math.max(

                normalizeNonNegative(
                    assessment.currentDirectAdmissions
                ),

                normalizeNonNegative(
                    assessment.expectedDirectAdmissions4h
                )

            )

        );


    const projectedSurgicalAdmissions =

        roundValue(

            Math.max(

                normalizeNonNegative(
                    assessment.currentSurgicalAdmissions
                ),

                normalizeNonNegative(
                    assessment.expectedSurgicalAdmissions4h
                )

            )

        );


    /*
     * expectedEDAdmissions4h represents NEW ED-origin
     * inpatient admissions expected to occur during
     * the four-hour horizon.
     *
     * It explicitly excludes patients who are already
     * boarders at the beginning of the assessment.
     */

    const projectedNewAdmissions =

        roundValue(

            normalizeNonNegative(
                assessment.expectedEDAdmissions4h
            )

            +

            projectedDirectAdmissions

            +

            projectedSurgicalAdmissions

        );


    /*
     * Existing ED boarders are the current unresolved
     * ED-origin inpatient backlog.
     *
     * They are added exactly once here.
     */

    const projectedTotalBedDemand =

        roundValue(

            normalizeNonNegative(
                assessment.boardedPatients
            )

            +

            projectedNewAdmissions

        );


    const projectedAvailableAcuteCareBeds =

        roundValue(

            currentAvailableAcuteCareBeds

            +

            expectedInpatientDepartures

            -

            projectedTotalBedDemand

        );


    const historicalProjectedBedDemand =

        normalizeNonNegative(

            assessment.historicalProjectedBedDemand4h

        );


    /*
     * Historical projected balance may legitimately be
     * negative because a bed deficit may be normal for
     * this hospital at this weekday/hour.
     */

    const historicalProjectedBedBalance =

        normalizeFinite(

            assessment.historicalProjectedBedBalance4h

        );


    /*
     * Negative variance means today's projected bed
     * balance is WORSE than historical normal.
     *
     * Positive variance means today's projection is
     * BETTER than historical normal.
     */

    const projectedCapacityVariance =

        roundValue(

            projectedAvailableAcuteCareBeds

            -

            historicalProjectedBedBalance

        );


    const projectedCapacityScore =

        calculateProjectedCapacityScore(

            projectedCapacityVariance

        );


    /*
     * Temporary compatibility aliases.
     *
     * They allow existing dashboard/report components
     * to compile while those components are migrated to
     * the clearer Version 2.1 field names.
     */

    const currentHospitalInflow =

        knownNonEDInflow;


    const expectedHospitalInflow =

        expectedNonEDInflow;


    const projectedHospitalInflow =

        projectedNewAdmissions;


    /*
     * =================================================
     * Base Hospital Readiness Index
     * =================================================
     */

    const baseScore =

        roundScore(

            (edPressureScore * WEIGHTS.edPressure)

            +

            (acuteCapacityScore * WEIGHTS.acuteCapacity)

            +

            (criticalCapacityScore * WEIGHTS.criticalCapacity)

            +

            (inflowScore * WEIGHTS.inflow)

            +

            (projectedCapacityScore * WEIGHTS.projectedCapacity)

        );


    /*
     * Extreme domain values must not be completely
     * diluted by normal values in unrelated domains.
     *
     * This changes the numeric HRI only. Operational
     * state selection remains entirely score-driven.
     */
    const severityAdjustment =

        calculateSevereDomainAdjustment(

            [

                edPressureScore,

                acuteCapacityScore,

                criticalCapacityScore,

                inflowScore,

                projectedCapacityScore

            ]

        );


    const score =

        roundScore(

            baseScore

            +

            severityAdjustment

        );


    const operationalState =

        getOperationalState(

            score

        );


    const drivers =

        buildDrivers(

            assessment,

            {

                edPressureScore,

                edVolumeScore,

                edBoardingScore,

                edAcuityScore,

                acuteCapacityScore,

                criticalCapacityScore,

                inflowScore,

                projectedCapacityScore,

                currentHospitalInflow,

                projectedAvailableAcuteCareBeds,

                historicalProjectedBedBalance,

                projectedCapacityVariance,

                acuteOccupancy,

                criticalOccupancy

            }

        );


    return {

        score,

        status:
            operationalState.title,

        operationalState,

        edPressureScore,

        acuteCapacityScore,

        criticalCapacityScore,

        inflowScore,

        projectedCapacityScore,

        edVolumeScore,

        edBoardingScore,

        edAcuityScore,

        knownNonEDInflow,

        expectedNonEDInflow,

        projectedDirectAdmissions,

        projectedSurgicalAdmissions,

        projectedNewAdmissions,

        projectedTotalBedDemand,

        historicalProjectedBedDemand,

        expectedInpatientDepartures,

        currentAvailableAcuteCareBeds,

        projectedAvailableAcuteCareBeds,

        historicalProjectedBedBalance,

        projectedCapacityVariance,

        /* Temporary compatibility aliases. */
        currentHospitalInflow,

        expectedHospitalInflow,

        projectedHospitalInflow,

        drivers,

        recommendations:
            buildRecommendations(

                operationalState.recommendation,

                acuteOccupancy,

                criticalOccupancy,

                inflowScore,

                edPressureScore

            ),

        timestamp:
            new Date(

                assessment.assessmentTime

            )

    };

}


/*
 * =====================================================
 * ED Operational Pressure
 * =====================================================
 */


/**
 * Calculate pressure based on the percentage by
 * which a current value exceeds its historical norm.
 *
 * At or below historical expectation = 0.
 *
 * Example with maximumExcess = 0.50:
 *
 * Historical       -> 0
 * 25% above         -> 50
 * 50% above         -> 100
 */
function calculateRelativeExcessScore(

    current:number,

    expected:number,

    maximumExcess:number

):number {

    const safeCurrent =

        normalizeNonNegative(

            current

        );


    const safeExpected =

        normalizeNonNegative(

            expected

        );


    if(

        safeExpected <= 0

        ||

        safeCurrent <= safeExpected

    ){

        return 0;

    }


    const relativeExcess =

        (

            safeCurrent

            -

            safeExpected

        )

        /

        safeExpected;


    return roundScore(

        clampScore(

            relativeExcess

            /

            maximumExcess

            *

            100

        )

    );

}


/**
 * Calculate Emergency Department boarding pressure.
 *
 * Boarding is scored using a hybrid model so that
 * chronically high boarding is not normalized to zero.
 *
 * The score combines:
 *
 * 1. Absolute boarding burden.
 * 2. Additional pressure when boarding is worse than
 *    the historical weekday/hour expectation.
 *
 * Absolute burden anchors:
 *
 * 0 boarders   ->   0
 * 10 boarders  ->  10
 * 20 boarders  ->  25
 * 30 boarders  ->  40
 * 40 boarders  ->  60
 * 50 boarders  ->  80
 * 60+ boarders -> 100
 *
 * Historical-deviation modifier:
 *
 * At/below expected -> +0
 * 10% above         -> +5
 * 20% above         -> +10
 * 30% above         -> +15
 * 40% above         -> +20
 * 50%+ above        -> +25
 */
function calculateEDBoardingScore(

    currentBoarders:number,

    expectedBoarders:number

):number {

    const safeCurrentBoarders =

        normalizeNonNegative(

            currentBoarders

        );


    const safeExpectedBoarders =

        normalizeNonNegative(

            expectedBoarders

        );


    const absoluteBoardingScore =

        interpolatePressureCurve(

            safeCurrentBoarders,

            [

                { x:0, y:0 },

                { x:10, y:10 },

                { x:20, y:25 },

                { x:30, y:40 },

                { x:40, y:60 },

                { x:50, y:80 },

                { x:60, y:100 }

            ]

        );


    let historicalDeviationModifier = 0;


    if(

        safeExpectedBoarders > 0

        &&

        safeCurrentBoarders > safeExpectedBoarders

    ){

        const relativeExcess =

            (

                safeCurrentBoarders

                -

                safeExpectedBoarders

            )

            /

            safeExpectedBoarders;


        historicalDeviationModifier =

            interpolatePressureCurve(

                relativeExcess,

                [

                    { x:0, y:0 },

                    { x:0.10, y:5 },

                    { x:0.20, y:10 },

                    { x:0.30, y:15 },

                    { x:0.40, y:20 },

                    { x:0.50, y:25 }

                ]

            );

    }


    return roundScore(

        clampScore(

            absoluteBoardingScore

            +

            historicalDeviationModifier

        )

    );

}


/**
 * Calculate ED high-acuity pressure.
 *
 * Only ESI 1 and ESI 2 are entered.
 *
 * All remaining ED patients are implicitly
 * considered ESI 3 through ESI 5.
 *
 * A combined ESI 1 + ESI 2 share of 30% or more
 * produces the maximum acuity score.
 */
function calculateEDAcuityScore(

    assessment:SituationAssessment

):number {

    const totalEDVolume =

        normalizeNonNegative(

            assessment.totalEDVolume

        );


    if(totalEDVolume <= 0){

        return 0;

    }


    const highAcuityPatients =

        Math.min(

            totalEDVolume,

            normalizeNonNegative(

                assessment.esi1

            )

            +

            normalizeNonNegative(

                assessment.esi2

            )

        );


    const highAcuityShare =

        highAcuityPatients

        /

        totalEDVolume;


    return roundScore(

        clampScore(

            highAcuityShare

            /

            HIGH_ACUITY_SHARE_AT_MAXIMUM_SCORE

            *

            100

        )

    );

}


/*
 * =====================================================
 * Acute-Care Capacity
 * =====================================================
 */


/**
 * Convert acute-care occupancy into operational
 * pressure.
 *
 * Acute-care capacity is an absolute constraint.
 * Historical occupancy never reduces this score.
 *
 * <= 80% ->   0
 * 85%    ->  10
 * 90%    ->  25
 * 95%    ->  50
 * 97%    ->  65
 * 98%    ->  75
 * 99%    ->  88
 * 100%   -> 100
 */
function calculateAcuteCapacityScore(

    occupancy:number

):number {

    return interpolatePressureCurve(

        occupancy,

        [

            { x:0.80, y:0 },

            { x:0.85, y:10 },

            { x:0.90, y:25 },

            { x:0.95, y:50 },

            { x:0.97, y:65 },

            { x:0.98, y:75 },

            { x:0.99, y:88 },

            { x:1.00, y:100 }

        ]

    );

}


/*
 * =====================================================
 * Critical-Care Capacity
 * =====================================================
 */


/**
 * Critical-care capacity begins generating pressure
 * earlier and accelerates more quickly than acute
 * care.
 *
 * <= 70% occupancy -> 0
 * 80% occupancy    -> 30
 * 90% occupancy    -> 65
 * 100% occupancy   -> 100
 */
function calculateCriticalCapacityScore(

    occupancy:number

):number {

    return interpolatePressureCurve(

        occupancy,

        [

            {

                x:0.70,

                y:0

            },

            {

                x:0.80,

                y:30

            },

            {

                x:0.90,

                y:65

            },

            {

                x:1.00,

                y:100

            }

        ]

    );

}


/*
 * =====================================================
 * Hospital Inflow
 * =====================================================
 */


/**
 * Compare currently known hospital inflow with the
 * historical four-hour norm.
 *
 * At or below historical expectation = 0.
 *
 * Eight admissions above historical expectation
 * produces the maximum score.
 */
function calculateInflowScore(

    currentHospitalInflow:number,

    expectedHospitalInflow:number

):number {

    const excessInflow =

        currentHospitalInflow

        -

        expectedHospitalInflow;


    if(excessInflow <= 0){

        return 0;

    }


    return roundScore(

        clampScore(

            excessInflow

            /

            INFLOW_EXCESS_AT_MAXIMUM_SCORE

            *

            100

        )

    );

}


/*
 * =====================================================
 * Projected Capacity
 * =====================================================
 */


/**
 * Convert projected-capacity variance into pressure.
 *
 * The score is based on how much WORSE today's
 * projected bed balance is than the historical
 * projected balance for the same weekday/hour.
 *
 * At or better than historical expectation -> 0
 * 5 beds worse                          -> 25
 * 10 beds worse                         -> 50
 * 20 beds worse                         -> 80
 * 30 beds worse                         -> 100
 *
 * A negative absolute bed balance does NOT
 * automatically create a high score.
 */
function calculateProjectedCapacityScore(

    projectedCapacityVariance:number

):number {

    if(!Number.isFinite(projectedCapacityVariance)){

        return 100;

    }


    const bedsWorseThanHistorical = Math.max(

        0,

        -projectedCapacityVariance

    );


    return interpolatePressureCurve(

        bedsWorseThanHistorical,

        [

            {
                x:0,
                y:0
            },

            {
                x:5,
                y:25
            },

            {
                x:10,
                y:50
            },

            {
                x:20,
                y:80
            },

            {
                x:30,
                y:100
            }

        ]

    );

}


/*
 * =====================================================
 * Severe-domain adjustment
 * =====================================================
 */

/**
 * Add a controlled numerical adjustment when one or
 * more major Hospital Readiness domains become severe.
 *
 * A domain is considered severe at a score of 80 or
 * greater.
 *
 * Adjustment:
 *
 * 0 severe domains  -> +0
 * 1 severe domain   -> +5
 * 2 severe domains  -> +10
 * 3+ severe domains -> +15
 *
 * This adjustment is intentionally non-cumulative.
 * It prevents multiple extreme domains from being
 * excessively diluted by lower scores elsewhere while
 * avoiding very large additive bonuses.
 *
 * The operational state is still selected solely from
 * the final numerical Hospital Readiness score.
 */
function calculateSevereDomainAdjustment(

    domainScores:number[]

):number {

    const severeDomainCount =

        domainScores

            .map(

                domainScore =>

                    clampScore(

                        Number.isFinite(domainScore)

                            ? domainScore

                            : 0

                    )

            )

            .filter(

                domainScore =>

                    domainScore >= 80

            )

            .length;


    if(severeDomainCount >= 3){

        return 15;

    }


    if(severeDomainCount === 2){

        return 10;

    }


    if(severeDomainCount === 1){

        return 5;

    }


    return 0;

}


/*
 * =====================================================
 * Driver generation
 * =====================================================
 */


interface CalculatedDomains {

    edPressureScore:number;

    edVolumeScore:number;

    edBoardingScore:number;

    edAcuityScore:number;

    acuteCapacityScore:number;

    criticalCapacityScore:number;

    inflowScore:number;

    projectedCapacityScore:number;

    currentHospitalInflow:number;

    projectedAvailableAcuteCareBeds:number;

    historicalProjectedBedBalance:number;

    projectedCapacityVariance:number;

    acuteOccupancy:number;

    criticalOccupancy:number;

}


/**
 * Build the major operational drivers.
 */
function buildDrivers(

    assessment:SituationAssessment,

    domains:CalculatedDomains

):Driver[] {

    const drivers:Driver[] = [];


    if(domains.edPressureScore >= 20){

        drivers.push({

            title:
                "Emergency Department Pressure",

            description:
                "Emergency Department volume, boarding, or high-acuity demand is above normal operating conditions.",

            severity:
                domains.edPressureScore,

            currentValue:
                assessment.totalEDVolume,

            expectedValue:
                assessment.expectedEDVolume

        });

    }


    if(domains.edBoardingScore >= 20){

        drivers.push({

            title:
                "ED Boarding",

            description:
                "The current ED boarding population creates substantial operational burden and/or exceeds the historical expectation for this period.",

            severity:
                domains.edBoardingScore,

            currentValue:
                assessment.boardedPatients,

            expectedValue:
                assessment.expectedEDBoarders

        });

    }


    if(domains.acuteCapacityScore >= 20){

        drivers.push({

            title:
                "Acute-Care Capacity",

            description:
                "Staffed acute-care inpatient capacity is becoming constrained.",

            severity:
                domains.acuteCapacityScore,

            currentValue:
                roundValue(

                    domains.acuteOccupancy

                    *

                    100

                ),

            expectedValue:
                80

        });

    }


    if(domains.criticalCapacityScore >= 20){

        drivers.push({

            title:
                "Critical-Care Capacity",

            description:
                "Staffed critical-care capacity is becoming constrained.",

            severity:
                domains.criticalCapacityScore,

            currentValue:
                roundValue(

                    domains.criticalOccupancy

                    *

                    100

                ),

            expectedValue:
                70

        });

    }


    if(domains.inflowScore >= 20){

        drivers.push({

            title:
                "Hospital Inflow",

            description:
                "Known hospital admissions exceed the historical four-hour inflow expectation.",

            severity:
                domains.inflowScore,

            currentValue:
                domains.currentHospitalInflow,

            expectedValue:
                assessment.expectedHospitalInflow4h

        });

    }


    if(domains.projectedCapacityScore >= 20){

        drivers.push({

            title:
                "Projected Acute-Care Capacity",

            description:
                domains.projectedCapacityVariance < 0

                    ? `Projected acute-care bed balance is ${formatAbsoluteBedCount(domains.projectedCapacityVariance)} beds worse than the historical expectation for this weekday/hour.`

                    : "Projected acute-care bed balance is at or better than the historical expectation.",

            severity:
                domains.projectedCapacityScore,

            currentValue:
                domains.projectedAvailableAcuteCareBeds,

            expectedValue:
                domains.historicalProjectedBedBalance

        });

    }


    return drivers.sort(

        (

            first,

            second

        ) =>

            second.severity

            -

            first.severity

    );

}


/*
 * =====================================================
 * Initial recommendations
 * =====================================================
 */


/**
 * Generate basic recommendations.
 *
 * This is intentionally simple because Version 2
 * will later replace these hard-coded statements
 * with administrator-configurable surge-plan
 * recommendations.
 */
function buildRecommendations(

    stateRecommendation:string,

    acuteOccupancy:number,

    criticalOccupancy:number,

    inflowScore:number,

    edPressureScore:number

):string[] {

    const recommendations:string[] = [

        stateRecommendation

    ];


    /*
     * A negative absolute bed balance is not itself an
     * escalation criterion in Version 2.1 because a
     * deficit may be historically normal.
     *
     * Projected-capacity recommendations are driven
     * through the scored domain and operational
     * triggers rather than this absolute value.
     */


    if(criticalOccupancy >= 1){

        recommendations.push(

            "Critical-care occupancy has reached or exceeded staffed capacity. Review critical-care capacity and escalation actions."

        );

    }


    if(acuteOccupancy >= 0.95){

        recommendations.push(

            "Acute-care occupancy is at or above 95% of staffed capacity. Review inpatient throughput and surge-capacity actions."

        );

    }


    if(inflowScore >= 60){

        recommendations.push(

            "Hospital inflow is substantially above the historical expectation for the current four-hour period."

        );

    }


    if(edPressureScore >= 60){

        recommendations.push(

            "Emergency Department operational pressure is elevated. Review ED throughput, boarding, and hospital support actions."

        );

    }


    return Array.from(

        new Set(

            recommendations

        )

    );

}


/*
 * =====================================================
 * Shared mathematical helpers
 * =====================================================
 */


/**
 * Calculate occupancy as occupied / staffed.
 *
 * Occupancy above 100% is intentionally preserved.
 */
function calculateOccupancyRatio(

    occupied:number,

    staffed:number

):number {

    const safeOccupied =

        normalizeNonNegative(

            occupied

        );


    const safeStaffed =

        normalizeNonNegative(

            staffed

        );


    if(safeStaffed <= 0){

        return safeOccupied > 0

            ? 1

            : 0;

    }


    return safeOccupied

        /

        safeStaffed;

}


/**
 * Interpolate an ascending pressure curve.
 */
function interpolatePressureCurve(

    value:number,

    points:Array<{

        x:number;

        y:number;

    }>

):number {

    if(points.length === 0){

        return 0;

    }


    if(value <= points[0].x){

        return roundScore(

            points[0].y

        );

    }


    for(

        let index = 1;

        index < points.length;

        index += 1

    ){

        const previous =

            points[index - 1];


        const current =

            points[index];


        if(value <= current.x){

            return roundScore(

                interpolate(

                    value,

                    previous.x,

                    current.x,

                    previous.y,

                    current.y

                )

            );

        }

    }


    return roundScore(

        points[

            points.length - 1

        ].y

    );

}


/**
 * Linear interpolation.
 */
function interpolate(

    value:number,

    startX:number,

    endX:number,

    startY:number,

    endY:number

):number {

    if(startX === endX){

        return endY;

    }


    const position =

        (

            value

            -

            startX

        )

        /

        (

            endX

            -

            startX

        );


    return startY

        +

        position

        *

        (

            endY

            -

            startY

        );

}


/**
 * Normalize a value to a nonnegative number.
 */
function normalizeNonNegative(

    value:number

):number {

    if(

        !Number.isFinite(

            value

        )

        ||

        value < 0

    ){

        return 0;

    }


    return value;

}


/**
 * Normalize a finite signed value.
 */
function normalizeFinite(

    value:number

):number {

    if(!Number.isFinite(value)){

        return 0;

    }


    return value;

}


/**
 * Clamp a score from 0 through 100.
 */
function clampScore(

    value:number

):number {

    if(!Number.isFinite(value)){

        return 0;

    }


    return Math.min(

        100,

        Math.max(

            0,

            value

        )

    );

}


/**
 * Round scores to one decimal place.
 */
function roundScore(

    value:number

):number {

    return Math.round(

        clampScore(

            value

        )

        *

        10

    )

    /

    10;

}


/**
 * Round operational values to two decimals.
 */
function roundValue(

    value:number

):number {

    return Math.round(

        value

        *

        100

    )

    /

    100;

}


/**
 * Format the magnitude of a projected bed deficit.
 */
function formatAbsoluteBedCount(

    value:number

):string {

    const absoluteValue =

        Math.abs(

            value

        );


    return Number.isInteger(

        absoluteValue

    )

        ? String(

            absoluteValue

        )

        : absoluteValue.toFixed(

            1

        );

}