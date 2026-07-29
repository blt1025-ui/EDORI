import { calculateForecast }
from "./ForecastService";

import type { SituationAssessment } from "../types/SituationAssessment";
import type { EdoriResult } from "../types/EdoriResult";
import type { HistoricalRecord } from "../types/HistoricalRecord";


/*
====================================================
EDORI CONFIGURATION
====================================================
These values will eventually move to a configuration
file so they can be calibrated using historical data.
====================================================
*/

const EDORI_WEIGHTS = {

    demand: 0.25,

    boarding: 0.25,

    hospital: 0.15,

    capacity: 0.20,

    complexity: 0.10,

    forecast: 0.05

};


/*
====================================================
DEMAND SCORE
====================================================

Measures deviation from expected ED volume.

0-100 scale

50 = expected volume

Higher = worse than expected

====================================================
*/

function calculateDemandScore(

    currentVolume:number,

    expectedVolume:number

):number {


    if (!expectedVolume || expectedVolume <= 0)
        return 50;


    const difference =
        currentVolume - expectedVolume;


    const score =
        50 + (difference * 3);


    return Math.max(
        0,
        Math.min(
            score,
            100
        )
    );

}



/*
====================================================
BOARDING SCORE
====================================================

Measures boarding above expected baseline.

====================================================
*/


function calculateBoardingScore(

    currentBoarders:number,

    expectedBoarders:number

):number {


    if (!expectedBoarders || expectedBoarders <= 0)
        return 50;


    const difference =
        currentBoarders - expectedBoarders;


    const score =
        50 + (difference * 4);


    return Math.max(
        0,
        Math.min(
            score,
            100
        )
    );

}



/*
====================================================
HOSPITAL THROUGHPUT SCORE
====================================================

Measures inpatient bed strain.

Uses 273 medical beds.

====================================================
*/


function calculateHospitalScore(

    occupiedMedicalBeds:number

):number {


    const occupancy =
        occupiedMedicalBeds / 273;


    /*
    Expected:
    <85% = lower concern
    >95% = increasing concern
    */

    const score =
        (occupancy - 0.85) * 300;


    return Math.max(

        0,

        Math.min(

            100,

            50 + score

        )

    );

}



/*
====================================================
ACUITY SCORE
====================================================

Calculates weighted patient complexity.

ESI weights:
1 = 5
2 = 4
3 = 3
4 = 2
5 = 1

====================================================
*/


function calculateComplexityScore(

    esi1:number,

    esi2:number,

    esi3:number,

    esi4:number,

    esi5:number

):number {


    const acuityUnits =

        (esi1 * 5) +

        (esi2 * 4) +

        (esi3 * 3) +

        (esi4 * 2) +

        (esi5 * 1);



    /*
    100 acuity units = moderate workload

    This will be calibrated later.
    */

    const score =
        acuityUnits;


    return Math.max(

        0,

        Math.min(

            score,

            100

        )

    );

}



/*
====================================================
CLINICAL CAPACITY SCORE
====================================================

Compares available clinicians
against expected staffing.

Adjusted by acuity burden.

====================================================
*/


function calculateCapacityScore(

    currentRN:number,

    expectedRN:number,

    currentMD:number,

    expectedMD:number,

    acuityScore:number

):number {


    if (

        expectedRN <=0 ||
        expectedMD <=0

    )

        return 50;



    const rnRatio =
        currentRN / expectedRN;


    const mdRatio =
        currentMD / expectedMD;



    const staffingRatio =

        (

            (rnRatio * 0.6)

            +

            (mdRatio * 0.4)

        );



    let score =

        100 -

        (staffingRatio * 100);



    /*
    Increase concern when
    acuity is high.

    */

    score +=

        acuityScore * 0.25;



    return Math.max(

        0,

        Math.min(

            score,

            100

        )

    );

}



/*
====================================================
FORECAST SCORE
====================================================

Predicts near future strain.

Current formula:

Arrivals - Departures

====================================================
*/


function calculateForecastScore(

    arrivals:number,

    departures:number

):number {


    const netChange =

        arrivals - departures;



    const score =

        50 + (netChange * 5);



    return Math.max(

        0,

        Math.min(

            score,

            100

        )

    );

}



/*
====================================================
STATUS CLASSIFICATION
====================================================
*/


function determineStatus(

    score:number

):string {


    if(score < 25)

        return "Normal Operations";


    if(score < 40)

        return "Increasing Demand";


    if(score < 55)

        return "Operational Strain";


    if(score < 70)

        return "High Surge Conditions";


    return "Crisis Operations";

}



/*
====================================================
MAIN EDORI CALCULATION
====================================================
*/


export function calculateEDORI(

    assessment:SituationAssessment,

    historical:HistoricalRecord

):EdoriResult {



    const demandScore =

        calculateDemandScore(

            assessment.totalEDVolume,

            historical.expectedVolume

        );



    const boardingScore =

        calculateBoardingScore(

            assessment.boardedPatients,

            historical.expectedBoarders

        );



    const hospitalScore =

        calculateHospitalScore(

            assessment.occupiedMedicalBeds

        );



    const complexityScore =

        calculateComplexityScore(

            assessment.esi1,

            assessment.esi2,

            assessment.esi3,

            assessment.esi4,

            assessment.esi5

        );



    const capacityScore =

        calculateCapacityScore(

            assessment.currentRN,

            historical.expectedRN,

            assessment.currentMD,

            historical.expectedMD,

            complexityScore

        );



    const forecast =

calculateForecast(

    assessment.totalEDVolume,

    historical.expectedArrivals,

    historical.expectedDepartures

);


const forecastScore =

forecast.riskScore;




    const overallScore = Math.round(

        (demandScore *
            EDORI_WEIGHTS.demand)

        +

        (boardingScore *
            EDORI_WEIGHTS.boarding)

        +

        (hospitalScore *
            EDORI_WEIGHTS.hospital)

        +

        (capacityScore *
            EDORI_WEIGHTS.capacity)

        +

        (complexityScore *
            EDORI_WEIGHTS.complexity)

        +

        (forecastScore *
            EDORI_WEIGHTS.forecast)

    );



    return {


        overallScore,


        status:

            determineStatus(
                overallScore
            ),


        demandScore,


        boardingScore,


        hospitalScore,


        capacityScore,


        complexityScore,


        forecastScore


    };

}