/**
 * SecurityAuditService
 *
 * Frontend read-only cache for PostgreSQL-backed EDORI
 * security-audit records.
 *
 * The public synchronous API is intentionally retained so
 * the existing SecurityAuditLog component does not need to
 * change.
 */

import {

    subscribe

}

from "./EventService";


import {

    APP_EVENTS

}

from "../config/appEvents";


export type SecurityAuditEventType =

    | "authentication.login.success"
    | "authentication.login.failed"
    | "authentication.login.locked"
    | "authentication.logout"
    | "authentication.password.changed"
    | "authentication.password.reset"
    | "user.created"
    | "user.updated"
    | "user.role.changed"
    | "user.status.changed";


export interface SecurityAuditRecord {

    id:string;

    timestamp:string;

    eventType:SecurityAuditEventType;

    actorUserId:string;

    actorUsername:string;

    actorDisplayName:string;

    targetUserId:string;

    targetUsername:string;

    targetDisplayName:string;

    success:boolean;

    summary:string;

    details:Record<string,string | number | boolean | null>;

}


interface ServerSecurityAuditRecord {

    id:string;

    timestamp:string;

    eventType:string;

    actorUserId:string;

    actorUsername:string;

    actorDisplayName:string;

    targetUserId:string;

    targetUsername:string;

    targetDisplayName:string;

    success:boolean;

    summary:string;

    details:Record<string,unknown>;

    remoteAddress?:string;

    userAgent?:string;

}


let auditRecords:SecurityAuditRecord[] = [];

let auditInitialized = false;

let auditInitializationInProgress = false;


clearLegacySecurityAuditStorage();


subscribe(

    APP_EVENTS.USERS_CHANGED,

    () => {

        auditInitialized = false;


        void initializeServerSecurityAuditLog();

    }

);


/**
 * Load the PostgreSQL audit log.
 */
export async function initializeServerSecurityAuditLog():

Promise<void> {

    if(
        auditInitialized
        ||
        auditInitializationInProgress
    ){

        return;

    }


    auditInitializationInProgress = true;


    try {

        const response =

            await fetch(

                "/api/security-audit?limit=5000",

                {
                    method:
                        "GET",

                    credentials:
                        "include",

                    headers:{
                        "Accept":
                            "application/json"
                    }
                }

            );


        const payload =

            await readJson<{

                records?:ServerSecurityAuditRecord[];

                message?:string;

            }>(
                response
            );


        if(!response.ok){

            /*
             * Non-administrators may legitimately receive
             * 403. Keep an empty read-only cache.
             */
            if(response.status === 403){

                auditRecords = [];

                auditInitialized = true;

                return;

            }


            throw new Error(

                payload.message
                ?? "EDORI could not load the security audit log."

            );

        }


        auditRecords =

            Array.isArray(
                payload.records
            )

                ? payload.records
                    .map(
                        normalizeServerRecord
                    )
                    .filter(
                        (
                            record
                        ):record is SecurityAuditRecord =>
                            record !== null
                    )

                : [];


        auditInitialized = true;

    }
    catch(error){

        console.warn(

            "EDORI could not load the PostgreSQL security audit log.",

            error

        );

    }
    finally {

        auditInitializationInProgress = false;

    }

}


/**
 * Return newest records first.
 */
export function getSecurityAuditLog():

SecurityAuditRecord[] {

    return auditRecords

        .map(
            cloneRecord
        );

}


/**
 * Legacy compatibility diagnostic.
 *
 * No active browser audit storage remains.
 */
export function getSecurityAuditStorageKey():string {

    return "edori_security_audit_v1";

}


/**
 * Legacy compatibility stub.
 *
 * Security audit writes are server-authoritative and are
 * no longer accepted from browser code.
 */
export function recordSecurityAuditEvent(

    _input:unknown

):SecurityAuditRecord {

    throw new Error(

        "Browser-side security audit writes are disabled. EDORI security audit events are written by the server."

    );

}


function normalizeServerRecord(

    record:ServerSecurityAuditRecord

):SecurityAuditRecord | null {

    const eventType =

        mapServerEventType(
            record.eventType,
            record.details
        );


    if(!eventType){

        return null;

    }


    if(
        typeof record.id !== "string"
        ||
        typeof record.timestamp !== "string"
        ||
        typeof record.success !== "boolean"
        ||
        typeof record.summary !== "string"
    ){

        return null;

    }


    return {

        id:
            record.id,

        timestamp:
            record.timestamp,

        eventType,

        actorUserId:
            typeof record.actorUserId === "string"
                ? record.actorUserId
                : "",

        actorUsername:
            typeof record.actorUsername === "string"
                ? record.actorUsername
                : "",

        actorDisplayName:
            typeof record.actorDisplayName === "string"
                ? record.actorDisplayName
                : "",

        targetUserId:
            typeof record.targetUserId === "string"
                ? record.targetUserId
                : "",

        targetUsername:
            typeof record.targetUsername === "string"
                ? record.targetUsername
                : "",

        targetDisplayName:
            typeof record.targetDisplayName === "string"
                ? record.targetDisplayName
                : "",

        success:
            record.success,

        summary:
            record.summary,

        details:
            normalizeDetails(
                record.details
            )

    };

}


function mapServerEventType(

    eventType:string,

    details:Record<string,unknown>

):SecurityAuditEventType | null {

    switch(eventType){

        case "auth.login.success":

            return "authentication.login.success";


        case "auth.login.failure":

            return details.locked === true

                ? "authentication.login.locked"

                : "authentication.login.failed";


        case "auth.logout":

            return "authentication.logout";


        case "auth.password.change":

            return "authentication.password.changed";


        case "user.password.reset":

            return "authentication.password.reset";


        case "user.create":

            return "user.created";


        case "user.update":

            return "user.updated";


        case "user.role.change":

            return "user.role.changed";


        case "user.status.change":

            return "user.status.changed";


        default:

            return null;

    }

}


function normalizeDetails(

    value:unknown

):Record<string,string | number | boolean | null> {

    if(
        typeof value !== "object"
        ||
        value === null
        ||
        Array.isArray(
            value
        )
    ){

        return {};

    }


    const output:
    Record<string,string | number | boolean | null> = {};


    Object.entries(
        value
    ).forEach(

        ([key,item]) => {

            if(
                typeof item === "string"
                ||
                typeof item === "number"
                ||
                typeof item === "boolean"
                ||
                item === null
            ){

                output[key] =
                    item;

            }

        }

    );


    return output;

}


function cloneRecord(

    record:SecurityAuditRecord

):SecurityAuditRecord {

    return {

        ...record,

        details:{
            ...record.details
        }

    };

}


function clearLegacySecurityAuditStorage():

void {

    try {

        localStorage.removeItem(
            "edori_security_audit_v1"
        );

    }
    catch(error){

        console.warn(

            "EDORI could not remove legacy browser security-audit storage.",

            error

        );

    }

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