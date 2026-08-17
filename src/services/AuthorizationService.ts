/**
 * AuthorizationService
 *
 * Central permission checks for EDORI.
 *
 * UI components and operational actions should call this
 * service rather than checking role names directly.
 */

import {

    getRolePermissions

}

from "../types/RoleDefinitions";


import type {

    Permission

}

from "../types/Permission";


import type {

    User

}

from "../types/User";


import {

    getCurrentUser

}

from "./UserService";


/**
 * Test a specific user for one permission.
 */
export function userHasPermission(

    user:User | null,

    permission:Permission

):boolean {

    if(

        !user

        ||

        !user.active

    ){

        return false;

    }


    return getRolePermissions(
        user.role
    ).includes(
        permission
    );

}


/**
 * Test the current EDORI user for one permission.
 */
export function hasPermission(

    permission:Permission

):boolean {

    return userHasPermission(

        getCurrentUser(),

        permission

    );

}


/**
 * Test whether the current user has every permission.
 */
export function hasAllPermissions(

    permissions:Permission[]

):boolean {

    return permissions.every(

        permission =>
            hasPermission(
                permission
            )

    );

}


/**
 * Test whether the current user has at least one
 * permission from a set.
 */
export function hasAnyPermission(

    permissions:Permission[]

):boolean {

    return permissions.some(

        permission =>
            hasPermission(
                permission
            )

    );

}


/**
 * Require a permission before a protected action.
 *
 * Throws so callers cannot accidentally continue after
 * failed authorization.
 */
export function requirePermission(

    permission:Permission

):void {

    if(

        hasPermission(
            permission
        )

    ){

        return;

    }


    throw new Error(
        `Permission denied: ${permission}`
    );

}


/**
 * Return current permission set for UI rendering.
 */
export function getCurrentPermissions():Permission[] {

    const user =
        getCurrentUser();


    if(

        !user

        ||

        !user.active

    ){

        return [];

    }


    return getRolePermissions(
        user.role
    );

}