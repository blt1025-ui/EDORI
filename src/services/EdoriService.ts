/**
 * EdoriService
 *
 * Pure EDORI calculation service.
 *
 * Input:
 * A complete validated SituationAssessment.
 *
 * Output:
 * One EdoriResult.
 *
 * This service does not:
 *
 * - Read application state
 * - Modify application state
 * - Save browser data
 * - Save snapshots
 * - Emit events
 * - Update the dashboard
 */

import {

    areWeightsValid,

    WEIGHTS

}

from "../config/weights";


import {

    getThreshold

}

from "../config/thresholds";


import {

    calculateForecast

}

from "./ForecastService";


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


/**
 * Maximum positive variance used to normalize
 * demand and boarding scores.
 *
 * These values can be recalibrated later during
 * operational scenario testing.
 */
const DEMAND_VARIANCE_AT_MAXIMUM_SCORE = 25;

const BOARDING_VARIANCE_AT_MAXIMUM_SCORE = 25;


/**
 * Hospital occupancy below this level does not
 * generate a primary driver.
 */
const HOSPITAL_DRIVER_THRESHOLD = 85;


/**
 * Acuity scores below this level do not generate
 * a primary driver.
 */
const ACUITY_DRIVER_THRESHOLD = 60;


/**
 * Forecast scores at or below this level do not
 * generate a primary driver.
 */
const FORECAST_DRIVER_THRESHOLD = 50;


/**
 * Calculate one authoritative EDORI result.
 *
 * The caller is responsible for validating the
 * assessment before invoking this function.
 */
export function calculateEdori(

    assessment:SituationAssessment

):EdoriResult {

    assertValidWeights();


    const demandScore = calculateDemandScore(

        assessment

    );


    const boardingScore = calculateBoardingScore(

        assessment

    );


    const hospitalScore = calculateHospitalScore(

        assessment

    );


    const acuityScore = calculateAcuityScore(

        assessment

    );


    const forecastResult = calculateForecast(

        assessment

    );


    const forecastScore = clampScore(

        forecastResult.forecastScore

    );


    const weightedScore =

        demandScore * WEIGHTS.demand

        +

        boardingScore * WEIGHTS.boarding

        +

        hospitalScore * WEIGHTS.hospital

        +

        acuityScore * WEIGHTS.acuity

        +

        forecastScore * WEIGHTS.forecast;


    const score = Math.round(

        clampScore(

            weightedScore

        )

    );


    const threshold = getThreshold(

        score

    );


    const operationalState = {

        ...threshold.operationalState

    };


    const drivers = generateDrivers(

        assessment,

        {

            demandScore,

            boardingScore,

            hospitalScore,

            acuityScore,

            forecastScore

        }

    );


    const recommendations =

        generateScoreRecommendations(

            score

        );


    return {

        score,

        status:
            operationalState.title,

        operationalState,

        demandScore:
            roundDomainScore(

                demandScore

            ),

        boardingScore:
            roundDomainScore(

                boardingScore

            ),

        hospitalScore:
            roundDomainScore(

                hospitalScore

            ),

        acuityScore:
            roundDomainScore(

                acuityScore

            ),

        forecastScore:
            roundDomainScore(

                forecastScore

            ),

        drivers,

        recommendations,

        timestamp:
            new Date()

    };

}


/**
 * Calculate current ED demand relative to
 * historical expected ED volume.
 *
 * Conditions at or below expected volume
 * contribute no demand-strain score.
 */
function calculateDemandScore(

    assessment:SituationAssessment

):number {

    if(assessment.expectedVolume <= 0){

        return 0;

    }


    const positiveVariance = Math.max(

        0,

        assessment.totalEDVolume

        -

        assessment.expectedVolume

    );


    return normalizePositiveVariance(

        positiveVariance,

        DEMAND_VARIANCE_AT_MAXIMUM_SCORE

    );

}


/**
 * Calculate boarding strain relative to the
 * historical boarding expectation.
 *
 * Boarding at or below the expected baseline
 * contributes no excess-boarding score.
 */
function calculateBoardingScore(

    assessment:SituationAssessment

):number {

    const positiveVariance = Math.max(

        0,

        assessment.boardedPatients

        -

        assessment.expectedBoarders

    );


    return normalizePositiveVariance(

        positiveVariance,

        BOARDING_VARIANCE_AT_MAXIMUM_SCORE

    );

}


/**
 * Calculate medical-bed occupancy.
 *
 * The configured denominator is expected to
 * represent usable medical beds rather than
 * total licensed hospital beds.
 */
function calculateHospitalScore(

    assessment:SituationAssessment

):number {

    if(

        !Number.isFinite(

            assessment.staffedMedicalBeds

        )

        ||

        assessment.staffedMedicalBeds <= 0

    ){

        return 0;

    }


    const occupancyPercentage =

        assessment.occupiedMedicalBeds

        /

        assessment.staffedMedicalBeds

        *

        100;


    return clampScore(

        occupancyPercentage

    );

}


/**
 * Calculate the current patient-acuity score.
 *
 * ESI weighting:
 *
 * ESI 1 = 5
 * ESI 2 = 4
 * ESI 3 = 3
 * ESI 4 = 2
 * ESI 5 = 1
 *
 * The weighted acuity burden is divided by
 * total ED volume and converted to 0–100.
 */
function calculateAcuityScore(

    assessment:SituationAssessment

):number {

    const assignedEsiCount =

        assessment.esi1

        +

        assessment.esi2

        +

        assessment.esi3

        +

        assessment.esi4

        +

        assessment.esi5;


    /*
     * Acuity cannot be calculated when no patients
     * currently have an assigned ESI.
     */

    if(assignedEsiCount <= 0){

        return 0;

    }


    const weightedAcuityBurden =

        assessment.esi1 * 5

        +

        assessment.esi2 * 4

        +

        assessment.esi3 * 3

        +

        assessment.esi4 * 2

        +

        assessment.esi5;


    /*
     * Calculate acuity using only patients with an
     * assigned ESI.
     *
     * Patients without an assigned ESI continue to
     * contribute to total ED demand but do not receive
     * an artificial acuity weight of zero.
     */

    const averageAcuityWeight =

        weightedAcuityBurden

        /

        assignedEsiCount;


    /*
     * Maximum possible average weight is 5.
     *
     * Multiplying by 20 converts:
     *
     * 1.0 → 20
     * 2.0 → 40
     * 3.0 → 60
     * 4.0 → 80
     * 5.0 → 100
     */

    return clampScore(

        averageAcuityWeight * 20

    );

}


/**
 * Normalize a positive variance to 0–100.
 */
function normalizePositiveVariance(

    variance:number,

    varianceAtMaximumScore:number

):number {

    if(

        !Number.isFinite(

            variance

        )

        ||

        !Number.isFinite(

            varianceAtMaximumScore

        )

        ||

        variance <= 0

        ||

        varianceAtMaximumScore <= 0

    ){

        return 0;

    }


    return clampScore(

        variance

        /

        varianceAtMaximumScore

        *

        100

    );

}


/**
 * Create primary operational drivers.
 */
function generateDrivers(

    assessment:SituationAssessment,

    scores:{

        demandScore:number;

        boardingScore:number;

        hospitalScore:number;

        acuityScore:number;

        forecastScore:number;

    }

):Driver[] {

    const drivers:Driver[] = [];


    addDemandDriver(

        drivers,

        assessment,

        scores.demandScore

    );


    addBoardingDriver(

        drivers,

        assessment,

        scores.boardingScore

    );


    addHospitalDriver(

        drivers,

        assessment,

        scores.hospitalScore

    );


    addAcuityDriver(

        drivers,

        assessment,

        scores.acuityScore

    );


    addForecastDriver(

        drivers,

        scores.forecastScore

    );


    return drivers

        .sort(

            (

                first,

                second

            ) =>

                second.severity

                -

                first.severity

        )

        .map(

            driver => ({

                ...driver

            })

        );

}


/**
 * Add an ED-volume driver.
 */
function addDemandDriver(

    drivers:Driver[],

    assessment:SituationAssessment,

    severity:number

):void {

    if(

        assessment.totalEDVolume

        <=

        assessment.expectedVolume

    ){

        return;

    }


    const variance = roundDisplayNumber(

        assessment.totalEDVolume

        -

        assessment.expectedVolume

    );


    drivers.push({

        title:
            "ED Volume",

        description:
            `Total ED volume is ${variance} patients above the historical expectation.`,

        severity:
            roundDomainScore(

                severity

            ),

        currentValue:
            assessment.totalEDVolume,

        expectedValue:
            assessment.expectedVolume

    });

}


/**
 * Add an excess-boarding driver.
 */
function addBoardingDriver(

    drivers:Driver[],

    assessment:SituationAssessment,

    severity:number

):void {

    if(

        assessment.boardedPatients

        <=

        assessment.expectedBoarders

    ){

        return;

    }


    const variance = roundDisplayNumber(

        assessment.boardedPatients

        -

        assessment.expectedBoarders

    );


    drivers.push({

        title:
            "Boarding",

        description:
            `Boarding is ${variance} patients above the historical expectation.`,

        severity:
            roundDomainScore(

                severity

            ),

        currentValue:
            assessment.boardedPatients,

        expectedValue:
            assessment.expectedBoarders

    });

}


/**
 * Add a hospital-capacity driver.
 */
function addHospitalDriver(

    drivers:Driver[],

    assessment:SituationAssessment,

    severity:number

):void {

    if(severity < HOSPITAL_DRIVER_THRESHOLD){

        return;

    }


    drivers.push({

        title:
            "Hospital Capacity",

        description:
            `Medical-bed occupancy is ${Math.round(severity)}%.`,

        severity:
            roundDomainScore(

                severity

            ),

        currentValue:
            assessment.occupiedMedicalBeds,

        expectedValue:
            Math.round(

                assessment.staffedMedicalBeds

                *

                HOSPITAL_DRIVER_THRESHOLD

                /

                100

            )

    });

}


/**
 * Add a patient-acuity driver.
 */
function addAcuityDriver(

    drivers:Driver[],

    assessment:SituationAssessment,

    severity:number

):void {

    if(severity < ACUITY_DRIVER_THRESHOLD){

        return;

    }


    const highAcuityCount =

        assessment.esi1

        +

        assessment.esi2;


    drivers.push({

        title:
            "Patient Acuity",

        description:
            `${highAcuityCount} current ED patients are categorized as ESI 1 or ESI 2.`,

        severity:
            roundDomainScore(

                severity

            ),

        currentValue:
            highAcuityCount,

        expectedValue:
            roundDisplayNumber(

                assessment.totalEDVolume

                *

                0.20

            )

    });

}


/**
 * Add a forecast driver.
 */
/**
 * Add a near-term forecast driver.
 */
function addForecastDriver(

    drivers:Driver[],

    severity:number

):void {

    if(severity <= FORECAST_DRIVER_THRESHOLD){

        return;

    }


    drivers.push({

        title:
            "Near-Term Flow",

        description:
            "Expected arrivals exceed expected departures, indicating likely near-term growth in ED census.",

        severity:
            roundDomainScore(

                severity

            ),

        currentValue:
            roundDomainScore(

                severity

            ),

        expectedValue:
            FORECAST_DRIVER_THRESHOLD

    });

}


/**
 * Create broad score-level recommendations.
 *
 * Driver-specific recommendations remain the
 * responsibility of RecommendationService.
 */
function generateScoreRecommendations(

    score:number

):string[] {

    if(score >= 85){

        return [

            "Activate the highest-level hospital surge response.",

            "Escalate inpatient throughput barriers to executive leadership.",

            "Prepare immediate additional treatment and boarding capacity.",

            "Reassess EDORI conditions at frequent intervals."

        ];

    }


    if(score >= 70){

        return [

            "Escalate inpatient throughput review.",

            "Prepare additional surge capacity.",

            "Notify operational leadership.",

            "Increase EDORI assessment frequency."

        ];

    }


    if(score >= 55){

        return [

            "Review hospital throughput barriers.",

            "Evaluate additional ED and inpatient capacity options.",

            "Monitor expected arrivals and departures closely."

        ];

    }


    if(score >= 40){

        return [

            "Increase operational monitoring.",

            "Review discharge and admission barriers.",

            "Prepare for possible escalation."

        ];

    }


    if(score >= 25){

        return [

            "Increase operational awareness.",

            "Monitor ED volume, boarding, acuity, and hospital occupancy."

        ];

    }


    return [

        "Continue routine operations.",

        "Maintain standard operational monitoring."

    ];

}


/**
 * Confirm domain weights total 1.00.
 */
function assertValidWeights():void {

    if(areWeightsValid()){

        return;

    }


    throw new Error(

        "EDORI domain weights must total 1.00."

    );

}


/**
 * Keep a score between 0 and 100.
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
 * Round a domain score for storage and display.
 */
function roundDomainScore(

    value:number

):number {

    return Math.round(

        clampScore(

            value

        )

        *

        10

    ) / 10;

}


/**
 * Round values used in driver descriptions.
 */
function roundDisplayNumber(

    value:number

):number {

    return Math.round(

        value * 10

    ) / 10;

}