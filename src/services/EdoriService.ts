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



import {

    HOSPITAL

}

from "../config/constants";



import {

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



import {

    saveSnapshot,

    shouldCreateSnapshot

}

from "./SnapshotService";








export function calculateEdori(

    assessment:SituationAssessment

):EdoriResult {



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

        getThreshold(

            score

        );







    const snapshot = {


        score,


        status:

            threshold.status,


        operationalState:

            threshold.state,


        timestamp:

            new Date()


    };






    if(

        shouldCreateSnapshot(

            snapshot

        )

    ){

        saveSnapshot(

            snapshot

        );

    }







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









function calculateDemand(

    assessment:SituationAssessment

):number {


    if(

        assessment.expectedVolume === 0

    ){

        return 0;

    }



    return normalize(

        assessment.totalEDVolume -

        assessment.expectedVolume,

        25

    );

}









function calculateBoarding(

    assessment:SituationAssessment

):number {


    return normalize(

        assessment.boardedPatients -

        assessment.expectedBoarders,

        25

    );

}









function calculateHospitalCapacity(

    assessment:SituationAssessment

):number {


    const occupancy =

        assessment.occupiedMedicalBeds /

        HOSPITAL.MEDICAL_BEDS;



    return Math.min(

        100,

        occupancy * 100

    );

}









function calculateClinicalCapacity(

    assessment:SituationAssessment

):number {


    const providers =

        assessment.currentRN +

        assessment.currentMD;




    if(providers === 0){

        return 100;

    }





    return normalize(

        assessment.totalEDVolume /

        providers - 3,

        10

    );

}









function calculateAcuity(

    assessment:SituationAssessment

):number {


    const weightedPatients =

        assessment.esi1 * 5 +

        assessment.esi2 * 4 +

        assessment.esi3 * 3 +

        assessment.esi4 * 2 +

        assessment.esi5;




    if(

        assessment.totalEDVolume === 0

    ){

        return 0;

    }



    return Math.min(

        100,

        (

            weightedPatients /

            assessment.totalEDVolume

        )

        *20

    );

}









function normalize(

    value:number,

    maximum:number

):number {


    if(value <=0){

        return 0;

    }



    return Math.min(

        100,

        (

            value /

            maximum

        )

        *100

    );

}









function generateDrivers(

    assessment:SituationAssessment,

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









function generateRecommendations(

    score:number

):string[] {



    if(score >=70){


        return [

            "Escalate inpatient throughput review.",

            "Prepare additional surge capacity.",

            "Notify operational leadership."

        ];


    }





    if(score >=40){


        return [

            "Monitor ED flow closely.",

            "Review discharge and admission barriers."

        ];


    }






    return [

        "Continue normal operations."

    ];

}