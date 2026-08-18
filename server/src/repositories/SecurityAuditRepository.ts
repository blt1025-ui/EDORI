/**
 * SecurityAuditRepository
 *
 * PostgreSQL persistence for EDORI security-audit events.
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