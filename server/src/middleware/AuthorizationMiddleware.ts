/**
 * AuthorizationMiddleware
 *
 * Reusable server-side permission enforcement.
 */

import type {
    NextFunction,
    Response
}
from "express";

import {
    roleHasPermission
}
from "../authorization/PermissionDefinitions.js";

import type {
    PermissionId
}
from "../authorization/PermissionDefinitions.js";

import type {
    AuthenticatedRequest
}
from "./AuthMiddleware.js";

export function requirePermission(
    permission:PermissionId
) {
    return (
        request:AuthenticatedRequest,
        response:Response,
        next:NextFunction
    ):void => {
        const user =
            request.edoriUser;

        if(!user){
            response.status(401).json({
                error:"unauthorized",
                message:"Authentication is required."
            });
            return;
        }

        if(
            !roleHasPermission(
                user.role,
                permission
            )
        ){
            response.status(403).json({
                error:"forbidden",
                message:"You do not have permission to perform this action."
            });
            return;
        }

        next();
    };
}