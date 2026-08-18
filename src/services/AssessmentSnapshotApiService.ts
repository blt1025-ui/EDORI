/**
 * AssessmentSnapshotApiService
 *
 * Frontend client for PostgreSQL-backed completed
 * assessment history.
 */

import type {

    EdoriSnapshot

}

from "../types/EdoriSnapshot";


export async function saveServerSnapshot(

    snapshot:EdoriSnapshot

):Promise<{

    inserted:boolean;

    snapshot:EdoriSnapshot;

}> {

    const response =

        await apiFetch(

            "/api/assessments",

            {
                method:
                    "POST",

                body:
                    JSON.stringify(
                        serializeSnapshot(
                            snapshot
                        )
                    )

            }

        );


    const payload =

        await readJson<{

            inserted?:boolean;

            snapshot?:EdoriSnapshot;

            message?:string;

        }>(
            response
        );


    if(

        !response.ok

        ||

        !payload.snapshot

    ){

        throw new Error(

            payload.message
            ?? "EDORI could not save the assessment to the server."

        );

    }


    return {

        inserted:
            payload.inserted
            ?? false,

        snapshot:
            normalizeSnapshot(
                payload.snapshot
            )

    };

}


export async function loadServerSnapshots(

    limit = 500

):Promise<EdoriSnapshot[]> {

    const response =

        await apiFetch(

            `/api/assessments?limit=${encodeURIComponent(String(limit))}`,

            {
                method:
                    "GET"
            }

        );


    const payload =

        await readJson<{

            snapshots?:EdoriSnapshot[];

            message?:string;

        }>(
            response
        );


    if(!response.ok){

        throw new Error(

            payload.message
            ?? "EDORI could not load assessment history."

        );

    }


    return (

        payload.snapshots

        ?? []

    ).map(
        normalizeSnapshot
    );

}


export async function loadLatestServerSnapshot():

Promise<EdoriSnapshot | null> {

    const response =

        await apiFetch(

            "/api/assessments/latest",

            {
                method:
                    "GET"
            }

        );


    const payload =

        await readJson<{

            snapshot?:EdoriSnapshot | null;

            message?:string;

        }>(
            response
        );


    if(!response.ok){

        throw new Error(

            payload.message
            ?? "EDORI could not load the latest assessment."

        );

    }


    return payload.snapshot

        ? normalizeSnapshot(
            payload.snapshot
        )

        : null;

}


export async function clearServerSnapshots():

Promise<number> {

    const response =

        await apiFetch(

            "/api/assessments",

            {
                method:
                    "DELETE"
            }

        );


    const payload =

        await readJson<{

            deleted?:number;

            message?:string;

        }>(
            response
        );


    if(!response.ok){

        throw new Error(

            payload.message
            ?? "EDORI could not clear assessment history."

        );

    }


    return payload.deleted

        ?? 0;

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


function serializeSnapshot(

    snapshot:EdoriSnapshot

):Record<string, unknown> {

    return {

        ...snapshot,

        timestamp:
            new Date(
                snapshot.timestamp
            ).toISOString(),

        operationalState:{
            ...snapshot.operationalState
        },

        activeTriggerIds:
            snapshot.activeTriggerIds
                ? [
                    ...snapshot.activeTriggerIds
                ]
                : undefined,

        activeTriggerTitles:
            snapshot.activeTriggerTitles
                ? [
                    ...snapshot.activeTriggerTitles
                ]
                : undefined

    };

}


function normalizeSnapshot(

    snapshot:EdoriSnapshot

):EdoriSnapshot {

    return {

        ...snapshot,

        timestamp:
            new Date(
                snapshot.timestamp
            ),

        operationalState:{
            ...snapshot.operationalState
        },

        activeTriggerIds:
            snapshot.activeTriggerIds
                ? [
                    ...snapshot.activeTriggerIds
                ]
                : undefined,

        activeTriggerTitles:
            snapshot.activeTriggerTitles
                ? [
                    ...snapshot.activeTriggerTitles
                ]
                : undefined

    };

}