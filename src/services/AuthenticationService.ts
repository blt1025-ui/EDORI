/**
 * AuthenticationService
 *
 * Development authentication/session boundary for EDORI.
 *
 * The UI should call this service rather than selecting
 * users directly.
 *
 * Production replacement:
 * - POST username/password to EDORI API
 * - server verifies password hash
 * - server creates secure session
 * - browser receives HttpOnly session cookie
 */

import type {

    User

}

from "../types/User";


import {

    clearCurrentUser,
    getCurrentUser,
    setCurrentUser

}

from "./UserService";


import {

    ensureBootstrapCredential,
    mustChangePassword,
    setPassword,
    verifyCredentials

}

from "./CredentialService";


import {

    clearFailedLogins,
    getLoginLockoutState,
    recordFailedLogin

}

from "./LoginSecurityService";


import {

    recordSecurityAuditEvent

}

from "./SecurityAuditService";


const PASSWORD_CHANGE_REQUEST_STORAGE_KEY =

    "edori_password_change_requested_v1";


export interface LoginResult {

    success:boolean;

    user?:User;

    passwordChangeRequired?:boolean;

    error?:string;

}


/**
 * Prepare development authentication.
 */
export async function initializeAuthentication():Promise<void> {

    await ensureBootstrapCredential();

}


/**
 * Authenticate one username/password pair.
 */
export async function login(

    username:string,

    password:string

):Promise<LoginResult> {

    try {

        const lockoutState =

            getLoginLockoutState(
                username
            );


        if(lockoutState.locked){

            recordSecurityAuditEvent({

                eventType:
                    "authentication.login.locked",

                target:{
                    username:
                        username.trim()
                },

                success:
                    false,

                summary:
                    "Login blocked because the account is temporarily locked."

            });


            return {

                success:
                    false,

                error:
                    "Sign in is temporarily unavailable for this account. Try again later."

            };

        }


        const userId =

            await verifyCredentials(

                username,

                password

            );


        if(!userId){

            recordFailedLogin(
                username
            );


            const updatedLockoutState =

                getLoginLockoutState(
                    username
                );


            recordSecurityAuditEvent({

                eventType:
                    updatedLockoutState.locked
                        ? "authentication.login.locked"
                        : "authentication.login.failed",

                target:{
                    username:
                        username.trim()
                },

                success:
                    false,

                summary:
                    updatedLockoutState.locked
                        ? "Account entered temporary lockout after repeated failed login attempts."
                        : "Login failed because the supplied credentials were not accepted."

            });


            return {

                success:
                    false,

                error:
                    "The username or password is incorrect."

            };

        }


        clearFailedLogins(
            username
        );


        const selected =

            setCurrentUser(
                userId
            );


        if(!selected){

            return {

                success:
                    false,

                error:
                    "This EDORI account is not available."

            };

        }


        const user =

            getCurrentUser();


        if(!user){

            return {

                success:
                    false,

                error:
                    "EDORI could not establish the user session."

            };

        }


        clearRequestedPasswordChange();


        recordSecurityAuditEvent({

            eventType:
                "authentication.login.success",

            actor:{
                userId:
                    user.id,

                username:
                    user.username,

                displayName:
                    user.displayName
            },

            target:{
                userId:
                    user.id,

                username:
                    user.username,

                displayName:
                    user.displayName
            },

            success:
                true,

            summary:
                "User signed in successfully.",

            details:{
                passwordChangeRequired:
                    mustChangePassword(
                        user.id
                    )
            }

        });


        return {

            success:
                true,

            user,

            passwordChangeRequired:
                mustChangePassword(
                    user.id
                )

        };

    }
    catch(error){

        console.error(

            "EDORI authentication failed:",

            error

        );


        return {

            success:
                false,

            error:
                "EDORI could not complete sign in."

        };

    }

}


/**
 * Sign out the current user.
 */
export function logout():void {

    const user =
        getCurrentUser();


    if(user){

        recordSecurityAuditEvent({

            eventType:
                "authentication.logout",

            actor:{
                userId:
                    user.id,

                username:
                    user.username,

                displayName:
                    user.displayName
            },

            target:{
                userId:
                    user.id,

                username:
                    user.username,

                displayName:
                    user.displayName
            },

            success:
                true,

            summary:
                "User signed out."

        });

    }


    clearRequestedPasswordChange();

    clearCurrentUser();

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
 * Cancel a voluntary password-change request.
 *
 * Forced password changes cannot be cancelled.
 */
export function cancelPasswordChange():boolean {

    const user =
        getCurrentUser();


    if(

        user

        &&

        mustChangePassword(
            user.id
        )

    ){

        return false;

    }


    clearRequestedPasswordChange();

    return true;

}


/**
 * Return true when the authenticated user must or has
 * voluntarily requested to change the password.
 */
export function isPasswordChangeRequired():boolean {

    const user =
        getCurrentUser();


    if(!user){

        return false;

    }


    if(

        mustChangePassword(
            user.id
        )

    ){

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
 * Return whether the password change is mandatory.
 */
export function isPasswordChangeForced():boolean {

    const user =
        getCurrentUser();


    return (

        user !== null

        &&

        mustChangePassword(
            user.id
        )

    );

}


/**
 * Change the authenticated user's password.
 *
 * The current password is verified before the new
 * password is persisted.
 */
export async function changeCurrentPassword(

    currentPassword:string,

    newPassword:string

):Promise<{

    success:boolean;

    error?:string;

}> {

    const user =
        getCurrentUser();


    if(!user){

        return {

            success:
                false,

            error:
                "No authenticated EDORI user is available."

        };

    }


    const verifiedUserId =

        await verifyCredentials(

            user.username,

            currentPassword

        );


    if(

        verifiedUserId

        !==

        user.id

    ){

        return {

            success:
                false,

            error:
                "The current password is incorrect."

        };

    }


    if(currentPassword === newPassword){

        return {

            success:
                false,

            error:
                "The new password must be different from the current password."

        };

    }


    try {

        await setPassword(

            user.id,

            newPassword,

            {
                mustChangePassword:
                    false
            }

        );


        clearRequestedPasswordChange();


        recordSecurityAuditEvent({

            eventType:
                "authentication.password.changed",

            actor:{
                userId:
                    user.id,

                username:
                    user.username,

                displayName:
                    user.displayName
            },

            target:{
                userId:
                    user.id,

                username:
                    user.username,

                displayName:
                    user.displayName
            },

            success:
                true,

            summary:
                "User changed their own password."

        });


        return {

            success:
                true

        };

    }
    catch(error){

        return {

            success:
                false,

            error:
                error instanceof Error
                    ? error.message
                    : "EDORI could not change the password."

        };

    }

}


/**
 * Clear voluntary password-change state.
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
 * Determine whether a user is currently authenticated.
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