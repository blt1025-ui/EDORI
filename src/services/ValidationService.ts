/**
 * ValidationService
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Central validation utilities for current
 * assessment inputs and completed hospital
 * readiness assessments.
 *
 * Responsibilities:
 *
 * - Validate current user-entered inputs
 * - Validate acute-care and critical-care capacity
 * - Validate ED census and boarding relationships
 * - Validate ESI 1 and ESI 2 counts
 * - Validate known non-ED hospital inflow values
 * - Validate completed assessment metadata
 * - Validate historical four-hour expectations
 *
 * This service does not calculate Hospital
 * Readiness scores.
 */

import type {

    EdoriAssessmentInput

}

from "../types/EdoriAssessmentInput";


import type {

    SituationAssessment

}

from "../types/SituationAssessment";


/**
 * Standard validation response.
 */
export interface ValidationResult {

    valid:boolean;

    errors:string[];

    warnings:string[];

}


/**
 * A validatable object may be either:
 *
 * - the current user input; or
 * - a completed SituationAssessment.
 */
export type ValidatableAssessment =

    EdoriAssessmentInput

    |

    SituationAssessment;


/*
 * =====================================================
 * Public validation API
 * =====================================================
 */


/**
 * Validate either current input or a completed
 * assessment.
 */
export function validateAssessment(

    assessment:ValidatableAssessment

):ValidationResult {

    const errors:string[] = [];

    const warnings:string[] = [];


    validateCurrentInputFields(

        assessment,

        errors

    );


    validateBoardingRelationship(

        assessment,

        errors,

        warnings

    );


    validateEsiRelationship(

        assessment,

        errors,

        warnings

    );


    validateAcuteCareCapacity(

        assessment,

        errors,

        warnings

    );


    validateCriticalCareCapacity(

        assessment,

        errors,

        warnings

    );


    validateHospitalInflow(

        assessment,

        errors

    );


    if(isCompletedAssessment(assessment)){

        validateAssessmentMetadata(

            assessment,

            errors

        );


        validateHistoricalExpectations(

            assessment,

            errors,

            warnings

        );

    }


    return {

        valid:
            errors.length === 0,

        errors:

            Array.from(

                new Set(

                    errors

                )

            ),

        warnings:

            Array.from(

                new Set(

                    warnings

                )

            )

    };

}


/**
 * Validate only current user-entered inputs.
 */
export function validateAssessmentInput(

    assessment:EdoriAssessmentInput

):ValidationResult {

    return validateAssessment(

        assessment

    );

}


/**
 * Validate a completed SituationAssessment.
 */
export function validateState(

    assessment:SituationAssessment

):ValidationResult {

    return validateAssessment(

        assessment

    );

}


/**
 * Alias retained for existing callers.
 */
export function validateSituationAssessment(

    assessment:SituationAssessment

):ValidationResult {

    return validateAssessment(

        assessment

    );

}


/**
 * Return only validation errors.
 */
export function getAssessmentValidationErrors(

    assessment:ValidatableAssessment

):string[] {

    return validateAssessment(

        assessment

    ).errors;

}


/**
 * Determine whether an assessment is valid.
 */
export function isAssessmentValid(

    assessment:ValidatableAssessment

):boolean {

    return validateAssessment(

        assessment

    ).valid;

}


/*
 * =====================================================
 * Reusable calculation helpers
 * =====================================================
 */


/**
 * Total explicitly entered high-acuity patients.
 */
export function calculateHighAcuityTotal(

    assessment:Pick<

        EdoriAssessmentInput,

        | "esi1"

        | "esi2"

    >

):number {

    return normalizeForCalculation(

        assessment.esi1

    )

    +

    normalizeForCalculation(

        assessment.esi2

    );

}


/**
 * Compatibility alias.
 *
 * Version 2 no longer collects ESI 3, 4, or 5.
 * Therefore the ESI total now represents only
 * explicitly entered ESI 1 and ESI 2 patients.
 */
export function calculateEsiTotal(

    assessment:Pick<

        EdoriAssessmentInput,

        | "esi1"

        | "esi2"

    >

):number {

    return calculateHighAcuityTotal(

        assessment

    );

}


/**
 * Number of ED patients who are not ESI 1 or ESI 2.
 *
 * These patients are assumed to be ESI 3 through
 * ESI 5 for the Version 2 model.
 */
export function calculateLowerAcuityCount(

    assessment:Pick<

        EdoriAssessmentInput,

        | "totalEDVolume"

        | "esi1"

        | "esi2"

    >

):number {

    return Math.max(

        0,

        normalizeForCalculation(

            assessment.totalEDVolume

        )

        -

        calculateHighAcuityTotal(

            assessment

        )

    );

}


/**
 * Compatibility alias retained for components that
 * previously displayed an unassigned ESI count.
 *
 * In Version 2, this represents patients who are
 * assumed to be ESI 3 through ESI 5.
 */
export function calculateUnassignedEsiCount(

    assessment:Pick<

        EdoriAssessmentInput,

        | "totalEDVolume"

        | "esi1"

        | "esi2"

    >

):number {

    return calculateLowerAcuityCount(

        assessment

    );

}


/**
 * Calculate acute-care occupancy percentage.
 */
export function calculateAcuteCareOccupancyPercent(

    occupiedBeds:number,

    staffedBeds:number

):number {

    return calculateOccupancyPercent(

        occupiedBeds,

        staffedBeds

    );

}


/**
 * Calculate critical-care occupancy percentage.
 */
export function calculateCriticalCareOccupancyPercent(

    occupiedBeds:number,

    staffedBeds:number

):number {

    return calculateOccupancyPercent(

        occupiedBeds,

        staffedBeds

    );

}


/**
 * Compatibility helper retained temporarily.
 *
 * This now behaves as a generic occupancy
 * calculation and should be replaced in UI code by
 * the acute-care or critical-care helper.
 */
export function calculateMedicalBedOccupancyPercent(

    occupiedBeds:number,

    staffedBeds:number

):number {

    return calculateOccupancyPercent(

        occupiedBeds,

        staffedBeds

    );

}


/*
 * =====================================================
 * Current input validation
 * =====================================================
 */


/**
 * Validate every required user-entered field.
 */
function validateCurrentInputFields(

    assessment:ValidatableAssessment,

    errors:string[]

):void {

    const fields:Array<{

        key:keyof EdoriAssessmentInput;

        label:string;

        positive?:boolean;

    }> = [

        {

            key:
                "totalEDVolume",

            label:
                "Total ED volume"

        },

        {

            key:
                "boardedPatients",

            label:
                "Boarding patients"

        },

        {

            key:
                "esi1",

            label:
                "ESI 1 patients"

        },

        {

            key:
                "esi2",

            label:
                "ESI 2 patients"

        },

        {

            key:
                "staffedAcuteCareBeds",

            label:
                "Staffed acute-care beds",

            positive:
                true

        },

        {

            key:
                "occupiedAcuteCareBeds",

            label:
                "Occupied acute-care beds"

        },

        {

            key:
                "staffedCriticalCareBeds",

            label:
                "Staffed critical-care beds",

            positive:
                true

        },

        {

            key:
                "occupiedCriticalCareBeds",

            label:
                "Occupied critical-care beds"

        },

        {

            key:
                "currentDirectAdmissions",

            label:
                "Current direct admissions"

        },

        {

            key:
                "currentSurgicalAdmissions",

            label:
                "Current surgical admissions"

        }

    ];


    fields.forEach(

        field => {

            const value = assessment[

                field.key

            ];


            if(

                typeof value !== "number"

                ||

                !Number.isFinite(

                    value

                )

            ){

                errors.push(

                    `${field.label} must be a valid number.`

                );


                return;

            }


            if(

                field.positive

                ?

                value <= 0

                :

                value < 0

            ){

                errors.push(

                    field.positive

                        ? `${field.label} must be greater than zero.`

                        : `${field.label} cannot be negative.`

                );

            }


            if(!Number.isInteger(value)){

                errors.push(

                    `${field.label} must be entered as a whole number.`

                );

            }

        }

    );

}


/**
 * Boarding patients cannot exceed total ED census.
 */
function validateBoardingRelationship(

    assessment:ValidatableAssessment,

    errors:string[],

    warnings:string[]

):void {

    const totalEDVolume =

        assessment.totalEDVolume;


    const boardedPatients =

        assessment.boardedPatients;


    if(

        !Number.isFinite(

            totalEDVolume

        )

        ||

        !Number.isFinite(

            boardedPatients

        )

    ){

        return;

    }


    if(

        boardedPatients

        >

        totalEDVolume

    ){

        errors.push(

            "Boarding patients cannot exceed total ED volume."

        );


        return;

    }


    if(

        totalEDVolume > 0

        &&

        boardedPatients

        /

        totalEDVolume

        >= 0.50

    ){

        warnings.push(

            "Boarding patients represent at least half of the total ED census."

        );

    }

}


/**
 * Validate ESI 1 and ESI 2 counts.
 *
 * All remaining ED patients are assumed to be
 * ESI 3 through ESI 5.
 */
function validateEsiRelationship(

    assessment:ValidatableAssessment,

    errors:string[],

    warnings:string[]

):void {

    const totalEDVolume =

        assessment.totalEDVolume;


    const highAcuityTotal =

        calculateHighAcuityTotal(

            assessment

        );


    if(

        !Number.isFinite(

            totalEDVolume

        )

        ||

        totalEDVolume < 0

    ){

        return;

    }


    if(

        highAcuityTotal

        >

        totalEDVolume

    ){

        errors.push(

            "The combined ESI 1 and ESI 2 count cannot exceed total ED volume."

        );


        return;

    }


    if(

        totalEDVolume > 0

        &&

        highAcuityTotal

        /

        totalEDVolume

        >= 0.30

    ){

        warnings.push(

            "ESI 1 and ESI 2 patients represent at least 30% of the total ED census."

        );

    }

}


/**
 * Validate acute-care staffed and occupied beds.
 */
function validateAcuteCareCapacity(

    assessment:ValidatableAssessment,

    errors:string[],

    warnings:string[]

):void {

    const staffedBeds =

        assessment.staffedAcuteCareBeds;


    const occupiedBeds =

        assessment.occupiedAcuteCareBeds;


    if(

        !Number.isFinite(

            staffedBeds

        )

        ||

        !Number.isFinite(

            occupiedBeds

        )

        ||

        staffedBeds <= 0

        ||

        occupiedBeds < 0

    ){

        return;

    }


    if(

        occupiedBeds

        >

        staffedBeds

    ){

        errors.push(

            "Occupied acute-care beds cannot exceed staffed acute-care beds."

        );


        return;

    }


    const occupancy =

        calculateAcuteCareOccupancyPercent(

            occupiedBeds,

            staffedBeds

        );


    if(occupancy >= 100){

        warnings.push(

            "All staffed acute-care beds are currently occupied."

        );


        return;

    }


    if(occupancy >= 95){

        warnings.push(

            `Acute-care occupancy is ${formatPercentage(
                occupancy
            )}, indicating very limited staffed capacity.`

        );

    }

}


/**
 * Validate critical-care staffed and occupied beds.
 */
function validateCriticalCareCapacity(

    assessment:ValidatableAssessment,

    errors:string[],

    warnings:string[]

):void {

    const staffedBeds =

        assessment.staffedCriticalCareBeds;


    const occupiedBeds =

        assessment.occupiedCriticalCareBeds;


    if(

        !Number.isFinite(

            staffedBeds

        )

        ||

        !Number.isFinite(

            occupiedBeds

        )

        ||

        staffedBeds <= 0

        ||

        occupiedBeds < 0

    ){

        return;

    }


    if(

        occupiedBeds

        >

        staffedBeds

    ){

        errors.push(

            "Occupied critical-care beds cannot exceed staffed critical-care beds."

        );


        return;

    }


    const occupancy =

        calculateCriticalCareOccupancyPercent(

            occupiedBeds,

            staffedBeds

        );


    if(occupancy >= 100){

        warnings.push(

            "All staffed critical-care beds are currently occupied."

        );


        return;

    }


    if(occupancy >= 95){

        warnings.push(

            `Critical-care occupancy is ${formatPercentage(
                occupancy
            )}, indicating very limited staffed capacity.`

        );

    }

}


/**
 * Validate known non-ED hospital inflow.
 *
 * Current ED admissions are intentionally excluded in
 * Version 2.1. Existing ED-origin bed demand is
 * represented by boardedPatients.
 */
function validateHospitalInflow(

    assessment:ValidatableAssessment,

    errors:string[]

):void {

    const inflow =

        assessment.currentDirectAdmissions

        +

        assessment.currentSurgicalAdmissions;


    if(
        Number.isFinite(
            assessment.staffedAcuteCareBeds
        )
        &&
        inflow
        >
        assessment.staffedAcuteCareBeds
    ){

        errors.push(

            "Known direct and surgical/procedural admissions cannot exceed the total number of staffed acute-care beds."

        );

    }

}


/*
 * =====================================================
 * Completed assessment validation
 * =====================================================
 */


/**
 * Determine whether this is a completed
 * SituationAssessment.
 */
function isCompletedAssessment(

    assessment:ValidatableAssessment

):assessment is SituationAssessment {

    return (

        "assessmentTime" in assessment

        ||

        "expectedEDVolume" in assessment

        ||

        "forecastHours" in assessment

    );

}


/**
 * Validate metadata added by EdoriEngine.
 */
function validateAssessmentMetadata(

    assessment:SituationAssessment,

    errors:string[]

):void {

    if(!isValidDay(assessment.day)){

        errors.push(

            "Assessment day must be a valid day of the week."

        );

    }


    if(

        !Number.isInteger(

            assessment.hour

        )

        ||

        assessment.hour < 0

        ||

        assessment.hour > 23

    ){

        errors.push(

            "Assessment hour must be a whole number from 0 through 23."

        );

    }


    if(

        !isValidDateValue(

            assessment.assessmentTime

        )

    ){

        errors.push(

            "Assessment time is invalid."

        );

    }


    if(

        !Number.isInteger(

            assessment.forecastHours

        )

        ||

        assessment.forecastHours !== 4

    ){

        errors.push(

            "Hospital Readiness forecast horizon must be four hours."

        );

    }

}


/**
 * Validate all historical values used by the
 * completed assessment.
 */
function validateHistoricalExpectations(

    assessment:SituationAssessment,

    errors:string[],

    warnings:string[]

):void {

    const nonnegativeFields:Array<{

        key:

            | "expectedEDVolume"
            | "expectedEDBoarders"
            | "expectedStaffedAcuteCareBeds"
            | "expectedOccupiedAcuteCareBeds"
            | "expectedAvailableAcuteCareBeds"
            | "expectedEDAdmissions4h"
            | "expectedDirectAdmissions4h"
            | "expectedSurgicalAdmissions4h"
            | "expectedHospitalInflow4h"
            | "expectedInpatientDepartures4h"
            | "historicalProjectedBedDemand4h";

        label:string;

        positive?:boolean;

    }> = [

        {
            key:"expectedEDVolume",
            label:"Expected ED volume"
        },

        {
            key:"expectedEDBoarders",
            label:"Expected ED boarders"
        },

        {
            key:"expectedStaffedAcuteCareBeds",
            label:"Expected staffed acute-care beds",
            positive:true
        },

        {
            key:"expectedOccupiedAcuteCareBeds",
            label:"Expected occupied acute-care beds"
        },

        {
            key:"expectedAvailableAcuteCareBeds",
            label:"Expected available acute-care beds"
        },

        {
            key:"expectedEDAdmissions4h",
            label:"Expected four-hour new ED admissions"
        },

        {
            key:"expectedDirectAdmissions4h",
            label:"Expected four-hour direct admissions"
        },

        {
            key:"expectedSurgicalAdmissions4h",
            label:"Expected four-hour surgical admissions"
        },

        {
            key:"expectedHospitalInflow4h",
            label:"Expected four-hour hospital inflow"
        },

        {
            key:"expectedInpatientDepartures4h",
            label:"Expected four-hour inpatient departures"
        },

        {
            key:"historicalProjectedBedDemand4h",
            label:"Historical projected four-hour bed demand"
        }

    ];


    nonnegativeFields.forEach(

        field => {

            const value = assessment[field.key];


            if(
                typeof value !== "number"
                ||
                !Number.isFinite(value)
            ){

                errors.push(
                    `${field.label} must be a valid number.`
                );

                return;

            }


            if(
                field.positive
                    ? value <= 0
                    : value < 0
            ){

                errors.push(

                    field.positive
                        ? `${field.label} must be greater than zero.`
                        : `${field.label} cannot be negative.`

                );

            }

        }

    );


    /*
     * Historical projected bed balance may be
     * negative and must therefore be validated as a
     * finite signed number rather than nonnegative.
     */
    if(
        !Number.isFinite(
            assessment.historicalProjectedBedBalance4h
        )
    ){

        errors.push(
            "Historical projected four-hour bed balance must be a valid number."
        );

    }


    if(
        assessment.expectedEDBoarders
        >
        assessment.expectedEDVolume
    ){

        errors.push(
            "Expected ED boarders cannot exceed expected ED volume."
        );

    }


    if(
        assessment.expectedOccupiedAcuteCareBeds
        >
        assessment.expectedStaffedAcuteCareBeds
    ){

        errors.push(
            "Expected occupied acute-care beds cannot exceed expected staffed acute-care beds."
        );

    }


    const calculatedExpectedAvailable =

        assessment.expectedStaffedAcuteCareBeds

        -

        assessment.expectedOccupiedAcuteCareBeds;


    if(
        Math.abs(
            calculatedExpectedAvailable
            -
            assessment.expectedAvailableAcuteCareBeds
        )
        >
        0.05
    ){

        errors.push(
            "Expected available acute-care beds do not equal expected staffed minus expected occupied acute-care beds."
        );

    }


    const calculatedExpectedInflow =

        assessment.expectedEDAdmissions4h

        +

        assessment.expectedDirectAdmissions4h

        +

        assessment.expectedSurgicalAdmissions4h;


    if(
        Math.abs(
            calculatedExpectedInflow
            -
            assessment.expectedHospitalInflow4h
        )
        >
        0.05
    ){

        errors.push(
            "Expected hospital inflow does not equal the sum of expected ED, direct, and surgical admissions."
        );

    }


    const calculatedHistoricalDemand =

        assessment.expectedEDBoarders

        +

        assessment.expectedEDAdmissions4h

        +

        assessment.expectedDirectAdmissions4h

        +

        assessment.expectedSurgicalAdmissions4h;


    if(
        Math.abs(
            calculatedHistoricalDemand
            -
            assessment.historicalProjectedBedDemand4h
        )
        >
        0.05
    ){

        errors.push(
            "Historical projected bed demand does not match the expected boarding and admission components."
        );

    }


    const calculatedHistoricalBalance =

        assessment.expectedAvailableAcuteCareBeds

        +

        assessment.expectedInpatientDepartures4h

        -

        assessment.historicalProjectedBedDemand4h;


    if(
        Math.abs(
            calculatedHistoricalBalance
            -
            assessment.historicalProjectedBedBalance4h
        )
        >
        0.05
    ){

        errors.push(
            "Historical projected bed balance does not match historical available beds, expected departures, and projected demand."
        );

    }


    if(assessment.expectedEDVolume === 0){

        warnings.push(
            "Expected ED volume is zero; ED demand comparison may be limited."
        );

    }

}


/*
 * =====================================================
 * Shared helpers
 * =====================================================
 */


function calculateOccupancyPercent(

    occupiedBeds:number,

    staffedBeds:number

):number {

    if(

        !Number.isFinite(

            occupiedBeds

        )

        ||

        !Number.isFinite(

            staffedBeds

        )

        ||

        occupiedBeds < 0

        ||

        staffedBeds <= 0

    ){

        return 0;

    }


    return occupiedBeds

        /

        staffedBeds

        *

        100;

}


function isValidDay(

    value:unknown

):boolean {

    return value === "Sunday"

        ||

        value === "Monday"

        ||

        value === "Tuesday"

        ||

        value === "Wednesday"

        ||

        value === "Thursday"

        ||

        value === "Friday"

        ||

        value === "Saturday";

}


function isValidDateValue(

    value:unknown

):boolean {

    if(

        !(

            value instanceof Date

            ||

            typeof value === "string"

            ||

            typeof value === "number"

        )

    ){

        return false;

    }


    return !Number.isNaN(

        new Date(

            value

        ).getTime()

    );

}


function normalizeForCalculation(

    value:unknown

):number {

    if(

        typeof value !== "number"

        ||

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


function formatPercentage(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "0%";

    }


    return `${value.toFixed(1)}%`;

}