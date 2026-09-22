/**
 * ExecutiveReportEmailService
 *
 * Sends an already-calculated Executive Assessment
 * Report through Brevo.
 *
 * Responsibilities:
 *
 * - Generate the PDF attachment
 * - Generate a concise executive-summary email
 * - Send one private message version per recipient
 * - Support Brevo sandbox mode
 * - Return provider message IDs for audit history
 *
 * This service does NOT calculate Hospital Readiness.
 */

import {

    randomUUID

}

from "node:crypto";


import {

    getExecutiveReportEmailEnvironment

}

from "../config/environment.js";


import type {

    ExecutiveReportRecipientSnapshot

}

from "../repositories/ExecutiveReportDistributionRepository.js";


import type {

    ExecutiveReportPayload

}

from "../types/ExecutiveReportPayload.js";


import {

    createExecutiveReportPdf

}

from "./ExecutiveReportPdfService.js";


const BREVO_TRANSACTIONAL_EMAIL_URL =
    "https://api.brevo.com/v3/smtp/email";


export interface ExecutiveReportEmailResult {

    sandbox:boolean;

    acceptedCount:number;

    failedCount:number;

    providerMessageIds:string[];

    providerRequestId:string;

}


interface BrevoSendResponse {

    messageId?:unknown;

    messageIds?:unknown;

    code?:unknown;

    message?:unknown;

}


interface BrevoMessageVersion {

    to:Array<{

        email:string;

        name?:string;

    }>;

}


interface BrevoTransactionalEmailRequest {

    sender:{

        email:string;

        name:string;

    };

    subject:string;

    htmlContent:string;

    textContent:string;

    headers:Record<string, string>;

    attachment:Array<{

        content:string;

        name:string;

    }>;

    messageVersions:BrevoMessageVersion[];

}


/**
 * Send one Executive Assessment Report.
 */
export async function sendExecutiveReportEmail(

    input:{

        report:ExecutiveReportPayload;

        recipients:ExecutiveReportRecipientSnapshot[];

        subject:string;

    }

):Promise<ExecutiveReportEmailResult> {

    const environment =
        getExecutiveReportEmailEnvironment();


    const recipients =
        normalizeRecipients(
            input.recipients
        );


    if(recipients.length === 0){

        throw new Error(
            "No enabled Executive Report recipients are available."
        );

    }


    const pdfBuffer =

        await createExecutiveReportPdf(
            input.report
        );


    const providerRequestId =
        randomUUID();


    const requestBody:BrevoTransactionalEmailRequest = {

        sender:{

            email:
                environment.fromEmail,

            name:
                environment.fromName

        },

        subject:
            input.subject,

        htmlContent:
            createExecutiveSummaryHtml(
                input.report
            ),

        textContent:
            createExecutiveSummaryText(
                input.report
            ),

        headers:{

            idempotencyKey:
                providerRequestId,

            ...(environment.sandbox
                ? {
                    "X-Sib-Sandbox":
                        "drop"
                }
                : {}
            )

        },

        attachment:[

            {
                content:
                    pdfBuffer.toString(
                        "base64"
                    ),

                name:
                    createPdfFilename(
                        input.report
                    )
            }

        ],

        messageVersions:

            recipients.map(

                recipient => ({

                    to:[

                        {
                            email:
                                recipient.email,

                            ...(recipient.displayName
                                ? {
                                    name:
                                        recipient.displayName
                                }
                                : {}
                            )
                        }

                    ]

                })

            )

    };


    let response:Response;


    try {

        response =

            await fetch(

                BREVO_TRANSACTIONAL_EMAIL_URL,

                {

                    method:
                        "POST",

                    headers:{

                        "Accept":
                            "application/json",

                        "Content-Type":
                            "application/json",

                        "api-key":
                            environment.apiKey

                    },

                    body:
                        JSON.stringify(
                            requestBody
                        )

                }

            );

    }
    catch(error){

        throw new Error(

            `Unable to connect to the Executive Report email provider: ${getErrorMessage(
                error
            )}`

        );

    }


    const responsePayload =

        await readBrevoResponse(
            response
        );


    if(!response.ok){

        throw new Error(

            createBrevoFailureMessage(
                response.status,
                responsePayload
            )

        );

    }


    const providerMessageIds =

        normalizeMessageIds(
            responsePayload
        );


    /*
     * Sandbox mode validates the request but does not
     * deliver messages. Therefore acceptedCount remains
     * zero in our application-level delivery accounting.
     */
    if(environment.sandbox){

        return {

            sandbox:
                true,

            acceptedCount:
                0,

            failedCount:
                0,

            providerMessageIds,

            providerRequestId

        };

    }


    /*
     * A successful Brevo batch response means the
     * provider accepted the request for processing.
     *
     * It does not mean the messages have reached the
     * recipients' inboxes. Delivery/bounce tracking can
     * later be added through transactional webhooks.
     */
    return {

        sandbox:
            false,

        acceptedCount:
            recipients.length,

        failedCount:
            0,

        providerMessageIds,

        providerRequestId

    };

}


/**
 * Build the concise HTML executive summary.
 */
function createExecutiveSummaryHtml(

    report:ExecutiveReportPayload

):string {

    const projectedBeds =
        report.capacity.projectedAvailableAcuteCareBeds;


    const scoreChange =

        report.scoreChange === null

            ? "No prior comparison"

            : formatSignedNumber(
                report.scoreChange
            );


    const driverMarkup =

        createHtmlList(

            report.drivers,

            "No dominant Hospital Readiness drivers were identified."

        );


    const triggerMarkup =

        createHtmlList(

            report.triggers,

            "No operational triggers are currently active."

        );


    const recommendationMarkup =

        createHtmlList(

            report.recommendations,

            "No operational intervention is currently recommended."

        );


    return `<!DOCTYPE html>

<html>

<head>

    <meta charset="utf-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
    >

    <title>
        Hospital Readiness Executive Assessment Report
    </title>

</head>

<body
    style="
        margin:0;
        padding:0;
        background:#f3f5f8;
        font-family:Arial, Helvetica, sans-serif;
        color:#172033;
    "
>

    <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="
            width:100%;
            background:#f3f5f8;
        "
    >

        <tr>

            <td
                align="center"
                style="
                    padding:28px 12px;
                "
            >

                <table
                    role="presentation"
                    width="680"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                        width:100%;
                        max-width:680px;
                        background:#ffffff;
                        border-collapse:separate;
                        border-spacing:0;
                        border:1px solid #d8dee8;
                        border-radius:12px;
                        overflow:hidden;
                    "
                >

                    <tr>

                        <td
                            style="
                                padding:28px 30px 20px 30px;
                            "
                        >

                            <div
                                style="
                                    color:#5f6b7a;
                                    font-size:11px;
                                    font-weight:700;
                                    letter-spacing:1.2px;
                                    text-transform:uppercase;
                                "
                            >
                                Hospital Readiness Index
                            </div>

                            <div
                                style="
                                    margin-top:6px;
                                    color:#172033;
                                    font-size:26px;
                                    line-height:32px;
                                    font-weight:700;
                                "
                            >
                                Executive Assessment Report
                            </div>

                            <div
                                style="
                                    margin-top:8px;
                                    color:#5f6b7a;
                                    font-size:13px;
                                    line-height:19px;
                                "
                            >
                                Assessment completed
                                ${escapeHtml(
                                    formatDateTime(
                                        report.assessmentTimestamp
                                    )
                                )}
                            </div>

                        </td>

                    </tr>


                    <tr>

                        <td
                            style="
                                padding:0 30px 24px 30px;
                            "
                        >

                            <table
                                role="presentation"
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                style="
                                    width:100%;
                                    background:#f4f6f9;
                                    border-left:6px solid ${escapeAttribute(
                                        normalizeColor(
                                            report.operationalColor
                                        )
                                    )};
                                    border-radius:8px;
                                "
                            >

                                <tr>

                                    <td
                                        style="
                                            padding:18px 18px;
                                        "
                                    >

                                        <div
                                            style="
                                                color:#5f6b7a;
                                                font-size:10px;
                                                font-weight:700;
                                                text-transform:uppercase;
                                            "
                                        >
                                            Operational Level
                                        </div>

                                        <div
                                            style="
                                                margin-top:4px;
                                                color:#172033;
                                                font-size:21px;
                                                line-height:27px;
                                                font-weight:700;
                                            "
                                        >
                                            ${escapeHtml(
                                                report.operationalLevel
                                            )}
                                        </div>

                                    </td>


                                    <td
                                        width="110"
                                        align="center"
                                        style="
                                            padding:18px 8px;
                                        "
                                    >

                                        <div
                                            style="
                                                color:#5f6b7a;
                                                font-size:10px;
                                                font-weight:700;
                                                text-transform:uppercase;
                                            "
                                        >
                                            HRI Score
                                        </div>

                                        <div
                                            style="
                                                margin-top:2px;
                                                color:#172033;
                                                font-size:32px;
                                                line-height:36px;
                                                font-weight:700;
                                            "
                                        >
                                            ${Math.round(
                                                report.hriScore
                                            )}
                                        </div>

                                    </td>

                                </tr>

                            </table>

                        </td>

                    </tr>


                    <tr>

                        <td
                            style="
                                padding:0 30px 24px 30px;
                            "
                        >

                            ${createHtmlSectionHeading(
                                "Current Operational Picture"
                            )}

                            ${createSummaryMetricTable([

                                {
                                    label:
                                        "Trend",

                                    value:
                                        report.riskDirection
                                },

                                {
                                    label:
                                        "Confidence",

                                    value:
                                        report.confidence
                                },

                                {
                                    label:
                                        "Score Change",

                                    value:
                                        scoreChange
                                },

                                {
                                    label:
                                        "Active Triggers",

                                    value:
                                        String(
                                            report.activeTriggerCount
                                        )
                                }

                            ])}

                        </td>

                    </tr>


                    <tr>

                        <td
                            style="
                                padding:0 30px 24px 30px;
                            "
                        >

                            ${createHtmlSectionHeading(
                                "Hospital Readiness Domains"
                            )}

                            ${createSummaryMetricTable([

                                {
                                    label:
                                        "ED Operational Pressure",

                                    value:
                                        `${formatNumber(
                                            report.domains
                                                .edOperationalPressure
                                        )} / 100`
                                },

                                {
                                    label:
                                        "Projected Acute-Care Capacity",

                                    value:
                                        `${formatNumber(
                                            report.domains
                                                .projectedAcuteCareCapacity
                                        )} / 100`
                                },

                                {
                                    label:
                                        "Critical-Care Capacity",

                                    value:
                                        `${formatNumber(
                                            report.domains
                                                .criticalCareCapacity
                                        )} / 100`
                                },

                                {
                                    label:
                                        "Projected Available Acute Beds",

                                    value:
                                        formatBedAvailability(
                                            projectedBeds
                                        )
                                }

                            ])}

                        </td>

                    </tr>


                    <tr>

                        <td
                            style="
                                padding:0 30px 24px 30px;
                            "
                        >

                            ${createHtmlSectionHeading(
                                "Current Capacity"
                            )}

                            ${createSummaryMetricTable([

                                {
                                    label:
                                        "Total ED Volume",

                                    value:
                                        formatNumber(
                                            report.capacity.totalEDVolume
                                        )
                                },

                                {
                                    label:
                                        "Boarding Patients",

                                    value:
                                        formatNumber(
                                            report.capacity.boardedPatients
                                        )
                                },

                                {
                                    label:
                                        "Acute-Care Occupancy",

                                    value:
                                        `${formatNumber(
                                            report.capacity
                                                .acuteOccupancyPercent
                                        )}%`
                                },

                                {
                                    label:
                                        "Critical-Care Occupancy",

                                    value:
                                        `${formatNumber(
                                            report.capacity
                                                .criticalOccupancyPercent
                                        )}%`
                                }

                            ])}

                        </td>

                    </tr>


                    <tr>

                        <td
                            style="
                                padding:0 30px 24px 30px;
                            "
                        >

                            ${createHtmlSectionHeading(
                                "Four-Hour Capacity Outlook"
                            )}

                            <div
                                style="
                                    background:#f4f6f9;
                                    border:1px solid #d8dee8;
                                    border-radius:8px;
                                    padding:16px 18px;
                                "
                            >

                                <div
                                    style="
                                        color:#172033;
                                        font-size:15px;
                                        line-height:21px;
                                        font-weight:700;
                                    "
                                >
                                    ${escapeHtml(
                                        report.outlook.heading
                                    )}
                                </div>

                                <div
                                    style="
                                        margin-top:6px;
                                        color:#5f6b7a;
                                        font-size:13px;
                                        line-height:20px;
                                    "
                                >
                                    ${escapeHtml(
                                        report.outlook.description
                                    )}
                                </div>

                            </div>

                        </td>

                    </tr>


                    <tr>

                        <td
                            style="
                                padding:0 30px 22px 30px;
                            "
                        >

                            ${createHtmlSectionHeading(
                                "Primary Drivers"
                            )}

                            ${driverMarkup}

                        </td>

                    </tr>


                    <tr>

                        <td
                            style="
                                padding:0 30px 22px 30px;
                            "
                        >

                            ${createHtmlSectionHeading(
                                "Operational Triggers"
                            )}

                            ${triggerMarkup}

                        </td>

                    </tr>


                    <tr>

                        <td
                            style="
                                padding:0 30px 28px 30px;
                            "
                        >

                            ${createHtmlSectionHeading(
                                "Recommended Actions"
                            )}

                            ${recommendationMarkup}

                        </td>

                    </tr>


                    <tr>

                        <td
                            style="
                                padding:20px 30px;
                                background:#172033;
                                color:#dfe5ee;
                                font-size:11px;
                                line-height:17px;
                            "
                        >

                            The complete Executive Assessment Report is
                            attached as a PDF.

                            <br><br>

                            The Hospital Readiness Index is an operational
                            decision-support tool. Results should be interpreted
                            with clinical and administrative judgment and local
                            surge policies.

                        </td>

                    </tr>

                </table>

            </td>

        </tr>

    </table>

</body>

</html>`;

}


/**
 * Plain-text fallback.
 */
function createExecutiveSummaryText(

    report:ExecutiveReportPayload

):string {

    const lines:string[] = [

        "HOSPITAL READINESS INDEX",

        "Executive Assessment Report",

        "",

        `Assessment completed: ${formatDateTime(
            report.assessmentTimestamp
        )}`,

        "",

        `Operational Level: ${report.operationalLevel}`,

        `HRI Score: ${Math.round(
            report.hriScore
        )}`,

        `Trend: ${report.riskDirection}`,

        `Confidence: ${report.confidence}`,

        "",

        "Hospital Readiness Domains",

        `ED Operational Pressure: ${formatNumber(
            report.domains.edOperationalPressure
        )} / 100`,

        `Projected Acute-Care Capacity: ${formatNumber(
            report.domains.projectedAcuteCareCapacity
        )} / 100`,

        `Critical-Care Capacity: ${formatNumber(
            report.domains.criticalCareCapacity
        )} / 100`,

        "",

        "Current Capacity",

        `Total ED Volume: ${formatNumber(
            report.capacity.totalEDVolume
        )}`,

        `Boarding Patients: ${formatNumber(
            report.capacity.boardedPatients
        )}`,

        `Acute-Care Occupancy: ${formatNumber(
            report.capacity.acuteOccupancyPercent
        )}%`,

        `Critical-Care Occupancy: ${formatNumber(
            report.capacity.criticalOccupancyPercent
        )}%`,

        `Projected Available Acute-Care Beds: ${formatBedAvailability(
            report.capacity.projectedAvailableAcuteCareBeds
        )}`,

        "",

        "Four-Hour Capacity Outlook",

        report.outlook.heading,

        report.outlook.description,

        "",

        "Primary Drivers",

        ...createTextList(
            report.drivers,
            "No dominant Hospital Readiness drivers were identified."
        ),

        "",

        "Operational Triggers",

        ...createTextList(
            report.triggers,
            "No operational triggers are currently active."
        ),

        "",

        "Recommended Actions",

        ...createTextList(
            report.recommendations,
            "No operational intervention is currently recommended."
        ),

        "",

        "The complete Executive Assessment Report is attached as a PDF.",

        "",

        "The Hospital Readiness Index is an operational decision-support tool. Results should be interpreted with clinical and administrative judgment and local surge policies."

    ];


    return lines.join(
        "\n"
    );

}


function createHtmlSectionHeading(

    title:string

):string {

    return `

        <div
            style="
                margin-bottom:10px;
                color:#172033;
                font-size:15px;
                line-height:20px;
                font-weight:700;
            "
        >
            ${escapeHtml(title)}
        </div>

    `;

}


function createSummaryMetricTable(

    metrics:Array<{

        label:string;

        value:string;

    }>

):string {

    const rows:string[] = [];


    for(
        let index = 0;
        index < metrics.length;
        index += 2
    ){

        const first =
            metrics[index];


        const second =
            metrics[index + 1];


        rows.push(`

            <tr>

                ${createSummaryMetricCell(
                    first
                )}

                ${second
                    ? createSummaryMetricCell(
                        second
                    )
                    : `
                        <td
                            width="50%"
                            style="
                                width:50%;
                                padding:5px;
                            "
                        >
                        </td>
                    `
                }

            </tr>

        `);

    }


    return `

        <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
                width:100%;
                border-collapse:collapse;
            "
        >

            ${rows.join("")}

        </table>

    `;

}


function createSummaryMetricCell(

    metric:{

        label:string;

        value:string;

    }

):string {

    return `

        <td
            width="50%"
            valign="top"
            style="
                width:50%;
                padding:5px;
            "
        >

            <div
                style="
                    border:1px solid #d8dee8;
                    border-radius:7px;
                    padding:11px 12px;
                "
            >

                <div
                    style="
                        color:#5f6b7a;
                        font-size:10px;
                        line-height:14px;
                        font-weight:700;
                    "
                >
                    ${escapeHtml(
                        metric.label
                    )}
                </div>

                <div
                    style="
                        margin-top:4px;
                        color:#172033;
                        font-size:17px;
                        line-height:22px;
                        font-weight:700;
                    "
                >
                    ${escapeHtml(
                        metric.value
                    )}
                </div>

            </div>

        </td>

    `;

}


function createHtmlList(

    items:ExecutiveReportPayload["drivers"],

    emptyMessage:string

):string {

    if(items.length === 0){

        return `

            <div
                style="
                    color:#5f6b7a;
                    font-size:13px;
                    line-height:19px;
                "
            >
                ${escapeHtml(
                    emptyMessage
                )}
            </div>

        `;

    }


    return items

        .map(

            item => `

                <div
                    style="
                        padding:11px 0;
                        border-bottom:1px solid #e4e8ef;
                    "
                >

                    <div
                        style="
                            color:#172033;
                            font-size:13px;
                            line-height:18px;
                            font-weight:700;
                        "
                    >
                        ${escapeHtml(
                            item.title
                        )}
                    </div>

                    <div
                        style="
                            margin-top:3px;
                            color:#5f6b7a;
                            font-size:12px;
                            line-height:18px;
                        "
                    >
                        ${escapeHtml(
                            item.description
                        )}
                    </div>

                    <div
                        style="
                            margin-top:4px;
                            color:#5f6b7a;
                            font-size:10px;
                            line-height:14px;
                            font-weight:700;
                            text-transform:uppercase;
                        "
                    >
                        ${escapeHtml(
                            item.label
                        )}
                    </div>

                </div>

            `

        )

        .join("");

}


function createTextList(

    items:ExecutiveReportPayload["drivers"],

    emptyMessage:string

):string[] {

    if(items.length === 0){

        return [
            emptyMessage
        ];

    }


    return items.map(

        item =>

            `- ${item.title}: ${item.description} (${item.label})`

    );

}


function normalizeRecipients(

    recipients:ExecutiveReportRecipientSnapshot[]

):ExecutiveReportRecipientSnapshot[] {

    const seen =
        new Set<string>();


    const normalized:ExecutiveReportRecipientSnapshot[] = [];


    for(const recipient of recipients){

        const email =

            recipient.email
                .trim()
                .toLowerCase();


        if(
            !email
            ||
            seen.has(
                email
            )
        ){

            continue;

        }


        seen.add(
            email
        );


        normalized.push({

            displayName:
                recipient.displayName.trim(),

            email

        });

    }


    return normalized;

}


async function readBrevoResponse(

    response:Response

):Promise<BrevoSendResponse> {

    const text =
        await response.text();


    if(!text){

        return {};

    }


    try {

        return JSON.parse(
            text
        ) as BrevoSendResponse;

    }
    catch {

        return {

            message:
                text.slice(
                    0,
                    500
                )

        };

    }

}


function normalizeMessageIds(

    payload:BrevoSendResponse

):string[] {

    if(Array.isArray(payload.messageIds)){

        return payload.messageIds.filter(

            (
                value
            ):value is string =>

                typeof value === "string"

        );

    }


    if(typeof payload.messageId === "string"){

        return [
            payload.messageId
        ];

    }


    return [];

}


function createBrevoFailureMessage(

    status:number,

    payload:BrevoSendResponse

):string {

    const providerMessage =

        typeof payload.message === "string"

            ? payload.message.trim()

            : "";


    const providerCode =

        typeof payload.code === "string"

            ? payload.code.trim()

            : "";


    const detail = [

        providerCode,

        providerMessage

    ]
        .filter(
            Boolean
        )
        .join(
            ": "
        );


    if(detail){

        return `Executive Report email provider rejected the request (${status}): ${detail}`;

    }


    return `Executive Report email provider rejected the request with HTTP ${status}.`;

}


function createPdfFilename(

    report:ExecutiveReportPayload

):string {

    const date =
        new Date(
            report.assessmentTimestamp
        );


    const datePart =

        Number.isNaN(
            date.getTime()
        )

            ? "assessment"

            : [

                date.getFullYear(),

                String(
                    date.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                ),

                String(
                    date.getDate()
                ).padStart(
                    2,
                    "0"
                )

            ].join(
                "-"
            );


    return `Hospital_Readiness_Executive_Assessment_${datePart}.pdf`;

}


function formatDateTime(

    value:string

):string {

    const date =
        new Date(
            value
        );


    if(Number.isNaN(date.getTime())){

        return "Unavailable";

    }


    return date.toLocaleString(

        "en-US",

        {

            month:
                "short",

            day:
                "numeric",

            year:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit",

            timeZoneName:
                "short"

        }

    );

}


function formatNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(Number.isInteger(value)){

        return String(
            value
        );

    }


    return value
        .toFixed(
            1
        )
        .replace(
            /\.0$/,
            ""
        );

}


function formatSignedNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(value > 0){

        return `+${formatNumber(
            value
        )}`;

    }


    return formatNumber(
        value
    );

}


function formatBedAvailability(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(value < 0){

        return `${formatNumber(
            value
        )} beds (deficit)`;

    }


    if(value === 1){

        return "1 bed";

    }


    return `${formatNumber(
        value
    )} beds`;

}


function normalizeColor(

    value:string

):string {

    if(
        /^#[0-9a-f]{6}$/i.test(
            value
        )
    ){

        return value;

    }


    return "#172033";

}


function escapeHtml(

    value:string

):string {

    return value
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            "\"",
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(

    value:string

):string {

    return escapeHtml(
        value
    );

}


function getErrorMessage(

    error:unknown

):string {

    if(error instanceof Error){

        return error.message;

    }


    return String(
        error
    );

}