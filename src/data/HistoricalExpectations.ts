/**
 * HistoricalExpectations
 *
 * Version 2.1 Hospital Readiness Model
 *
 * DEVELOPMENT FALLBACK DATA ONLY.
 *
 * This file generates a structurally complete
 * 168-record weekly dataset so the application can
 * operate while the real Hospital Readiness
 * historical dataset is being prepared.
 *
 * These values MUST NOT be considered calibrated
 * hospital operational baselines.
 */

import type {

    DayOfWeek,
    HistoricalExpectation

}

from "../types/HistoricalExpectation";


const DAYS:DayOfWeek[] = [

    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"

];


export const HISTORICAL_EXPECTATIONS:

HistoricalExpectation[] = DAYS.flatMap(

    day =>
        Array.from(

            {
                length:24
            },

            (
                _,
                hour
            ):HistoricalExpectation =>

                createDevelopmentExpectation(
                    day,
                    hour
                )

        )

);


/**
 * Create one temporary hourly baseline.
 */
function createDevelopmentExpectation(

    day:DayOfWeek,

    hour:number

):HistoricalExpectation {

    return {

        day,

        hour,

        expectedEDVolume:
            getDevelopmentEDVolume(
                hour
            ),

        expectedEDBoarders:
            getDevelopmentEDBoarders(
                hour
            ),

        expectedStaffedAcuteCareBeds:
            getDevelopmentStaffedAcuteCareBeds(
                hour
            ),

        expectedOccupiedAcuteCareBeds:
            getDevelopmentOccupiedAcuteCareBeds(
                hour
            ),

        expectedEDAdmissions:
            getDevelopmentEDAdmissions(
                hour
            ),

        expectedDirectAdmissions:
            getDevelopmentDirectAdmissions(
                hour
            ),

        expectedSurgicalAdmissions:
            getDevelopmentSurgicalAdmissions(
                hour
            ),

        expectedInpatientDepartures:
            getDevelopmentInpatientDepartures(
                hour
            )

    };

}


function getDevelopmentEDVolume(

    hour:number

):number {

    if(hour >= 10 && hour <= 22){

        return 70;

    }


    if(hour >= 6 && hour <= 9){

        return 55;

    }


    return 45;

}


function getDevelopmentEDBoarders(

    hour:number

):number {

    if(hour >= 8 && hour <= 20){

        return 32;

    }


    return 28;

}


/**
 * Temporary staffed acute-care baseline.
 *
 * Real historical values should replace this.
 */
function getDevelopmentStaffedAcuteCareBeds(

    _hour:number

):number {

    return 273;

}


/**
 * Temporary occupied acute-care profile.
 *
 * This development profile intentionally produces
 * limited historical bed availability because the
 * Version 2.1 model is designed to compare today's
 * projected balance with the hospital's normal
 * projected balance rather than assuming zero deficit
 * is the historical norm.
 */
function getDevelopmentOccupiedAcuteCareBeds(

    hour:number

):number {

    if(hour >= 10 && hour <= 20){

        return 258;

    }


    if(hour >= 7 && hour <= 9){

        return 250;

    }


    return 245;

}


/**
 * NEW ED-origin inpatient admissions during the
 * hourly interval.
 *
 * These are not ED arrivals and do not include
 * patients already boarding at interval start.
 */
function getDevelopmentEDAdmissions(

    hour:number

):number {

    if(hour >= 12 && hour <= 22){

        return 2.5;

    }


    if(hour >= 7 && hour <= 11){

        return 2;

    }


    return 1.5;

}


function getDevelopmentDirectAdmissions(

    hour:number

):number {

    if(hour >= 7 && hour <= 18){

        return 0.75;

    }


    return 0.25;

}


function getDevelopmentSurgicalAdmissions(

    hour:number

):number {

    if(hour >= 8 && hour <= 17){

        return 1.5;

    }


    if(hour >= 18 && hour <= 20){

        return 0.5;

    }


    return 0;

}


function getDevelopmentInpatientDepartures(

    hour:number

):number {

    if(hour >= 10 && hour <= 16){

        return 3;

    }


    if(hour >= 17 && hour <= 20){

        return 1.5;

    }


    if(hour >= 7 && hour <= 9){

        return 1;

    }


    return 0.5;

}