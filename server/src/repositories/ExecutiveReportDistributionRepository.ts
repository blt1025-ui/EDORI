/**
 * ExecutiveReportDistributionRepository
 *
 * PostgreSQL persistence for:
 *
 * - Executive Assessment Report recipients
 * - Executive Assessment Report distribution history
 * - Daily recipient-delivery usage
 * - Atomic daily-delivery reservations
 */

import {

    databasePool

}

from "../database/database.js";


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

    recipientSnapshot:ExecutiveReportRecipientSnapshot[];

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

}


export interface ExecutiveReportDeliveryReservationResult {

    reserved:boolean;

    dailyLimit:number;

    used:number;

    reservedCount:number;

    remaining:number;

    distribution:ExecutiveReportDistribution | null;

}


interface RecipientRow {

    id:string;

    display_name:string;

    email:string;

    enabled:boolean;

    created_at:Date;

    created_by_user_id:string;

    created_by_username:string;

    created_by_display_name:string;

    updated_at:Date;

    updated_by_user_id:string;

    updated_by_username:string;

    updated_by_display_name:string;

}


interface DistributionRow {

    id:string;

    created_at:Date;

    initiated_by_user_id:string;

    initiated_by_username:string;

    initiated_by_display_name:string;

    assessment_timestamp:Date;

    hri_score:string | number;

    operational_level:string;

    subject:string;

    recipient_count:number;

    recipient_snapshot:unknown;

    accepted_count:number;

    failed_count:number;

    status:
        | "pending"
        | "accepted"
        | "partial"
        | "failed"
        | "sandbox";

    provider:string;

    provider_message_ids:unknown;

    failure_message:string | null;

    completed_at:Date | null;

}


interface DailyDeliveryCountRow {

    delivery_count:string | number;

}


/**
 * Return every configured recipient.
 */
export async function getExecutiveReportRecipients():

Promise<ExecutiveReportRecipient[]> {

    const result =

        await databasePool.query<RecipientRow>(`

            SELECT
                id,
                display_name,
                email,
                enabled,
                created_at,
                created_by_user_id,
                created_by_username,
                created_by_display_name,
                updated_at,
                updated_by_user_id,
                updated_by_username,
                updated_by_display_name

            FROM executive_report_recipients

            ORDER BY
                enabled DESC,
                LOWER(display_name),
                LOWER(email),
                id

        `);


    return result.rows.map(
        mapRecipientRow
    );

}


/**
 * Return only enabled recipients.
 */
export async function getEnabledExecutiveReportRecipients():

Promise<ExecutiveReportRecipient[]> {

    const result =

        await databasePool.query<RecipientRow>(`

            SELECT
                id,
                display_name,
                email,
                enabled,
                created_at,
                created_by_user_id,
                created_by_username,
                created_by_display_name,
                updated_at,
                updated_by_user_id,
                updated_by_username,
                updated_by_display_name

            FROM executive_report_recipients

            WHERE enabled = TRUE

            ORDER BY
                LOWER(display_name),
                LOWER(email),
                id

        `);


    return result.rows.map(
        mapRecipientRow
    );

}


/**
 * Create one recipient.
 */
export async function createExecutiveReportRecipient(

    input:{

        displayName:string;

        email:string;

        userId:string;

        username:string;

        userDisplayName:string;

    }

):Promise<ExecutiveReportRecipient> {

    const result =

        await databasePool.query<RecipientRow>(`

            INSERT INTO executive_report_recipients (

                display_name,
                email,
                enabled,

                created_by_user_id,
                created_by_username,
                created_by_display_name,

                updated_by_user_id,
                updated_by_username,
                updated_by_display_name

            )

            VALUES (

                $1,
                $2,
                TRUE,

                $3,
                $4,
                $5,

                $3,
                $4,
                $5

            )

            RETURNING
                id,
                display_name,
                email,
                enabled,
                created_at,
                created_by_user_id,
                created_by_username,
                created_by_display_name,
                updated_at,
                updated_by_user_id,
                updated_by_username,
                updated_by_display_name

        `, [

            input.displayName.trim(),

            input.email.trim().toLowerCase(),

            input.userId,

            input.username,

            input.userDisplayName

        ]);


    return mapRecipientRow(
        result.rows[0]
    );

}


/**
 * Update one existing recipient.
 */
export async function updateExecutiveReportRecipient(

    input:{

        id:string;

        displayName:string;

        email:string;

        enabled:boolean;

        userId:string;

        username:string;

        userDisplayName:string;

    }

):Promise<ExecutiveReportRecipient | null> {

    const result =

        await databasePool.query<RecipientRow>(`

            UPDATE executive_report_recipients

            SET
                display_name = $2,
                email = $3,
                enabled = $4,

                updated_at = NOW(),

                updated_by_user_id = $5,
                updated_by_username = $6,
                updated_by_display_name = $7

            WHERE id = $1

            RETURNING
                id,
                display_name,
                email,
                enabled,
                created_at,
                created_by_user_id,
                created_by_username,
                created_by_display_name,
                updated_at,
                updated_by_user_id,
                updated_by_username,
                updated_by_display_name

        `, [

            input.id,

            input.displayName.trim(),

            input.email.trim().toLowerCase(),

            input.enabled,

            input.userId,

            input.username,

            input.userDisplayName

        ]);


    const row =
        result.rows[0];


    return row
        ? mapRecipientRow(row)
        : null;

}


/**
 * Return recent distribution history.
 */
export async function getExecutiveReportDistributions(

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


    const result =

        await databasePool.query<DistributionRow>(`

            SELECT
                id,
                created_at,
                initiated_by_user_id,
                initiated_by_username,
                initiated_by_display_name,
                assessment_timestamp,
                hri_score,
                operational_level,
                subject,
                recipient_count,
                recipient_snapshot,
                accepted_count,
                failed_count,
                status,
                provider,
                provider_message_ids,
                failure_message,
                completed_at

            FROM executive_report_distributions

            ORDER BY
                created_at DESC,
                id DESC

            LIMIT $1

        `, [

            safeLimit

        ]);


    return result.rows.map(
        mapDistributionRow
    );

}


/**
 * Count recipient deliveries accepted by the provider
 * during the current UTC calendar day.
 *
 * Sandbox sends do not count because accepted_count is
 * recorded as zero for sandbox distributions.
 */
export async function getTodayAcceptedDeliveryCount():

Promise<number> {

    const result =

        await databasePool.query<DailyDeliveryCountRow>(`

            SELECT

                COALESCE(
                    SUM(accepted_count),
                    0
                ) AS delivery_count

            FROM executive_report_distributions

            WHERE
                created_at >= DATE_TRUNC(
                    'day',
                    NOW() AT TIME ZONE 'UTC'
                ) AT TIME ZONE 'UTC'

                AND

                created_at <
                    (
                        DATE_TRUNC(
                            'day',
                            NOW() AT TIME ZONE 'UTC'
                        )
                        +
                        INTERVAL '1 day'
                    ) AT TIME ZONE 'UTC'

        `);


    return Number(
        result.rows[0]?.delivery_count
        ?? 0
    );

}


/**
 * Atomically reserve delivery capacity and create the
 * pending distribution audit record.
 *
 * A PostgreSQL transaction-level advisory lock prevents
 * two application requests from simultaneously reserving
 * the same remaining daily capacity.
 *
 * Pending distributions are included in the reservation
 * total until they are completed. This prevents a second
 * request from exceeding the daily application limit
 * while the first provider request is still in flight.
 */
export async function reserveExecutiveReportDistribution(

    input:{

        userId:string;

        username:string;

        userDisplayName:string;

        assessmentTimestamp:string;

        hriScore:number;

        operationalLevel:string;

        subject:string;

        recipients:ExecutiveReportRecipientSnapshot[];

        dailyLimit:number;

    }

):Promise<ExecutiveReportDeliveryReservationResult> {

    const client =
        await databasePool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        /*
         * Stable application-specific advisory-lock key.
         *
         * The lock exists only for this transaction and
         * serializes Executive Report quota reservations.
         */
        await client.query(

            "SELECT pg_advisory_xact_lock($1)",

            [
                24092201
            ]

        );


        const usageResult =

            await client.query<DailyDeliveryCountRow>(`

                SELECT

                    COALESCE(

                        SUM(

                            CASE

                                WHEN status = 'pending'
                                    THEN recipient_count

                                ELSE accepted_count

                            END

                        ),

                        0

                    ) AS delivery_count

                FROM executive_report_distributions

                WHERE
                    created_at >= DATE_TRUNC(
                        'day',
                        NOW() AT TIME ZONE 'UTC'
                    ) AT TIME ZONE 'UTC'

                    AND

                    created_at <
                        (
                            DATE_TRUNC(
                                'day',
                                NOW() AT TIME ZONE 'UTC'
                            )
                            +
                            INTERVAL '1 day'
                        ) AT TIME ZONE 'UTC'

                    AND status <> 'sandbox'

            `);


        const used =

            Number(
                usageResult.rows[0]?.delivery_count
                ?? 0
            );


        const recipientCount =
            input.recipients.length;


        const remaining =

            Math.max(
                0,
                input.dailyLimit - used
            );


        if(
            recipientCount <= 0
            ||
            recipientCount > remaining
        ){

            await client.query(
                "ROLLBACK"
            );


            return {

                reserved:
                    false,

                dailyLimit:
                    input.dailyLimit,

                used,

                reservedCount:
                    0,

                remaining,

                distribution:
                    null

            };

        }


        const result =

            await client.query<DistributionRow>(`

                INSERT INTO executive_report_distributions (

                    initiated_by_user_id,
                    initiated_by_username,
                    initiated_by_display_name,

                    assessment_timestamp,

                    hri_score,

                    operational_level,

                    subject,

                    recipient_count,

                    recipient_snapshot,

                    status

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

                    $9::jsonb,

                    'pending'

                )

                RETURNING
                    id,
                    created_at,
                    initiated_by_user_id,
                    initiated_by_username,
                    initiated_by_display_name,
                    assessment_timestamp,
                    hri_score,
                    operational_level,
                    subject,
                    recipient_count,
                    recipient_snapshot,
                    accepted_count,
                    failed_count,
                    status,
                    provider,
                    provider_message_ids,
                    failure_message,
                    completed_at

            `, [

                input.userId,

                input.username,

                input.userDisplayName,

                input.assessmentTimestamp,

                input.hriScore,

                input.operationalLevel,

                input.subject,

                recipientCount,

                JSON.stringify(
                    input.recipients
                )

            ]);


        await client.query(
            "COMMIT"
        );


        return {

            reserved:
                true,

            dailyLimit:
                input.dailyLimit,

            used,

            reservedCount:
                recipientCount,

            remaining:
                Math.max(
                    0,
                    remaining - recipientCount
                ),

            distribution:
                mapDistributionRow(
                    result.rows[0]
                )

        };

    }
    catch(error){

        try {

            await client.query(
                "ROLLBACK"
            );

        }
        catch {

            /*
             * Preserve the original database error.
             */

        }


        throw error;

    }
    finally {

        client.release();

    }

}


/**
 * Create a pending audit record without quota
 * reservation.
 *
 * Retained for compatibility with existing server code.
 * New email delivery should use
 * reserveExecutiveReportDistribution().
 */
export async function createPendingExecutiveReportDistribution(

    input:{

        userId:string;

        username:string;

        userDisplayName:string;

        assessmentTimestamp:string;

        hriScore:number;

        operationalLevel:string;

        subject:string;

        recipientCount:number;

        recipientSnapshot?:ExecutiveReportRecipientSnapshot[];

    }

):Promise<ExecutiveReportDistribution> {

    const recipientSnapshot =

        input.recipientSnapshot
        ?? [];


    const result =

        await databasePool.query<DistributionRow>(`

            INSERT INTO executive_report_distributions (

                initiated_by_user_id,
                initiated_by_username,
                initiated_by_display_name,

                assessment_timestamp,

                hri_score,

                operational_level,

                subject,

                recipient_count,

                recipient_snapshot,

                status

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

                $9::jsonb,

                'pending'

            )

            RETURNING
                id,
                created_at,
                initiated_by_user_id,
                initiated_by_username,
                initiated_by_display_name,
                assessment_timestamp,
                hri_score,
                operational_level,
                subject,
                recipient_count,
                recipient_snapshot,
                accepted_count,
                failed_count,
                status,
                provider,
                provider_message_ids,
                failure_message,
                completed_at

        `, [

            input.userId,

            input.username,

            input.userDisplayName,

            input.assessmentTimestamp,

            input.hriScore,

            input.operationalLevel,

            input.subject,

            input.recipientCount,

            JSON.stringify(
                recipientSnapshot
            )

        ]);


    return mapDistributionRow(
        result.rows[0]
    );

}


/**
 * Create a sandbox distribution record.
 *
 * Sandbox requests are not counted against the local
 * daily delivery reservation because no actual messages
 * are delivered.
 */
export async function createSandboxExecutiveReportDistribution(

    input:{

        userId:string;

        username:string;

        userDisplayName:string;

        assessmentTimestamp:string;

        hriScore:number;

        operationalLevel:string;

        subject:string;

        recipients:ExecutiveReportRecipientSnapshot[];

    }

):Promise<ExecutiveReportDistribution> {

    const result =

        await databasePool.query<DistributionRow>(`

            INSERT INTO executive_report_distributions (

                initiated_by_user_id,
                initiated_by_username,
                initiated_by_display_name,

                assessment_timestamp,

                hri_score,

                operational_level,

                subject,

                recipient_count,

                recipient_snapshot,

                status

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

                $9::jsonb,

                'sandbox'

            )

            RETURNING
                id,
                created_at,
                initiated_by_user_id,
                initiated_by_username,
                initiated_by_display_name,
                assessment_timestamp,
                hri_score,
                operational_level,
                subject,
                recipient_count,
                recipient_snapshot,
                accepted_count,
                failed_count,
                status,
                provider,
                provider_message_ids,
                failure_message,
                completed_at

        `, [

            input.userId,

            input.username,

            input.userDisplayName,

            input.assessmentTimestamp,

            input.hriScore,

            input.operationalLevel,

            input.subject,

            input.recipients.length,

            JSON.stringify(
                input.recipients
            )

        ]);


    return mapDistributionRow(
        result.rows[0]
    );

}


/**
 * Complete a distribution record after the provider
 * request finishes.
 */
export async function completeExecutiveReportDistribution(

    input:{

        id:string;

        status:
            | "accepted"
            | "partial"
            | "failed"
            | "sandbox";

        acceptedCount:number;

        failedCount:number;

        providerMessageIds:string[];

        failureMessage?:string | null;

    }

):Promise<ExecutiveReportDistribution | null> {

    const result =

        await databasePool.query<DistributionRow>(`

            UPDATE executive_report_distributions

            SET
                status = $2,
                accepted_count = $3,
                failed_count = $4,
                provider_message_ids = $5::jsonb,
                failure_message = $6,
                completed_at = NOW()

            WHERE id = $1

            RETURNING
                id,
                created_at,
                initiated_by_user_id,
                initiated_by_username,
                initiated_by_display_name,
                assessment_timestamp,
                hri_score,
                operational_level,
                subject,
                recipient_count,
                recipient_snapshot,
                accepted_count,
                failed_count,
                status,
                provider,
                provider_message_ids,
                failure_message,
                completed_at

        `, [

            input.id,

            input.status,

            Math.max(
                0,
                Math.trunc(
                    input.acceptedCount
                )
            ),

            Math.max(
                0,
                Math.trunc(
                    input.failedCount
                )
            ),

            JSON.stringify(
                input.providerMessageIds
            ),

            input.failureMessage
            ?? null

        ]);


    const row =
        result.rows[0];


    return row
        ? mapDistributionRow(row)
        : null;

}


/**
 * Map PostgreSQL recipient row to API model.
 */
function mapRecipientRow(

    row:RecipientRow

):ExecutiveReportRecipient {

    return {

        id:
            String(
                row.id
            ),

        displayName:
            row.display_name,

        email:
            row.email,

        enabled:
            row.enabled,

        createdAt:
            new Date(
                row.created_at
            ).toISOString(),

        createdByUserId:
            row.created_by_user_id,

        createdByUsername:
            row.created_by_username,

        createdByDisplayName:
            row.created_by_display_name,

        updatedAt:
            new Date(
                row.updated_at
            ).toISOString(),

        updatedByUserId:
            row.updated_by_user_id,

        updatedByUsername:
            row.updated_by_username,

        updatedByDisplayName:
            row.updated_by_display_name

    };

}


/**
 * Map PostgreSQL distribution row to API model.
 */
function mapDistributionRow(

    row:DistributionRow

):ExecutiveReportDistribution {

    return {

        id:
            String(
                row.id
            ),

        createdAt:
            new Date(
                row.created_at
            ).toISOString(),

        initiatedByUserId:
            row.initiated_by_user_id,

        initiatedByUsername:
            row.initiated_by_username,

        initiatedByDisplayName:
            row.initiated_by_display_name,

        assessmentTimestamp:
            new Date(
                row.assessment_timestamp
            ).toISOString(),

        hriScore:
            Number(
                row.hri_score
            ),

        operationalLevel:
            row.operational_level,

        subject:
            row.subject,

        recipientCount:
            Number(
                row.recipient_count
            ),

        recipientSnapshot:
            normalizeRecipientSnapshot(
                row.recipient_snapshot
            ),

        acceptedCount:
            Number(
                row.accepted_count
            ),

        failedCount:
            Number(
                row.failed_count
            ),

        status:
            row.status,

        provider:
            row.provider,

        providerMessageIds:
            normalizeProviderMessageIds(
                row.provider_message_ids
            ),

        failureMessage:
            row.failure_message,

        completedAt:
            row.completed_at
                ? new Date(
                    row.completed_at
                ).toISOString()
                : null

    };

}


/**
 * Safely normalize the immutable recipient snapshot.
 */
function normalizeRecipientSnapshot(

    value:unknown

):ExecutiveReportRecipientSnapshot[] {

    if(!Array.isArray(value)){

        return [];

    }


    return value

        .filter(

            (
                item
            ):item is Record<string, unknown> =>

                typeof item === "object"
                &&
                item !== null

        )

        .map(

            item => ({

                displayName:

                    typeof item.displayName === "string"
                        ? item.displayName
                        : "",

                email:

                    typeof item.email === "string"
                        ? item.email
                        : ""

            })

        )

        .filter(

            item =>
                Boolean(
                    item.email
                )

        );

}


/**
 * Safely normalize the JSONB provider-message list.
 */
function normalizeProviderMessageIds(

    value:unknown

):string[] {

    if(!Array.isArray(value)){

        return [];

    }


    return value.filter(

        (
            item
        ):item is string =>

            typeof item === "string"

    );

}