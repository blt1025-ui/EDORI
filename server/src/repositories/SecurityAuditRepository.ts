/**
 * SecurityAuditRepository
 *
 * PostgreSQL persistence and read access for EDORI
 * security-audit events.
 */

import {

    randomUUID

}

from "node:crypto";


import {

    databasePool

}

from "../database/database.js";


export interface SecurityAuditRecord {

    eventType:string;

    actorUserId?:string | null;

    actorUsername?:string;

    actorDisplayName?:string;

    targetUserId?:string | null;

    targetUsername?:string;

    targetDisplayName?:string;

    success:boolean;

    summary:string;

    details?:Record<string, unknown>;

    remoteAddress?:string;

    userAgent?:string;

}


export interface StoredSecurityAuditRecord {

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

    details:Record<string, unknown>;

    remoteAddress:string;

    userAgent:string;

}


interface SecurityAuditRow {

    id:string;

    timestamp:Date;

    event_type:string;

    actor_user_id:string | null;

    actor_username:string;

    actor_display_name:string;

    target_user_id:string | null;

    target_username:string;

    target_display_name:string;

    success:boolean;

    summary:string;

    details:Record<string, unknown>;

    remote_address:string | null;

    user_agent:string | null;

}


/**
 * Persist one immutable security-audit event.
 */
export async function insertSecurityAuditRecord(

    record:SecurityAuditRecord

):Promise<void> {

    await databasePool.query(

        `
            INSERT INTO security_audit_log (
                id,
                event_type,
                actor_user_id,
                actor_username,
                actor_display_name,
                target_user_id,
                target_username,
                target_display_name,
                success,
                summary,
                details,
                remote_address,
                user_agent
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11::jsonb,
                $12,
                $13
            )
        `,

        [
            randomUUID(),
            record.eventType,
            record.actorUserId ?? null,
            record.actorUsername ?? "",
            record.actorDisplayName ?? "",
            record.targetUserId ?? null,
            record.targetUsername ?? "",
            record.targetDisplayName ?? "",
            record.success,
            record.summary,
            JSON.stringify(
                record.details ?? {}
            ),
            record.remoteAddress ?? null,
            record.userAgent ?? null
        ]

    );

}


/**
 * Return newest security-audit records first.
 */
export async function listSecurityAuditRecords(

    limit = 1000

):Promise<StoredSecurityAuditRecord[]> {

    const safeLimit =

        Math.max(

            1,

            Math.min(
                Math.trunc(
                    limit
                ),
                5000
            )

        );


    const result =

        await databasePool.query<SecurityAuditRow>(

            `
                SELECT
                    id,
                    timestamp,
                    event_type,
                    actor_user_id,
                    actor_username,
                    actor_display_name,
                    target_user_id,
                    target_username,
                    target_display_name,
                    success,
                    summary,
                    details,
                    remote_address,
                    user_agent
                FROM security_audit_log
                ORDER BY timestamp DESC
                LIMIT $1
            `,

            [
                safeLimit
            ]

        );


    return result.rows.map(

        row => ({

            id:
                row.id,

            timestamp:
                new Date(
                    row.timestamp
                ).toISOString(),

            eventType:
                row.event_type,

            actorUserId:
                row.actor_user_id
                ?? "",

            actorUsername:
                row.actor_username
                ?? "",

            actorDisplayName:
                row.actor_display_name
                ?? "",

            targetUserId:
                row.target_user_id
                ?? "",

            targetUsername:
                row.target_username
                ?? "",

            targetDisplayName:
                row.target_display_name
                ?? "",

            success:
                row.success,

            summary:
                row.summary,

            details:
                row.details
                ?? {},

            remoteAddress:
                row.remote_address
                ?? "",

            userAgent:
                row.user_agent
                ?? ""

        })

    );

}