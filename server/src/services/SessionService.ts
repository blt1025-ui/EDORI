/**
 * SessionService
 *
 * Applies centralized EDORI session policy.
 */

import {

    getSessionPolicyForRole,
    SESSION_CLEANUP_MINIMUM_INTERVAL_MINUTES,
    SESSION_CLEANUP_RETENTION_HOURS

}

from "../config/SessionPolicy.js";


import type {

    SessionRole

}

from "../config/SessionPolicy.js";


import {

    createSession,
    deleteStaleSessions,
    refreshSessionActivity

}

from "../repositories/SessionRepository.js";


let lastCleanupStartedAt =

    0;


export async function createUserSession(

    input:{

        userId:string;

        role:SessionRole;

        userAgent?:string;

        remoteAddress?:string;

    }

) {

    await runSessionCleanupIfDue();


    const policy =

        getSessionPolicyForRole(
            input.role
        );


    return createSession({

        userId:
            input.userId,

        inactivityTimeoutMinutes:
            policy.inactivityTimeoutMinutes,

        absoluteTimeoutHours:
            policy.absoluteTimeoutHours,

        userAgent:
            input.userAgent,

        remoteAddress:
            input.remoteAddress

    });

}


export async function touchUserSession(

    sessionId:string,

    role:SessionRole

):Promise<void> {

    const policy =

        getSessionPolicyForRole(
            role
        );


    await refreshSessionActivity(

        sessionId,

        policy.inactivityTimeoutMinutes

    );


    await runSessionCleanupIfDue();

}


export async function runSessionCleanupIfDue():Promise<void> {

    const now =
        Date.now();


    const minimumIntervalMs =

        SESSION_CLEANUP_MINIMUM_INTERVAL_MINUTES
        *
        60_000;


    if(

        now
        -
        lastCleanupStartedAt

        <
        minimumIntervalMs

    ){

        return;

    }


    lastCleanupStartedAt =
        now;


    try {

        const deletedCount =

            await deleteStaleSessions(
                SESSION_CLEANUP_RETENTION_HOURS
            );


        if(deletedCount > 0){

            console.info(

                `EDORI session cleanup removed ${deletedCount} stale session record${deletedCount === 1 ? "" : "s"}.`

            );

        }

    }
    catch(error){

        console.error(

            "EDORI session cleanup failed:",

            error

        );

    }

}