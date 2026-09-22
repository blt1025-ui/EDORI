/**
 * ExecutiveReportDistributionApiService
 *
 * Frontend API client for:
 *
 * - Executive Report recipient administration
 * - Distribution history
 * - Daily delivery usage
 * - Send preview
 * - Executive Assessment Report distribution
 */

import type {

    ExecutiveReportPayload

}

from "../types/ExecutiveReportPayload";


const BASE_URL =
    "/api/executive-report-distribution";


export interface ExecutiveReportRecipient {

    id:string;

    displayName:string;

    email:string;

    enabled:boolean;

    createdAt:string;

    createdByUserId:string;

    createdByUsername:string;

    createdByDisplayName:string;

    updatedAt:string;

    updatedByUserId:string;

    updatedByUsername:string;

    updatedByDisplayName:string;

}


export interface ExecutiveReportRecipientSnapshot {

    displayName:string;

    email:string;

}


export interface ExecutiveReportDistribution {

    id:string;

    createdAt:string;

    initiatedByUserId:string;

    initiatedByUsername:string;

    initiatedByDisplayName:string;

    assessmentTimestamp:string;

    hriScore:number;

    operationalLevel:string;

    subject:string;

    recipientCount:number;

    acceptedCount:number;

    failedCount:number;

    status:
        | "pending"
        | "accepted"
        | "partial"
        | "failed"
        | "sandbox";

    provider:string;

    providerMessageIds:string[];

    failureMessage:string | null;

    completedAt:string | null;

    recipientSnapshot:
        ExecutiveReportRecipientSnapshot[];

}


export interface ExecutiveReportDailyUsage {

    dailyLimit:number;

    used:number;

    remaining:number;

}


export interface ExecutiveReportSendPreview {

    recipients:
        ExecutiveReportRecipientSnapshot[];

    recipientCount:number;

    dailyLimit:number;

    used:number;

    remaining:number;

}


export interface ExecutiveReportSendResult {

    sent:boolean;

    sandbox:boolean;

    message:string;

    distribution:
        ExecutiveReportDistribution;

}


/**
 * Load all configured recipients.
 */
export async function loadExecutiveReportRecipients():
Promise<ExecutiveReportRecipient[]> {

    const response =

        await apiFetch(
            `${BASE_URL}/recipients`
        );


    const payload =
        await readJson(response);


    return Array.isArray(
        payload.recipients
    )

        ? payload.recipients.map(
            normalizeRecipient
        )

        : [];

}


/**
 * Create a recipient.
 */
export async function createExecutiveReportRecipient(

    input:{

        displayName:string;

        email:string;

    }

):Promise<ExecutiveReportRecipient> {

    const response =

        await apiFetch(

            `${BASE_URL}/recipients`,

            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        displayName:
                            input.displayName,

                        email:
                            input.email

                    })

            }

        );


    const payload =
        await readJson(response);


    if(
        !payload.recipient
        ||
        typeof payload.recipient !== "object"
    ){

        throw new Error(
            "The server did not return the created Executive Report recipient."
        );

    }


    return normalizeRecipient(
        payload.recipient
    );

}


/**
 * Update a recipient.
 */
export async function updateExecutiveReportRecipient(

    recipientId:string,

    input:{

        displayName:string;

        email:string;

        enabled:boolean;

    }

):Promise<ExecutiveReportRecipient> {

    const response =

        await apiFetch(

            `${BASE_URL}/recipients/${encodeURIComponent(
                recipientId
            )}`,

            {

                method:
                    "PUT",

                body:
                    JSON.stringify({

                        displayName:
                            input.displayName,

                        email:
                            input.email,

                        enabled:
                            input.enabled

                    })

            }

        );


    const payload =
        await readJson(response);


    if(
        !payload.recipient
        ||
        typeof payload.recipient !== "object"
    ){

        throw new Error(
            "The server did not return the updated Executive Report recipient."
        );

    }


    return normalizeRecipient(
        payload.recipient
    );

}


/**
 * Load recent distribution history.
 */
export async function loadExecutiveReportDistributionHistory(

    limit = 50

):Promise<ExecutiveReportDistribution[]> {

    const safeLimit =

        Math.max(

            1,

            Math.min(
                200,
                Math.trunc(limit)
            )

        );


    const response =

        await apiFetch(

            `${BASE_URL}/history?limit=${safeLimit}`

        );


    const payload =
        await readJson(response);


    return Array.isArray(
        payload.distributions
    )

        ? payload.distributions.map(
            normalizeDistribution
        )

        : [];

}


/**
 * Load today's delivery usage.
 */
export async function loadExecutiveReportDailyUsage():
Promise<ExecutiveReportDailyUsage> {

    const response =

        await apiFetch(
            `${BASE_URL}/usage`
        );


    const payload =
        await readJson(response);


    return normalizeDailyUsage(
        payload
    );

}


/**
 * Load the exact recipient/quota preview for a send.
 *
 * This endpoint is available to users with send
 * permission even if they cannot administer recipients.
 */
export async function loadExecutiveReportSendPreview():
Promise<ExecutiveReportSendPreview> {

    const response =

        await apiFetch(
            `${BASE_URL}/send-preview`
        );


    const payload =
        await readJson(response);


    const recipients =

        Array.isArray(
            payload.recipients
        )

            ? payload.recipients
                .map(
                    normalizeRecipientSnapshot
                )
                .filter(
                    (
                        recipient
                    ):recipient is ExecutiveReportRecipientSnapshot =>

                        recipient !== null
                )

            : [];


    return {

        recipients,

        recipientCount:

            normalizeNonnegativeInteger(
                payload.recipientCount
            ),

        dailyLimit:

            normalizeNonnegativeInteger(
                payload.dailyLimit
            ),

        used:

            normalizeNonnegativeInteger(
                payload.used
            ),

        remaining:

            normalizeNonnegativeInteger(
                payload.remaining
            )

    };

}


/**
 * Send one Executive Assessment Report.
 *
 * The payload contains structured report data only.
 * The server creates the email HTML and PDF.
 */
export async function sendExecutiveReport(

    report:ExecutiveReportPayload

):Promise<ExecutiveReportSendResult> {

    const response =

        await apiFetch(

            `${BASE_URL}/send`,

            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        report

                    })

            }

        );


    const payload =
        await readJson(response);


    if(
        !payload.distribution
        ||
        typeof payload.distribution !== "object"
    ){

        throw new Error(
            "The server did not return an Executive Report distribution record."
        );

    }


    return {

        sent:
            payload.sent === true,

        sandbox:
            payload.sandbox === true,

        message:

            typeof payload.message === "string"

                ? payload.message

                : "Executive Report distribution completed.",

        distribution:

            normalizeDistribution(
                payload.distribution
            )

    };

}


/**
 * Shared authenticated API request.
 */
async function apiFetch(

    url:string,

    options:RequestInit = {}

):Promise<Response> {

    const headers =
        new Headers(
            options.headers
        );


    headers.set(
        "Accept",
        "application/json"
    );


    if(
        options.body !== undefined
        &&
        !headers.has(
            "Content-Type"
        )
    ){

        headers.set(
            "Content-Type",
            "application/json"
        );

    }


    const response =

        await fetch(

            url,

            {

                ...options,

                headers,

                credentials:
                    "include"

            }

        );


    if(!response.ok){

        const payload =
            await readJsonSafely(
                response
            );


        const message =

            typeof payload?.message === "string"

                ? payload.message

                : createHttpErrorMessage(
                    response.status
                );


        throw new Error(
            message
        );

    }


    return response;

}


/**
 * Read required JSON response.
 */
async function readJson(

    response:Response

):Promise<Record<string, any>> {

    try {

        const payload =
            await response.json();


        if(
            typeof payload !== "object"
            ||
            payload === null
            ||
            Array.isArray(payload)
        ){

            throw new Error(
                "Unexpected server response."
            );

        }


        return payload as Record<string, any>;

    }
    catch(error){

        if(error instanceof Error){

            throw error;

        }


        throw new Error(
            "Unable to read the server response."
        );

    }

}


/**
 * Best-effort JSON reader used for API errors.
 */
async function readJsonSafely(

    response:Response

):Promise<Record<string, any> | null> {

    try {

        const payload =
            await response.json();


        if(
            typeof payload === "object"
            &&
            payload !== null
            &&
            !Array.isArray(payload)
        ){

            return payload as Record<string, any>;

        }


        return null;

    }
    catch {

        return null;

    }

}


/**
 * Normalize one recipient.
 */
function normalizeRecipient(

    value:any

):ExecutiveReportRecipient {

    return {

        id:
            normalizeString(
                value?.id
            ),

        displayName:
            normalizeString(
                value?.displayName
            ),

        email:
            normalizeString(
                value?.email
            ),

        enabled:
            value?.enabled === true,

        createdAt:
            normalizeString(
                value?.createdAt
            ),

        createdByUserId:
            normalizeString(
                value?.createdByUserId
            ),

        createdByUsername:
            normalizeString(
                value?.createdByUsername
            ),

        createdByDisplayName:
            normalizeString(
                value?.createdByDisplayName
            ),

        updatedAt:
            normalizeString(
                value?.updatedAt
            ),

        updatedByUserId:
            normalizeString(
                value?.updatedByUserId
            ),

        updatedByUsername:
            normalizeString(
                value?.updatedByUsername
            ),

        updatedByDisplayName:
            normalizeString(
                value?.updatedByDisplayName
            )

    };

}


/**
 * Normalize one immutable recipient snapshot.
 */
function normalizeRecipientSnapshot(

    value:any

):ExecutiveReportRecipientSnapshot | null {

    if(
        typeof value !== "object"
        ||
        value === null
    ){

        return null;

    }


    const displayName =
        normalizeString(
            value.displayName
        );


    const email =
        normalizeString(
            value.email
        );


    if(!email){

        return null;

    }


    return {

        displayName,

        email

    };

}


/**
 * Normalize one distribution-history record.
 */
function normalizeDistribution(

    value:any

):ExecutiveReportDistribution {

    const status =
        normalizeDistributionStatus(
            value?.status
        );


    const recipientSnapshot =

        Array.isArray(
            value?.recipientSnapshot
        )

            ? value.recipientSnapshot
                .map(
                    normalizeRecipientSnapshot
                )
                .filter(
    (
        recipient:ExecutiveReportRecipientSnapshot | null
    ):recipient is ExecutiveReportRecipientSnapshot =>

        recipient !== null
)

            : [];


    const providerMessageIds =

        Array.isArray(
            value?.providerMessageIds
        )

            ? value.providerMessageIds.filter(

                (
                    item:any
                ):item is string =>

                    typeof item === "string"

            )

            : [];


    return {

        id:
            normalizeString(
                value?.id
            ),

        createdAt:
            normalizeString(
                value?.createdAt
            ),

        initiatedByUserId:
            normalizeString(
                value?.initiatedByUserId
            ),

        initiatedByUsername:
            normalizeString(
                value?.initiatedByUsername
            ),

        initiatedByDisplayName:
            normalizeString(
                value?.initiatedByDisplayName
            ),

        assessmentTimestamp:
            normalizeString(
                value?.assessmentTimestamp
            ),

        hriScore:
            normalizeFiniteNumber(
                value?.hriScore
            ),

        operationalLevel:
            normalizeString(
                value?.operationalLevel
            ),

        subject:
            normalizeString(
                value?.subject
            ),

        recipientCount:
            normalizeNonnegativeInteger(
                value?.recipientCount
            ),

        acceptedCount:
            normalizeNonnegativeInteger(
                value?.acceptedCount
            ),

        failedCount:
            normalizeNonnegativeInteger(
                value?.failedCount
            ),

        status,

        provider:
            normalizeString(
                value?.provider
            ),

        providerMessageIds,

        failureMessage:

            typeof value?.failureMessage === "string"

                ? value.failureMessage

                : null,

        completedAt:

            typeof value?.completedAt === "string"

                ? value.completedAt

                : null,

        recipientSnapshot

    };

}


/**
 * Normalize daily usage response.
 */
function normalizeDailyUsage(

    value:any

):ExecutiveReportDailyUsage {

    return {

        dailyLimit:
            normalizeNonnegativeInteger(
                value?.dailyLimit
            ),

        used:
            normalizeNonnegativeInteger(
                value?.used
            ),

        remaining:
            normalizeNonnegativeInteger(
                value?.remaining
            )

    };

}


function normalizeDistributionStatus(

    value:unknown

):ExecutiveReportDistribution["status"] {

    switch(value){

        case "accepted":
        case "partial":
        case "failed":
        case "sandbox":
        case "pending":

            return value;

        default:

            return "failed";

    }

}


function normalizeString(

    value:unknown

):string {

    return typeof value === "string"

        ? value

        : "";

}


function normalizeFiniteNumber(

    value:unknown

):number {

    return (

        typeof value === "number"
        &&
        Number.isFinite(value)

    )

        ? value

        : 0;

}


function normalizeNonnegativeInteger(

    value:unknown

):number {

    if(
        typeof value !== "number"
        ||
        !Number.isFinite(value)
    ){

        return 0;

    }


    return Math.max(
        0,
        Math.trunc(value)
    );

}


function createHttpErrorMessage(

    status:number

):string {

    switch(status){

        case 400:

            return "The Executive Report request was invalid.";

        case 401:

            return "Your session has expired. Please sign in again.";

        case 403:

            return "You do not have permission to perform this Executive Report action.";

        case 404:

            return "The Executive Report service could not be found.";

        case 409:

            return "The Executive Report could not be sent because of a configuration or delivery-limit conflict.";

        case 429:

            return "The Executive Report email service is temporarily rate limited.";

        default:

            return `Executive Report request failed with HTTP ${status}.`;

    }

}