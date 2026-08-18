/**
 * CurrentOperationalStateApiService
 *
 * Frontend API client for EDORI's authoritative current
 * committed Hospital Readiness assessment.
 */

import type {

    SituationAssessment

}

from "../types/SituationAssessment";


export interface ServerCurrentOperationalState {

    assessment:SituationAssessment;

    updatedAt:string;

    updatedByUserId:string;

    updatedByUsername:string;

    updatedByDisplayName:string;

}


export async function loadServerCurrentState():

Promise<ServerCurrentOperationalState | null> {

    const response =

        await apiFetch(

            "/api/state",

            {
                method:
                    "GET"
            }

        );


    const payload =

        await readJson<{

            state?:ServerCurrentOperationalState | null;

            message?:string;

        }>(
            response
        );


    if(!response.ok){

        throw new Error(

            payload.message
            ?? "EDORI could not load the current operational state."

        );

    }


    return payload.state

        ? normalizeState(
            payload.state
        )

        : null;

}


export async function saveServerCurrentState(

    assessment:SituationAssessment,

    schemaVersion:number

):Promise<ServerCurrentOperationalState> {

    const response =

        await apiFetch(

            "/api/state",

            {
                method:
                    "PUT",

                body:
                    JSON.stringify({

                        schemaVersion,

                        assessment:{
                            ...assessment
                        }

                    })

            }

        );


    const payload =

        await readJson<{

            state?:ServerCurrentOperationalState;

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
            ?? "EDORI could not save the current operational state."

        );

    }


    return normalizeState(
        payload.state
    );

}


export async function clearServerCurrentState():

Promise<boolean> {

    const response =

        await apiFetch(

            "/api/state",

            {
                method:
                    "DELETE"
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
            ?? "EDORI could not clear the current operational state."

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


function normalizeState(

    state:ServerCurrentOperationalState

):ServerCurrentOperationalState {

    return {

        ...state,

        assessment:{
            ...state.assessment
        }

    };

}