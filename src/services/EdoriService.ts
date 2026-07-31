/**
 * EdoriService
 *
 * Core EDORI calculation engine.
 *
 * Converts operational conditions into
 * a 0–100 operational readiness score.
 *
 * Active scoring domains:
 *
 * - ED demand
 * - Boarding
 * - Hospital capacity
 * - Patient acuity
 * - Forecast
 *
 * Nursing and provider staffing are not
 * included in the EDORI calculation.
 *
 * This service:
 *
 * - Performs calculations only
 * - Does not save snapshots
 * - Does not emit events
 * - Does not update application state
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
 * Calculate the authoritative EDORI result.
 */
export function calculateEdori(

    assessment:SituationAssessment

):EdoriResult {

    /*
     * Calculate the active scoring domains.
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


    const acuityScore = calculateAcuity(

        assessment

    );


    const forecast = calculateForecast(

        assessment

    );


    /*
     * Weighted EDORI score.
     *
     * Staffing is intentionally excluded.
     */

    const rawScore =

        demandScore * WEIGHTS.demand

        +

        boardingScore * WEIGHTS.boarding

        +

        hospitalScore * WEIGHTS.hospital

        +

        acuityScore * WEIGHTS.acuity

        +

        forecast.forecastScore * WEIGHTS.forecast;


    const score = Math.round(

        clampScore(

            rawScore

        )

    );


    const threshold = getThreshold(

        score

    );


    const operationalState =

        threshold.operationalState;


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

        acuityScore,

        forecastScore:
            forecast.forecastScore,

        drivers,

        recommendations,

        timestamp:
            new Date()

    };

}


/**
 * ED Demand
 *
 * Measures current ED volume above the
 * historical expectation for the same
 * weekday and hour.
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
 * Boarding
 *
 * Measures current boarding above the
 * historical expectation.
 */
function calculateBoarding(

    assessment:SituationAssessment

):number {

    if(

        assessment.expectedBoarders < 0

    ){

        return 0;

    }


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
 * Hospital Capacity
 *
 * Uses occupied medical beds divided by the
 * configured medical-bed denominator.
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
 * Patient Acuity
 *
 * Uses a weighted ESI distribution divided
 * by total ED volume.
 */
function calculateAcuity(

    assessment:SituationAssessment

):number {

    if(

        assessment.totalEDVolume <= 0

    ){

        return 0;

    }


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


    const acuityRatio =

        weightedPatients

        /

        assessment.totalEDVolume;


    return clampScore(

        acuityRatio * 20

    );

}


/**
 * Convert a positive variance into a
 * normalized 0–100 score.
 */
function normalize(

    value:number,

    maximum:number

):number {

    if(

        !Number.isFinite(value)

        ||

        !Number.isFinite(maximum)

        ||

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
 * Keep a value within 0–100.
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
 * Generate operational drivers.
 *
 * Staffing is intentionally excluded.
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


    addAcuityDriver(

        drivers,

        assessment

    );


    addForecastDriver(

        drivers,

        forecastScore

    );


    return drivers.sort(

        (

            first,

            second

        ) => second.severity - first.severity

    );

}


/**
 * Add boarding as a driver.
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
            `Boarding exceeds the historical expectation by ${difference} patients.`,

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
 * Add ED volume as a driver.
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
            `Emergency department volume exceeds the historical expectation by ${difference} patients.`,

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
 * Add hospital occupancy as a driver.
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
 * Add patient acuity as a driver.
 */
function addAcuityDriver(

    drivers:Driver[],

    assessment:SituationAssessment

):void {

    const acuityScore = calculateAcuity(

        assessment

    );


    if(acuityScore < 60){

        return;

    }


    const highAcuityPatients =

        assessment.esi1

        +

        assessment.esi2;


    drivers.push({

        title:
            "Patient Acuity",

        description:
            "The current ESI distribution indicates elevated clinical complexity.",

        severity:
            acuityScore,

        currentValue:
            highAcuityPatients,

        expectedValue:
            Math.round(

                assessment.totalEDVolume * 0.20

            )

    });

}


/**
 * Add forecast strain as a driver.
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
            "Projected arrivals and departures indicate increasing operational strain.",

        severity:
            clampScore(

                forecastScore

            ),

        currentValue:
            forecastScore,

        expectedValue:
            50

    });

}


/**
 * Generate basic score-level recommendations.
 */
function generateRecommendations(

    score:number

):string[] {

    if(score >= 85){

        return [

            "Activate hospital-wide surge response.",

            "Escalate inpatient throughput barriers to executive leadership.",

            "Prepare immediate additional treatment and boarding capacity.",

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

            "Monitor projected arrivals and departures."

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

            "Monitor volume, boarding, acuity, and hospital occupancy."

        ];

    }


    return [

        "Continue normal operations.",

        "Maintain routine operational monitoring."

    ];

}