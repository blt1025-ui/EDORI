/**
 * LoginSecurityService
 *
 * Development-only failed-login protection.
 *
 * Production EDORI will move this responsibility to the
 * backend so lockout state cannot be altered by browser
 * users.
 */

const LOGIN_SECURITY_STORAGE_KEY =

    "edori_login_security_v1";


const MAX_FAILED_ATTEMPTS =

    5;


const FAILED_ATTEMPT_WINDOW_MILLISECONDS =

    15 * 60 * 1000;


const LOCKOUT_MILLISECONDS =

    15 * 60 * 1000;


interface LoginSecurityRecord {

    username:string;

    failedAttemptTimestamps:number[];

    lockedUntil:number | null;

}


/**
 * Return lockout state for one username.
 */
export function getLoginLockoutState(

    username:string

):{

    locked:boolean;

    lockedUntil:Date | null;

    remainingMilliseconds:number;

} {

    const normalizedUsername =

        normalizeUsername(
            username
        );


    if(!normalizedUsername){

        return {

            locked:
                false,

            lockedUntil:
                null,

            remainingMilliseconds:
                0

        };

    }


    const now =

        Date.now();


    const records =

        readRecords();


    const record =

        records.find(

            candidate =>
                candidate.username
                ===
                normalizedUsername

        );


    if(!record){

        return {

            locked:
                false,

            lockedUntil:
                null,

            remainingMilliseconds:
                0

        };

    }


    if(

        record.lockedUntil

        &&

        record.lockedUntil > now

    ){

        return {

            locked:
                true,

            lockedUntil:
                new Date(
                    record.lockedUntil
                ),

            remainingMilliseconds:
                record.lockedUntil - now

        };

    }


    /*
     * Clear expired lockout and stale attempts.
     */
    const cutoff =

        now
        -
        FAILED_ATTEMPT_WINDOW_MILLISECONDS;


    record.failedAttemptTimestamps =

        record.failedAttemptTimestamps

            .filter(

                timestamp =>
                    timestamp >= cutoff

            );


    record.lockedUntil =
        null;


    writeRecords(
        records
    );


    return {

        locked:
            false,

        lockedUntil:
            null,

        remainingMilliseconds:
            0

    };

}


/**
 * Record one failed authentication attempt.
 */
export function recordFailedLogin(

    username:string

):void {

    const normalizedUsername =

        normalizeUsername(
            username
        );


    if(!normalizedUsername){

        return;

    }


    const now =

        Date.now();


    const cutoff =

        now
        -
        FAILED_ATTEMPT_WINDOW_MILLISECONDS;


    const records =

        readRecords();


    let record =

        records.find(

            candidate =>
                candidate.username
                ===
                normalizedUsername

        );


    if(!record){

        record = {

            username:
                normalizedUsername,

            failedAttemptTimestamps:
                [],

            lockedUntil:
                null

        };


        records.push(
            record
        );

    }


    record.failedAttemptTimestamps =

        record.failedAttemptTimestamps

            .filter(

                timestamp =>
                    timestamp >= cutoff

            );


    record.failedAttemptTimestamps.push(
        now
    );


    if(

        record.failedAttemptTimestamps.length

        >=

        MAX_FAILED_ATTEMPTS

    ){

        record.lockedUntil =

            now
            +
            LOCKOUT_MILLISECONDS;


        /*
         * Start fresh after the lockout expires.
         */
        record.failedAttemptTimestamps =
            [];

    }


    writeRecords(
        records
    );

}


/**
 * Successful login clears prior failures.
 */
export function clearFailedLogins(

    username:string

):void {

    const normalizedUsername =

        normalizeUsername(
            username
        );


    if(!normalizedUsername){

        return;

    }


    writeRecords(

        readRecords()

            .filter(

                record =>
                    record.username
                    !==
                    normalizedUsername

            )

    );

}


/**
 * Administrator/development helper for future UI use.
 */
export function clearLoginLockout(

    username:string

):void {

    clearFailedLogins(
        username
    );

}


/**
 * Public policy values for UI/help text.
 */
export function getLoginSecurityPolicy():{

    maxFailedAttempts:number;

    failedAttemptWindowMinutes:number;

    lockoutMinutes:number;

} {

    return {

        maxFailedAttempts:
            MAX_FAILED_ATTEMPTS,

        failedAttemptWindowMinutes:
            Math.round(
                FAILED_ATTEMPT_WINDOW_MILLISECONDS
                /
                60_000
            ),

        lockoutMinutes:
            Math.round(
                LOCKOUT_MILLISECONDS
                /
                60_000
            )

    };

}


/**
 * Read development lockout state.
 */
function readRecords():LoginSecurityRecord[] {

    let raw:string | null = null;


    try {

        raw =

            localStorage.getItem(

                LOGIN_SECURITY_STORAGE_KEY

            );

    }
    catch(error){

        console.error(

            "EDORI could not read login-security state.",

            error

        );


        return [];

    }


    if(!raw){

        return [];

    }


    try {

        const parsed:unknown =

            JSON.parse(
                raw
            );


        if(!Array.isArray(parsed)){

            return [];

        }


        return parsed

            .filter(
                isLoginSecurityRecord
            )

            .map(

                record => ({

                    ...record,

                    failedAttemptTimestamps:[
                        ...record.failedAttemptTimestamps
                    ]

                })

            );

    }
    catch(error){

        console.error(

            "EDORI could not parse login-security state.",

            error

        );


        return [];

    }

}


/**
 * Persist development lockout state.
 */
function writeRecords(

    records:LoginSecurityRecord[]

):void {

    try {

        localStorage.setItem(

            LOGIN_SECURITY_STORAGE_KEY,

            JSON.stringify(
                records
            )

        );

    }
    catch(error){

        console.error(

            "EDORI could not persist login-security state.",

            error

        );

    }

}


/**
 * Runtime record validation.
 */
function isLoginSecurityRecord(

    value:unknown

):value is LoginSecurityRecord {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return false;

    }


    const candidate =

        value as Partial<LoginSecurityRecord>;


    return (

        typeof candidate.username
        ===
        "string"

        &&

        Array.isArray(
            candidate.failedAttemptTimestamps
        )

        &&

        candidate.failedAttemptTimestamps.every(

            timestamp =>
                typeof timestamp === "number"
                &&
                Number.isFinite(
                    timestamp
                )

        )

        &&

        (
            candidate.lockedUntil === null

            ||

            (
                typeof candidate.lockedUntil
                ===
                "number"

                &&

                Number.isFinite(
                    candidate.lockedUntil
                )
            )
        )

    );

}


/**
 * Canonical username key.
 */
function normalizeUsername(

    username:string

):string {

    return username
        .trim()
        .toLowerCase();

}