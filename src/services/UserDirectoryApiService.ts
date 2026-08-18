/**
 * UserDirectoryApiService
 *
 * Frontend API client for PostgreSQL-backed EDORI user
 * administration.
 */

import type {

    RoleId

}

from "../types/Role";


import type {

    User

}

from "../types/User";


export async function loadServerUsers():Promise<User[]> {

    const response =

        await apiFetch(

            "/api/admin/users",

            {
                method:
                    "GET"
            }

        );


    const payload =

        await readJson<{

            users?:User[];

            message?:string;

        }>(
            response
        );


    if(!response.ok){

        throw new Error(

            payload.message
            ?? "EDORI could not load the user directory."

        );

    }


    return (

        payload.users

        ?? []

    ).map(
        normalizeUser
    );

}


export async function createServerUser(

    input:{

        username:string;

        displayName:string;

        email:string;

        role:RoleId;

        temporaryPassword:string;

    }

):Promise<User> {

    const response =

        await apiFetch(

            "/api/admin/users",

            {
                method:
                    "POST",

                body:
                    JSON.stringify(
                        input
                    )

            }

        );


    const payload =

        await readJson<{

            user?:User;

            message?:string;

        }>(
            response
        );


    if(

        !response.ok

        ||

        !payload.user

    ){

        throw new Error(

            payload.message
            ?? "EDORI could not create the user."

        );

    }


    return normalizeUser(
        payload.user
    );

}


export async function updateServerUser(

    userId:string,

    changes:{

        username:string;

        displayName:string;

        email:string;

        role:RoleId;

        active:boolean;

    }

):Promise<User> {

    const response =

        await apiFetch(

            `/api/admin/users/${encodeURIComponent(userId)}`,

            {
                method:
                    "PUT",

                body:
                    JSON.stringify(
                        changes
                    )

            }

        );


    const payload =

        await readJson<{

            user?:User;

            message?:string;

        }>(
            response
        );


    if(

        !response.ok

        ||

        !payload.user

    ){

        throw new Error(

            payload.message
            ?? "EDORI could not update the user."

        );

    }


    return normalizeUser(
        payload.user
    );

}


export async function resetServerUserPassword(

    userId:string,

    temporaryPassword:string

):Promise<void> {

    const response =

        await apiFetch(

            `/api/admin/users/${encodeURIComponent(userId)}/reset-password`,

            {
                method:
                    "POST",

                body:
                    JSON.stringify({

                        temporaryPassword

                    })

            }

        );


    const payload =

        await readJson<{

            success?:boolean;

            message?:string;

        }>(
            response
        );


    if(

        !response.ok

        ||

        !payload.success

    ){

        throw new Error(

            payload.message
            ?? "EDORI could not reset the password."

        );

    }

}


async function apiFetch(

    url:string,

    options:RequestInit

):Promise<Response> {

    return fetch(

        url,

        {
            ...options,

            credentials:
                "include",

            headers:{
                "Accept":
                    "application/json",

                "Content-Type":
                    "application/json",

                ...options.headers
            }

        }

    );

}


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


function normalizeUser(

    user:User

):User {

    return {

        ...user,

        email:
            user.email
            ?? "",

        createdAt:
            user.createdAt
            ?? new Date().toISOString(),

        updatedAt:
            user.updatedAt
            ?? new Date().toISOString()

    };

}