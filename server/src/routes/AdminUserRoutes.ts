/**
 * AdminUserRoutes
 *
 * PostgreSQL-backed EDORI user administration.
 */

import {

    Router

}

from "express";


import {

    hashPassword

}

from "../auth/PasswordService.js";


import {

    requireAuthentication

}

from "../middleware/AuthMiddleware.js";

import {

    requirePermission

}

from "../middleware/AuthorizationMiddleware.js";


import type {

    AuthenticatedRequest

}

from "../middleware/AuthMiddleware.js";


import {

    upsertCredential

}

from "../repositories/CredentialRepository.js";


import {

    revokeSessionsForUser

}

from "../repositories/SessionRepository.js";


import {

    createAuditIdentity,
    writeSecurityAudit

}

from "../services/SecurityAuditService.js";


import {

    createUser,
    findUserById,
    listUsers,
    updateUser

}

from "../repositories/UserRepository.js";


import type {

    RoleId

}

from "../repositories/UserRepository.js";


export const adminUserRouter =

    Router();


adminUserRouter.use(
    requireAuthentication
);


adminUserRouter.use(

    requirePermission(
        "users.manage"
    )

);


/**
 * Return centralized EDORI user directory.
 */
adminUserRouter.get(

    "/",

    async (_request, response, next) => {

        try {

            response.status(200).json({

                users:
                    await listUsers()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Create a user with a temporary password.
 */
adminUserRouter.post(

    "/",

    async (
        request:AuthenticatedRequest,
        response,
        next
    ) => {

        try {

            const role =

                normalizeRole(
                    request.body?.role
                );


            const temporaryPassword =

                typeof request.body?.temporaryPassword
                ===
                "string"

                    ? request.body.temporaryPassword

                    : "";


            if(!temporaryPassword){

                response.status(400).json({

                    error:
                        "invalid_request",

                    message:
                        "A temporary password is required."

                });


                return;

            }


            const credential =

                await hashPassword(
                    temporaryPassword
                );


            const user =

                await createUser({

                    username:
                        requireString(
                            request.body?.username,
                            "Username"
                        ),

                    displayName:
                        requireString(
                            request.body?.displayName,
                            "Display name"
                        ),

                    email:
                        typeof request.body?.email === "string"
                            ? request.body.email
                            : "",

                    role,

                    active:
                        true

                });


            try {

                await upsertCredential({

                    userId:
                        user.id,

                    passwordHash:
                        credential.passwordHash,

                    passwordSalt:
                        credential.passwordSalt,

                    passwordAlgorithm:
                        credential.passwordAlgorithm,

                    passwordIterations:
                        credential.passwordIterations,

                    mustChangePassword:
                        true

                });

            }
            catch(error){

                /*
                 * User creation succeeded but credential
                 * persistence failed. Surface the error so
                 * the Administrator can repair via reset.
                 */
                throw error;

            }


            await writeSecurityAudit({

                eventType:
                    "user.create",

                actor:
                    request.edoriUser
                        ? createAuditIdentity(
                            request.edoriUser
                        )
                        : undefined,

                target:
                    createAuditIdentity(
                        user
                    ),

                success:
                    true,

                summary:
                    "EDORI user account created.",

                details:{
                    role:
                        user.role,

                    active:
                        user.active,

                    temporaryPasswordRequired:
                        true
                },

                request

            });


            response.status(201).json({

                user,

                temporaryPasswordRequired:
                    true

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Update user profile, role, or active status.
 */
adminUserRouter.put(

    "/:userId",

    async (
        request:AuthenticatedRequest,
        response,
        next
    ) => {

        try {

            const userId =
                getRouteParameter(
                    request.params.userId
                );


            if(!userId){

                response.status(400).json({

                    error:
                        "invalid_request"

                });


                return;

            }


            const existing =

                await findUserById(
                    userId
                );


            if(!existing){

                response.status(404).json({

                    error:
                        "not_found",

                    message:
                        "User not found."

                });


                return;

            }


            const role =

                request.body?.role === undefined

                    ? undefined

                    : normalizeRole(
                        request.body.role
                    );


            const active =

                request.body?.active === undefined

                    ? undefined

                    : Boolean(
                        request.body.active
                    );


            const user =

                await updateUser(

                    userId,

                    {
                        username:
                            typeof request.body?.username === "string"
                                ? request.body.username
                                : undefined,

                        displayName:
                            typeof request.body?.displayName === "string"
                                ? request.body.displayName
                                : undefined,

                        email:
                            typeof request.body?.email === "string"
                                ? request.body.email
                                : undefined,

                        role,

                        active
                    }

                );


            const roleChanged =

                user.role
                !==
                existing.role;


            const activeChanged =

                user.active
                !==
                existing.active;


            if(

                roleChanged

                ||

                activeChanged

            ){

                await revokeSessionsForUser(

                    user.id,

                    roleChanged
                        ? "role_changed"
                        : "account_status_changed"

                );

            }


            await writeSecurityAudit({

                eventType:
                    "user.update",

                actor:
                    request.edoriUser
                        ? createAuditIdentity(
                            request.edoriUser
                        )
                        : undefined,

                target:
                    createAuditIdentity(
                        user
                    ),

                success:
                    true,

                summary:
                    "EDORI user account updated.",

                details:{
                    usernameChanged:
                        existing.username
                        !==
                        user.username,

                    displayNameChanged:
                        existing.displayName
                        !==
                        user.displayName,

                    emailChanged:
                        existing.email
                        !==
                        user.email
                },

                request

            });


            if(roleChanged){

                await writeSecurityAudit({

                    eventType:
                        "user.role.change",

                    actor:
                        request.edoriUser
                            ? createAuditIdentity(
                                request.edoriUser
                            )
                            : undefined,

                    target:
                        createAuditIdentity(
                            user
                        ),

                    success:
                        true,

                    summary:
                        "EDORI user role changed.",

                    details:{
                        previousRole:
                            existing.role,

                        newRole:
                            user.role
                    },

                    request

                });

            }


            if(activeChanged){

                await writeSecurityAudit({

                    eventType:
                        "user.status.change",

                    actor:
                        request.edoriUser
                            ? createAuditIdentity(
                                request.edoriUser
                            )
                            : undefined,

                    target:
                        createAuditIdentity(
                            user
                        ),

                    success:
                        true,

                    summary:
                        "EDORI user active status changed.",

                    details:{
                        previousActive:
                            existing.active,

                        newActive:
                            user.active
                    },

                    request

                });

            }


            response.status(200).json({

                user

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Administrator password reset.
 */
adminUserRouter.post(

    "/:userId/reset-password",

    async (
        request:AuthenticatedRequest,
        response,
        next
    ) => {

        try {

            const userId =
                getRouteParameter(
                    request.params.userId
                );


            if(!userId){

                response.status(400).json({

                    error:
                        "invalid_request"

                });


                return;

            }


            const user =

                await findUserById(
                    userId
                );


            if(!user){

                response.status(404).json({

                    error:
                        "not_found",

                    message:
                        "User not found."

                });


                return;

            }


            const temporaryPassword =

                requireString(
                    request.body?.temporaryPassword,
                    "Temporary password"
                );


            const credential =

                await hashPassword(
                    temporaryPassword
                );


            await upsertCredential({

                userId:
                    user.id,

                passwordHash:
                    credential.passwordHash,

                passwordSalt:
                    credential.passwordSalt,

                passwordAlgorithm:
                    credential.passwordAlgorithm,

                passwordIterations:
                    credential.passwordIterations,

                mustChangePassword:
                    true

            });


            await revokeSessionsForUser(

                user.id,

                "password_reset"

            );


            await writeSecurityAudit({

                eventType:
                    "user.password.reset",

                actor:
                    request.edoriUser
                        ? createAuditIdentity(
                            request.edoriUser
                        )
                        : undefined,

                target:
                    createAuditIdentity(
                        user
                    ),

                success:
                    true,

                summary:
                    "EDORI Administrator reset a user password.",

                details:{
                    mustChangePassword:
                        true,

                    sessionsRevoked:
                        true
                },

                request

            });


            response.status(200).json({

                success:
                    true,

                mustChangePassword:
                    true

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);



function getRouteParameter(

    value:string | string[] | undefined

):string {

    if(Array.isArray(value)){

        return value[0]

            ?? "";

    }


    return value

        ?? "";

}


function requireString(

    value:unknown,

    label:string

):string {

    if(

        typeof value !== "string"

        ||

        !value.trim()

    ){

        throw new Error(

            `${label} is required.`

        );

    }


    return value.trim();

}


function normalizeRole(

    value:unknown

):RoleId {

    if(

        value === "viewer"

        ||

        value === "operator"

        ||

        value === "administrator"

    ){

        return value;

    }


    throw new Error(

        "Select a valid EDORI role."

    );

}