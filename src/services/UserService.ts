/**
 * UserService
 *
 * Local EDORI user-directory persistence.
 *
 * Phase 1 uses localStorage so the authorization model
 * can be integrated into the application now.
 *
 * This is NOT production authentication. Passwords are
 * intentionally not stored here.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import type {

    RoleId

}

from "../types/Role";


import type {

    User

}

from "../types/User";


import {

    emit

}

from "./EventService";


import {

    requirePermission

}

from "./AuthorizationService";


const USER_STORAGE_KEY =

    "edori_users_v1";


const CURRENT_USER_STORAGE_KEY =

    "edori_current_user_v1";


/**
 * Return all users sorted by display name.
 *
 * A bootstrap Administrator is created automatically
 * when no user directory exists.
 */
export function getUsers():User[] {

    const users =

        readUsers();


    if(users.length > 0){

        return sortUsers(
            users
        );

    }


    const administrator =

        createBootstrapAdministrator();


    writeUsers([
        administrator
    ]);


    return [
        administrator
    ];

}


/**
 * Find one user by ID.
 */
export function getUserById(

    userId:string

):User | null {

    return getUsers()

        .find(

            user =>
                user.id === userId

        )

        ?? null;

}


/**
 * Return the currently authenticated/current EDORI user.
 *
 * No fallback user is selected automatically. A null
 * result represents a signed-out session.
 */
export function getCurrentUser():User | null {

    const currentId =

        readCurrentUserId();


    if(!currentId){

        return null;

    }


    const currentUser =

        getUsers()

            .find(

                user =>
                    user.id === currentId
                    &&
                    user.active

            )

        ?? null;


    if(!currentUser){

        clearCurrentUserId();

        return null;

    }


    return currentUser;

}


/**
 * Select the current local EDORI user.
 *
 * This is a development/local session mechanism, not a
 * password-based authentication function.
 */
export function setCurrentUser(

    userId:string

):boolean {

    const user =

        getUserById(
            userId
        );


    if(

        !user

        ||

        !user.active

    ){

        return false;

    }


    const existingUserId =

        readCurrentUserId();


    /*
     * Avoid unnecessary application refreshes when the
     * requested user is already selected.
     */
    if(existingUserId === user.id){

        return true;

    }


    setCurrentUserId(
        user.id
    );


    notifyUsersChanged();


    return true;

}


/**
 * Clear the current EDORI user.
 *
 * Used by the authentication/session layer during
 * sign-out. This does not delete or deactivate the
 * underlying user record.
 */
export function clearCurrentUser():void {

    clearCurrentUserId();


    emit(

        APP_EVENTS.USERS_CHANGED

    );

}


/**
 * Create a new user.
 */
export function createUser(

    input:{

        username:string;

        displayName:string;

        email?:string;

        role:RoleId;

    }

):User {

    requirePermission(
        "users.manage"
    );


    const users =

        getUsers();


    const username =

        normalizeRequiredText(
            input.username,
            "Username"
        );


    const displayName =

        normalizeRequiredText(
            input.displayName,
            "Display name"
        );


    if(

        users.some(

            user =>
                user.username
                    .toLowerCase()
                ===
                username.toLowerCase()

        )

    ){

        throw new Error(
            "A user with that username already exists."
        );

    }


    const now =

        new Date().toISOString();


    const user:User = {

        id:
            createUserId(),

        username,

        displayName,

        email:
            input.email?.trim() ?? "",

        role:
            input.role,

        active:
            true,

        createdAt:
            now,

        updatedAt:
            now

    };


    writeUsers([
        ...users,
        user
    ]);


    notifyUsersChanged();


    return {
        ...user
    };

}


/**
 * Update one user.
 */
export function updateUser(

    userId:string,

    changes:{

        username?:string;

        displayName?:string;

        email?:string;

        role?:RoleId;

        active?:boolean;

    }

):User {

    requirePermission(
        "users.manage"
    );


    const users =

        getUsers();


    const index =

        users.findIndex(

            user =>
                user.id === userId

        );


    if(index < 0){

        throw new Error(
            "User not found."
        );

    }


    const existing =

        users[index];


    if(!existing){

        throw new Error(
            "User not found."
        );

    }


    const username =

        changes.username === undefined

            ? existing.username

            : normalizeRequiredText(
                changes.username,
                "Username"
            );


    if(

        users.some(

            user =>
                user.id !== userId
                &&
                user.username
                    .toLowerCase()
                ===
                username.toLowerCase()

        )

    ){

        throw new Error(
            "A user with that username already exists."
        );

    }


    const updated:User = {

        ...existing,

        username,

        displayName:

            changes.displayName === undefined

                ? existing.displayName

                : normalizeRequiredText(
                    changes.displayName,
                    "Display name"
                ),

        email:

            changes.email === undefined

                ? existing.email

                : changes.email.trim(),

        role:

            changes.role

            ?? existing.role,

        active:

            changes.active

            ?? existing.active,

        updatedAt:

            new Date().toISOString()

    };


    /*
     * Never allow the final active Administrator to be
     * deactivated or demoted.
     */
    enforceAdministratorContinuity(
        users,
        existing,
        updated
    );


    users[index] =

        updated;


    writeUsers(
        users
    );


    /*
     * If the current user was deactivated, select another
     * active user automatically.
     */
    const currentId =

        readCurrentUserId();


    if(

        currentId === updated.id

        &&

        !updated.active

    ){

        const fallback =

            users.find(

                user =>
                    user.active

            );


        if(fallback){

            setCurrentUserId(
                fallback.id
            );

        }

        else{

            clearCurrentUserId();

        }

    }


    /*
     * One event covers both the directory change and any
     * automatic session change caused by the update.
     */
    notifyUsersChanged();


    return {
        ...updated
    };

}


/**
 * Convenience role update.
 */
export function setUserRole(

    userId:string,

    role:RoleId

):User {

    return updateUser(

        userId,

        {
            role
        }

    );

}


/**
 * Convenience activation/deactivation.
 */
export function setUserActive(

    userId:string,

    active:boolean

):User {

    return updateUser(

        userId,

        {
            active
        }

    );

}


/**
 * Count active Administrators.
 */
export function getActiveAdministratorCount():number {

    return getUsers()

        .filter(

            user =>
                user.active
                &&
                user.role
                ===
                "administrator"

        )

        .length;

}


/**
 * Storage key helper for future migration/debugging.
 */
export function getUserStorageKey():string {

    return USER_STORAGE_KEY;

}


/**
 * Notify application components that the local user
 * directory or current-user session changed.
 */
function notifyUsersChanged():void {

    emit(
        APP_EVENTS.USERS_CHANGED
    );

}


/**
 * Create initial local Administrator.
 */
function createBootstrapAdministrator():User {

    const now =

        new Date().toISOString();


    return {

        id:
            "bootstrap-administrator",

        username:
            "admin",

        displayName:
            "EDORI Administrator",

        email:
            "",

        role:
            "administrator",

        active:
            true,

        createdAt:
            now,

        updatedAt:
            now

    };

}


/**
 * Ensure EDORI always retains at least one active
 * Administrator account.
 */
function enforceAdministratorContinuity(

    users:User[],

    existing:User,

    updated:User

):void {

    const existingWasActiveAdministrator =

        existing.active

        &&

        existing.role
        ===
        "administrator";


    const updatedIsActiveAdministrator =

        updated.active

        &&

        updated.role
        ===
        "administrator";


    if(

        !existingWasActiveAdministrator

        ||

        updatedIsActiveAdministrator

    ){

        return;

    }


    const otherActiveAdministratorExists =

        users.some(

            user =>
                user.id !== existing.id
                &&
                user.active
                &&
                user.role
                ===
                "administrator"

        );


    if(!otherActiveAdministratorExists){

        throw new Error(
            "EDORI must retain at least one active Administrator."
        );

    }

}


/**
 * Read persisted users.
 */
function readUsers():User[] {

    let raw:string | null = null;


    try {

        raw =

            localStorage.getItem(
                USER_STORAGE_KEY
            );

    }

    catch(error){

        console.error(
            "UserService could not read user storage.",
            error
        );

        return [];

    }


    if(!raw){

        return [];

    }


    try {

        const parsed:unknown =

            JSON.parse(
                raw
            );


        if(!Array.isArray(parsed)){

            return [];

        }


        return parsed

            .map(
                normalizeStoredUser
            )

            .filter(
                (
                    user
                ):user is User =>
                    user !== null
            );

    }

    catch(error){

        console.error(
            "UserService could not parse user storage.",
            error
        );

        return [];

    }

}


/**
 * Persist the complete user directory.
 */
function writeUsers(

    users:User[]

):void {

    try {

        localStorage.setItem(

            USER_STORAGE_KEY,

            JSON.stringify(
                users
            )

        );

    }

    catch(error){

        console.error(
            "UserService could not persist user storage.",
            error
        );

        throw new Error(
            "EDORI could not save the user directory."
        );

    }

}


/**
 * Normalize one persisted user record.
 */
function normalizeStoredUser(

    value:unknown

):User | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate =

        value as Partial<User>;


    if(

        typeof candidate.id !== "string"

        ||

        typeof candidate.username !== "string"

        ||

        typeof candidate.displayName !== "string"

        ||

        !isRoleId(
            candidate.role
        )

    ){

        return null;

    }


    return {

        id:
            candidate.id,

        username:
            candidate.username,

        displayName:
            candidate.displayName,

        email:
            typeof candidate.email === "string"
                ? candidate.email
                : "",

        role:
            candidate.role,

        active:
            candidate.active !== false,

        createdAt:
            typeof candidate.createdAt === "string"
                ? candidate.createdAt
                : new Date().toISOString(),

        updatedAt:
            typeof candidate.updatedAt === "string"
                ? candidate.updatedAt
                : new Date().toISOString()

    };

}


/**
 * Read selected current-user ID.
 */
/**
 * Remove the persisted current-user identifier.
 */
/**
 * Remove the persisted current-user identifier.
 */
function clearCurrentUserId():void {

    try {

        sessionStorage.removeItem(

            CURRENT_USER_STORAGE_KEY

        );

    }
    catch(error){

        console.error(

            "UserService could not clear the current EDORI user.",

            error

        );

    }

}

function readCurrentUserId():string | null {

    try {

        return sessionStorage.getItem(
            CURRENT_USER_STORAGE_KEY
        );

    }

    catch {

        return null;

    }

}


/**
 * Persist selected current-user ID.
 */
function setCurrentUserId(

    userId:string

):void {

    try {

        sessionStorage.setItem(
            CURRENT_USER_STORAGE_KEY,
            userId
        );

    }

    catch(error){

        console.error(
            "UserService could not persist current user.",
            error
        );

    }

}


/**
 * Remove current-user selection.
 */



/**
 * Normalize required string input.
 */
function normalizeRequiredText(

    value:string,

    label:string

):string {

    const normalized =

        value.trim();


    if(normalized.length === 0){

        throw new Error(
            `${label} is required.`
        );

    }


    return normalized;

}


/**
 * Runtime RoleId validation for persisted records.
 */
function isRoleId(

    value:unknown

):value is RoleId {

    return (

        value === "viewer"

        ||

        value === "operator"

        ||

        value === "administrator"

    );

}


/**
 * Create unique local user ID.
 */
function createUserId():string {

    if(

        typeof crypto !== "undefined"

        &&

        typeof crypto.randomUUID === "function"

    ){

        return crypto.randomUUID();

    }


    return `user-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2,10)}`;

}


/**
 * Sort users by display name.
 */
function sortUsers(

    users:User[]

):User[] {

    return users

        .slice()

        .sort(

            (
                first,
                second
            ) =>

                first.displayName.localeCompare(
                    second.displayName
                )

        );

}