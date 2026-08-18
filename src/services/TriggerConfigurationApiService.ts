/**
 * TriggerConfigurationApiService
 *
 * Frontend API client for EDORI hospital-specific
 * operational-trigger overrides.
 */

export interface ServerTriggerConfigurationOverride {

    triggerId:string;

    enabled:boolean;

    interventionIds:string[];

}


export interface ServerTriggerConfiguration {

    schemaVersion:number;

    overrides:ServerTriggerConfigurationOverride[];

}


export interface ServerTriggerConfigurationEnvelope {

    schemaVersion:number;

    savedAt:string;

    savedByUserId:string;

    savedByUsername:string;

    savedByDisplayName:string;

    configuration:ServerTriggerConfiguration;

}


export async function loadServerTriggerConfiguration():

Promise<ServerTriggerConfigurationEnvelope | null> {

    const response =

        await apiFetch(

            "/api/trigger-configuration",

            {
                method:
                    "GET"
            }

        );


    const payload =

        await readJson<{

            override?:ServerTriggerConfigurationEnvelope | null;

            message?:string;

        }>(
            response
        );


    if(!response.ok){

        throw new Error(

            payload.message
            ?? "EDORI could not load trigger configuration."

        );

    }


    return payload.override

        ? cloneEnvelope(
            payload.override
        )

        : null;

}


export async function saveServerTriggerConfiguration(

    configuration:ServerTriggerConfiguration

):Promise<ServerTriggerConfigurationEnvelope> {

    const response =

        await apiFetch(

            "/api/trigger-configuration",

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

            override?:ServerTriggerConfigurationEnvelope;

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
            ?? "EDORI could not save trigger configuration."

        );

    }


    return cloneEnvelope(
        payload.override
    );

}


export async function clearServerTriggerConfiguration():

Promise<boolean> {

    const response =

        await apiFetch(

            "/api/trigger-configuration",

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
            ?? "EDORI could not restore built-in trigger configuration."

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


function cloneEnvelope(

    envelope:ServerTriggerConfigurationEnvelope

):ServerTriggerConfigurationEnvelope {

    return {

        ...envelope,

        configuration:
            cloneConfiguration(
                envelope.configuration
            )

    };

}


function cloneConfiguration(

    configuration:ServerTriggerConfiguration

):ServerTriggerConfiguration {

    return {

        schemaVersion:
            configuration.schemaVersion,

        overrides:
            configuration.overrides.map(
                override => ({

                    triggerId:
                        override.triggerId,

                    enabled:
                        override.enabled,

                    interventionIds:[
                        ...override.interventionIds
                    ]

                })
            )

    };

}