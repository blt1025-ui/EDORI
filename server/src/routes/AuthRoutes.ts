/**
 * AuthRoutes
 *
 * Server-side EDORI authentication endpoints.
 */

import {

    Router

}

from "express";


import {

    authenticateUser,
    changeAuthenticatedUserPassword,
    getPasswordChangeRequirement

}

from "../auth/ServerAuthenticationService.js";

import {

    SESSION_COOKIE_MAX_AGE_MS

}

from "../config/SessionPolicy.js";


import {

    EDORI_SESSION_COOKIE,
    requireAuthentication

}

from "../middleware/AuthMiddleware.js";


import type {

    AuthenticatedRequest

}

from "../middleware/AuthMiddleware.js";


import {

    revokeSessionByToken

}

from "../repositories/SessionRepository.js";


import {

    createAuditIdentity,
    writeSecurityAudit

}

from "../services/SecurityAuditService.js";


export const authRouter =

    Router();


authRouter.post(

    "/login",

    async (request, response, next) => {

        try {

            const username =

                typeof request.body?.username
                ===
                "string"

                    ? request.body.username

                    : "";


            const password =

                typeof request.body?.password
                ===
                "string"

                    ? request.body.password

                    : "";


            if(

                !username.trim()

                ||

                !password

            ){

                response.status(400).json({

                    error:
                        "invalid_request",

                    message:
                        "Username and password are required."

                });


                return;

            }


            const result =

                await authenticateUser({

                    username,

                    password,

                    userAgent:
                        request.get(
                            "user-agent"
                        )
                        ?? undefined,

                    remoteAddress:
                        request.ip

                });


            if(!result.success){

                await writeSecurityAudit({

                    eventType:
                        "auth.login.failure",

                    actor:{
                        username:
                            username.trim()
                    },

                    success:
                        false,

                    summary:
                        "EDORI login attempt failed.",

                    details:{
                        locked:
                            result.locked
                            ?? false
                    },

                    request

                });


                response.status(

                    result.locked
                        ? 423
                        : 401

                ).json({

                    error:
                        result.locked
                            ? "account_locked"
                            : "invalid_credentials",

                    message:
                        result.locked
                            ? "Sign in is temporarily unavailable for this account. Try again later."
                            : "The username or password is incorrect."

                });


                return;

            }


            if(

                !result.sessionToken

                ||

                !result.user

            ){

                throw new Error(

                    "EDORI login succeeded without a session."

                );

            }


            response.cookie(

                EDORI_SESSION_COOKIE,

                result.sessionToken,

                {
                    httpOnly:
                        true,

                    secure:
                        process.env.NODE_ENV
                        ===
                        "production",

                    sameSite:
                        "strict",

                    path:
                        "/",

                    maxAge:
                        SESSION_COOKIE_MAX_AGE_MS

                }

            );


            await writeSecurityAudit({

                eventType:
                    "auth.login.success",

                actor:
                    createAuditIdentity(
                        result.user
                    ),

                success:
                    true,

                summary:
                    "EDORI user signed in successfully.",

                details:{
                    role:
                        result.user.role,

                    mustChangePassword:
                        result.mustChangePassword
                        ?? false
                },

                request

            });


            response.status(200).json({

                authenticated:
                    true,

                user:
                    result.user,

                mustChangePassword:
                    result.mustChangePassword
                    ?? false

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


authRouter.get(

    "/session",

    requireAuthentication,

    async (
        request:AuthenticatedRequest,
        response,
        next
    ) => {

        try {

            const user =
                request.edoriUser;


            if(!user){

                response.status(401).json({

                    error:
                        "unauthorized"

                });


                return;

            }


            const mustChangePassword =

                await getPasswordChangeRequirement(
                    user.id
                );


            response.status(200).json({

                authenticated:
                    true,

                user,

                mustChangePassword

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


authRouter.post(

    "/change-password",

    requireAuthentication,

    async (
        request:AuthenticatedRequest,
        response,
        next
    ) => {

        try {

            const user =
                request.edoriUser;


            if(!user){

                response.status(401).json({

                    error:
                        "unauthorized"

                });


                return;

            }


            const currentPassword =

                typeof request.body?.currentPassword
                ===
                "string"

                    ? request.body.currentPassword

                    : "";


            const newPassword =

                typeof request.body?.newPassword
                ===
                "string"

                    ? request.body.newPassword

                    : "";


            if(

                !currentPassword

                ||

                !newPassword

            ){

                response.status(400).json({

                    error:
                        "invalid_request",

                    message:
                        "Current password and new password are required."

                });


                return;

            }


            const result =

                await changeAuthenticatedUserPassword({

                    userId:
                        user.id,

                    currentPassword,

                    newPassword

                });


            if(!result.success){

                await writeSecurityAudit({

                    eventType:
                        "auth.password.change",

                    actor:
                        createAuditIdentity(
                            user
                        ),

                    target:
                        createAuditIdentity(
                            user
                        ),

                    success:
                        false,

                    summary:
                        "EDORI password change failed.",

                    details:{
                        reason:
                            result.error
                            ?? "password_change_failed"
                    },

                    request

                });


                response.status(400).json({

                    error:
                        "password_change_failed",

                    message:
                        result.error
                        ?? "EDORI could not change the password."

                });


                return;

            }


            await writeSecurityAudit({

                eventType:
                    "auth.password.change",

                actor:
                    createAuditIdentity(
                        user
                    ),

                target:
                    createAuditIdentity(
                        user
                    ),

                success:
                    true,

                summary:
                    "EDORI password changed successfully.",

                request

            });


            response.status(200).json({

                success:
                    true,

                mustChangePassword:
                    false

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


authRouter.post(

    "/logout",

    requireAuthentication,

    async (
        request:AuthenticatedRequest,
        response,
        next
    ) => {

        try {

            const user =
                request.edoriUser;


            if(request.edoriSessionToken){

                await revokeSessionByToken(

                    request.edoriSessionToken,

                    "user_logout"

                );

            }


            if(user){

                await writeSecurityAudit({

                    eventType:
                        "auth.logout",

                    actor:
                        createAuditIdentity(
                            user
                        ),

                    success:
                        true,

                    summary:
                        "EDORI user signed out.",

                    request

                });

            }


            response.clearCookie(

                EDORI_SESSION_COOKIE,

                {
                    httpOnly:
                        true,

                    secure:
                        process.env.NODE_ENV
                        ===
                        "production",

                    sameSite:
                        "strict",

                    path:
                        "/"

                }

            );


            response.status(200).json({

                authenticated:
                    false

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);