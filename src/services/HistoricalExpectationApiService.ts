/**
 * HistoricalExpectationApiService
 *
 * Frontend API client for EDORI's optional imported
 * historical expectation dataset.
 */

import type {

    HistoricalExpectation

}

from "../types/HistoricalExpectation";


export interface ServerHistoricalDataset {

    schemaVersion:number;

    importedAt:string;

    importedByUserId:string;

    importedByUsername:string;

    importedByDisplayName:string;

    recordCount:number;

    records:HistoricalExpectation[];

}


export async function loadServerHistoricalDataset():

Promise<ServerHistoricalDataset | null> {

    const response =

        await apiFetch(

            "/api/historical-expectations",

            {
                method:
                    "GET"
            }

        );


    const payload =

        await readJson<{

            dataset?:ServerHistoricalDataset | null;

            message?:string;

        }>(
            response
        );


    if(!response.ok){

        throw new Error(

            payload.message
            ?? "EDORI could not load historical expectations."

        );

    }


    return payload.dataset

        ? cloneServerDataset(
            payload.dataset
        )

        : null;

}


export async function saveServerHistoricalDataset(

    records:HistoricalExpectation[]

):Promise<ServerHistoricalDataset> {

    const response =

        await apiFetch(

            "/api/historical-expectations",

            {
                method:
                    "PUT",

                body:
                    JSON.stringify({

                        records:
                            records.map(
                                record => ({
                                    ...record
                                })
                            )

                    })

            }

        );


    const payload =

        await readJson<{

            dataset?:ServerHistoricalDataset;

            message?:string;

        }>(
            response
        );


    if(

        !response.ok

        ||

        !payload.dataset

    ){

        throw new Error(

            payload.message
            ?? "EDORI could not save historical expectations."

        );

    }


    return cloneServerDataset(
        payload.dataset
    );

}


export async function clearServerHistoricalDataset():

Promise<boolean> {

    const response =

        await apiFetch(

            "/api/historical-expectations",

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
            ?? "EDORI could not clear imported historical expectations."

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


function cloneServerDataset(

    dataset:ServerHistoricalDataset

):ServerHistoricalDataset {

    return {

        ...dataset,

        records:
            dataset.records.map(
                record => ({
                    ...record
                })
            )

    };

}