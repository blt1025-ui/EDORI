/**
 * SessionSecurityService
 *
 * Development inactivity protection for authenticated
 * EDORI sessions.
 *
 * Policy:
 * - Viewer: no inactivity timeout
 * - Operator: 30-minute inactivity timeout
 * - Administrator: 30-minute inactivity timeout
 * - Warning appears 5 minutes before automatic logout
 *
 * Production EDORI should enforce session expiration on
 * the backend as well as in the browser.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    logout

}

from "./AuthenticationService";


import {

    subscribe

}

from "./EventService";


import {

    getCurrentUser

}

from "./UserService";


const INACTIVITY_TIMEOUT_MILLISECONDS =

    30 * 60 * 1000;


const WARNING_BEFORE_TIMEOUT_MILLISECONDS =

    5 * 60 * 1000;


const ACTIVITY_EVENTS = [

    "mousedown",
    "keydown",
    "touchstart",
    "scroll"

] as const;


let initialized = false;


let warningTimer:number | null = null;


let logoutTimer:number | null = null;


let warningVisible = false;


/**
 * Initialize inactivity-session protection.
 */
export function initializeSessionSecurity():void {

    if(initialized){

        synchronizeSessionSecurity();

        return;

    }


    initialized =
        true;


    ACTIVITY_EVENTS.forEach(

        eventName => {

            window.addEventListener(

                eventName,

                handleUserActivity,

                {
                    passive:
                        true
                }

            );

        }

    );


    subscribe(

        APP_EVENTS.USERS_CHANGED,

        synchronizeSessionSecurity

    );


    synchronizeSessionSecurity();

}


/**
 * Re-evaluate whether the current account should be
 * subject to an inactivity timeout.
 */
function synchronizeSessionSecurity():void {

    clearSessionTimers();

    hideWarning();


    const user =
        getCurrentUser();


    if(!user){

        return;

    }


    /*
     * Viewer accounts are intentionally exempt from
     * inactivity logout.
     */
    if(user.role === "viewer"){

        return;

    }


    scheduleSessionTimers();

}


/**
 * Any activity restarts the inactivity window for
 * Operator and Administrator accounts.
 */
function handleUserActivity():void {

    const user =
        getCurrentUser();


    if(

        !user

        ||

        user.role === "viewer"

    ){

        return;

    }


    clearSessionTimers();


    if(warningVisible){

        hideWarning();

    }


    scheduleSessionTimers();

}


/**
 * Schedule warning and automatic logout.
 */
function scheduleSessionTimers():void {

    const warningDelay =

        INACTIVITY_TIMEOUT_MILLISECONDS

        -

        WARNING_BEFORE_TIMEOUT_MILLISECONDS;


    warningTimer =

        window.setTimeout(

            showWarning,

            warningDelay

        );


    logoutTimer =

        window.setTimeout(

            performAutomaticLogout,

            INACTIVITY_TIMEOUT_MILLISECONDS

        );

}


/**
 * Display the inactivity warning.
 */
function showWarning():void {

    const user =
        getCurrentUser();


    if(

        !user

        ||

        user.role === "viewer"

    ){

        return;

    }


    warningVisible =
        true;


    let backdrop =

        document.getElementById(

            "edoriSessionWarningBackdrop"

        );


    if(!backdrop){

        backdrop =

            document.createElement(
                "div"
            );


        backdrop.id =
            "edoriSessionWarningBackdrop";


        backdrop.className =
            "edori-session-warning-backdrop";


        backdrop.innerHTML = `

            <div
                class="edori-session-warning-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="edoriSessionWarningTitle"
                aria-describedby="edoriSessionWarningDescription"
            >

                <div class="edori-session-warning-icon">
                    ⏱
                </div>


                <span class="application-page-eyebrow">
                    Session Security
                </span>


                <h2 id="edoriSessionWarningTitle">
                    Your session will end soon
                </h2>


                <p id="edoriSessionWarningDescription">
                    EDORI has been inactive. For security, this session
                    will automatically sign out in approximately
                    5 minutes unless activity resumes.
                </p>


                <button
                    id="edoriContinueSessionButton"
                    class="button button-primary"
                    type="button"
                >
                    Continue Session
                </button>

            </div>

        `;


        document.body.appendChild(
            backdrop
        );


        const continueButton =

            document.getElementById(

                "edoriContinueSessionButton"

            ) as HTMLButtonElement | null;


        continueButton?.addEventListener(

            "click",

            () => {

                handleUserActivity();

            }

        );

    }


    backdrop.removeAttribute(
        "hidden"
    );


    window.setTimeout(

        () => {

            const continueButton =

                document.getElementById(

                    "edoriContinueSessionButton"

                ) as HTMLButtonElement | null;


            continueButton?.focus();

        },

        0

    );

}


/**
 * Hide inactivity warning.
 */
function hideWarning():void {

    warningVisible =
        false;


    const backdrop =

        document.getElementById(

            "edoriSessionWarningBackdrop"

        );


    if(backdrop){

        backdrop.setAttribute(
            "hidden",
            ""
        );

    }

}


/**
 * Automatically end the current Operator/Admin session.
 */
function performAutomaticLogout():void {

    clearSessionTimers();

    hideWarning();


    const user =
        getCurrentUser();


    if(

        !user

        ||

        user.role === "viewer"

    ){

        return;

    }


    logout();

}


/**
 * Cancel current warning/logout timers.
 */
function clearSessionTimers():void {

    if(warningTimer !== null){

        window.clearTimeout(
            warningTimer
        );


        warningTimer =
            null;

    }


    if(logoutTimer !== null){

        window.clearTimeout(
            logoutTimer
        );


        logoutTimer =
            null;

    }

}


/**
 * Expose policy for UI/testing.
 */
export function getSessionSecurityPolicy():{

    viewerTimeoutEnabled:boolean;

    operatorTimeoutMinutes:number;

    administratorTimeoutMinutes:number;

    warningMinutes:number;

} {

    return {

        viewerTimeoutEnabled:
            false,

        operatorTimeoutMinutes:
            Math.round(
                INACTIVITY_TIMEOUT_MILLISECONDS
                /
                60_000
            ),

        administratorTimeoutMinutes:
            Math.round(
                INACTIVITY_TIMEOUT_MILLISECONDS
                /
                60_000
            ),

        warningMinutes:
            Math.round(
                WARNING_BEFORE_TIMEOUT_MILLISECONDS
                /
                60_000
            )

    };

}