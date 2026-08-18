/**
 * SecurityAuditService
 *
 * Safe application-facing security-audit helper.
 *
 * Audit writes are intentionally best-effort: an audit
 * persistence failure is reported to the server console
 * but does not alter the outcome of an already-completed
 * authentication or administrative operation.
 *
 * Sensitive values are never accepted into the persisted
 * details object.
 */

import type {

    Request

}

from "express";


import {

    insertSecurityAuditRecord

}

from "../repositories/SecurityAuditRepository.js";


export type SecurityAuditEventType =

    | "auth.login.success"
    | "auth.login.failure"
    | "auth.logout"
    | "auth.password.change"
    | "user.create"
    | "user.update"
    | "user.role.change"
    | "user.status.change"
    | "user.password.reset";


export interface AuditIdentity {

    id?:string | null;

    username?:string;

    displayName?:string;

}


interface WriteSecurityAuditInput {

    eventType:SecurityAuditEventType;

    actor?:AuditIdentity;

    target?:AuditIdentity;

    success:boolean;

    summary:string;

    details?:Record<string, unknown>;

    request?:Request;

}


/**
 * Write one audit event without allowing audit failure to
 * break the user's completed operation.
 */
export async function writeSecurityAudit(

    input:WriteSecurityAuditInput

):Promise<void> {

    try {

        await insertSecurityAuditRecord({

            eventType:
                input.eventType,

            actorUserId:
                input.actor?.id
                ?? null,

            actorUsername:
                input.actor?.username
                ?? "",

            actorDisplayName:
                input.actor?.displayName
                ?? "",

            targetUserId:
                input.target?.id
                ?? null,

            targetUsername:
                input.target?.username
                ?? "",

            targetDisplayName:
                input.target?.displayName
                ?? "",

            success:
                input.success,

            summary:
                input.summary,

            details:
                sanitizeDetails(
                    input.details
                    ?? {}
                ),

            remoteAddress:
                input.request
                    ? getRemoteAddress(
                        input.request
                    )
                    : undefined,

            userAgent:
                input.request
                    ?.get(
                        "user-agent"
                    )
                ?? undefined

        });

    }
    catch(error){

        console.error(

            "EDORI security audit write failed:",

            error

        );

    }

}


/**
 * Convert an EDORI user object into audit identity data.
 */
export function createAuditIdentity(

    user:{

        id:string;

        username:string;

        displayName:string;

    }

):AuditIdentity {

    return {

        id:
            user.id,

        username:
            user.username,

        displayName:
            user.displayName

    };

}


/**
 * Ensure obvious credential/session material can never be
 * added to audit details accidentally.
 */
function sanitizeDetails(

    details:Record<string, unknown>

):Record<string, unknown> {

    const blockedKeys =

        new Set([

            "password",
            "currentpassword",
            "newpassword",
            "temporarypassword",
            "passwordhash",
            "passwordsalt",
            "salt",
            "sessiontoken",
            "token",
            "cookie",
            "authorization"

        ]);


    const sanitized:Record<string, unknown> = {};


    for(

        const [
            key,
            value
        ]

        of

        Object.entries(
            details
        )

    ){

        if(

            blockedKeys.has(
                key
                    .replaceAll(
                        "_",
                        ""
                    )
                    .replaceAll(
                        "-",
                        ""
                    )
                    .toLowerCase()
            )

        ){

            continue;

        }


        sanitized[key] =

            sanitizeValue(
                value,
                blockedKeys
            );

    }


    return sanitized;

}


function sanitizeValue(

    value:unknown,

    blockedKeys:Set<string>

):unknown {

    if(Array.isArray(value)){

        return value.map(

            item =>
                sanitizeValue(
                    item,
                    blockedKeys
                )

        );

    }


    if(

        typeof value === "object"

        &&

        value !== null

    ){

        const result:Record<string, unknown> = {};


        for(

            const [
                key,
                nestedValue
            ]

            of

            Object.entries(
                value
            )

        ){

            const normalizedKey =

                key
                    .replaceAll(
                        "_",
                        ""
                    )
                    .replaceAll(
                        "-",
                        ""
                    )
                    .toLowerCase();


            if(

                blockedKeys.has(
                    normalizedKey
                )

            ){

                continue;

            }


            result[key] =

                sanitizeValue(
                    nestedValue,
                    blockedKeys
                );

        }


        return result;

    }


    return value;

}


function getRemoteAddress(

    request:Request

):string | undefined {

    const forwardedFor =

        request.get(
            "x-forwarded-for"
        );


    if(forwardedFor){

        return forwardedFor
            .split(
                ","
            )[0]
            ?.trim()
            || undefined;

    }


    return request.ip

        || undefined;

}