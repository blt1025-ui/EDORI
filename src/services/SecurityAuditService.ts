/**
 * SecurityAuditService
 *
 * Development-only security/account audit log.
 *
 * IMPORTANT:
 * Production EDORI must persist audit records on the
 * backend/database where normal browser users cannot
 * modify or delete them.
 */

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


const SECURITY_AUDIT_STORAGE_KEY =

    "edori_security_audit_v1";


const MAX_AUDIT_RECORDS =

    5000;


/**
 * Append one audit record.
 *
 * Callers supply identity snapshots explicitly so this
 * service does not depend on UserService and cannot
 * create circular imports.
 */
export function recordSecurityAuditEvent(

    input:{

        eventType:SecurityAuditEventType;

        actor?:{

            userId?:string;

            username?:string;

            displayName?:string;

        } | null;

        target?:{

            userId?:string;

            username?:string;

            displayName?:string;

        } | null;

        success:boolean;

        summary:string;

        details?:Record<
            string,
            string | number | boolean | null
        >;

    }

):SecurityAuditRecord {

    const record:SecurityAuditRecord = {

        id:
            createAuditId(),

        timestamp:
            new Date().toISOString(),

        eventType:
            input.eventType,

        actorUserId:
            input.actor?.userId
            ?? "",

        actorUsername:
            input.actor?.username
            ?? "",

        actorDisplayName:
            input.actor?.displayName
            ?? "",

        targetUserId:
            input.target?.userId
            ?? "",

        targetUsername:
            input.target?.username
            ?? "",

        targetDisplayName:
            input.target?.displayName
            ?? "",

        success:
            input.success,

        summary:
            input.summary.trim(),

        details:
            {
                ...(input.details ?? {})
            }

    };


    const records =

        readSecurityAuditLog();


    records.push(
        record
    );


    const trimmedRecords =

        records.length > MAX_AUDIT_RECORDS

            ? records.slice(
                records.length
                -
                MAX_AUDIT_RECORDS
            )

            : records;


    writeSecurityAuditLog(
        trimmedRecords
    );


    return cloneRecord(
        record
    );

}


/**
 * Return newest records first.
 */
export function getSecurityAuditLog():SecurityAuditRecord[] {

    return readSecurityAuditLog()

        .slice()

        .sort(

            (first, second) =>

                new Date(
                    second.timestamp
                ).getTime()

                -

                new Date(
                    first.timestamp
                ).getTime()

        )

        .map(
            cloneRecord
        );

}


/**
 * Return the storage key for migration/debugging.
 */
export function getSecurityAuditStorageKey():string {

    return SECURITY_AUDIT_STORAGE_KEY;

}


/**
 * Read stored records defensively.
 */
function readSecurityAuditLog():SecurityAuditRecord[] {

    let raw:string | null = null;


    try {

        raw =

            localStorage.getItem(

                SECURITY_AUDIT_STORAGE_KEY

            );

    }
    catch(error){

        console.error(

            "EDORI could not read the security audit log.",

            error

        );


        return [];

    }


    if(!raw){

        return [];

    }


    try {

        const parsed:unknown =

            JSON.parse(
                raw
            );


        if(!Array.isArray(parsed)){

            return [];

        }


        return parsed

            .map(
                normalizeAuditRecord
            )

            .filter(

                (
                    record
                ):record is SecurityAuditRecord =>

                    record !== null

            );

    }
    catch(error){

        console.error(

            "EDORI could not parse the security audit log.",

            error

        );


        return [];

    }

}


/**
 * Persist the complete development audit log.
 */
function writeSecurityAuditLog(

    records:SecurityAuditRecord[]

):void {

    try {

        localStorage.setItem(

            SECURITY_AUDIT_STORAGE_KEY,

            JSON.stringify(
                records
            )

        );

    }
    catch(error){

        console.error(

            "EDORI could not persist the security audit log.",

            error

        );

    }

}


/**
 * Normalize one persisted record.
 */
function normalizeAuditRecord(

    value:unknown

):SecurityAuditRecord | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate =

        value as Partial<SecurityAuditRecord>;


    if(

        typeof candidate.id !== "string"

        ||

        typeof candidate.timestamp !== "string"

        ||

        !isAuditEventType(
            candidate.eventType
        )

        ||

        typeof candidate.success !== "boolean"

        ||

        typeof candidate.summary !== "string"

    ){

        return null;

    }


    const details =

        normalizeDetails(
            candidate.details
        );


    return {

        id:
            candidate.id,

        timestamp:
            candidate.timestamp,

        eventType:
            candidate.eventType,

        actorUserId:
            typeof candidate.actorUserId === "string"
                ? candidate.actorUserId
                : "",

        actorUsername:
            typeof candidate.actorUsername === "string"
                ? candidate.actorUsername
                : "",

        actorDisplayName:
            typeof candidate.actorDisplayName === "string"
                ? candidate.actorDisplayName
                : "",

        targetUserId:
            typeof candidate.targetUserId === "string"
                ? candidate.targetUserId
                : "",

        targetUsername:
            typeof candidate.targetUsername === "string"
                ? candidate.targetUsername
                : "",

        targetDisplayName:
            typeof candidate.targetDisplayName === "string"
                ? candidate.targetDisplayName
                : "",

        success:
            candidate.success,

        summary:
            candidate.summary,

        details

    };

}


/**
 * Normalize arbitrary detail values.
 */
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

        ([key, item]) => {

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


/**
 * Runtime event-name validation.
 */
function isAuditEventType(

    value:unknown

):value is SecurityAuditEventType {

    return (

        value === "authentication.login.success"

        ||

        value === "authentication.login.failed"

        ||

        value === "authentication.login.locked"

        ||

        value === "authentication.logout"

        ||

        value === "authentication.password.changed"

        ||

        value === "authentication.password.reset"

        ||

        value === "user.created"

        ||

        value === "user.updated"

        ||

        value === "user.role.changed"

        ||

        value === "user.status.changed"

    );

}


/**
 * Defensive copy.
 */
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


/**
 * Create a browser-safe audit identifier.
 */
function createAuditId():string {

    if(

        typeof crypto !== "undefined"

        &&

        typeof crypto.randomUUID === "function"

    ){

        return crypto.randomUUID();

    }


    return `audit-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2,10)}`;

}