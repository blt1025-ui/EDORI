/**
 * User
 *
 * Local EDORI user record.
 *
 * IMPORTANT:
 * This model represents application authorization.
 * It does not provide secure identity authentication.
 * A production identity provider can later replace the
 * session-selection layer without changing permissions.
 */

import type {

    RoleId

}

from "./Role";


export interface User {

    id:string;

    username:string;

    displayName:string;

    email:string;

    role:RoleId;

    active:boolean;

    createdAt:string;

    updatedAt:string;

}