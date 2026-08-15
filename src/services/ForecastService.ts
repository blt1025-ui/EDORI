/**
 * ForecastService
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Pure four-hour hospital-capacity forecast.
 *
 * This service mirrors the authoritative Version 2.1
 * demand model used by EdoriService.
 */

import type {

    SituationAssessment

}

from "../types/SituationAssessment";


export interface ForecastResult {

    currentAvailableBeds:number;

    expectedHospitalInflow:number;

    expectedInpatientDepartures:number;

    historicalNetFlow:number;

    currentKnownHospitalInflow:number;

    inflowVariance:number;

    projectedHospitalInflow:number;

    projectedTotalBedDemand:number;

    historicalProjectedBedDemand:number;

    historicalProjectedBedBalance:number;

    projectedCapacityVariance:number;

    projectedAvailableBeds:number;

    direction:

        | "Improving"

        | "Stable"

        | "Tightening"

        | "Deficit";

    description:string;

}


export function calculateForecast(

    assessment:SituationAssessment

):ForecastResult {

    const staffedAcuteCareBeds =

        normalizeHistoricalValue(

            assessment.staffedAcuteCareBeds

        );


    const occupiedAcuteCareBeds =

        normalizeHistoricalValue(

            assessment.occupiedAcuteCareBeds

        );


    const currentAvailableBeds =

        roundValue(

            staffedAcuteCareBeds

            -

            occupiedAcuteCareBeds

        );


    const expectedEDAdmissions =

        normalizeHistoricalValue(

            assessment.expectedEDAdmissions4h

        );


    const expectedDirectAdmissions =

        normalizeHistoricalValue(

            assessment.expectedDirectAdmissions4h

        );


    const expectedSurgicalAdmissions =

        normalizeHistoricalValue(

            assessment.expectedSurgicalAdmissions4h

        );


    const expectedHospitalInflow =

        roundValue(

            expectedEDAdmissions

            +

            expectedDirectAdmissions

            +

            expectedSurgicalAdmissions

        );


    const expectedNonEDInflow =

        roundValue(

            expectedDirectAdmissions

            +

            expectedSurgicalAdmissions

        );


    const expectedInpatientDepartures =

        normalizeHistoricalValue(

            assessment.expectedInpatientDepartures4h

        );


    const historicalNetFlow =

        roundValue(

            expectedHospitalInflow

            -

            expectedInpatientDepartures

        );


    const currentDirectAdmissions =

        normalizeHistoricalValue(

            assessment.currentDirectAdmissions

        );


    const currentSurgicalAdmissions =

        normalizeHistoricalValue(

            assessment.currentSurgicalAdmissions

        );


    const currentKnownHospitalInflow =

        roundValue(

            currentDirectAdmissions

            +

            currentSurgicalAdmissions

        );


    const inflowVariance =

        roundValue(

            currentKnownHospitalInflow

            -

            expectedNonEDInflow

        );


    const projectedDirectAdmissions =

        roundValue(

            Math.max(

                currentDirectAdmissions,

                expectedDirectAdmissions

            )

        );


    const projectedSurgicalAdmissions =

        roundValue(

            Math.max(

                currentSurgicalAdmissions,

                expectedSurgicalAdmissions

            )

        );


    const projectedHospitalInflow =

        roundValue(

            expectedEDAdmissions

            +

            projectedDirectAdmissions

            +

            projectedSurgicalAdmissions

        );


    const currentBoarders =

        normalizeHistoricalValue(

            assessment.boardedPatients

        );


    const projectedTotalBedDemand =

        roundValue(

            currentBoarders

            +

            projectedHospitalInflow

        );


    const projectedAvailableBeds =

        roundValue(

            currentAvailableBeds

            +

            expectedInpatientDepartures

            -

            projectedTotalBedDemand

        );


    const historicalProjectedBedDemand =

        normalizeHistoricalValue(

            assessment.historicalProjectedBedDemand4h

        );


    const historicalProjectedBedBalance =

        normalizeSignedHistoricalValue(

            assessment.historicalProjectedBedBalance4h

        );


    const projectedCapacityVariance =

        roundValue(

            projectedAvailableBeds

            -

            historicalProjectedBedBalance

        );


    const direction =

        getForecastDirection(

            projectedAvailableBeds,

            projectedCapacityVariance

        );


    return {

        currentAvailableBeds,

        expectedHospitalInflow,

        expectedInpatientDepartures,

        historicalNetFlow,

        currentKnownHospitalInflow,

        inflowVariance,

        projectedHospitalInflow,

        projectedTotalBedDemand,

        historicalProjectedBedDemand,

        historicalProjectedBedBalance,

        projectedCapacityVariance,

        projectedAvailableBeds,

        direction,

        description:
            createForecastDescription(

                currentAvailableBeds,

                currentBoarders,

                expectedEDAdmissions,

                currentDirectAdmissions,

                currentSurgicalAdmissions,

                projectedDirectAdmissions,

                projectedSurgicalAdmissions,

                projectedHospitalInflow,

                projectedTotalBedDemand,

                expectedInpatientDepartures,

                projectedAvailableBeds,

                historicalProjectedBedBalance,

                projectedCapacityVariance,

                direction

            )

    };

}


function getForecastDirection(

    projectedAvailableBeds:number,

    projectedCapacityVariance:number

):

    | "Improving"

    | "Stable"

    | "Tightening"

    | "Deficit" {

    if(projectedCapacityVariance <= -5){

        return projectedAvailableBeds < 0

            ? "Deficit"

            : "Tightening";

    }


    if(projectedCapacityVariance >= 5){

        return "Improving";

    }


    return "Stable";

}


function createForecastDescription(

    currentAvailableBeds:number,

    currentBoarders:number,

    expectedEDAdmissions:number,

    currentDirectAdmissions:number,

    currentSurgicalAdmissions:number,

    projectedDirectAdmissions:number,

    projectedSurgicalAdmissions:number,

    projectedNewAdmissions:number,

    projectedTotalBedDemand:number,

    expectedInpatientDepartures:number,

    projectedAvailableBeds:number,

    historicalProjectedBedBalance:number,

    projectedCapacityVariance:number,

    direction:

        | "Improving"

        | "Stable"

        | "Tightening"

        | "Deficit"

):string {

    const details = [

        `Current acute-care availability is ${formatValue(currentAvailableBeds)} beds.`,

        `There are ${formatValue(currentBoarders)} ED boarders already requiring inpatient beds.`,

        `Historical expectations include ${formatValue(expectedEDAdmissions)} new ED-origin admissions during the next four hours.`,

        `Currently known non-ED demand includes ${formatValue(currentDirectAdmissions)} direct admissions and ${formatValue(currentSurgicalAdmissions)} surgical/procedural admissions.`,

        `The forecast uses ${formatValue(projectedDirectAdmissions)} direct admissions and ${formatValue(projectedSurgicalAdmissions)} surgical/procedural admissions after comparison with historical expectations.`,

        `Projected new admissions total ${formatValue(projectedNewAdmissions)} patients.`,

        `Total projected bed demand is ${formatValue(projectedTotalBedDemand)} patients after adding current ED boarders exactly once.`,

        `Historical inpatient departures over the same horizon are ${formatValue(expectedInpatientDepartures)} patients.`,

        `Projected acute-care bed balance is ${formatSignedValue(projectedAvailableBeds)} beds.`,

        `The historical projected bed balance for this weekday/hour is ${formatSignedValue(historicalProjectedBedBalance)} beds.`,

        createCapacityVarianceDescription(

            projectedCapacityVariance

        )

    ];


    if(direction === "Deficit"){

        details.push(

            "The projected bed balance is materially worse than the historical baseline and remains below zero."

        );

    }
    else if(direction === "Tightening"){

        details.push(

            "Projected capacity is materially tighter than the historical baseline."

        );

    }
    else if(direction === "Improving"){

        details.push(

            "Projected capacity is materially better than the historical baseline."

        );

    }
    else {

        details.push(

            "Projected capacity is within approximately five beds of the historical baseline."

        );

    }


    return details.join(

        " "

    );

}


function createCapacityVarianceDescription(

    projectedCapacityVariance:number

):string {

    if(projectedCapacityVariance < 0){

        return `Today's projected bed balance is ${formatValue(

            Math.abs(

                projectedCapacityVariance

            )

        )} beds worse than the historical projection.`;

    }


    if(projectedCapacityVariance > 0){

        return `Today's projected bed balance is ${formatValue(

            projectedCapacityVariance

        )} beds better than the historical projection.`;

    }


    return "Today's projected bed balance matches the historical projection.";

}


function normalizeHistoricalValue(

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


function normalizeSignedHistoricalValue(

    value:number

):number {

    if(

        !Number.isFinite(

            value

        )

    ){

        return 0;

    }


    return value;

}


function roundValue(

    value:number

):number {

    if(!Number.isFinite(value)){

        return 0;

    }


    return Math.round(

        value * 100

    )

    /

    100;

}


function formatValue(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "0";

    }


    if(Number.isInteger(value)){

        return String(value);

    }


    return value

        .toFixed(

            2

        )

        .replace(

            /\.?0+$/,

            ""

        );

}


function formatSignedValue(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "0";

    }


    if(value > 0){

        return `+${formatValue(value)}`;

    }


    return formatValue(value);

}