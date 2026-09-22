/**
 * ExecutiveReportDistributionRoutes
 *
 * Authenticated API for:
 *
 * - Executive Assessment Report recipient configuration
 * - Distribution history
 * - Distribution preview
 * - Executive Report email delivery
 */

import {

    Router

}

from "express";


import {

    requireAuthentication

}

from "../middleware/AuthMiddleware.js";


import type {

    AuthenticatedRequest

}

from "../middleware/AuthMiddleware.js";


import {

    requirePermission

}

from "../middleware/AuthorizationMiddleware.js";


import {

    completeExecutiveReportDistribution,
    createExecutiveReportRecipient,
    createPendingExecutiveReportDistribution,
    getEnabledExecutiveReportRecipients,
    getExecutiveReportDistributions,
    getExecutiveReportRecipients,
    getTodayAcceptedDeliveryCount,
    reserveExecutiveReportDistribution,
    updateExecutiveReportRecipient

}

from "../repositories/ExecutiveReportDistributionRepository.js";


import type {

    ExecutiveReportRecipientSnapshot

}

from "../repositories/ExecutiveReportDistributionRepository.js";


import {

    getExecutiveReportEmailEnvironment

}

from "../config/environment.js";


import {

    sendExecutiveReportEmail

}

from "../services/ExecutiveReportEmailService.js";


import type {

    ExecutiveReportListItem,
    ExecutiveReportPayload

}

from "../types/ExecutiveReportPayload.js";


export const executiveReportDistributionRouter =
    Router();


const BREVO_FREE_DAILY_DELIVERY_LIMIT =
    300;


executiveReportDistributionRouter.use(

    requireAuthentication

);


/**
 * Read recipient configuration.
 */
executiveReportDistributionRouter.get(

    "/recipients",

    requirePermission(
        "executiveReportDistribution.manage"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                recipients:
                    await getExecutiveReportRecipients()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Create a recipient.
 */
executiveReportDistributionRouter.post(

    "/recipients",

    requirePermission(
        "executiveReportDistribution.manage"
    ),

    async (
        request:AuthenticatedRequest,
        response,
        next
    ) => {

        try {

            const user =
                request.edoriUser;


            if(!user){

                response.status(401).json({

                    error:
                        "unauthorized"

                });


                return;

            }


            const displayName =

                normalizeRequiredText(
                    request.body?.displayName,
                    200
                );


            const email =

                normalizeEmail(
                    request.body?.email
                );


            if(
                !displayName
                ||
                !email
            ){

                response.status(400).json({

                    error:
                        "invalid_recipient",

                    message:
                        "A valid recipient name and email address are required."

                });


                return;

            }


            try {

                const recipient =

                    await createExecutiveReportRecipient({

                        displayName,

                        email,

                        userId:
                            user.id,

                        username:
                            user.username,

                        userDisplayName:
                            user.displayName

                    });


                response.status(201).json({

                    created:
                        true,

                    recipient

                });

            }
            catch(error){

                if(isUniqueConstraintError(error)){

                    response.status(409).json({

                        error:
                            "duplicate_recipient",

                        message:
                            "That email address is already configured for Executive Report distribution."

                    });


                    return;

                }


                throw error;

            }

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Update a recipient.
 */
executiveReportDistributionRouter.put(

    "/recipients/:recipientId",

    requirePermission(
        "executiveReportDistribution.manage"
    ),

    async (
        request:AuthenticatedRequest,
        response,
        next
    ) => {

        try {

            const user =
                request.edoriUser;


            if(!user){

                response.status(401).json({

                    error:
                        "unauthorized"

                });


                return;

            }


            const recipientId =

                normalizePositiveIntegerId(
                    request.params.recipientId
                );


            const displayName =

                normalizeRequiredText(
                    request.body?.displayName,
                    200
                );


            const email =

                normalizeEmail(
                    request.body?.email
                );


            const enabled =
                request.body?.enabled;


            if(
                !recipientId
                ||
                !displayName
                ||
                !email
                ||
                typeof enabled !== "boolean"
            ){

                response.status(400).json({

                    error:
                        "invalid_recipient",

                    message:
                        "A valid recipient ID, name, email address, and enabled status are required."

                });


                return;

            }


            try {

                const recipient =

                    await updateExecutiveReportRecipient({

                        id:
                            recipientId,

                        displayName,

                        email,

                        enabled,

                        userId:
                            user.id,

                        username:
                            user.username,

                        userDisplayName:
                            user.displayName

                    });


                if(!recipient){

                    response.status(404).json({

                        error:
                            "recipient_not_found",

                        message:
                            "The Executive Report recipient was not found."

                    });


                    return;

                }


                response.status(200).json({

                    saved:
                        true,

                    recipient

                });

            }
            catch(error){

                if(isUniqueConstraintError(error)){

                    response.status(409).json({

                        error:
                            "duplicate_recipient",

                        message:
                            "That email address is already configured for Executive Report distribution."

                    });


                    return;

                }


                throw error;

            }

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Read recent distribution history.
 */
executiveReportDistributionRouter.get(

    "/history",

    requirePermission(
        "executiveReportDistribution.manage"
    ),

    async (request, response, next) => {

        try {

            const limit =

                normalizeHistoryLimit(
                    request.query.limit
                );


            response.status(200).json({

                distributions:

                    await getExecutiveReportDistributions(
                        limit
                    )

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Return current daily provider-accepted usage.
 */
executiveReportDistributionRouter.get(

    "/usage",

    requirePermission(
        "executiveReportDistribution.send"
    ),

    async (_request, response, next) => {

        try {

            const used =

                await getTodayAcceptedDeliveryCount();


            response.status(200).json({

                dailyLimit:
                    BREVO_FREE_DAILY_DELIVERY_LIMIT,

                used,

                remaining:

                    Math.max(
                        0,
                        BREVO_FREE_DAILY_DELIVERY_LIMIT
                        -
                        used
                    )

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Preview the current distribution before sending.
 *
 * Operators can see the recipients for the specific
 * distribution they are about to initiate without
 * receiving recipient-management permission.
 */
executiveReportDistributionRouter.get(

    "/send-preview",

    requirePermission(
        "executiveReportDistribution.send"
    ),

    async (_request, response, next) => {

        try {

            const recipients =

                await getEnabledExecutiveReportRecipients();


            const used =

                await getTodayAcceptedDeliveryCount();


            response.status(200).json({

                recipients:

                    recipients.map(

                        recipient => ({

                            displayName:
                                recipient.displayName,

                            email:
                                recipient.email

                        })

                    ),

                recipientCount:
                    recipients.length,

                dailyLimit:
                    BREVO_FREE_DAILY_DELIVERY_LIMIT,

                used,

                remaining:

                    Math.max(
                        0,
                        BREVO_FREE_DAILY_DELIVERY_LIMIT
                        -
                        used
                    )

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Send the current Executive Assessment Report.
 *
 * The frontend supplies a structured snapshot of the
 * already-calculated authoritative report.
 *
 * This route does not calculate Hospital Readiness.
 */
executiveReportDistributionRouter.post(

    "/send",

    requirePermission(
        "executiveReportDistribution.send"
    ),

    async (
        request:AuthenticatedRequest,
        response,
        next
    ) => {

        let distributionId:string | null =
            null;


        let recipientCount =
            0;


        try {

            const user =
                request.edoriUser;


            if(!user){

                response.status(401).json({

                    error:
                        "unauthorized"

                });


                return;

            }


            const report =

                normalizeExecutiveReportPayload(
                    request.body?.report
                );


            if(!report){

                response.status(400).json({

                    error:
                        "invalid_report",

                    message:
                        "The Executive Assessment Report payload is invalid or incomplete."

                });


                return;

            }


            const enabledRecipients =

                await getEnabledExecutiveReportRecipients();


            const recipients:ExecutiveReportRecipientSnapshot[] =

                enabledRecipients.map(

                    recipient => ({

                        displayName:
                            recipient.displayName,

                        email:
                            recipient.email

                    })

                );


            recipientCount =
                recipients.length;


            if(recipientCount === 0){

                response.status(409).json({

                    error:
                        "no_recipients",

                    message:
                        "No enabled Executive Report recipients are configured."

                });


                return;

            }


            const subject =

                createExecutiveReportSubject(
                    report
                );


            /*
             * Reading email configuration here serves
             * two purposes:
             *
             * 1. Validate that the provider configuration
             *    exists before creating a send record.
             *
             * 2. Determine whether this is a sandbox send.
             */
            const emailEnvironment =

                getExecutiveReportEmailEnvironment();


            if(emailEnvironment.sandbox){

                /*
                 * Sandbox does not deliver email or consume
                 * Brevo delivery quota, so it does not need
                 * a real-delivery quota reservation.
                 */
                const pendingDistribution =

                    await createPendingExecutiveReportDistribution({

                        userId:
                            user.id,

                        username:
                            user.username,

                        userDisplayName:
                            user.displayName,

                        assessmentTimestamp:
                            report.assessmentTimestamp,

                        hriScore:
                            report.hriScore,

                        operationalLevel:
                            report.operationalLevel,

                        subject,

                        recipientCount,

                        recipientSnapshot:
                            recipients

                    });


                distributionId =
                    pendingDistribution.id;

            }
            else {

                /*
                 * Real delivery uses an atomic PostgreSQL
                 * quota reservation so simultaneous sends
                 * cannot consume the same remaining quota.
                 */
                const reservation =

                    await reserveExecutiveReportDistribution({

                        userId:
                            user.id,

                        username:
                            user.username,

                        userDisplayName:
                            user.displayName,

                        assessmentTimestamp:
                            report.assessmentTimestamp,

                        hriScore:
                            report.hriScore,

                        operationalLevel:
                            report.operationalLevel,

                        subject,

                        recipients,

                        dailyLimit:
                            BREVO_FREE_DAILY_DELIVERY_LIMIT

                    });


                if(
                    !reservation.reserved
                    ||
                    !reservation.distribution
                ){

                    response.status(409).json({

                        error:
                            "daily_delivery_limit",

                        message:
                            "Sending this report would exceed the remaining daily Executive Report email limit.",

                        dailyLimit:
                            reservation.dailyLimit,

                        used:
                            reservation.used,

                        requested:
                            recipientCount,

                        remaining:
                            reservation.remaining

                    });


                    return;

                }


                distributionId =
                    reservation.distribution.id;

            }


            const emailResult =

                await sendExecutiveReportEmail({

                    report,

                    recipients,

                    subject

                });


            const completedDistribution =

                await completeExecutiveReportDistribution({

                    id:
                        distributionId,

                    status:

                        emailResult.sandbox
                            ? "sandbox"
                            : "accepted",

                    acceptedCount:
                        emailResult.acceptedCount,

                    failedCount:
                        emailResult.failedCount,

                    providerMessageIds:
                        emailResult.providerMessageIds,

                    failureMessage:
                        null

                });


            if(!completedDistribution){

                throw new Error(
                    "The Executive Report was processed, but its distribution audit record could not be completed."
                );

            }


            response.status(200).json({

                sent:
                    !emailResult.sandbox,

                sandbox:
                    emailResult.sandbox,

                message:

                    emailResult.sandbox

                        ? "Executive Report sandbox validation completed successfully. No email was delivered."

                        : `Executive Assessment Report accepted for delivery to ${recipientCount} recipient${
                            recipientCount === 1
                                ? ""
                                : "s"
                        }.`,

                distribution:
                    completedDistribution

            });

        }
        catch(error){

            /*
             * If a pending audit record was created before
             * the provider request failed, complete it as
             * failed so it does not remain pending and does
             * not continue reserving daily quota.
             */
            if(distributionId){

                try {

                    await completeExecutiveReportDistribution({

                        id:
                            distributionId,

                        status:
                            "failed",

                        acceptedCount:
                            0,

                        failedCount:
                            recipientCount,

                        providerMessageIds:
                            [],

                        failureMessage:
                            normalizeFailureMessage(
                                error
                            )

                    });

                }
                catch(auditError){

                    console.error(

                        "Unable to complete failed Executive Report distribution audit record:",

                        auditError

                    );

                }

            }


            next(
                error
            );

        }

    }

);


/**
 * Create the server-controlled subject.
 */
function createExecutiveReportSubject(

    report:ExecutiveReportPayload

):string {

    return `Hospital Readiness Executive Assessment – ${report.operationalLevel} – HRI ${Math.round(
        report.hriScore
    )}`;

}


/**
 * Strictly normalize the structured report payload.
 *
 * The server does not accept arbitrary HTML from the
 * browser.
 */
function normalizeExecutiveReportPayload(

    value:unknown

):ExecutiveReportPayload | null {

    if(!isRecord(value)){

        return null;

    }


    const assessmentTimestamp =

        normalizeTimestamp(
            value.assessmentTimestamp
        );


    const generatedTimestamp =

        normalizeTimestamp(
            value.generatedTimestamp
        );


    const hriScore =
        normalizeFiniteNumber(
            value.hriScore
        );


    const operationalLevel =

        normalizeRequiredText(
            value.operationalLevel,
            100
        );


    const operationalIcon =

        normalizeOptionalText(
            value.operationalIcon,
            20
        );


    const operationalColor =

        normalizeColor(
            value.operationalColor
        );


    const riskDirection =

        normalizeRequiredText(
            value.riskDirection,
            100
        );


    const confidence =

        normalizeRequiredText(
            value.confidence,
            100
        );


    const scoreChange =

        value.scoreChange === null

            ? null

            : normalizeFiniteNumber(
                value.scoreChange
            );


    const activeTriggerCount =

        normalizeNonnegativeInteger(
            value.activeTriggerCount
        );


    const priorityActionCount =

        normalizeNonnegativeInteger(
            value.priorityActionCount
        );


    if(
        !assessmentTimestamp
        ||
        !generatedTimestamp
        ||
        hriScore === null
        ||
        hriScore < 0
        ||
        hriScore > 100
        ||
        !operationalLevel
        ||
        operationalIcon === null
        ||
        !operationalColor
        ||
        !riskDirection
        ||
        !confidence
        ||
        (
            value.scoreChange !== null
            &&
            scoreChange === null
        )
        ||
        activeTriggerCount === null
        ||
        priorityActionCount === null
    ){

        return null;

    }


    const domains =

        normalizeDomains(
            value.domains
        );


    const capacity =

        normalizeCapacity(
            value.capacity
        );


    const acuity =

        normalizeAcuity(
            value.acuity
        );


    const drivers =

        normalizeReportList(
            value.drivers,
            5
        );


    const triggers =

        normalizeReportList(
            value.triggers,
            8
        );


    const recommendations =

        normalizeReportList(
            value.recommendations,
            8
        );

const trend =
    normalizeExecutiveReportTrend(
        value.trend
    );


if(trend === null){

    return null;

}


    const outlook =

        normalizeOutlook(
            value.outlook
        );


    if(
        !domains
        ||
        !capacity
        ||
        !acuity
        ||
        drivers === null
        ||
        triggers === null
        ||
        recommendations === null
        ||
        !outlook
    ){

        return null;

    }


    return {

        assessmentTimestamp,

        generatedTimestamp,

        hriScore,

        operationalLevel,

        operationalIcon,

        operationalColor,

        riskDirection,

        confidence,

        scoreChange,

        activeTriggerCount,

        priorityActionCount,

        domains,

        capacity,

        acuity,

        drivers,

triggers,

recommendations,

trend,

outlook

    };

}


function normalizeExecutiveReportTrend(

    value:unknown

):ExecutiveReportPayload["trend"] | null {

    if(!Array.isArray(value)){

        return null;

    }


    const normalized:ExecutiveReportPayload["trend"] = [];


    for(const item of value){

        const point =
            normalizeExecutiveReportTrendPoint(
                item
            );


        if(!point){

            return null;

        }


        normalized.push(
            point
        );

    }


    /*
     * The frontend sends no more than 24 points.
     * Enforce the same limit at the API boundary.
     */
    return normalized
        .slice(
            -24
        )
        .sort(
            (
                first,
                second
            ) =>
                new Date(
                    first.timestamp
                ).getTime()
                -
                new Date(
                    second.timestamp
                ).getTime()
        );

}


function normalizeExecutiveReportTrendPoint(

    value:unknown

):ExecutiveReportPayload["trend"][number] | null {

    if(
        typeof value !== "object"
        ||
        value === null
        ||
        Array.isArray(value)
    ){

        return null;

    }


    const candidate =
        value as Record<string, unknown>;


    const timestamp =
        typeof candidate.timestamp === "string"
            ? candidate.timestamp.trim()
            : "";


    const score =
        normalizeFiniteNumber(
            candidate.score
        );


    const operationalLevel =
        typeof candidate.operationalLevel === "string"
            ? candidate.operationalLevel.trim()
            : "";


    if(
        !timestamp
        ||
        Number.isNaN(
            new Date(
                timestamp
            ).getTime()
        )
        ||
        score === null
        ||
        score < 0
        ||
        score > 100
        ||
        ![
            "Alpha",
            "Bravo",
            "Charlie",
            "Delta",
            "Echo"
        ].includes(
            operationalLevel
        )
    ){

        return null;

    }


    return {

        timestamp:
            new Date(
                timestamp
            ).toISOString(),

        score,

        operationalLevel

    };

}

function normalizeDomains(

    value:unknown

):ExecutiveReportPayload["domains"] | null {

    if(!isRecord(value)){

        return null;

    }


    const edOperationalPressure =
        normalizeScore(
            value.edOperationalPressure
        );


    const projectedAcuteCareCapacity =
        normalizeScore(
            value.projectedAcuteCareCapacity
        );


    const criticalCareCapacity =
        normalizeScore(
            value.criticalCareCapacity
        );


    if(
        edOperationalPressure === null
        ||
        projectedAcuteCareCapacity === null
        ||
        criticalCareCapacity === null
    ){

        return null;

    }


    return {

        edOperationalPressure,

        projectedAcuteCareCapacity,

        criticalCareCapacity

    };

}


function normalizeCapacity(

    value:unknown

):ExecutiveReportPayload["capacity"] | null {

    if(!isRecord(value)){

        return null;

    }


    const totalEDVolume =
        normalizeNonnegativeNumber(
            value.totalEDVolume
        );

    const edTreatmentBeds =
        normalizePositiveNumber(
            value.edTreatmentBeds
        );

    const edCapacityPercent =
        normalizeNonnegativeNumber(
            value.edCapacityPercent
        );

    const boardedPatients =
        normalizeNonnegativeNumber(
            value.boardedPatients
        );

    const boardingSharePercent =
        normalizeNonnegativeNumber(
            value.boardingSharePercent
        );

    const occupiedAcuteCareBeds =
        normalizeNonnegativeNumber(
            value.occupiedAcuteCareBeds
        );

    const staffedAcuteCareBeds =
        normalizeNonnegativeNumber(
            value.staffedAcuteCareBeds
        );

    const acuteOccupancyPercent =
        normalizeNonnegativeNumber(
            value.acuteOccupancyPercent
        );

    const occupiedCriticalCareBeds =
        normalizeNonnegativeNumber(
            value.occupiedCriticalCareBeds
        );

    const staffedCriticalCareBeds =
        normalizeNonnegativeNumber(
            value.staffedCriticalCareBeds
        );

    const criticalOccupancyPercent =
        normalizeNonnegativeNumber(
            value.criticalOccupancyPercent
        );

    const knownDirectAdmissions4h =
        normalizeNonnegativeNumber(
            value.knownDirectAdmissions4h
        );

    const knownSurgicalAdmissions4h =
        normalizeNonnegativeNumber(
            value.knownSurgicalAdmissions4h
        );

    const expectedAdditionalEDAdmissions4h =
        normalizeNonnegativeNumber(
            value.expectedAdditionalEDAdmissions4h
        );

    const expectedInpatientDepartures4h =
        normalizeNonnegativeNumber(
            value.expectedInpatientDepartures4h
        );

    /*
     * This value may intentionally be negative when
     * projected demand exceeds staffed capacity.
     */
    const projectedAvailableAcuteCareBeds =
        normalizeFiniteNumber(
            value.projectedAvailableAcuteCareBeds
        );


    const values = [

        totalEDVolume,
        edTreatmentBeds,
        edCapacityPercent,
        boardedPatients,
        boardingSharePercent,
        occupiedAcuteCareBeds,
        staffedAcuteCareBeds,
        acuteOccupancyPercent,
        occupiedCriticalCareBeds,
        staffedCriticalCareBeds,
        criticalOccupancyPercent,
        knownDirectAdmissions4h,
        knownSurgicalAdmissions4h,
        expectedAdditionalEDAdmissions4h,
        expectedInpatientDepartures4h,
        projectedAvailableAcuteCareBeds

    ];


    if(
        values.some(
            item => item === null
        )
    ){

        return null;

    }


    return {

        totalEDVolume:
            totalEDVolume!,

        edTreatmentBeds:
            edTreatmentBeds!,

        edCapacityPercent:
            edCapacityPercent!,

        boardedPatients:
            boardedPatients!,

        boardingSharePercent:
            boardingSharePercent!,

        occupiedAcuteCareBeds:
            occupiedAcuteCareBeds!,

        staffedAcuteCareBeds:
            staffedAcuteCareBeds!,

        acuteOccupancyPercent:
            acuteOccupancyPercent!,

        occupiedCriticalCareBeds:
            occupiedCriticalCareBeds!,

        staffedCriticalCareBeds:
            staffedCriticalCareBeds!,

        criticalOccupancyPercent:
            criticalOccupancyPercent!,

        knownDirectAdmissions4h:
            knownDirectAdmissions4h!,

        knownSurgicalAdmissions4h:
            knownSurgicalAdmissions4h!,

        expectedAdditionalEDAdmissions4h:
            expectedAdditionalEDAdmissions4h!,

        expectedInpatientDepartures4h:
            expectedInpatientDepartures4h!,

        projectedAvailableAcuteCareBeds:
            projectedAvailableAcuteCareBeds!

    };

}


function normalizeAcuity(

    value:unknown

):ExecutiveReportPayload["acuity"] | null {

    if(!isRecord(value)){

        return null;

    }


    const esi1 =
        normalizeNonnegativeNumber(
            value.esi1
        );

    const esi2 =
        normalizeNonnegativeNumber(
            value.esi2
        );

    const esi3to5 =
        normalizeNonnegativeNumber(
            value.esi3to5
        );

    const highAcuityCount =
        normalizeNonnegativeNumber(
            value.highAcuityCount
        );

    const highAcuityPercent =
        normalizeNonnegativeNumber(
            value.highAcuityPercent
        );


    if(
        esi1 === null
        ||
        esi2 === null
        ||
        esi3to5 === null
        ||
        highAcuityCount === null
        ||
        highAcuityPercent === null
    ){

        return null;

    }


    return {

        esi1,

        esi2,

        esi3to5,

        highAcuityCount,

        highAcuityPercent

    };

}


function normalizeReportList(

    value:unknown,

    maximumItems:number

):ExecutiveReportListItem[] | null {

    if(!Array.isArray(value)){

        return null;

    }


    if(value.length > maximumItems){

        return null;

    }


    const items:ExecutiveReportListItem[] = [];


    for(const rawItem of value){

        if(!isRecord(rawItem)){

            return null;

        }


        const title =

            normalizeRequiredText(
                rawItem.title,
                300
            );


        const description =

            normalizeRequiredText(
                rawItem.description,
                2_000
            );


        const label =

            normalizeRequiredText(
                rawItem.label,
                100
            );


        if(
            !title
            ||
            !description
            ||
            !label
        ){

            return null;

        }


        items.push({

            title,

            description,

            label

        });

    }


    return items;

}


function normalizeOutlook(

    value:unknown

):ExecutiveReportPayload["outlook"] | null {

    if(!isRecord(value)){

        return null;

    }


    const heading =

        normalizeRequiredText(
            value.heading,
            500
        );


    const description =

        normalizeRequiredText(
            value.description,
            3_000
        );


    if(
        !heading
        ||
        !description
    ){

        return null;

    }


    return {

        heading,

        description

    };

}


function normalizeRequiredText(

    value:unknown,

    maximumLength:number

):string | null {

    if(typeof value !== "string"){

        return null;

    }


    const normalized =
        value.trim();


    if(
        !normalized
        ||
        normalized.length > maximumLength
    ){

        return null;

    }


    return normalized;

}


function normalizeOptionalText(

    value:unknown,

    maximumLength:number

):string | null {

    if(typeof value !== "string"){

        return null;

    }


    const normalized =
        value.trim();


    if(normalized.length > maximumLength){

        return null;

    }


    return normalized;

}


function normalizeEmail(

    value:unknown

):string | null {

    if(typeof value !== "string"){

        return null;

    }


    const normalized =
        value.trim().toLowerCase();


    if(
        !normalized
        ||
        normalized.length > 320
    ){

        return null;

    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if(!emailPattern.test(normalized)){

        return null;

    }


    return normalized;

}


function normalizeTimestamp(

    value:unknown

):string | null {

    if(typeof value !== "string"){

        return null;

    }


    const date =
        new Date(
            value
        );


    if(Number.isNaN(date.getTime())){

        return null;

    }


    return date.toISOString();

}


function normalizeFiniteNumber(

    value:unknown

):number | null {

    if(
        typeof value !== "number"
        ||
        !Number.isFinite(value)
    ){

        return null;

    }


    return value;

}


function normalizeNonnegativeNumber(

    value:unknown

):number | null {

    const normalized =
        normalizeFiniteNumber(
            value
        );


    if(
        normalized === null
        ||
        normalized < 0
    ){

        return null;

    }


    return normalized;

}


function normalizePositiveNumber(

    value:unknown

):number | null {

    const normalized =
        normalizeFiniteNumber(
            value
        );


    if(
        normalized === null
        ||
        normalized <= 0
    ){

        return null;

    }


    return normalized;

}


function normalizeNonnegativeInteger(

    value:unknown

):number | null {

    const normalized =
        normalizeNonnegativeNumber(
            value
        );


    if(
        normalized === null
        ||
        !Number.isInteger(normalized)
    ){

        return null;

    }


    return normalized;

}


function normalizeScore(

    value:unknown

):number | null {

    const normalized =
        normalizeFiniteNumber(
            value
        );


    if(
        normalized === null
        ||
        normalized < 0
        ||
        normalized > 100
    ){

        return null;

    }


    return normalized;

}


function normalizeColor(

    value:unknown

):string | null {

    if(
        typeof value !== "string"
        ||
        !/^#[0-9a-f]{6}$/i.test(
            value
        )
    ){

        return null;

    }


    return value;

}


function normalizePositiveIntegerId(

    value:unknown

):string | null {

    if(
        typeof value !== "string"
        ||
        !/^[1-9]\d*$/.test(
            value
        )
    ){

        return null;

    }


    return value;

}


function normalizeHistoryLimit(

    value:unknown

):number {

    if(typeof value !== "string"){

        return 50;

    }


    const parsed =

        Number.parseInt(
            value,
            10
        );


    if(
        !Number.isFinite(parsed)
        ||
        parsed <= 0
    ){

        return 50;

    }


    return Math.min(
        200,
        parsed
    );

}


function normalizeFailureMessage(

    error:unknown

):string {

    const message =

        error instanceof Error

            ? error.message

            : "Executive Report distribution failed.";


    /*
     * Keep provider/database errors useful for the audit
     * record while preventing unbounded text storage.
     */
    return message
        .trim()
        .slice(
            0,
            2_000
        );

}


function isRecord(

    value:unknown

):value is Record<string, unknown> {

    return (

        typeof value === "object"

        &&

        value !== null

        &&

        !Array.isArray(value)

    );

}


function isUniqueConstraintError(

    error:unknown

):boolean {

    if(
        typeof error !== "object"
        ||
        error === null
    ){

        return false;

    }


    return (

        "code" in error

        &&

        (
            error as {
                code?:unknown;
            }
        ).code === "23505"

    );

}