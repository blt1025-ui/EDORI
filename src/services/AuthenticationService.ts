/**
 * AuthenticationService
 *
 * Browser boundary for PostgreSQL-backed EDORI
 * authentication.
 *
 * The server owns:
 * - password verification
 * - failed-login protection
 * - session creation/revocation
 * - inactivity expiration
 *
 * The browser receives only a user snapshot and relies
 * on an HttpOnly session cookie.
 */

import type {

    User

}

from "../types/User";


import {

    clearCurrentUser,
    getCurrentUser,
    setAuthenticatedSessionUser

}

from "./UserService";


const PASSWORD_CHANGE_REQUEST_STORAGE_KEY =

    "edori_password_change_requested_v1";


let serverMustChangePassword =

    false;


export interface LoginResult {

    success:boolean;

    user?:User;

    passwordChangeRequired?:boolean;

    error?:string;

}


/**
 * Restore authenticated identity from the server
 * HttpOnly session cookie.
 */
export async function initializeAuthentication():Promise<void> {

    try {

        const response =

            await fetch(

                "/api/auth/session",

                {
                    method:
                        "GET",

                    credentials:
                        "include",

                    headers:{
                        "Accept":
                            "application/json"
                    }

                }

            );


        if(response.status === 401){

            serverMustChangePassword =
                false;


            setAuthenticatedSessionUser(
                null
            );


            return;

        }


        if(!response.ok){

            throw new Error(

                `EDORI session check failed with HTTP ${response.status}.`

            );

        }


        const payload =

            await readJson<SessionResponse>(
                response
            );


        if(

            !payload.authenticated

            ||

            !payload.user

        ){

            serverMustChangePassword =
                false;


            setAuthenticatedSessionUser(
                null
            );


            return;

        }


        serverMustChangePassword =

            payload.mustChangePassword
            ?? false;


        setAuthenticatedSessionUser(

            normalizeUser(
                payload.user
            )

        );

    }
    catch(error){

        serverMustChangePassword =
            false;


        setAuthenticatedSessionUser(
            null
        );


        console.error(

            "EDORI could not restore the server session.",

            error

        );

    }

}


/**
 * Authenticate with the EDORI API.
 */
export async function login(

    username:string,

    password:string

):Promise<LoginResult> {

    try {

        const response =

            await fetch(

                "/api/auth/login",

                {
                    method:
                        "POST",

                    credentials:
                        "include",

                    headers:{
                        "Accept":
                            "application/json",

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            username,

                            password

                        })

                }

            );


        const payload =

            await readJson<LoginResponse>(
                response
            );


        if(!response.ok){

            return {

                success:
                    false,

                error:
                    payload.message
                    ?? (
                        response.status === 423
                            ? "Sign in is temporarily unavailable for this account. Try again later."
                            : "The username or password is incorrect."
                    )

            };

        }


        if(

            !payload.authenticated

            ||

            !payload.user

        ){

            return {

                success:
                    false,

                error:
                    "EDORI could not establish the authenticated session."

            };

        }


        const user =

            normalizeUser(
                payload.user
            );


        serverMustChangePassword =

            payload.mustChangePassword
            ?? false;


        clearRequestedPasswordChange();


        setAuthenticatedSessionUser(
            user
        );


        return {

            success:
                true,

            user,

            passwordChangeRequired:
                serverMustChangePassword

        };

    }
    catch(error){

        console.error(

            "EDORI login request failed:",

            error

        );


        return {

            success:
                false,

            error:
                "EDORI could not reach the authentication service."

        };

    }

}


/**
 * End the server session and clear browser identity.
 */
export async function logout():Promise<void> {

    try {

        await fetch(

            "/api/auth/logout",

            {
                method:
                    "POST",

                credentials:
                    "include",

                headers:{
                    "Accept":
                        "application/json"
                }

            }

        );

    }
    catch(error){

        console.error(

            "EDORI logout request failed:",

            error

        );

    }
    finally {

        serverMustChangePassword =
            false;


        clearRequestedPasswordChange();


        clearCurrentUser();

    }

}


/**
 * Determine whether a user is currently authenticated.
 *
 * initializeAuthentication() confirms this state with
 * the server before main.ts renders the application.
 */
export function isAuthenticated():boolean {

    return getCurrentUser() !== null;

}


/**
 * Return authenticated identity.
 */
export function getAuthenticatedUser():User | null {

    return getCurrentUser();

}


/**
 * Request the password-change workspace voluntarily.
 */
export function requestPasswordChange():void {

    try {

        sessionStorage.setItem(

            PASSWORD_CHANGE_REQUEST_STORAGE_KEY,

            "true"

        );

    }
    catch(error){

        console.error(

            "EDORI could not request password change.",

            error

        );

    }

}


/**
 * Cancel a voluntary password change.
 *
 * Server-required password changes cannot be cancelled.
 */
export function cancelPasswordChange():boolean {

    if(serverMustChangePassword){

        return false;

    }


    clearRequestedPasswordChange();

    return true;

}


/**
 * Return whether password-change UI should be displayed.
 */
export function isPasswordChangeRequired():boolean {

    if(!isAuthenticated()){

        return false;

    }


    if(serverMustChangePassword){

        return true;

    }


    try {

        return (

            sessionStorage.getItem(

                PASSWORD_CHANGE_REQUEST_STORAGE_KEY

            )

            ===

            "true"

        );

    }
    catch {

        return false;

    }

}


/**
 * Return whether the current password change is forced.
 */
export function isPasswordChangeForced():boolean {

    return (

        isAuthenticated()

        &&

        serverMustChangePassword

    );

}


/**
 * Change the authenticated user's password through the
 * server API.
 */
export async function changeCurrentPassword(

    currentPassword:string,

    newPassword:string

):Promise<{

    success:boolean;

    error?:string;

}> {

    try {

        const response =

            await fetch(

                "/api/auth/change-password",

                {
                    method:
                        "POST",

                    credentials:
                        "include",

                    headers:{
                        "Accept":
                            "application/json",

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            currentPassword,

                            newPassword

                        })

                }

            );


        const payload =

            await readJson<PasswordChangeResponse>(
                response
            );


        if(!response.ok){

            return {

                success:
                    false,

                error:
                    payload.message
                    ?? "EDORI could not change the password."

            };

        }


        serverMustChangePassword =
            false;


        clearRequestedPasswordChange();


        return {

            success:
                true

        };

    }
    catch(error){

        console.error(

            "EDORI password-change request failed:",

            error

        );


        return {

            success:
                false,

            error:
                "EDORI could not reach the authentication service."

        };

    }

}


/**
 * Normalize server user payload into the existing
 * frontend User model.
 */
function normalizeUser(

    value:ServerUser

):User {

    return {

        id:
            value.id,

        username:
            value.username,

        displayName:
            value.displayName,

        email:
            value.email
            ?? "",

        role:
            value.role,

        active:
            value.active,

        createdAt:
            value.createdAt
            ?? new Date().toISOString(),

        updatedAt:
            value.updatedAt
            ?? new Date().toISOString()

    };

}


/**
 * Remove voluntary password-change state.
 */
function clearRequestedPasswordChange():void {

    try {

        sessionStorage.removeItem(

            PASSWORD_CHANGE_REQUEST_STORAGE_KEY

        );

    }
    catch(error){

        console.error(

            "EDORI could not clear password-change state.",

            error

        );

    }

}


/**
 * Parse JSON safely even when the server returns an
 * empty response body.
 */
async function readJson<T>(

    response:Response

):Promise<T> {

    const text =

        await response.text();


    if(!text){

        return {} as T;

    }


    return JSON.parse(
        text
    ) as T;

}


interface ServerUser {

    id:string;

    username:string;

    displayName:string;

    email?:string;

    role:
        | "viewer"
        | "operator"
        | "administrator";

    active:boolean;

    createdAt?:string;

    updatedAt?:string;

}


interface SessionResponse {

    authenticated?:boolean;

    user?:ServerUser;

    mustChangePassword?:boolean;

    message?:string;

}


interface LoginResponse extends SessionResponse {

    error?:string;

}


interface PasswordChangeResponse {

    success?:boolean;

    mustChangePassword?:boolean;

    message?:string;

}