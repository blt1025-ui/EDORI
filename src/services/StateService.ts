/**
 * StateService
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Persistent storage for the most recently
 * committed Hospital Readiness assessment.
 *
 * StateService is the authoritative source for
 * the latest completed SituationAssessment.
 *
 * Draft values entered in the assessment form
 * must not be written here until EdoriEngine has:
 *
 * - validated current operational inputs;
 * - determined the assessment period;
 * - loaded historical expectations;
 * - built the complete SituationAssessment;
 * - validated the completed assessment;
 * - calculated Hospital Readiness.
 *
 * This service does not calculate readiness.
 */

import type {

    SituationAssessment

}

from "../types/SituationAssessment";


import {

    clearServerCurrentState,
    loadServerCurrentState,
    saveServerCurrentState

}

from "./CurrentOperationalStateApiService";


import {

    emit,
    subscribe

}

from "./EventService";


import {

    APP_EVENTS

}

from "../config/appEvents";


/*
 * =====================================================
 * Server persistence configuration
 * =====================================================
 */

/**
 * Version 3 corresponds to the Version 2.1 Hospital
 * Readiness SituationAssessment structure.
 */
const STATE_STORAGE_VERSION = 3;


/**
 * Previous browser-persistent state key.
 *
 * This is retained only so Phase 13B can remove obsolete
 * local state after PostgreSQL becomes authoritative.
 */
const LEGACY_STATE_STORAGE_KEY =

    "edori_current_assessment";


let serverStateInitialized = false;


/**
 * Shared initialization promise.
 *
 * Multiple callers can request initialization during
 * application startup. All callers must await the same
 * PostgreSQL load rather than treating an in-progress
 * request as if initialization were complete.
 */
let serverStateInitializationPromise:
Promise<void> | null = null;


let serverStateWriteInProgress = false;

let lastServerStateUpdatedAtMilliseconds = 0;


/*
 * =====================================================
 * Default state
 * =====================================================
 */


/**
 * Default state used before the first completed
 * Hospital Readiness assessment or after incompatible
 * browser storage is rejected.
 *
 * Capacity values are zero here because the actual
 * staffed capacity must come from the user.
 *
 * Validation permits these zero values only for this
 * initial uncommitted state.
 */
const DEFAULT_STATE:SituationAssessment = {

    /*
     * Assessment metadata
     */

    assessmentTime:"",

    day:"",

    hour:0,

    forecastHours:4,


    /*
     * Emergency Department
     */

    totalEDVolume:0,

    boardedPatients:0,

    esi1:0,

    esi2:0,


    /*
     * Acute-care hospital capacity
     */

    staffedAcuteCareBeds:0,

    occupiedAcuteCareBeds:0,


    /*
     * Critical-care hospital capacity
     */

    staffedCriticalCareBeds:0,

    occupiedCriticalCareBeds:0,


    /*
     * Known hospital inflow
     */

    currentEDAdmissions:0,

    currentDirectAdmissions:0,

    currentSurgicalAdmissions:0,


    /*
     * Historical ED expectations
     */

    expectedEDVolume:0,

    expectedEDBoarders:0,


    /*
     * Historical acute-care baseline
     */

    expectedStaffedAcuteCareBeds:0,

    expectedOccupiedAcuteCareBeds:0,

    expectedAvailableAcuteCareBeds:0,


    /*
     * Historical projected capacity baseline
     */

    historicalProjectedBedDemand4h:0,

    historicalProjectedBedBalance4h:0,

    /*
     * Historical four-hour hospital inflow
     */

    expectedEDAdmissions4h:0,

    expectedDirectAdmissions4h:0,

    expectedSurgicalAdmissions4h:0,

    expectedHospitalInflow4h:0,


    /*
     * Historical four-hour hospital outflow
     */

    expectedInpatientDepartures4h:0

};


/*
 * =====================================================
 * In-memory state
 * =====================================================
 */

/**
 * Current committed assessment.
 */
let state:SituationAssessment =

    cloneAssessment(
        DEFAULT_STATE
    );


clearLegacyStateStorage();


/**
 * AuthenticationService publishes USERS_CHANGED when the
 * authenticated server identity is established or changes.
 * At that point PostgreSQL can safely become authoritative.
 */
subscribe(

    APP_EVENTS.USERS_CHANGED,

    () => {

        void initializeServerCurrentState();

    }

);


/*
 * =====================================================
 * Public API
 * =====================================================
 */

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
 * EdoriEngine normally passes a complete validated
 * assessment through setState().
 *
 * Partial support remains available for controlled
 * administrative or testing workflows.
 */
export function updateState(

    updates:Partial<SituationAssessment>

):void {

    const candidate = {

        ...state,

        ...updates

    };


    const normalizedState =

        normalizeAssessment(

            candidate

        );


    if(!normalizedState){

        throw new Error(

            "The Hospital Readiness assessment state is invalid and could not be saved."

        );

    }


    state = cloneAssessment(

        normalizedState

    );


    void persistCurrentStateToServer(
        state
    );


    emit(
        APP_EVENTS.STATE_CHANGED
    );

}


/**
 * Replace the complete committed assessment.
 */
export function setState(

    assessment:SituationAssessment

):void {

    const normalizedState =

        normalizeAssessment(

            assessment

        );


    if(!normalizedState){

        throw new Error(

            "The Hospital Readiness assessment state is invalid and could not be saved."

        );

    }


    state = cloneAssessment(

        normalizedState

    );


    void persistCurrentStateToServer(
        state
    );


    emit(
        APP_EVENTS.STATE_CHANGED
    );

}


/**
 * Determine whether a completed committed
 * assessment exists.
 */
export function hasCommittedAssessment():

boolean {

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
 * - the current calculated result;
 * - snapshot history;
 * - imported historical expectations;
 * - administrator configuration.
 */
export function clearState():

void {

    state = cloneAssessment(

        DEFAULT_STATE

    );


    void clearServerCurrentState()
        .catch(
            error => {

                console.error(

                    "Unable to clear the PostgreSQL Hospital Readiness current state:",

                    error

                );

            }
        );


    emit(
        APP_EVENTS.STATE_CHANGED
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

    forecastHours:number;

} {

    const assessmentTime =

        state.assessmentTime

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
            state.hour,

        forecastHours:
            state.forecastHours

    };

}


/*
 * =====================================================
 * PostgreSQL persistence
 * =====================================================
 */

/**
 * Load the authoritative current assessment from
 * PostgreSQL after authentication is established.
 *
 * Initialization may be requested by both the
 * USERS_CHANGED subscription and the application startup
 * sequence. If one load is already running, every caller
 * receives and awaits that same Promise.
 */
export function initializeServerCurrentState():

Promise<void> {

    if(serverStateInitialized){

        return Promise.resolve();

    }


    if(serverStateInitializationPromise){

        return serverStateInitializationPromise;

    }


    serverStateInitializationPromise =

        (async () => {

            try {

                const serverState =

                    await loadServerCurrentState();


                if(!serverState){

                    state = cloneAssessment(
                        DEFAULT_STATE
                    );


                    lastServerStateUpdatedAtMilliseconds =
                        0;


                    serverStateInitialized =
                        true;


                    return;

                }


                const normalizedState =

                    normalizeAssessment(
                        serverState.assessment
                    );


                if(!normalizedState){

                    throw new Error(

                        "The PostgreSQL current Hospital Readiness assessment contains invalid values."

                    );

                }


                state = cloneAssessment(
                    normalizedState
                );


                lastServerStateUpdatedAtMilliseconds =

                    normalizeServerTimestampMilliseconds(
                        serverState.updatedAt
                    );


                serverStateInitialized =
                    true;

            }
            catch(error){

                /*
                 * Do not mark initialization complete when
                 * PostgreSQL could not be loaded.
                 *
                 * This permits a later authenticated retry.
                 */
                console.warn(

                    "Unable to load the PostgreSQL Hospital Readiness current state:",

                    error

                );

            }
            finally {

                /*
                 * Release the shared Promise only after every
                 * caller awaiting this initialization has been
                 * allowed to complete.
                 */
                serverStateInitializationPromise =
                    null;

            }

        })();


    return serverStateInitializationPromise;

}


/**
 * Refresh the committed assessment from PostgreSQL.
 *
 * Returns true only when the effective in-memory
 * assessment changed.
 *
 * This method never writes back to the server.
 */
export async function refreshServerCurrentState():

Promise<boolean> {

    if(serverStateWriteInProgress){

        return false;

    }


    /*
     * If initial hydration is still running, wait for it
     * rather than racing a second PostgreSQL read against
     * application startup.
     */
    if(serverStateInitializationPromise){

        await serverStateInitializationPromise;

    }


    const serverState =

        await loadServerCurrentState();


    /*
     * A remote delete should clear this workstation once
     * there is no local write in flight.
     */
    if(!serverState){

        if(!hasCommittedAssessment()){

            return false;

        }


        state = cloneAssessment(
            DEFAULT_STATE
        );


        lastServerStateUpdatedAtMilliseconds = 0;


        emit(
            APP_EVENTS.STATE_CHANGED
        );


        return true;

    }


    const serverUpdatedAtMilliseconds =

        normalizeServerTimestampMilliseconds(
            serverState.updatedAt
        );


    /*
     * Never apply a response known to be older than a
     * server version already observed by this tab.
     */
    if(
        serverUpdatedAtMilliseconds > 0
        &&
        lastServerStateUpdatedAtMilliseconds > 0
        &&
        serverUpdatedAtMilliseconds
        <
        lastServerStateUpdatedAtMilliseconds
    ){

        return false;

    }


    const normalizedState =

        normalizeAssessment(
            serverState.assessment
        );


    if(!normalizedState){

        throw new Error(
            "The synchronized PostgreSQL Hospital Readiness assessment contains invalid values."
        );

    }


    if(
        assessmentsEqual(
            state,
            normalizedState
        )
    ){

        lastServerStateUpdatedAtMilliseconds =
            Math.max(
                lastServerStateUpdatedAtMilliseconds,
                serverUpdatedAtMilliseconds
            );


        return false;

    }


    state = cloneAssessment(
        normalizedState
    );


    lastServerStateUpdatedAtMilliseconds =
        serverUpdatedAtMilliseconds;


    serverStateInitialized = true;


    emit(
        APP_EVENTS.STATE_CHANGED
    );


    return true;

}


/**
 * Persist one validated committed assessment through the
 * authenticated current-state API.
 */
async function persistCurrentStateToServer(

    assessment:SituationAssessment

):Promise<void> {

    serverStateWriteInProgress = true;


    try {

        const serverState =

            await saveServerCurrentState(

                cloneAssessment(
                    assessment
                ),

                STATE_STORAGE_VERSION

            );


        const normalizedState =

            normalizeAssessment(
                serverState.assessment
            );


        if(!normalizedState){

            throw new Error(

                "The server returned an invalid Hospital Readiness current state."

            );

        }


        /*
         * Do not allow an older asynchronous response to
         * overwrite a newer assessment already committed
         * locally.
         */
        if(

            state.assessmentTime

            ===

            assessment.assessmentTime

        ){

            state = cloneAssessment(
                normalizedState
            );

        }


        lastServerStateUpdatedAtMilliseconds =
            normalizeServerTimestampMilliseconds(
                serverState.updatedAt
            );


        serverStateInitialized = true;

    }
    catch(error){

        console.error(

            "Unable to save the current Hospital Readiness assessment to PostgreSQL:",

            error

        );

    }
    finally {

        serverStateWriteInProgress = false;

    }

}


/**
 * Compare two normalized assessments.
 */
function assessmentsEqual(

    first:SituationAssessment,

    second:SituationAssessment

):boolean {

    return JSON.stringify(
        first
    )
    ===
    JSON.stringify(
        second
    );

}


/**
 * Normalize one server updated-at timestamp.
 */
function normalizeServerTimestampMilliseconds(

    value:string

):number {

    const milliseconds =
        new Date(
            value
        ).getTime();


    return Number.isNaN(
        milliseconds
    )

        ? 0

        : milliseconds;

}


/**
 * Remove obsolete browser-persistent current state.
 */
function clearLegacyStateStorage():

void {

    try {

        localStorage.removeItem(
            LEGACY_STATE_STORAGE_KEY
        );

    }
    catch(error){

        console.warn(

            "Unable to remove legacy Hospital Readiness browser state:",

            error

        );

    }

}


/*
 * =====================================================
 * Assessment normalization
 * =====================================================
 */

/**
 * Validate and normalize one unknown assessment.
 *
 * Only Version 2.1 Hospital Readiness fields are copied.
 *
 * Extra legacy properties are ignored.
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

        forecastHours?:unknown;

        totalEDVolume?:unknown;

        boardedPatients?:unknown;

        esi1?:unknown;

        esi2?:unknown;

        staffedAcuteCareBeds?:unknown;

        occupiedAcuteCareBeds?:unknown;

        staffedCriticalCareBeds?:unknown;

        occupiedCriticalCareBeds?:unknown;

        currentEDAdmissions?:unknown;

        currentDirectAdmissions?:unknown;

        currentSurgicalAdmissions?:unknown;

        expectedEDVolume?:unknown;

        expectedEDBoarders?:unknown;

        expectedStaffedAcuteCareBeds?:unknown;

        expectedOccupiedAcuteCareBeds?:unknown;

        expectedAvailableAcuteCareBeds?:unknown;

        expectedEDAdmissions4h?:unknown;

        expectedDirectAdmissions4h?:unknown;

        expectedSurgicalAdmissions4h?:unknown;

        expectedHospitalInflow4h?:unknown;

        expectedInpatientDepartures4h?:unknown;

        historicalProjectedBedDemand4h?:unknown;

        historicalProjectedBedBalance4h?:unknown;

    };


    /*
     * =================================================
     * Metadata
     * =================================================
     */

    const assessmentTime =

        normalizeAssessmentTime(

            candidate.assessmentTime

        );


    if(assessmentTime === null){

        return null;

    }


    const day =

        normalizeDay(

            candidate.day

        );


    if(day === null){

        return null;

    }


    const hour =

        normalizeHour(

            candidate.hour

        );


    const forecastHours =

        normalizeForecastHours(

            candidate.forecastHours

        );


    /*
     * =================================================
     * Emergency Department
     * =================================================
     */

    const totalEDVolume =

        normalizeNonNegativeNumber(

            candidate.totalEDVolume

        );


    const boardedPatients =

        normalizeNonNegativeNumber(

            candidate.boardedPatients

        );


    const esi1 =

        normalizeNonNegativeNumber(

            candidate.esi1

        );


    const esi2 =

        normalizeNonNegativeNumber(

            candidate.esi2

        );


    /*
     * =================================================
     * Acute-care capacity
     * =================================================
     */

    const staffedAcuteCareBeds =

        normalizeNonNegativeNumber(

            candidate.staffedAcuteCareBeds

        );


    const occupiedAcuteCareBeds =

        normalizeNonNegativeNumber(

            candidate.occupiedAcuteCareBeds

        );


    /*
     * =================================================
     * Critical-care capacity
     * =================================================
     */

    const staffedCriticalCareBeds =

        normalizeNonNegativeNumber(

            candidate.staffedCriticalCareBeds

        );


    const occupiedCriticalCareBeds =

        normalizeNonNegativeNumber(

            candidate.occupiedCriticalCareBeds

        );


    /*
     * =================================================
     * Known hospital inflow
     * =================================================
     */

    /*
     * Version 2.1 compatibility field.
     *
     * Current ED Admissions is no longer a user input.
     * Existing ED-origin inpatient demand is represented
     * by boardedPatients. Any legacy stored value is
     * intentionally ignored.
     */
    const currentEDAdmissions = 0;


    const currentDirectAdmissions =

        normalizeNonNegativeNumber(

            candidate.currentDirectAdmissions

        );


    const currentSurgicalAdmissions =

        normalizeNonNegativeNumber(

            candidate.currentSurgicalAdmissions

        );


    /*
     * =================================================
     * Historical ED expectations
     * =================================================
     */

    const expectedEDVolume =

        normalizeNonNegativeNumber(

            candidate.expectedEDVolume

        );


    const expectedEDBoarders =

        normalizeNonNegativeNumber(

            candidate.expectedEDBoarders

        );


    /*
     * =================================================
     * Historical acute-care baseline
     * =================================================
     */

    const expectedStaffedAcuteCareBeds =

        normalizeNonNegativeNumber(

            candidate.expectedStaffedAcuteCareBeds

        );


    const expectedOccupiedAcuteCareBeds =

        normalizeNonNegativeNumber(

            candidate.expectedOccupiedAcuteCareBeds

        );


    const expectedAvailableAcuteCareBeds =

        normalizeNonNegativeNumber(

            candidate.expectedAvailableAcuteCareBeds

        );


    /*
     * =================================================
     * Historical four-hour hospital inflow
     * =================================================
     */

    const expectedEDAdmissions4h =

        normalizeNonNegativeNumber(

            candidate.expectedEDAdmissions4h

        );


    const expectedDirectAdmissions4h =

        normalizeNonNegativeNumber(

            candidate.expectedDirectAdmissions4h

        );


    const expectedSurgicalAdmissions4h =

        normalizeNonNegativeNumber(

            candidate.expectedSurgicalAdmissions4h

        );


    const expectedHospitalInflow4h =

        normalizeNonNegativeNumber(

            candidate.expectedHospitalInflow4h

        );


    /*
     * =================================================
     * Historical four-hour hospital outflow
     * =================================================
     */

    const expectedInpatientDepartures4h =

        normalizeNonNegativeNumber(

            candidate.expectedInpatientDepartures4h

        );


    /*
     * =================================================
     * Historical projected capacity baseline
     * =================================================
     */

    const historicalProjectedBedDemand4h =

        normalizeNonNegativeNumber(

            candidate.historicalProjectedBedDemand4h

        );


    /*
     * Historical projected bed balance may be
     * negative, so it must be normalized as a signed
     * finite number.
     */
    const historicalProjectedBedBalance4h =

        normalizeSignedNumber(

            candidate.historicalProjectedBedBalance4h

        );


    /*
     * =================================================
     * Reject invalid values
     * =================================================
     */

    if(

        hour === null

        ||

        forecastHours === null

        ||

        totalEDVolume === null

        ||

        boardedPatients === null

        ||

        esi1 === null

        ||

        esi2 === null

        ||

        staffedAcuteCareBeds === null

        ||

        occupiedAcuteCareBeds === null

        ||

        staffedCriticalCareBeds === null

        ||

        occupiedCriticalCareBeds === null

        ||

        currentDirectAdmissions === null

        ||

        currentSurgicalAdmissions === null

        ||

        expectedEDVolume === null

        ||

        expectedEDBoarders === null

        ||

        expectedStaffedAcuteCareBeds === null

        ||

        expectedOccupiedAcuteCareBeds === null

        ||

        expectedAvailableAcuteCareBeds === null

        ||

        expectedEDAdmissions4h === null

        ||

        expectedDirectAdmissions4h === null

        ||

        expectedSurgicalAdmissions4h === null

        ||

        expectedHospitalInflow4h === null

        ||

        expectedInpatientDepartures4h === null

        ||

        historicalProjectedBedDemand4h === null

        ||

        historicalProjectedBedBalance4h === null

    ){

        return null;

    }


    /*
     * =================================================
     * Initial-state exception
     * =================================================
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


        /*
         * A completed assessment must have real
         * staffed capacity denominators.
         */

        if(

            staffedAcuteCareBeds <= 0

            ||

            staffedCriticalCareBeds <= 0

        ){

            return null;

        }

    }


    /*
     * =================================================
     * Cross-field validation
     * =================================================
     */


    /**
     * Boarding cannot exceed total ED census.
     */
    if(

        boardedPatients

        >

        totalEDVolume

    ){

        return null;

    }


    /**
     * Explicitly entered high-acuity patients
     * cannot exceed the total ED census.
     *
     * ESI 3 through ESI 5 are inferred as:
     *
     * totalEDVolume - esi1 - esi2
     */
    if(

        esi1

        +

        esi2

        >

        totalEDVolume

    ){

        return null;

    }


    /**
     * Occupied acute-care beds cannot exceed the
     * currently staffed acute-care denominator.
     */
    if(

        occupiedAcuteCareBeds

        >

        staffedAcuteCareBeds

    ){

        return null;

    }


    /**
     * Occupied critical-care beds cannot exceed the
     * currently staffed critical-care denominator.
     */
    if(

        occupiedCriticalCareBeds

        >

        staffedCriticalCareBeds

    ){

        return null;

    }


    /**
     * Historical ED boarding cannot exceed the
     * historical expected ED census.
     */
    if(

        expectedEDBoarders

        >

        expectedEDVolume

    ){

        return null;

    }


    /**
     * Historical occupied acute-care beds cannot
     * exceed historical staffed acute-care beds.
     */
    if(

        expectedOccupiedAcuteCareBeds

        >

        expectedStaffedAcuteCareBeds

    ){

        return null;

    }


    /**
     * Historical available acute-care beds must equal
     * historical staffed minus historical occupied.
     */
    const calculatedHistoricalAvailableBeds =

        expectedStaffedAcuteCareBeds

        -

        expectedOccupiedAcuteCareBeds;


    if(

        Math.abs(

            calculatedHistoricalAvailableBeds

            -

            expectedAvailableAcuteCareBeds

        )

        >

        0.05

    ){

        return null;

    }


    /**
     * Verify the stored four-hour inflow total.
     *
     * Historical expectations may contain decimal
     * averages, so floating-point tolerance is used.
     */
    const calculatedHistoricalInflow =

        expectedEDAdmissions4h

        +

        expectedDirectAdmissions4h

        +

        expectedSurgicalAdmissions4h;


    if(

        Math.abs(

            calculatedHistoricalInflow

            -

            expectedHospitalInflow4h

        )

        >

        0.001

    ){

        return null;

    }


    /**
     * Historical projected bed demand includes the
     * existing expected ED boarding backlog plus NEW
     * ED-origin, direct, and surgical/procedural
     * admissions expected during the four-hour window.
     */
    const calculatedHistoricalBedDemand =

        expectedEDBoarders

        +

        expectedEDAdmissions4h

        +

        expectedDirectAdmissions4h

        +

        expectedSurgicalAdmissions4h;


    if(

        Math.abs(

            calculatedHistoricalBedDemand

            -

            historicalProjectedBedDemand4h

        )

        >

        0.05

    ){

        return null;

    }


    /**
     * Historical projected bed balance may
     * legitimately be negative.
     */
    const calculatedHistoricalBedBalance =

        expectedAvailableAcuteCareBeds

        +

        expectedInpatientDepartures4h

        -

        historicalProjectedBedDemand4h;


    if(

        Math.abs(

            calculatedHistoricalBedBalance

            -

            historicalProjectedBedBalance4h

        )

        >

        0.05

    ){

        return null;

    }


    /*
     * =================================================
     * Return normalized Version 2.1 state
     * =================================================
     */

    return {

        assessmentTime,

        day,

        hour,

        forecastHours,

        totalEDVolume,

        boardedPatients,

        esi1,

        esi2,

        staffedAcuteCareBeds,

        occupiedAcuteCareBeds,

        staffedCriticalCareBeds,

        occupiedCriticalCareBeds,

        currentEDAdmissions,

        currentDirectAdmissions,

        currentSurgicalAdmissions,

        expectedEDVolume,

        expectedEDBoarders,

        expectedStaffedAcuteCareBeds,

        expectedOccupiedAcuteCareBeds,

        expectedAvailableAcuteCareBeds,

        expectedEDAdmissions4h,

        expectedDirectAdmissions4h,

        expectedSurgicalAdmissions4h,

        expectedHospitalInflow4h,

        expectedInpatientDepartures4h,

        historicalProjectedBedDemand4h,

        historicalProjectedBedBalance4h

    };

}


/*
 * =====================================================
 * Primitive normalization helpers
 * =====================================================
 */

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


    const trimmedValue =

        value.trim();


    if(trimmedValue.length === 0){

        return "";

    }


    const timestamp =

        new Date(

            trimmedValue

        );


    if(

        Number.isNaN(

            timestamp.getTime()

        )

    ){

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


    const trimmedValue =

        value.trim();


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


    const match =

        days.find(

            day =>

                day.toLowerCase()

                ===

                trimmedValue.toLowerCase()

        );


    return match ?? null;

}


/**
 * Normalize an hour to an integer from 0 through 23.
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
 * Normalize the Hospital Readiness forecast horizon.
 *
 * Version 2.1 currently uses exactly four hours.
 */
function normalizeForecastHours(

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

        value !== 4

    ){

        return null;

    }


    return value;

}


/**
 * Normalize a nonnegative finite number.
 *
 * Historical expectations may contain decimals.
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
 * Normalize a finite signed number.
 *
 * Negative values are intentionally accepted for
 * historical projected bed balance.
 */
function normalizeSignedNumber(

    value:unknown

):number | null {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(

            value

        )

    ){

        return null;

    }


    return value;

}


/*
 * =====================================================
 * Defensive cloning
 * =====================================================
 */

/**
 * Return a defensive assessment copy.
 *
 * SituationAssessment currently contains only
 * primitive values, so explicit copying keeps this
 * function easy to audit when fields change.
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

        forecastHours:
            assessment.forecastHours,

        totalEDVolume:
            assessment.totalEDVolume,

        boardedPatients:
            assessment.boardedPatients,

        esi1:
            assessment.esi1,

        esi2:
            assessment.esi2,

        staffedAcuteCareBeds:
            assessment.staffedAcuteCareBeds,

        occupiedAcuteCareBeds:
            assessment.occupiedAcuteCareBeds,

        staffedCriticalCareBeds:
            assessment.staffedCriticalCareBeds,

        occupiedCriticalCareBeds:
            assessment.occupiedCriticalCareBeds,

        currentEDAdmissions:
            assessment.currentEDAdmissions,

        currentDirectAdmissions:
            assessment.currentDirectAdmissions,

        currentSurgicalAdmissions:
            assessment.currentSurgicalAdmissions,

        expectedEDVolume:
            assessment.expectedEDVolume,

        expectedEDBoarders:
            assessment.expectedEDBoarders,

        expectedStaffedAcuteCareBeds:
            assessment.expectedStaffedAcuteCareBeds,

        expectedOccupiedAcuteCareBeds:
            assessment.expectedOccupiedAcuteCareBeds,

        expectedAvailableAcuteCareBeds:
            assessment.expectedAvailableAcuteCareBeds,

        expectedEDAdmissions4h:
            assessment.expectedEDAdmissions4h,

        expectedDirectAdmissions4h:
            assessment.expectedDirectAdmissions4h,

        expectedSurgicalAdmissions4h:
            assessment.expectedSurgicalAdmissions4h,

        expectedHospitalInflow4h:
            assessment.expectedHospitalInflow4h,

        expectedInpatientDepartures4h:
            assessment.expectedInpatientDepartures4h,

        historicalProjectedBedDemand4h:
            assessment.historicalProjectedBedDemand4h,

        historicalProjectedBedBalance4h:
            assessment.historicalProjectedBedBalance4h

    };

}