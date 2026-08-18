/**
 * ModelConfigurationApiService
 *
 * Frontend API client for EDORI model configuration
 * overrides.
 */

import type {

    ConfigurationOverrides

}

from "../types/ConfigurationOverrides";


export interface ServerModelConfigurationOverride {

    schemaVersion:number;

    savedAt:string;

    savedByUserId:string;

    savedByUsername:string;

    savedByDisplayName:string;

    configuration:ConfigurationOverrides;

}


export async function loadServerModelConfiguration():

Promise<ServerModelConfigurationOverride | null> {

    const response =

        await apiFetch(

            "/api/model-configuration",

            {
                method:
                    "GET"
            }

        );


    const payload =

        await readJson<{

            override?:ServerModelConfigurationOverride | null;

            message?:string;

        }>(
            response
        );


    if(!response.ok){

        throw new Error(

            payload.message
            ?? "EDORI could not load model configuration."

        );

    }


    return payload.override

        ? cloneOverride(
            payload.override
        )

        : null;

}


export async function saveServerModelConfiguration(

    configuration:ConfigurationOverrides

):Promise<ServerModelConfigurationOverride> {

    const response =

        await apiFetch(

            "/api/model-configuration",

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

            override?:ServerModelConfigurationOverride;

            message?:string;

            errors?:string[];

        }>(
            response
        );


    if(
        !response.ok
        ||
        !payload.override
    ){

        throw new Error(

            payload.errors?.join(
                " "
            )
            ??
            payload.message
            ??
            "EDORI could not save model configuration."

        );

    }


    return cloneOverride(
        payload.override
    );

}


export async function clearServerModelConfiguration():

Promise<boolean> {

    const response =

        await apiFetch(

            "/api/model-configuration",

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
            ?? "EDORI could not restore built-in model configuration."

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

    override:ServerModelConfigurationOverride

):ServerModelConfigurationOverride {

    return {

        ...override,

        configuration:
            cloneConfiguration(
                override.configuration
            )

    };

}


function cloneConfiguration(

    configuration:ConfigurationOverrides

):ConfigurationOverrides {

    return {

        hospital:{
            ...configuration.hospital
        },

        domainWeights:{
            ...configuration.domainWeights
        },

        edPressureWeights:{
            ...configuration.edPressureWeights
        },

        operationalLevels:
            configuration.operationalLevels.map(
                level => ({
                    ...level
                })
            )

    };

}