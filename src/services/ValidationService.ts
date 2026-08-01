/**
 * ValidationService
 *
 * Central validation source for EDORI.
 *
 * Provides validation for:
 *
 * 1. Current user-entered operational inputs
 * 2. Completed SituationAssessment objects
 *
 * No component or core module should duplicate
 * these business rules.
 */

import type {

    EdoriAssessmentInput

}

from "../types/EdoriAssessmentInput";


import type {

    SituationAssessment

}

from "../types/SituationAssessment";


const MEDICAL_BED_CAPACITY = 273;


const DAYS = [

    "Sunday",

    "Monday",

    "Tuesday",

    "Wednesday",

    "Thursday",

    "Friday",

    "Saturday"

] as const;


export interface ValidationResult {

    valid:boolean;

    errors:string[];

}


/**
 * Validate current values entered by the user.
 *
 * Historical expectations and assessment metadata
 * are not available at this stage.
 */
export function validateAssessmentInput(

    input:EdoriAssessmentInput

):ValidationResult {

    const errors:string[] = [];


    validateWholeNumber(

        input.totalEDVolume,

        "Total ED volume",

        errors

    );


    validateWholeNumber(

        input.boardedPatients,

        "Boarding patients",

        errors

    );


    validateWholeNumber(

        input.occupiedMedicalBeds,

        "Occupied medical beds",

        errors

    );


    validateWholeNumber(

        input.esi1,

        "ESI 1",

        errors

    );


    validateWholeNumber(

        input.esi2,

        "ESI 2",

        errors

    );


    validateWholeNumber(

        input.esi3,

        "ESI 3",

        errors

    );


    validateWholeNumber(

        input.esi4,

        "ESI 4",

        errors

    );


    validateWholeNumber(

        input.esi5,

        "ESI 5",

        errors

    );


    if(

        Number.isFinite(

            input.occupiedMedicalBeds

        )

        &&

        input.occupiedMedicalBeds

        >

        MEDICAL_BED_CAPACITY

    ){

        errors.push(

            `Occupied medical beds cannot exceed ${MEDICAL_BED_CAPACITY}.`

        );

    }


    if(

        Number.isFinite(

            input.boardedPatients

        )

        &&

        Number.isFinite(

            input.totalEDVolume

        )

        &&

        input.boardedPatients

        >

        input.totalEDVolume

    ){

        errors.push(

            "Boarding patients cannot exceed total ED volume."

        );

    }


    const esiTotal = calculateEsiTotal(

        input

    );


    if(

        Number.isFinite(

            esiTotal

        )

        &&

        Number.isFinite(

            input.totalEDVolume

        )

        &&

        esiTotal

        >

        input.totalEDVolume

    ){

        errors.push(

            `The ESI total (${esiTotal}) cannot exceed total ED volume (${input.totalEDVolume}).`

        );

    }


    return {

        valid:
            errors.length === 0,

        errors

    };

}


/**
 * Validate a complete authoritative assessment.
 */
export function validateState(

    assessment:SituationAssessment

):ValidationResult {

    const errors:string[] = [];


    /*
     * Reuse all current-input rules.
     */

    const inputValidation = validateAssessmentInput({

        totalEDVolume:
            assessment.totalEDVolume,

        boardedPatients:
            assessment.boardedPatients,

        occupiedMedicalBeds:
            assessment.occupiedMedicalBeds,

        esi1:
            assessment.esi1,

        esi2:
            assessment.esi2,

        esi3:
            assessment.esi3,

        esi4:
            assessment.esi4,

        esi5:
            assessment.esi5

    });


    errors.push(

        ...inputValidation.errors

    );


    validateAssessmentTime(

        assessment.assessmentTime,

        errors

    );


    validateDay(

        assessment.day,

        errors

    );


    validateHour(

        assessment.hour,

        errors

    );


    validateHistoricalNumber(

        assessment.expectedVolume,

        "Expected ED volume",

        errors

    );


    validateHistoricalNumber(

        assessment.expectedBoarders,

        "Expected boarding",

        errors

    );


    validateHistoricalNumber(

        assessment.expectedArrivals,

        "Expected arrivals",

        errors

    );


    validateHistoricalNumber(

        assessment.expectedDepartures,

        "Expected departures",

        errors

    );


    if(

        Number.isFinite(

            assessment.expectedBoarders

        )

        &&

        Number.isFinite(

            assessment.expectedVolume

        )

        &&

        assessment.expectedBoarders

        >

        assessment.expectedVolume

    ){

        errors.push(

            "Expected boarding cannot exceed expected ED volume."

        );

    }


    /*
     * EDORI demand scoring requires a meaningful
     * historical volume baseline.
     */

    if(assessment.expectedVolume <= 0){

        errors.push(

            "Expected ED volume must be greater than zero."

        );

    }


    return {

        valid:
            errors.length === 0,

        errors:
            removeDuplicateErrors(

                errors

            )

    };

}


/**
 * Calculate the total entered ESI census.
 */
export function calculateEsiTotal(

    input:Pick<

        EdoriAssessmentInput,

        | "esi1"

        | "esi2"

        | "esi3"

        | "esi4"

        | "esi5"

    >

):number {

    return input.esi1

        +

        input.esi2

        +

        input.esi3

        +

        input.esi4

        +

        input.esi5;

}


/**
 * Return the number of patients without an
 * entered ESI category.
 */
export function calculateUnassignedEsiCount(

    input:EdoriAssessmentInput

):number {

    return Math.max(

        0,

        input.totalEDVolume

        -

        calculateEsiTotal(

            input

        )

    );

}


/**
 * Validate a current operational count.
 */
function validateWholeNumber(

    value:number,

    label:string,

    errors:string[]

):void {

    if(!Number.isFinite(value)){

        errors.push(

            `${label} must be a valid number.`

        );


        return;

    }


    if(!Number.isInteger(value)){

        errors.push(

            `${label} must be a whole number.`

        );

    }


    if(value < 0){

        errors.push(

            `${label} cannot be negative.`

        );

    }

}


/**
 * Validate a historical expectation.
 *
 * Historical values may contain decimals.
 */
function validateHistoricalNumber(

    value:number,

    label:string,

    errors:string[]

):void {

    if(!Number.isFinite(value)){

        errors.push(

            `${label} must be a valid number.`

        );


        return;

    }


    if(value < 0){

        errors.push(

            `${label} cannot be negative.`

        );

    }

}


/**
 * Validate the assessment timestamp.
 */
function validateAssessmentTime(

    value:string,

    errors:string[]

):void {

    if(

        typeof value !== "string"

        ||

        value.trim().length === 0

    ){

        errors.push(

            "Assessment time is required."

        );


        return;

    }


    const timestamp = new Date(

        value

    );


    if(Number.isNaN(timestamp.getTime())){

        errors.push(

            "Assessment time is invalid."

        );

    }

}


/**
 * Validate the weekday.
 */
function validateDay(

    value:string,

    errors:string[]

):void {

    if(

        !DAYS.includes(

            value as typeof DAYS[number]

        )

    ){

        errors.push(

            "Assessment day must be Sunday through Saturday."

        );

    }

}


/**
 * Validate the hourly bucket.
 */
function validateHour(

    value:number,

    errors:string[]

):void {

    if(

        !Number.isInteger(value)

        ||

        value < 0

        ||

        value > 23

    ){

        errors.push(

            "Assessment hour must be an integer from 0 through 23."

        );

    }

}


/**
 * Remove repeated validation messages.
 */
function removeDuplicateErrors(

    errors:string[]

):string[] {

    return Array.from(

        new Set(

            errors

        )

    );

}