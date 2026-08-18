/**
 * SurgePlanApiService
 *
 * Frontend API client for EDORI's optional hospital-
 * specific surge-plan override.
 */

import type {

    SurgePlanConfiguration

}

from "../types/SurgePlanConfiguration";


export interface ServerSurgePlanOverride {

    schemaVersion:number;

    savedAt:string;

    savedByUserId:string;

    savedByUsername:string;

    savedByDisplayName:string;

    configuration:SurgePlanConfiguration;

}


export async function loadServerSurgePlan():

Promise<ServerSurgePlanOverride | null> {

    const response =

        await apiFetch(

            "/api/surge-plan",

            {
                method:
                    "GET"
            }

        );


    const payload =

        await readJson<{

            override?:ServerSurgePlanOverride | null;

            message?:string;

        }>(
            response
        );


    if(!response.ok){

        throw new Error(

            payload.message
            ?? "EDORI could not load the Hospital Surge Plan."

        );

    }


    return payload.override

        ? cloneOverride(
            payload.override
        )

        : null;

}


export async function saveServerSurgePlan(

    configuration:SurgePlanConfiguration

):Promise<ServerSurgePlanOverride> {

    const response =

        await apiFetch(

            "/api/surge-plan",

            {
                method:
                    "PUT",

                body:
                    JSON.stringify({

                        configuration:
                            cloneConfiguration(
                                configuration
                            )

                    })

            }

        );


    const payload =

        await readJson<{

            override?:ServerSurgePlanOverride;

            message?:string;

        }>(
            response
        );


    if(
        !response.ok
        ||
        !payload.override
    ){

        throw new Error(

            payload.message
            ?? "EDORI could not save the Hospital Surge Plan."

        );

    }


    return cloneOverride(
        payload.override
    );

}


export async function clearServerSurgePlan():

Promise<boolean> {

    const response =

        await apiFetch(

            "/api/surge-plan",

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
            ?? "EDORI could not restore the built-in Hospital Surge Plan."

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


function cloneOverride(

    override:ServerSurgePlanOverride

):ServerSurgePlanOverride {

    return {

        ...override,

        configuration:
            cloneConfiguration(
                override.configuration
            )

    };

}


function cloneConfiguration(

    configuration:SurgePlanConfiguration

):SurgePlanConfiguration {

    return {

        schemaVersion:
            configuration.schemaVersion,

        name:
            configuration.name,

        description:
            configuration.description,

        interventions:
            configuration.interventions.map(
                intervention => ({
                    ...intervention
                })
            )

    };

}