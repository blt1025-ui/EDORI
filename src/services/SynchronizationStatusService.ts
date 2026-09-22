/**
 * SynchronizationStatusService
 *
 * Read-only UI status for Hospital Readiness multi-workstation
 * synchronization.
 *
 * This service does not perform synchronization. It only
 * exposes the current health of SynchronizationService.
 */

export type SynchronizationHealth =
    | "idle"
    | "syncing"
    | "synchronized"
    | "delayed"
    | "offline";


export interface SynchronizationStatus {

    health:SynchronizationHealth;

    lastSuccessfulSyncAt:string | null;

    lastAttemptAt:string | null;

    consecutiveFailures:number;

    message:string;

}


type SynchronizationStatusListener =

    (
        status:SynchronizationStatus
    ) => void;


let status:SynchronizationStatus = {

    health:
        "idle",

    lastSuccessfulSyncAt:
        null,

    lastAttemptAt:
        null,

    consecutiveFailures:
        0,

    message:
        "Synchronization has not started."

};


const listeners =

    new Set<SynchronizationStatusListener>();


/**
 * Return a defensive copy of current status.
 */
export function getSynchronizationStatus():

SynchronizationStatus {

    return {
        ...status
    };

}


/**
 * Subscribe to synchronization-status changes.
 *
 * Returns an unsubscribe function.
 */
export function subscribeToSynchronizationStatus(

    listener:SynchronizationStatusListener

):() => void {

    listeners.add(
        listener
    );


    listener(
        getSynchronizationStatus()
    );


    return () => {

        listeners.delete(
            listener
        );

    };

}


/**
 * Mark the beginning of one synchronization cycle.
 */
export function markSynchronizationStarted():

void {

    const now =
        new Date().toISOString();


    updateStatus({

        ...status,

        health:
            "syncing",

        lastAttemptAt:
            now,

        message:
            "Checking for shared Hospital Readiness updates."

    });

}


/**
 * Mark a successful synchronization cycle.
 */
export function markSynchronizationSucceeded():

void {

    const now =
        new Date().toISOString();


    updateStatus({

        health:
            "synchronized",

        lastSuccessfulSyncAt:
            now,

        lastAttemptAt:
            now,

        consecutiveFailures:
            0,

        message:
            "Hospital Readiness is synchronized."

    });

}


/**
 * Mark an unsuccessful synchronization cycle.
 *
 * A single transient failure should not make the
 * application appear out of synchronization. The
 * sidebar reports a delayed state only after multiple
 * consecutive failures.
 */
export function markSynchronizationFailed(

    error:unknown

):void {

    const now =
        new Date().toISOString();


    const failures =
        status.consecutiveFailures + 1;


    const offline =

        typeof navigator !== "undefined"
        &&
        navigator.onLine === false;


    /*
     * Require multiple consecutive failures before
     * reporting synchronization as delayed.
     *
     * This prevents an isolated failed request from
     * making an otherwise healthy workstation appear
     * out of synchronization.
     */
    const delayed =

        failures >= 3;


    updateStatus({

        ...status,

        health:
            offline
                ? "offline"
                : delayed
                    ? "delayed"
                    : status.lastSuccessfulSyncAt
                        ? "synchronized"
                        : "syncing",

        lastAttemptAt:
            now,

        consecutiveFailures:
            failures,

        message:
            offline
                ? "This workstation appears to be offline."
                : delayed
                    ? createFailureMessage(
                        error
                    )
                    : "A synchronization attempt was unsuccessful. Retrying automatically."

    });

}

/**
 * Reset status when authentication ends.
 */
export function markSynchronizationStopped():

void {

    updateStatus({

        health:
            "idle",

        lastSuccessfulSyncAt:
            status.lastSuccessfulSyncAt,

        lastAttemptAt:
            status.lastAttemptAt,

        consecutiveFailures:
            0,

        message:
            "Synchronization is paused."

    });

}


function createFailureMessage(

    error:unknown

):string {

    if(
        error instanceof TypeError
        &&
        /fetch|network|load/i.test(
            error.message
        )
    ){

        return "Hospital Readiness could not reach the server. Retrying automatically.";

    }


    return "Synchronization is delayed. Hospital Readiness will retry automatically.";

}


function updateStatus(

    nextStatus:SynchronizationStatus

):void {

    status = {
        ...nextStatus
    };


    listeners.forEach(

        listener => {

            try {

                listener(
                    getSynchronizationStatus()
                );

            }
            catch(error){

                console.error(
                    "Hospital Readiness synchronization-status listener failed:",
                    error
                );

            }

        }

    );

}