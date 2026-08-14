/**
 * HistoricalDataService
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Provides:
 *
 * - Current-hour ED historical expectations
 * - Current-hour acute-care capacity baselines
 * - Rolling four-hour hospital-flow expectations
 * - Historical projected four-hour bed balance
 */

import {

    getHistoricalDataset

}

from "./HistoricalDataRepository";


import type {

    DayOfWeek,
    HistoricalExpectation

}

from "../types/HistoricalExpectation";


export type {

    DayOfWeek

}

from "../types/HistoricalExpectation";


export const HOSPITAL_FORECAST_HOURS = 4;


export interface ExpectedOperationalValues {

    expectedEDVolume:number;

    expectedEDBoarders:number;

    expectedStaffedAcuteCareBeds:number;

    expectedOccupiedAcuteCareBeds:number;

    expectedAvailableAcuteCareBeds:number;

    expectedEDAdmissions4h:number;

    expectedDirectAdmissions4h:number;

    expectedSurgicalAdmissions4h:number;

    expectedHospitalInflow4h:number;

    expectedInpatientDepartures4h:number;

    historicalProjectedBedDemand4h:number;

    historicalProjectedBedBalance4h:number;

}


/**
 * Find one hourly historical expectation.
 */
export function getHistoricalExpectation(

    day:DayOfWeek,

    hour:number

):HistoricalExpectation {

    const period = normalizeDayHour(
        day,
        hour
    );


    const dataset = getHistoricalDataset();


    const match = dataset.find(

        record =>
            record.day === period.day
            &&
            record.hour === period.hour

    );


    if(match){

        return cloneExpectation(
            match
        );

    }


    return createDefaultExpectation(
        period.day,
        period.hour
    );

}


/**
 * Return all historical values required by one
 * Version 2.1 Hospital Readiness assessment.
 */
export function getExpectedOperationalValues(

    day:DayOfWeek,

    hour:number

):ExpectedOperationalValues {

    const currentExpectation = getHistoricalExpectation(

        day,
        hour

    );


    const rolling = getRollingHospitalFlowExpectation(

        day,
        hour,
        HOSPITAL_FORECAST_HOURS

    );


    const expectedAvailableAcuteCareBeds = roundValue(

        currentExpectation.expectedStaffedAcuteCareBeds
        -
        currentExpectation.expectedOccupiedAcuteCareBeds

    );


    /*
     * Historical bed demand includes:
     *
     * - the boarding backlog already present at the
     *   start of the assessment;
     * - NEW ED admissions expected during the next
     *   four hours;
     * - expected direct admissions;
     * - expected surgical/procedural admissions.
     */
    const historicalProjectedBedDemand4h = roundValue(

        currentExpectation.expectedEDBoarders
        +
        rolling.expectedEDAdmissions
        +
        rolling.expectedDirectAdmissions
        +
        rolling.expectedSurgicalAdmissions

    );


    const historicalProjectedBedBalance4h = roundValue(

        expectedAvailableAcuteCareBeds
        +
        rolling.expectedInpatientDepartures
        -
        historicalProjectedBedDemand4h

    );


    return {

        expectedEDVolume:
            currentExpectation.expectedEDVolume,

        expectedEDBoarders:
            currentExpectation.expectedEDBoarders,

        expectedStaffedAcuteCareBeds:
            currentExpectation.expectedStaffedAcuteCareBeds,

        expectedOccupiedAcuteCareBeds:
            currentExpectation.expectedOccupiedAcuteCareBeds,

        expectedAvailableAcuteCareBeds,

        expectedEDAdmissions4h:
            rolling.expectedEDAdmissions,

        expectedDirectAdmissions4h:
            rolling.expectedDirectAdmissions,

        expectedSurgicalAdmissions4h:
            rolling.expectedSurgicalAdmissions,

        expectedHospitalInflow4h:
            rolling.expectedHospitalInflow,

        expectedInpatientDepartures4h:
            rolling.expectedInpatientDepartures,

        historicalProjectedBedDemand4h,

        historicalProjectedBedBalance4h

    };

}


/**
 * Sum new admissions and inpatient departures over a
 * rolling historical window.
 */
export function getRollingHospitalFlowExpectation(

    day:DayOfWeek,

    hour:number,

    horizonHours:number = HOSPITAL_FORECAST_HOURS

):{

    expectedEDAdmissions:number;

    expectedDirectAdmissions:number;

    expectedSurgicalAdmissions:number;

    expectedHospitalInflow:number;

    expectedInpatientDepartures:number;

} {

    const safeHorizon = normalizeForecastHours(

        horizonHours

    );


    let expectedEDAdmissions = 0;

    let expectedDirectAdmissions = 0;

    let expectedSurgicalAdmissions = 0;

    let expectedInpatientDepartures = 0;


    let period = normalizeDayHour(
        day,
        hour
    );


    for(
        let offset = 0;
        offset < safeHorizon;
        offset += 1
    ){

        const expectation = getHistoricalExpectation(

            period.day,
            period.hour

        );


        expectedEDAdmissions += normalizeHistoricalValue(
            expectation.expectedEDAdmissions
        );


        expectedDirectAdmissions += normalizeHistoricalValue(
            expectation.expectedDirectAdmissions
        );


        expectedSurgicalAdmissions += normalizeHistoricalValue(
            expectation.expectedSurgicalAdmissions
        );


        expectedInpatientDepartures += normalizeHistoricalValue(
            expectation.expectedInpatientDepartures
        );


        period = advanceOneHour(
            period.day,
            period.hour
        );

    }


    const expectedHospitalInflow =
        expectedEDAdmissions
        +
        expectedDirectAdmissions
        +
        expectedSurgicalAdmissions;


    return {

        expectedEDAdmissions:
            roundValue(expectedEDAdmissions),

        expectedDirectAdmissions:
            roundValue(expectedDirectAdmissions),

        expectedSurgicalAdmissions:
            roundValue(expectedSurgicalAdmissions),

        expectedHospitalInflow:
            roundValue(expectedHospitalInflow),

        expectedInpatientDepartures:
            roundValue(expectedInpatientDepartures)

    };

}


/**
 * Determine whether the complete rolling historical
 * window exists.
 */
export function hasHistoricalExpectation(

    day:DayOfWeek,

    hour:number,

    horizonHours:number = HOSPITAL_FORECAST_HOURS

):boolean {

    const safeHorizon = normalizeForecastHours(
        horizonHours
    );


    const dataset = getHistoricalDataset();


    let period = normalizeDayHour(
        day,
        hour
    );


    for(
        let offset = 0;
        offset < safeHorizon;
        offset += 1
    ){

        const exists = dataset.some(

            record =>
                record.day === period.day
                &&
                record.hour === period.hour

        );


        if(!exists){

            return false;

        }


        period = advanceOneHour(
            period.day,
            period.hour
        );

    }


    return true;

}


export function getExpectationsForDay(

    day:DayOfWeek

):HistoricalExpectation[] {

    return getHistoricalDataset()

        .filter(
            record => record.day === day
        )

        .sort(
            (first, second) =>
                first.hour - second.hour
        )

        .map(
            cloneExpectation
        );

}


export function getAllHistoricalExpectations():

HistoricalExpectation[] {

    return getHistoricalDataset()

        .map(
            cloneExpectation
        );

}


export function getDayOfWeekFromDate(

    date:Date

):DayOfWeek {

    const days:DayOfWeek[] = [

        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"

    ];


    return days[
        date.getDay()
    ];

}


export function getAssessmentPeriod(

    date:Date

):{

    day:DayOfWeek;

    hour:number;

} {

    return {

        day:
            getDayOfWeekFromDate(
                date
            ),

        hour:
            normalizeHour(
                date.getHours()
            )

    };

}


function advanceOneHour(

    day:DayOfWeek,

    hour:number

):{

    day:DayOfWeek;

    hour:number;

} {

    const safeHour = normalizeHour(
        hour
    );


    if(safeHour < 23){

        return {

            day,

            hour:
                safeHour + 1

        };

    }


    return {

        day:
            getNextDay(
                day
            ),

        hour:
            0

    };

}


function getNextDay(

    day:DayOfWeek

):DayOfWeek {

    const days:DayOfWeek[] = [

        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"

    ];


    const currentIndex = days.indexOf(
        day
    );


    const safeIndex =
        currentIndex >= 0
            ? currentIndex
            : 0;


    return days[
        (safeIndex + 1)
        %
        days.length
    ];

}


function normalizeDayHour(

    day:DayOfWeek,

    hour:number

):{

    day:DayOfWeek;

    hour:number;

} {

    return {

        day,

        hour:
            normalizeHour(
                hour
            )

    };

}


function normalizeHour(

    hour:number

):number {

    if(!Number.isFinite(hour)){

        return 0;

    }


    return Math.min(
        23,
        Math.max(
            0,
            Math.floor(hour)
        )
    );

}


function normalizeForecastHours(

    hours:number

):number {

    if(!Number.isFinite(hours)){

        return HOSPITAL_FORECAST_HOURS;

    }


    return Math.min(
        24,
        Math.max(
            1,
            Math.floor(hours)
        )
    );

}


function normalizeHistoricalValue(

    value:number

):number {

    if(
        !Number.isFinite(value)
        ||
        value < 0
    ){

        return 0;

    }


    return value;

}


function createDefaultExpectation(

    day:DayOfWeek,

    hour:number

):HistoricalExpectation {

    return {

        day,

        hour,

        expectedEDVolume:
            0,

        expectedEDBoarders:
            0,

        expectedStaffedAcuteCareBeds:
            1,

        expectedOccupiedAcuteCareBeds:
            0,

        expectedEDAdmissions:
            0,

        expectedDirectAdmissions:
            0,

        expectedSurgicalAdmissions:
            0,

        expectedInpatientDepartures:
            0

    };

}


function cloneExpectation(

    expectation:HistoricalExpectation

):HistoricalExpectation {

    return {

        ...expectation

    };

}


function roundValue(

    value:number

):number {

    return Math.round(
        value * 100
    ) / 100;

}