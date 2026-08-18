/**
 * SessionPolicy
 *
 * Centralized EDORI server-session policy.
 */

export type SessionRole =

    | "viewer"
    | "operator"
    | "administrator";


export interface SessionPolicy {

    inactivityTimeoutMinutes:number | null;

    absoluteTimeoutHours:number;

}


const SESSION_POLICIES:Record<SessionRole, SessionPolicy> = {

    viewer:{

        inactivityTimeoutMinutes:
            null,

        absoluteTimeoutHours:
            24

    },


    operator:{

        inactivityTimeoutMinutes:
            30,

        absoluteTimeoutHours:
            24

    },


    administrator:{

        inactivityTimeoutMinutes:
            30,

        absoluteTimeoutHours:
            24

    }

};


export const SESSION_CLEANUP_RETENTION_HOURS =

    7
    *
    24;


export const SESSION_CLEANUP_MINIMUM_INTERVAL_MINUTES =

    60;


export const SESSION_COOKIE_MAX_AGE_MS =

    24
    *
    60
    *
    60
    *
    1000;


export function getSessionPolicyForRole(

    role:SessionRole

):SessionPolicy {

    return {

        ...SESSION_POLICIES[
            role
        ]

    };

}