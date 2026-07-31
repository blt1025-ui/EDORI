/**
 * EdoriService
 *
 * Core EDORI calculation engine.
 *
 * Converts operational conditions into
 * a 0–100 surge score.
 *
 * Important:
 * - This service performs calculations only.
 * - It does not save snapshots.
 * - It does not emit events.
 * - It returns one authoritative EdoriResult.
 */

import type { SituationAssessment }
from "../types/SituationAssessment";

import type { EdoriResult }
from "../types/EdoriResult";

import type { Driver }
from "../types/Driver";

import { HOSPITAL }
from "../config/constants";

import { WEIGHTS }
from "../config/weights";

import { getThreshold }
from "../config/thresholds";

import { calculateForecast }
from "./ForecastService";


/**
 * Main EDORI calculation function.
 */
export function calculateEdori(

    assessment:SituationAssessment

):EdoriResult {

    /*
     * Calculate individual domains.
     */

    const demandScore = calculateDemand(

        assessment

    );


    const boardingScore = calculateBoarding(

        assessment

    );


    const hospitalScore = calculateHospitalCapacity(

        assessment

    );


    const capacityScore = calculateClinicalCapacity(

        assessment

    );


    const acuityScore = calculateAcuity(

        assessment

    );


    const forecast = calculateForecast(

        assessment

    );


    /*
     * Calculate weighted EDORI score.
     */

    const score = Math.round(

        demandScore * WEIGHTS.demand

        +

        boardingScore * WEIGHTS.boarding

        +

        hospitalScore * WEIGHTS.hospital

        +

        capacityScore * WEIGHTS.capacity

        +

        acuityScore * WEIGHTS.acuity

        +

        forecast.forecastScore * WEIGHTS.forecast

    );


    /*
     * Determine the operational state.
     */

    const threshold = getThreshold(

        score

    );


    const operationalState =

        threshold.operationalState;


    /*
     * Create one authoritative timestamp.
     */

    const timestamp = new Date();


    /*
     * Generate explanatory output.
     */

    const drivers = generateDrivers(

        assessment,

        forecast.forecastScore

    );


    const recommendations =

        generateRecommendations(

            score

        );


    return {

        score,

        status:
            operationalState.title,

        operationalState,

        demandScore,

        boardingScore,

        hospitalScore,

        capacityScore,

        acuityScore,

        forecastScore:
            forecast.forecastScore,

        drivers,

        recommendations,

        timestamp

    };

}


/**
 * ED Demand Score
 *
 * Compares current total ED volume
 * against the historical expected volume.
 */
function calculateDemand(

    assessment:SituationAssessment

):number {

    if(

        assessment.expectedVolume <= 0

    ){

        return 0;

    }


    const difference =

        assessment.totalEDVolume

        -

        assessment.expectedVolume;


    return normalize(

        difference,

        25

    );

}


/**
 * Boarding Score
 *
 * Compares current boarders with
 * the expected number of boarders.
 */
function calculateBoarding(

    assessment:SituationAssessment

):number {

    const difference =

        assessment.boardedPatients

        -

        assessment.expectedBoarders;


    return normalize(

        difference,

        25

    );

}


/**
 * Hospital Capacity Score
 *
 * Uses occupied medical beds divided by
 * the configured medical-bed denominator.
 */
function calculateHospitalCapacity(

    assessment:SituationAssessment

):number {

    if(

        HOSPITAL.MEDICAL_BEDS <= 0

    ){

        return 0;

    }


    const occupancy =

        assessment.occupiedMedicalBeds

        /

        HOSPITAL.MEDICAL_BEDS;


    return clampScore(

        occupancy * 100

    );

}


/**
 * Clinical Capacity Score
 *
 * Evaluates total ED volume relative to
 * combined nursing and physician coverage.
 */
function calculateClinicalCapacity(

    assessment:SituationAssessment

):number {

    const providers =

        assessment.currentRN

        +

        assessment.currentMD;


    if(providers <= 0){

        return 100;

    }


    const workload =

        assessment.totalEDVolume

        /

        providers;


    return normalize(

        workload - 3,

        10

    );

}


/**
 * Patient Acuity Score
 *
 * Uses weighted ESI distribution divided
 * by total ED volume.
 */
function calculateAcuity(

    assessment:SituationAssessment

):number {

    const weightedPatients =

        assessment.esi1 * 5

        +

        assessment.esi2 * 4

        +

        assessment.esi3 * 3

        +

        assessment.esi4 * 2

        +

        assessment.esi5;


    if(

        assessment.totalEDVolume <= 0

    ){

        return 0;

    }


    const acuityRatio =

        weightedPatients

        /

        assessment.totalEDVolume;


    return clampScore(

        acuityRatio * 20

    );

}


/**
 * Convert a positive value into a
 * normalized 0–100 score.
 */
function normalize(

    value:number,

    maximum:number

):number {

    if(

        value <= 0

        ||

        maximum <= 0

    ){

        return 0;

    }


    return clampScore(

        (

            value

            /

            maximum

        )

        * 100

    );

}


/**
 * Keep a score within the EDORI range.
 */
function clampScore(

    score:number

):number {

    if(!Number.isFinite(score)){

        return 0;

    }


    return Math.min(

        100,

        Math.max(

            0,

            score

        )

    );

}


/**
 * Generate dashboard drivers.
 */
function generateDrivers(

    assessment:SituationAssessment,

    forecastScore:number

):Driver[] {

    const drivers:Driver[] = [];


    addBoardingDriver(

        drivers,

        assessment

    );


    addDemandDriver(

        drivers,

        assessment

    );


    addHospitalCapacityDriver(

        drivers,

        assessment

    );


    addClinicalCapacityDriver(

        drivers,

        assessment

    );


    addForecastDriver(

        drivers,

        forecastScore

    );


    return drivers;

}


/**
 * Add boarding as a driver when current
 * boarding exceeds expected boarding.
 */
function addBoardingDriver(

    drivers:Driver[],

    assessment:SituationAssessment

):void {

    if(

        assessment.boardedPatients

        <=

        assessment.expectedBoarders

    ){

        return;

    }


    const difference =

        assessment.boardedPatients

        -

        assessment.expectedBoarders;


    drivers.push({

        title:
            "Boarding",

        description:
            `Boarding exceeds expected volume by ${difference} patients.`,

        severity:
            calculateBoarding(

                assessment

            ),

        currentValue:
            assessment.boardedPatients,

        expectedValue:
            assessment.expectedBoarders

    });

}


/**
 * Add ED volume as a driver when current
 * volume exceeds expected volume.
 */
function addDemandDriver(

    drivers:Driver[],

    assessment:SituationAssessment

):void {

    if(

        assessment.expectedVolume <= 0

        ||

        assessment.totalEDVolume

        <=

        assessment.expectedVolume

    ){

        return;

    }


    const difference =

        assessment.totalEDVolume

        -

        assessment.expectedVolume;


    drivers.push({

        title:
            "ED Volume",

        description:
            `Emergency department volume exceeds historical expectation by ${difference} patients.`,

        severity:
            calculateDemand(

                assessment

            ),

        currentValue:
            assessment.totalEDVolume,

        expectedValue:
            assessment.expectedVolume

    });

}


/**
 * Add hospital occupancy as a driver when
 * occupancy reaches a high operational level.
 */
function addHospitalCapacityDriver(

    drivers:Driver[],

    assessment:SituationAssessment

):void {

    const hospitalScore =

        calculateHospitalCapacity(

            assessment

        );


    if(hospitalScore < 85){

        return;

    }


    drivers.push({

        title:
            "Hospital Capacity",

        description:
            `Medical-bed occupancy is ${Math.round(hospitalScore)}%.`,

        severity:
            hospitalScore,

        currentValue:
            assessment.occupiedMedicalBeds,

        expectedValue:
            Math.round(

                HOSPITAL.MEDICAL_BEDS * 0.85

            )

    });

}


/**
 * Add clinical capacity when workload relative
 * to providers creates meaningful strain.
 */
function addClinicalCapacityDriver(

    drivers:Driver[],

    assessment:SituationAssessment

):void {

    const capacityScore =

        calculateClinicalCapacity(

            assessment

        );


    if(capacityScore < 40){

        return;

    }


    const currentProviders =

        assessment.currentRN

        +

        assessment.currentMD;


    const expectedProviders =

        assessment.expectedRN

        +

        assessment.expectedMD;


    drivers.push({

        title:
            "Clinical Capacity",

        description:
            "Current patient workload is high relative to available nursing and physician coverage.",

        severity:
            capacityScore,

        currentValue:
            currentProviders,

        expectedValue:
            expectedProviders

    });

}


/**
 * Add forecast strain when forecast score
 * exceeds the threshold.
 */
function addForecastDriver(

    drivers:Driver[],

    forecastScore:number

):void {

    if(forecastScore <= 50){

        return;

    }


    drivers.push({

        title:
            "Forecast",

        description:
            "Projected conditions indicate increasing operational strain.",

        severity:
            forecastScore,

        currentValue:
            forecastScore,

        expectedValue:
            50

    });

}


/**
 * Generate basic operational recommendations.
 *
 * RecommendationService may generate a more
 * detailed prioritized action list elsewhere.
 */
function generateRecommendations(

    score:number

):string[] {

    if(score >= 85){

        return [

            "Activate hospital-wide surge response.",

            "Escalate inpatient throughput barriers to executive leadership.",

            "Prepare immediate additional clinical and treatment capacity.",

            "Reassess EDORI conditions frequently."

        ];

    }


    if(score >= 70){

        return [

            "Escalate inpatient throughput review.",

            "Prepare additional surge capacity.",

            "Notify operational leadership.",

            "Increase assessment frequency."

        ];

    }


    if(score >= 55){

        return [

            "Review hospital throughput barriers.",

            "Evaluate additional ED and inpatient capacity options.",

            "Monitor staffing alignment with current workload."

        ];

    }


    if(score >= 40){

        return [

            "Monitor ED flow closely.",

            "Review discharge and admission barriers.",

            "Prepare for possible operational escalation."

        ];

    }


    if(score >= 25){

        return [

            "Increase operational awareness.",

            "Monitor volume, boarding, staffing, and hospital occupancy."

        ];

    }


    return [

        "Continue normal operations.",

        "Maintain routine operational monitoring."

    ];

}