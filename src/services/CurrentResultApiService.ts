/**
 * CurrentResultApiService
 *
 * Frontend API client for EDORI's authoritative current
 * Hospital Readiness result state.
 */

import type {

    EdoriResult

}

from "../types/EdoriResult";


export interface ServerCurrentResultState {

    schemaVersion:number;

    result:EdoriResult | null;

    invalidationReason:string | null;

    updatedAt:string;

    updatedByUserId:string;

    updatedByUsername:string;

    updatedByDisplayName:string;

}


export async function loadServerCurrentResultState():

Promise<ServerCurrentResultState | null> {

    const response =

        await apiFetch(
            "/api/result-state",
            {
                method:"GET"
            }
        );


    const payload =

        await readJson<{

            state?:ServerCurrentResultState | null;

            message?:string;

        }>(
            response
        );


    if(!response.ok){

        throw new Error(
            payload.message
            ?? "EDORI could not load the current result state."
        );

    }


    return payload.state
        ?? null;

}


export async function saveServerCurrentResultState(

    result:EdoriResult | null,

    invalidationReason:string | null

):Promise<ServerCurrentResultState> {

    const response =

        await apiFetch(
            "/api/result-state",
            {
                method:"PUT",

                body:
                    JSON.stringify({
                        result,
                        invalidationReason
                    })
            }
        );


    const payload =

        await readJson<{

            state?:ServerCurrentResultState;

            message?:string;

        }>(
            response
        );


    if(
        !response.ok
        ||
        !payload.state
    ){

        throw new Error(
            payload.message
            ?? "EDORI could not save the current result state."
        );

    }


    return payload.state;

}


export async function clearServerCurrentResultState():

Promise<boolean> {

    const response =

        await apiFetch(
            "/api/result-state",
            {
                method:"DELETE"
            }
        );


    const payload =

        await readJson<{
            cleared?:boolean;
            message?:string;
        }>(
            response
        );


    if(!response.ok){

        throw new Error(
            payload.message
            ?? "EDORI could not clear the current result state."
        );

    }


    return payload.cleared
        ?? false;

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