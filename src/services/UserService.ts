/**
 * UserService
 *
 * Server-session identity facade for EDORI.
 *
 * PostgreSQL + the EDORI API are now the authoritative
 * sources for users, credentials, roles, and sessions.
 *
 * This frontend service intentionally keeps only the
 * currently authenticated server user in memory so
 * existing authorization/components can continue using
 * getCurrentUser() synchronously.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import type {

    User

}

from "../types/User";


import {

    emit

}

from "./EventService";


/**
 * Legacy browser-storage keys from the development
 * authentication implementation.
 *
 * They are removed automatically so obsolete local user
 * records and password-derived material do not remain in
 * the browser after the PostgreSQL migration.
 */
const LEGACY_USER_STORAGE_KEY =

    "edori_users_v1";


const LEGACY_CURRENT_USER_STORAGE_KEY =

    "edori_current_user_v1";


const LEGACY_CREDENTIAL_STORAGE_KEY =

    "edori_user_credentials_v1";


/**
 * Authenticated user supplied by the server session.
 *
 * This value is memory-only. The HttpOnly session cookie
 * is the persistent authentication authority.
 */
let authenticatedSessionUser:User | null = null;


/**
 * Remove obsolete browser-based authentication/user
 * storage from earlier EDORI development phases.
 */
clearLegacyAuthenticationStorage();


/**
 * Return the currently authenticated EDORI user.
 */
export function getCurrentUser():User | null {

    if(

        !authenticatedSessionUser

        ||

        !authenticatedSessionUser.active

    ){

        return null;

    }


    return {

        ...authenticatedSessionUser

    };

}


/**
 * Set or clear the user confirmed by the server session.
 */
export function setAuthenticatedSessionUser(

    user:User | null

):void {

    authenticatedSessionUser =

        user

            ? {
                ...user
            }

            : null;


    notifyUsersChanged();

}


/**
 * Clear the current frontend identity during logout or
 * authentication failure.
 *
 * This does not revoke the server session by itself;
 * AuthenticationService performs the server logout call.
 */
export function clearCurrentUser():void {

    authenticatedSessionUser =
        null;


    notifyUsersChanged();

}


/**
 * Notify EDORI components that authenticated identity or
 * authorization may have changed.
 */
function notifyUsersChanged():void {

    emit(

        APP_EVENTS.USERS_CHANGED

    );

}


/**
 * Permanently remove obsolete local-development user and
 * credential data.
 */
function clearLegacyAuthenticationStorage():void {

    try {

        localStorage.removeItem(
            LEGACY_USER_STORAGE_KEY
        );


        localStorage.removeItem(
            LEGACY_CREDENTIAL_STORAGE_KEY
        );

    }
    catch(error){

        console.warn(

            "EDORI could not clear legacy local authentication storage.",

            error

        );

    }


    try {

        sessionStorage.removeItem(
            LEGACY_CURRENT_USER_STORAGE_KEY
        );


        /*
         * Some earlier builds accidentally cleared/read
         * this key from different storage areas, so remove
         * the localStorage copy as well.
         */
        localStorage.removeItem(
            LEGACY_CURRENT_USER_STORAGE_KEY
        );

    }
    catch(error){

        console.warn(

            "EDORI could not clear legacy current-user storage.",

            error

        );

    }

}