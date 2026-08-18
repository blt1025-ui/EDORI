/**
 * ServerAuthenticationService
 *
 * PostgreSQL-backed EDORI authentication.
 */

import {

    hashPassword,
    verifyPassword

}

from "./PasswordService.js";


import {

    findCredentialByUserId,
    upsertCredential

}

from "../repositories/CredentialRepository.js";


import {

    clearFailedLogins,
    isUsernameLocked,
    recordFailedLogin

}

from "../repositories/LoginSecurityRepository.js";


import {

    createUserSession

}

from "../services/SessionService.js";


import {

    findUserByUsername

}

from "../repositories/UserRepository.js";


export interface AuthenticatedUser {

    id:string;

    username:string;

    displayName:string;

    email:string;

    role:
        | "viewer"
        | "operator"
        | "administrator";

    active:boolean;

}


export interface ServerLoginResult {

    success:boolean;

    locked?:boolean;

    user?:AuthenticatedUser;

    sessionToken?:string;

    mustChangePassword?:boolean;

}


/**
 * Authenticate and create a server session.
 */
export async function authenticateUser(

    input:{

        username:string;

        password:string;

        userAgent?:string;

        remoteAddress?:string;

    }

):Promise<ServerLoginResult> {

    if(

        await isUsernameLocked(
            input.username
        )

    ){

        return {

            success:
                false,

            locked:
                true

        };

    }


    const user =

        await findUserByUsername(
            input.username
        );


    if(

        !user

        ||

        !user.active

    ){

        const state =

            await recordFailedLogin(
                input.username
            );


        return {

            success:
                false,

            locked:
                state.locked

        };

    }


    const credential =

        await findCredentialByUserId(
            user.id
        );


    if(!credential){

        const state =

            await recordFailedLogin(
                input.username
            );


        return {

            success:
                false,

            locked:
                state.locked

        };

    }


    const validPassword =

        await verifyPassword(

            input.password,

            credential

        );


    if(!validPassword){

        const state =

            await recordFailedLogin(
                input.username
            );


        return {

            success:
                false,

            locked:
                state.locked

        };

    }


    await clearFailedLogins(
        input.username
    );


    const session =

        await createUserSession({

            userId:
                user.id,

            role:
                user.role,

            userAgent:
                input.userAgent,

            remoteAddress:
                input.remoteAddress

        });


    return {

        success:
            true,

        user,

        sessionToken:
            session.sessionToken,

        mustChangePassword:
            credential.mustChangePassword

    };

}


/**
 * Return whether one authenticated user must change
 * their current password.
 */
export async function getPasswordChangeRequirement(

    userId:string

):Promise<boolean> {

    const credential =

        await findCredentialByUserId(
            userId
        );


    return credential?.mustChangePassword

        ?? false;

}


/**
 * Change an authenticated user's password.
 */
export async function changeAuthenticatedUserPassword(

    input:{

        userId:string;

        currentPassword:string;

        newPassword:string;

    }

):Promise<{

    success:boolean;

    error?:string;

}> {

    const credential =

        await findCredentialByUserId(
            input.userId
        );


    if(!credential){

        return {

            success:
                false,

            error:
                "Current password verification failed."

        };

    }


    const currentPasswordValid =

        await verifyPassword(

            input.currentPassword,

            credential

        );


    if(!currentPasswordValid){

        return {

            success:
                false,

            error:
                "The current password is incorrect."

        };

    }


    if(

        input.currentPassword

        ===

        input.newPassword

    ){

        return {

            success:
                false,

            error:
                "The new password must be different from the current password."

        };

    }


    const newCredential =

        await hashPassword(
            input.newPassword
        );


    await upsertCredential({

        userId:
            input.userId,

        passwordHash:
            newCredential.passwordHash,

        passwordSalt:
            newCredential.passwordSalt,

        passwordAlgorithm:
            newCredential.passwordAlgorithm,

        passwordIterations:
            newCredential.passwordIterations,

        mustChangePassword:
            false

    });


    return {

        success:
            true

    };

}