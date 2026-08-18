/**
 * SynchronizationService
 *
 * Multi-workstation synchronization for shared EDORI
 * operational state and administrative configuration.
 *
 * Polls every twenty seconds while authenticated.
 */

import {

    isAuthenticated

}

from "./AuthenticationService";


import {

    subscribe

}

from "./EventService";


import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    refreshServerCurrentState

}

from "./StateService";


import {

    refreshServerResultState

}

from "./ResultService";


import {

    refreshServerConfiguration

}

from "./ConfigurationService";


import {

    refreshServerHistoricalDataset

}

from "./HistoricalDataRepository";


import {

    refreshServerTriggerConfiguration

}

from "./TriggerConfigurationService";


import {

    refreshServerSurgePlan

}

from "./SurgePlanService";


import {

    markSynchronizationFailed,
    markSynchronizationStarted,
    markSynchronizationStopped,
    markSynchronizationSucceeded

}

from "./SynchronizationStatusService";


const SYNCHRONIZATION_INTERVAL_MILLISECONDS =

    20_000;


let synchronizationTimer:

ReturnType<typeof setInterval> | null = null;


let synchronizationInProgress = false;

let synchronizationInitialized = false;


/**
 * Initialize synchronization once for the lifetime of the
 * page.
 */
export function initializeSynchronizationService():

void {

    if(synchronizationInitialized){

        return;

    }


    synchronizationInitialized = true;


    subscribe(

        APP_EVENTS.USERS_CHANGED,

        reconcileSynchronizationState

    );


    window.addEventListener(

        "edori-authentication-state-changed",

        reconcileSynchronizationState

    );


    window.addEventListener(

        "online",

        () => {

            if(isAuthenticated()){

                void synchronizeNow();

            }

        }

    );


    window.addEventListener(

        "offline",

        () => {

            markSynchronizationFailed(
                new TypeError(
                    "Network connection is unavailable."
                )
            );

        }

    );


    document.addEventListener(

        "visibilitychange",

        () => {

            if(
                document.visibilityState === "visible"
                &&
                isAuthenticated()
            ){

                void synchronizeNow();

            }

        }

    );


    reconcileSynchronizationState();

}


/**
 * Stop the polling timer.
 */
export function stopSynchronizationService():

void {

    if(synchronizationTimer){

        clearInterval(
            synchronizationTimer
        );


        synchronizationTimer = null;

    }


    markSynchronizationStopped();

}


/**
 * Run one complete synchronization cycle.
 */
export async function synchronizeNow():

Promise<void> {

    if(
        synchronizationInProgress
        ||
        !isAuthenticated()
    ){

        return;

    }


    synchronizationInProgress = true;


    markSynchronizationStarted();


    try {

        await refreshServerCurrentState();

        await refreshServerResultState();


        const configurationChanged =

            await refreshServerConfiguration();


        const historicalDataChanged =

            await refreshServerHistoricalDataset();


        const triggerConfigurationChanged =

            await refreshServerTriggerConfiguration();


        const surgePlanChanged =

            await refreshServerSurgePlan();


        if(

            configurationChanged

            ||

            historicalDataChanged

            ||

            triggerConfigurationChanged

            ||

            surgePlanChanged

        ){

            console.info(

                "EDORI synchronized shared configuration:",

                {

                    configurationChanged,

                    historicalDataChanged,

                    triggerConfigurationChanged,

                    surgePlanChanged

                }

            );

        }


        markSynchronizationSucceeded();

    }
    catch(error){

        markSynchronizationFailed(
            error
        );


        /*
         * Temporary API/database failures must not blank or
         * crash the already-rendered dashboard.
         */
        console.warn(

            "EDORI synchronization cycle could not complete:",

            error

        );

    }
    finally {

        synchronizationInProgress = false;

    }

}


/**
 * Start or stop synchronization to match current
 * authentication state.
 */
function reconcileSynchronizationState():

void {

    if(!isAuthenticated()){

        stopSynchronizationService();

        return;

    }


    if(!synchronizationTimer){

        synchronizationTimer =

            setInterval(

                () => {

                    void synchronizeNow();

                },

                SYNCHRONIZATION_INTERVAL_MILLISECONDS

            );

    }


    /*
     * Synchronize immediately after authentication instead
     * of waiting for the first interval.
     */
    void synchronizeNow();

}