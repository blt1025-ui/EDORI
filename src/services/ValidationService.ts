/**
 * ValidationService
 *
 * Central validation utilities for EDORI assessment
 * inputs and completed operational assessments.
 *
 * Responsibilities:
 *
 * - Validate current assessment inputs
 * - Validate dynamic staffed medical-bed capacity
 * - Validate ED census and boarding relationships
 * - Validate ESI distribution
 * - Validate historical expectation values
 * - Provide reusable ESI calculation helpers
 *
 * This service does not calculate EDORI.
 */

import type {

    EdoriAssessmentInput

}

from "../types/EdoriAssessmentInput";


/**
 * Extended assessment shape used by the validation
 * service.
 *
 * A completed SituationAssessment may contain
 * additional fields such as day, hour, expectations,
 * staffing, and assessment time.
 */
export type ValidatableAssessment =

    EdoriAssessmentInput

    &

    {

        staffedMedicalBeds:number;

        day?:unknown;

        hour?:unknown;

        assessmentTime?:unknown;

        expectedVolume?:unknown;

        expectedBoarders?:unknown;

        expectedArrivals?:unknown;

        expectedDepartures?:unknown;

        expectedRN?:unknown;

        expectedMD?:unknown;

        currentRN?:unknown;

        currentMD?:unknown;

    };


/**
 * Standard validation response.
 */
export interface ValidationResult {

    valid:boolean;

    errors:string[];

    warnings:string[];

}


/**
 * Fields that must contain nonnegative numbers.
 */
const REQUIRED_NONNEGATIVE_FIELDS:Array<{

    key:keyof EdoriAssessmentInput;

    label:string;

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
            "occupiedMedicalBeds",

        label:
            "Occupied medical beds"

    },

    {

        key:
            "esi1",

        label:
            "ESI 1"

    },

    {

        key:
            "esi2",

        label:
            "ESI 2"

    },

    {

        key:
            "esi3",

        label:
            "ESI 3"

    },

    {

        key:
            "esi4",

        label:
            "ESI 4"

    },

    {

        key:
            "esi5",

        label:
            "ESI 5"

    }

];


/**
 * Validate an EDORI assessment.
 */
export function validateAssessment(

    assessment:ValidatableAssessment

):ValidationResult {

    const errors:string[] = [];

    const warnings:string[] = [];


    validateRequiredNumericFields(

        assessment,

        errors

    );


    validateStaffedMedicalBeds(

        assessment,

        errors,

        warnings

    );


    validateBoardingRelationship(

        assessment,

        errors,

        warnings

    );


    validateEsiDistribution(

        assessment,

        errors,

        warnings

    );


    validateAssessmentPeriod(

        assessment,

        errors

    );


    validateHistoricalExpectations(

        assessment,

        errors,

        warnings

    );


    validateOptionalStaffingValues(

        assessment,

        errors

    );


    return {

        valid:
            errors.length === 0,

        errors,

        warnings

    };

}


/**
 * Backward-compatible assessment-input validation.
 */
export function validateAssessmentInput(

    assessment:ValidatableAssessment

):ValidationResult {

    return validateAssessment(

        assessment

    );

}

/**
 * Backward-compatible validation function.
 *
 * Existing services may already call validateState().
 */
export function validateState(

    assessment:ValidatableAssessment

):ValidationResult {

    return validateAssessment(

        assessment

    );

}


/**
 * Additional alias for callers that use the full
 * SituationAssessment terminology.
 */
export function validateSituationAssessment(

    assessment:ValidatableAssessment

):ValidationResult {

    return validateAssessment(

        assessment

    );

}


/**
 * Return only validation error messages.
 *
 * This is useful for engine code that stores errors
 * directly in an unsuccessful result.
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


/**
 * Calculate the total number of patients assigned
 * to an ESI category.
 */
export function calculateEsiTotal(

    assessment:Pick<

        EdoriAssessmentInput,

        | "esi1"

        | "esi2"

        | "esi3"

        | "esi4"

        | "esi5"

    >

):number {

    return normalizeForCalculation(

        assessment.esi1

    )

    +

    normalizeForCalculation(

        assessment.esi2

    )

    +

    normalizeForCalculation(

        assessment.esi3

    )

    +

    normalizeForCalculation(

        assessment.esi4

    )

    +

    normalizeForCalculation(

        assessment.esi5

    );

}


/**
 * Calculate the number of ED patients who do not
 * have an entered ESI category.
 *
 * A negative result is prevented when the ESI total
 * exceeds the ED census.
 */
export function calculateUnassignedEsiCount(

    assessment:Pick<

        EdoriAssessmentInput,

        | "totalEDVolume"

        | "esi1"

        | "esi2"

        | "esi3"

        | "esi4"

        | "esi5"

    >

):number {

    return Math.max(

        0,

        normalizeForCalculation(

            assessment.totalEDVolume

        )

        -

        calculateEsiTotal(

            assessment

        )

    );

}


/**
 * Calculate current medical-bed occupancy using
 * staffed beds as the dynamic denominator.
 */
export function calculateMedicalBedOccupancyPercent(

    occupiedMedicalBeds:number,

    staffedMedicalBeds:number

):number {

    if(

        !Number.isFinite(

            occupiedMedicalBeds

        )

        ||

        !Number.isFinite(

            staffedMedicalBeds

        )

        ||

        occupiedMedicalBeds < 0

        ||

        staffedMedicalBeds <= 0

    ){

        return 0;

    }


    return occupiedMedicalBeds

        /

        staffedMedicalBeds

        *

        100;

}


/**
 * Validate all required nonnegative assessment
 * fields.
 */
function validateRequiredNumericFields(

    assessment:ValidatableAssessment,

    errors:string[]

):void {

    REQUIRED_NONNEGATIVE_FIELDS.forEach(

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


            if(value < 0){

                errors.push(

                    `${field.label} cannot be negative.`

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
 * Validate staffed medical-bed capacity.
 */
function validateStaffedMedicalBeds(

    assessment:ValidatableAssessment,

    errors:string[],

    warnings:string[]

):void {

    const staffedMedicalBeds =

        assessment.staffedMedicalBeds;


    const occupiedMedicalBeds =

        assessment.occupiedMedicalBeds;


    if(

        typeof staffedMedicalBeds !== "number"

        ||

        !Number.isFinite(

            staffedMedicalBeds

        )

    ){

        errors.push(

            "Staffed medical beds must be a valid number."

        );


        return;

    }


    if(staffedMedicalBeds <= 0){

        errors.push(

            "Staffed medical beds must be greater than zero."

        );


        return;

    }


    if(!Number.isInteger(staffedMedicalBeds)){

        errors.push(

            "Staffed medical beds must be entered as a whole number."

        );

    }


    if(

        Number.isFinite(

            occupiedMedicalBeds

        )

        &&

        occupiedMedicalBeds

        >

        staffedMedicalBeds

    ){

        errors.push(

            "Occupied medical beds cannot exceed staffed medical beds."

        );


        return;

    }


    const occupancyPercent =

        calculateMedicalBedOccupancyPercent(

            occupiedMedicalBeds,

            staffedMedicalBeds

        );


    if(occupancyPercent >= 100){

        warnings.push(

            "All staffed medical beds are currently occupied."

        );


        return;

    }


    if(occupancyPercent >= 95){

        warnings.push(

            `Medical-bed occupancy is ${formatPercentage(
                occupancyPercent
            )}, indicating very limited staffed capacity.`

        );

    }

}


/**
 * Validate the relationship between ED census and
 * boarded patients.
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


    if(boardedPatients > totalEDVolume){

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

        >=

        0.5

    ){

        warnings.push(

            "Boarding patients represent at least half of the total ED census."

        );

    }

}


/**
 * Validate ESI counts against total ED volume.
 */
function validateEsiDistribution(

    assessment:ValidatableAssessment,

    errors:string[],

    warnings:string[]

):void {

    const esiTotal = calculateEsiTotal(

        assessment

    );


    const totalEDVolume =

        assessment.totalEDVolume;


    if(

        !Number.isFinite(

            totalEDVolume

        )

        ||

        totalEDVolume < 0

    ){

        return;

    }


    if(esiTotal > totalEDVolume){

        errors.push(

            `The ESI total of ${esiTotal} exceeds the total ED volume of ${totalEDVolume}.`

        );


        return;

    }


    if(esiTotal < totalEDVolume){

    const unassignedCount =

        totalEDVolume

        -

        esiTotal;


    warnings.push(

        `${unassignedCount} ED patient${unassignedCount === 1 ? " does" : "s do"} not yet have an assigned ESI category. EDORI will calculate acuity using the patients with an entered ESI.`

    );

}


    if(

        totalEDVolume > 0

        &&

        assessment.esi1

        +

        assessment.esi2

        >

        totalEDVolume

    ){

        errors.push(

            "The ESI 1 and ESI 2 total cannot exceed total ED volume."

        );

    }


    if(

        totalEDVolume > 0

        &&

        assessment.esi1

        +

        assessment.esi2

        >=

        totalEDVolume * 0.35

    ){

        warnings.push(

            "ESI 1 and ESI 2 patients represent at least 35% of the ED census."

        );

    }

}


/**
 * Validate optional assessment day, hour, and time
 * when those fields are present.
 */
function validateAssessmentPeriod(

    assessment:ValidatableAssessment,

    errors:string[]

):void {

    if(

        assessment.day !== undefined

        &&

        !isValidDay(

            assessment.day

        )

    ){

        errors.push(

            "Assessment day must be a valid day of the week."

        );

    }


    if(assessment.hour !== undefined){

        if(

            typeof assessment.hour !== "number"

            ||

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

    }


    if(

        assessment.assessmentTime !== undefined

        &&

        !isValidDateValue(

            assessment.assessmentTime

        )

    ){

        errors.push(

            "Assessment time is invalid."

        );

    }

}


/**
 * Validate optional historical expectation values.
 */
function validateHistoricalExpectations(

    assessment:ValidatableAssessment,

    errors:string[],

    warnings:string[]

):void {

    const historicalFields:Array<{

        key:

            | "expectedVolume"

            | "expectedBoarders"

            | "expectedArrivals"

            | "expectedDepartures";

        label:string;

    }> = [

        {

            key:
                "expectedVolume",

            label:
                "Expected ED volume"

        },

        {

            key:
                "expectedBoarders",

            label:
                "Expected boarding"

        },

        {

            key:
                "expectedArrivals",

            label:
                "Expected arrivals"

        },

        {

            key:
                "expectedDepartures",

            label:
                "Expected departures"

        }

    ];


    historicalFields.forEach(

        field => {

            const value = assessment[

                field.key

            ];


            if(value === undefined){

                return;

            }


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


            if(value < 0){

                errors.push(

                    `${field.label} cannot be negative.`

                );

            }

        }

    );


    if(

        assessment.expectedVolume !== undefined

        &&

        assessment.expectedVolume === 0

    ){

        warnings.push(

            "Expected ED volume is zero; demand comparison may be limited."

        );

    }


    if(

        assessment.expectedArrivals !== undefined

        &&

        assessment.expectedDepartures !== undefined

        &&

        assessment.expectedArrivals === 0

        &&

        assessment.expectedDepartures === 0

    ){

        warnings.push(

            "Expected arrivals and departures are both zero; forecast movement may be limited."

        );

    }

}


/**
 * Validate optional RN and physician staffing
 * values if they remain part of the completed
 * assessment model.
 */
function validateOptionalStaffingValues(

    assessment:ValidatableAssessment,

    errors:string[]

):void {

    const staffingFields:Array<{

        key:

            | "currentRN"

            | "currentMD"

            | "expectedRN"

            | "expectedMD";

        label:string;

    }> = [

        {

            key:
                "currentRN",

            label:
                "Current RN staffing"

        },

        {

            key:
                "currentMD",

            label:
                "Current physician staffing"

        },

        {

            key:
                "expectedRN",

            label:
                "Expected RN staffing"

        },

        {

            key:
                "expectedMD",

            label:
                "Expected physician staffing"

        }

    ];


    staffingFields.forEach(

        field => {

            const value = assessment[

                field.key

            ];


            if(value === undefined){

                return;

            }


            if(

                typeof value !== "number"

                ||

                !Number.isFinite(

                    value

                )

                ||

                value < 0

            ){

                errors.push(

                    `${field.label} must be a valid nonnegative number.`

                );

            }

        }

    );

}


/**
 * Determine whether a value is a valid weekday.
 */
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


/**
 * Determine whether an unknown value can be
 * interpreted as a valid date.
 */
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


/**
 * Normalize an unknown numeric value for display
 * calculations.
 */
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


/**
 * Format a percentage to one decimal place.
 */
function formatPercentage(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "0%";

    }


    return `${value.toFixed(1)}%`;

}