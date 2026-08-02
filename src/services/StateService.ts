/**
 * StateService
 *
 * Persistent storage for the most recently
 * committed EDORI operational assessment.
 *
 * StateService is the authoritative source for
 * the latest completed SituationAssessment.
 *
 * Draft values entered in the form must not be
 * written here until EdoriEngine successfully:
 *
 * - loads historical expectations;
 * - validates the assessment;
 * - calculates EDORI.
 *
 * This service does not calculate EDORI.
 */

import type {

    SituationAssessment

}

from "../types/SituationAssessment";


const STATE_STORAGE_KEY =

    "edori_current_assessment";


/**
 * Increase this value when the stored assessment
 * shape changes incompatibly.
 */
const STATE_STORAGE_VERSION = 1;


/**
 * Browser-storage wrapper.
 */
interface StoredStateEnvelope {

    version:number;

    assessment:SituationAssessment;

}


/**
 * Default state used before the first completed
 * assessment or after stored data are rejected.
 */
const DEFAULT_STATE:SituationAssessment = {

    assessmentTime:"",

    day:"",

    hour:0,

    totalEDVolume:0,

    boardedPatients:0,

    occupiedMedicalBeds:0,

    staffedMedicalBeds: 273,

    esi1:0,

    esi2:0,

    esi3:0,

    esi4:0,

    esi5:0,

    expectedVolume:0,

    expectedBoarders:0,

    expectedArrivals:0,

    expectedDepartures:0

};


/**
 * Current in-memory committed assessment.
 */
let state:SituationAssessment =

    loadStoredState();


/**
 * Return a defensive copy of the committed state.
 */
export function getState():

SituationAssessment {

    return cloneAssessment(

        state

    );

}


/**
 * Update part of the committed assessment.
 *
 * EdoriEngine currently passes a complete validated
 * assessment, but Partial support remains useful for
 * controlled administrative or testing workflows.
 */
export function updateState(

    updates:Partial<SituationAssessment>

):void {

    const candidate = {

        ...state,

        ...updates

    };


    const normalizedState = normalizeAssessment(

        candidate

    );


    if(!normalizedState){

        throw new Error(

            "The EDORI assessment state is invalid and could not be saved."

        );

    }


    state = cloneAssessment(

        normalizedState

    );


    persistState();

}


/**
 * Replace the complete committed assessment.
 */
export function setState(

    assessment:SituationAssessment

):void {

    const normalizedState = normalizeAssessment(

        assessment

    );


    if(!normalizedState){

        throw new Error(

            "The EDORI assessment state is invalid and could not be saved."

        );

    }


    state = cloneAssessment(

        normalizedState

    );


    persistState();

}


/**
 * Determine whether a completed committed
 * assessment exists.
 */
export function hasCommittedAssessment():boolean {

    if(!state.assessmentTime){

        return false;

    }


    const timestamp = new Date(

        state.assessmentTime

    );


    return !Number.isNaN(

        timestamp.getTime()

    );

}


/**
 * Clear the committed operational assessment.
 *
 * This does not clear:
 *
 * - the current EDORI result;
 * - snapshot history;
 * - imported historical expectations.
 *
 * A full application reset should coordinate
 * those services explicitly.
 */
export function clearState():void {

    state = cloneAssessment(

        DEFAULT_STATE

    );


    localStorage.removeItem(

        STATE_STORAGE_KEY

    );

}


/**
 * Return state-service diagnostic information.
 */
export function getStateServiceStatus():{

    hasCommittedAssessment:boolean;

    assessmentTime:Date | null;

    day:string;

    hour:number;

} {

    const assessmentTime = state.assessmentTime

        ? new Date(

            state.assessmentTime

        )

        : null;


    return {

        hasCommittedAssessment:
            hasCommittedAssessment(),

        assessmentTime:

            assessmentTime

            &&

            !Number.isNaN(

                assessmentTime.getTime()

            )

                ? assessmentTime

                : null,

        day:
            state.day,

        hour:
            state.hour

    };

}


/**
 * Persist the committed state.
 */
function persistState():void {

    const envelope:StoredStateEnvelope = {

        version:
            STATE_STORAGE_VERSION,

        assessment:
            cloneAssessment(

                state

            )

    };


    try {

        localStorage.setItem(

            STATE_STORAGE_KEY,

            JSON.stringify(

                envelope

            )

        );

    }
    catch(error){

        console.error(

            "Unable to save the current EDORI assessment:",

            error

        );


        throw new Error(

            "The EDORI assessment could not be saved to browser storage."

        );

    }

}


/**
 * Restore and validate the committed assessment.
 */
function loadStoredState():

SituationAssessment {

    try {

        const stored = localStorage.getItem(

            STATE_STORAGE_KEY

        );


        if(!stored){

            return cloneAssessment(

                DEFAULT_STATE

            );

        }


        const parsed = JSON.parse(

            stored

        ) as unknown;


        const storedAssessment =

            extractStoredAssessment(

                parsed

            );


        if(!storedAssessment){

            throw new Error(

                "Stored EDORI assessment has an unsupported format."

            );

        }


        const normalizedAssessment =

            normalizeAssessment(

                storedAssessment

            );


        if(!normalizedAssessment){

            throw new Error(

                "Stored EDORI assessment contains invalid values."

            );

        }


        return cloneAssessment(

            normalizedAssessment

        );

    }
    catch(error){

        console.error(

            "Unable to restore the current EDORI assessment:",

            error

        );


        localStorage.removeItem(

            STATE_STORAGE_KEY

        );


        return cloneAssessment(

            DEFAULT_STATE

        );

    }

}


/**
 * Extract a stored assessment from:
 *
 * - the current versioned format;
 * - the previous unwrapped assessment format.
 */
function extractStoredAssessment(

    value:unknown

):unknown {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate = value as {

        version?:unknown;

        assessment?:unknown;

        totalEDVolume?:unknown;

    };


    /*
     * Current versioned format.
     */

    if(

        typeof candidate.version === "number"

        &&

        candidate.assessment !== undefined

    ){

        if(

            candidate.version

            !==

            STATE_STORAGE_VERSION

        ){

            return null;

        }


        return candidate.assessment;

    }


    /*
     * Legacy unwrapped state format.
     */

    if(

        candidate.totalEDVolume !== undefined

    ){

        return candidate;

    }


    return null;

}


/**
 * Validate and normalize one unknown assessment.
 *
 * Extra legacy properties such as currentRN,
 * currentMD, expectedRN, and expectedMD are ignored
 * because only current model fields are copied.
 */
function normalizeAssessment(

    value:unknown

):SituationAssessment | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate = value as {

        assessmentTime?:unknown;

        day?:unknown;

        hour?:unknown;

        totalEDVolume?:unknown;

        boardedPatients?:unknown;

        occupiedMedicalBeds?:unknown;

        staffedMedicalBeds?:unknown;

        esi1?:unknown;

        esi2?:unknown;

        esi3?:unknown;

        esi4?:unknown;

        esi5?:unknown;

        expectedVolume?:unknown;

        expectedBoarders?:unknown;

        expectedArrivals?:unknown;

        expectedDepartures?:unknown;

    };


    const assessmentTime = normalizeAssessmentTime(

        candidate.assessmentTime

    );


    if(assessmentTime === null){

        return null;

    }


    const day = normalizeDay(

        candidate.day

    );


    if(day === null){

        return null;

    }


    const hour = normalizeHour(

        candidate.hour

    );


    const totalEDVolume = normalizeNonNegativeNumber(

        candidate.totalEDVolume

    );


    const boardedPatients = normalizeNonNegativeNumber(

        candidate.boardedPatients

    );


    const occupiedMedicalBeds = normalizeNonNegativeNumber(

        candidate.occupiedMedicalBeds

    );

    const staffedMedicalBeds =

        normalizePositiveNumber(

            candidate.staffedMedicalBeds

        )

        ?? 273;


    const esi1 = normalizeNonNegativeNumber(

        candidate.esi1

    );


    const esi2 = normalizeNonNegativeNumber(

        candidate.esi2

    );


    const esi3 = normalizeNonNegativeNumber(

        candidate.esi3

    );


    const esi4 = normalizeNonNegativeNumber(

        candidate.esi4

    );


    const esi5 = normalizeNonNegativeNumber(

        candidate.esi5

    );


    const expectedVolume = normalizeNonNegativeNumber(

        candidate.expectedVolume

    );


    const expectedBoarders = normalizeNonNegativeNumber(

        candidate.expectedBoarders

    );


    const expectedArrivals = normalizeNonNegativeNumber(

        candidate.expectedArrivals

    );


    const expectedDepartures = normalizeNonNegativeNumber(

        candidate.expectedDepartures

    );


    if(

        hour === null

        ||

        totalEDVolume === null

        ||

        boardedPatients === null

        ||

        occupiedMedicalBeds === null

        ||

        esi1 === null

        ||

        esi2 === null

        ||

        esi3 === null

        ||

        esi4 === null

        ||

        esi5 === null

        ||

        expectedVolume === null

        ||

        expectedBoarders === null

        ||

        expectedArrivals === null

        ||

        expectedDepartures === null

    ){

        return null;

    }


    /*
     * Default pre-assessment state is permitted.
     */

    const isDefaultState =

        assessmentTime === ""

        &&

        day === "";


    if(!isDefaultState){

        if(

            assessmentTime === ""

            ||

            day === ""

        ){

            return null;

        }

    }


    if(boardedPatients > totalEDVolume){

        return null;

    }


    if(

        occupiedMedicalBeds

        >

        staffedMedicalBeds

    ){

        return null;

    }


    const esiTotal =

        esi1

        +

        esi2

        +

        esi3

        +

        esi4

        +

        esi5;


    if(esiTotal > totalEDVolume){

        return null;

    }


    if(expectedBoarders > expectedVolume){

        return null;

    }


    return {

        assessmentTime,

        day,

        hour,

        totalEDVolume,

        boardedPatients,

        occupiedMedicalBeds,

        staffedMedicalBeds,

        esi1,

        esi2,

        esi3,

        esi4,

        esi5,

        expectedVolume,

        expectedBoarders,

        expectedArrivals,

        expectedDepartures

    };

}


/**
 * Normalize an assessment timestamp.
 *
 * Empty string is valid only for the default state.
 */
function normalizeAssessmentTime(

    value:unknown

):string | null {

    if(value === undefined){

        return "";

    }


    if(typeof value !== "string"){

        return null;

    }


    const trimmedValue = value.trim();


    if(trimmedValue.length === 0){

        return "";

    }


    const timestamp = new Date(

        trimmedValue

    );


    if(Number.isNaN(

        timestamp.getTime()

    )){

        return null;

    }


    return timestamp.toISOString();

}


/**
 * Normalize the weekday.
 *
 * Empty string is valid for the initial state.
 */
function normalizeDay(

    value:unknown

):string | null {

    if(value === undefined){

        return "";

    }


    if(typeof value !== "string"){

        return null;

    }


    const trimmedValue = value.trim();


    if(trimmedValue.length === 0){

        return "";

    }


    const days = [

        "Sunday",

        "Monday",

        "Tuesday",

        "Wednesday",

        "Thursday",

        "Friday",

        "Saturday"

    ];


    const match = days.find(

        day =>

            day.toLowerCase()

            ===

            trimmedValue.toLowerCase()

    );


    return match ?? null;

}


/**
 * Normalize an hour to an integer from 0–23.
 */
function normalizeHour(

    value:unknown

):number | null {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(

            value

        )

        ||

        !Number.isInteger(

            value

        )

        ||

        value < 0

        ||

        value > 23

    ){

        return null;

    }


    return value;

}


/**
 * Normalize a positive finite number.
 *
 * Used for capacity values that must be greater
 * than zero.
 */
function normalizePositiveNumber(

    value:unknown

):number | null {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(

            value

        )

        ||

        value <= 0

    ){

        return null;

    }


    return value;

}


/**
 * Normalize a nonnegative finite number.
 *
 * Current operational assessment values should be
 * whole numbers, but historical expectations may
 * contain decimals.
 */
function normalizeNonNegativeNumber(

    value:unknown

):number | null {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(

            value

        )

        ||

        value < 0

    ){

        return null;

    }


    return value;

}


/**
 * Return a defensive assessment copy.
 */
function cloneAssessment(

    assessment:SituationAssessment

):SituationAssessment {

    return {

        assessmentTime:
            assessment.assessmentTime,

        day:
            assessment.day,

        hour:
            assessment.hour,

        totalEDVolume:
            assessment.totalEDVolume,

        boardedPatients:
            assessment.boardedPatients,

        occupiedMedicalBeds:
            assessment.occupiedMedicalBeds,

        staffedMedicalBeds:
            assessment.staffedMedicalBeds,

        esi1:
            assessment.esi1,

        esi2:
            assessment.esi2,

        esi3:
            assessment.esi3,

        esi4:
            assessment.esi4,

        esi5:
            assessment.esi5,

        expectedVolume:
            assessment.expectedVolume,

        expectedBoarders:
            assessment.expectedBoarders,

        expectedArrivals:
            assessment.expectedArrivals,

        expectedDepartures:
            assessment.expectedDepartures

    };

}