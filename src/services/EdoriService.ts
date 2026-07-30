/**
 * EdoriService
 *
 * Core EDORI calculation engine.
 *
 * Converts operational conditions into
 * a 0-100 surge score.
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


import {

    calculateForecast

}

from "./ForecastService";





/**
 * Main EDORI calculation function.
 */
export function calculateEdori(

    assessment: SituationAssessment

): EdoriResult {



    /*
     * Calculate individual domains
     */

    const demandScore =
        calculateDemand(
            assessment
        );


    const boardingScore =
        calculateBoarding(
            assessment
        );


    const hospitalScore =
        calculateHospitalCapacity(
            assessment
        );


    const capacityScore =
        calculateClinicalCapacity(
            assessment
        );


    const acuityScore =
        calculateAcuity(
            assessment
        );


    const forecast =
        calculateForecast(
            assessment
        );



    /*
     * Weighted EDORI score
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



    const threshold =
        getThreshold(score);



    return {


        score,


        status:
            threshold.status,


        demandScore,


        boardingScore,


        hospitalScore,


        capacityScore,


        acuityScore,


        forecastScore:
            forecast.forecastScore,


        drivers:
            generateDrivers(
                assessment,
                forecast.forecastScore
            ),


        recommendations:
            generateRecommendations(
                score
            ),


        timestamp:
            new Date()

    };

}







/**
 * ED Demand Score
 *
 * Compares current volume
 * against historical expectation.
 */
function calculateDemand(

    assessment: SituationAssessment

): number {


    if (
        assessment.expectedVolume === 0
    ) {

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
 */
function calculateBoarding(

    assessment: SituationAssessment

): number {


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
 * Uses medical/surgical beds only.
 */
function calculateHospitalCapacity(

    assessment: SituationAssessment

): number {


    const occupancy =

        assessment.occupiedMedicalBeds

        /

        HOSPITAL.MEDICAL_BEDS;



    return Math.min(

        100,

        occupancy * 100

    );

}






/**
 * Clinical Capacity Score
 *
 * Evaluates staffing relative
 * to patient workload.
 */
function calculateClinicalCapacity(

    assessment: SituationAssessment

): number {


    const providers =

        assessment.currentRN

        +

        assessment.currentMD;



    if (
        providers === 0
    ) {

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
 */
function calculateAcuity(

    assessment: SituationAssessment

): number {


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



    if (
        assessment.totalEDVolume === 0
    ) {

        return 0;

    }


    const acuityRatio =

        weightedPatients

        /

        assessment.totalEDVolume;



    return Math.min(

        100,

        acuityRatio * 20

    );

}







/**
 * Converts differences into
 * 0-100 scores.
 */
function normalize(

    value:number,

    maximum:number

):number {


    if(value <= 0){

        return 0;

    }


    return Math.min(

        100,

        (value / maximum) * 100

    );

}







/**
 * Generates dashboard drivers.
 */
function generateDrivers(

    assessment: SituationAssessment,

    forecastScore:number

):Driver[] {


    const drivers:Driver[] = [];



    if(

        assessment.boardedPatients >

        assessment.expectedBoarders

    ){

        drivers.push({

            title:"Boarding",

            description:
            `Boarding exceeds expected volume by ${
                assessment.boardedPatients -
                assessment.expectedBoarders
            } patients.`,

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



    if(

        assessment.totalEDVolume >

        assessment.expectedVolume

    ){

        drivers.push({

            title:"ED Volume",

            description:
            "Emergency department volume exceeds historical expectation.",

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



    if(
        forecastScore > 50
    ){

        drivers.push({

            title:"Forecast",

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


    return drivers;

}







/**
 * Generates operational recommendations.
 */
function generateRecommendations(

    score:number

):string[] {


    if(score >= 70){

        return [

            "Escalate inpatient throughput review.",

            "Prepare additional surge capacity.",

            "Notify operational leadership."

        ];

    }


    if(score >= 40){

        return [

            "Monitor ED flow closely.",

            "Review discharge and admission barriers."

        ];

    }


    return [

        "Continue normal operations."

    ];

}