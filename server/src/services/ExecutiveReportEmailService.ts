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

    const driverMarkup =
        createCompactEmailList(
            report.drivers,
            "No dominant Hospital Readiness drivers were identified."
        );

    const recommendationMarkup =
        createCompactEmailList(
            report.recommendations,
            "No operational intervention is currently recommended."
        );

    const domainCards = createEmailCardRow([
        {
            label:"ED Operational Pressure",
            value:`${formatNumber(report.domains.edOperationalPressure)} / 100`,
            detail:"45% weight"
        },
        {
            label:"Projected Acute-Care Capacity",
            value:`${formatNumber(report.domains.projectedAcuteCareCapacity)} / 100`,
            detail:"35% weight"
        },
        {
            label:"Critical-Care Capacity",
            value:`${formatNumber(report.domains.criticalCareCapacity)} / 100`,
            detail:"20% weight"
        }
    ]);

    const acuityCards = createEmailCardRow([
        {
            label:"ESI 1",
            value:formatNumber(report.acuity.esi1),
            detail:"Highest acuity"
        },
        {
            label:"ESI 2",
            value:formatNumber(report.acuity.esi2),
            detail:"High acuity"
        },
        {
            label:"ESI 3–5",
            value:formatNumber(report.acuity.esi3to5),
            detail:"Remaining census"
        },
        {
            label:"High Acuity",
            value:formatNumber(report.acuity.highAcuityCount),
            detail:`${formatNumber(report.acuity.highAcuityPercent)}% of ED census`
        }
    ]);

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
    >
    <title>Hospital Readiness Executive Assessment Report</title>
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
    style="width:100%;background:#f3f5f8;"
>
<tr>
<td align="center" style="padding:22px 10px;">

<table
    role="presentation"
    width="760"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
        width:100%;
        max-width:760px;
        background:#ffffff;
        border-collapse:separate;
        border-spacing:0;
        border:1px solid #d8dee8;
        border-radius:12px;
        overflow:hidden;
    "
>

<tr>
<td style="padding:22px 24px 14px 24px;">
    <div
        style="
            color:#5f6b7a;
            font-size:10px;
            line-height:14px;
            font-weight:700;
            letter-spacing:1.1px;
            text-transform:uppercase;
        "
    >
        Hospital Readiness Index
    </div>

    <div
        style="
            margin-top:4px;
            color:#172033;
            font-size:24px;
            line-height:29px;
            font-weight:700;
        "
    >
        Executive Assessment Report
    </div>

    <div
        style="
            margin-top:5px;
            color:#5f6b7a;
            font-size:12px;
            line-height:17px;
        "
    >
        Assessment ${escapeHtml(formatDateTime(report.assessmentTimestamp))}
    </div>
</td>
</tr>

<tr>
<td style="padding:0 24px 16px 24px;">
<table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
        width:100%;
        border-collapse:separate;
        border-spacing:0;
        background:#f4f6f9;
        border-left:6px solid ${escapeAttribute(normalizeColor(report.operationalColor))};
        border-radius:8px;
    "
>
<tr>
    ${createStatusCell("HRI Score", String(Math.round(report.hriScore)), true)}
    ${createStatusCell("Operational Level", report.operationalLevel)}
    ${createStatusCell("Trend", report.riskDirection)}
    ${createStatusCell("Confidence", report.confidence)}
    ${createStatusCell("Priority Actions", String(report.priorityActionCount))}
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:0 24px 16px 24px;">
    ${createCompactSectionHeading("Hospital Readiness Domains")}
    ${domainCards}
</td>
</tr>

<tr>
<td style="padding:0 24px 16px 24px;">
    ${createCompactSectionHeading("HRI Trend")}
    ${createHriTrendHtml(report)}
</td>
</tr>

<tr>
<td style="padding:0 24px 16px 24px;">
<table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="width:100%;border-collapse:collapse;"
>
<tr>
<td width="49%" valign="top" style="width:49%;padding:0 8px 0 0;">
    ${createCompactSectionHeading("Current Conditions")}
    ${createKeyValuePanel([
        ["ED Volume", `${formatNumber(report.capacity.totalEDVolume)} (${formatNumber(report.capacity.edCapacityPercent)}%)`],
        ["Boarding", `${formatNumber(report.capacity.boardedPatients)} (${formatNumber(report.capacity.boardingSharePercent)}%)`],
        ["Acute Beds", `${formatNumber(report.capacity.occupiedAcuteCareBeds)} / ${formatNumber(report.capacity.staffedAcuteCareBeds)}`],
        ["Critical Beds", `${formatNumber(report.capacity.occupiedCriticalCareBeds)} / ${formatNumber(report.capacity.staffedCriticalCareBeds)}`]
    ])}
</td>

<td width="2%" style="width:2%;font-size:1px;line-height:1px;">&nbsp;</td>

<td width="49%" valign="top" style="width:49%;padding:0 0 0 8px;">
    ${createCompactSectionHeading("Four-Hour Capacity Forecast")}
    ${createKeyValuePanel([
        ["Direct Admissions", formatNumber(report.capacity.knownDirectAdmissions4h)],
        ["Surgical / Procedural", formatNumber(report.capacity.knownSurgicalAdmissions4h)],
        ["Expected ED Admissions", formatNumber(report.capacity.expectedAdditionalEDAdmissions4h)],
        ["Expected Departures", formatNumber(report.capacity.expectedInpatientDepartures4h)],
        ["Projected Available", formatBedAvailability(projectedBeds)]
    ])}
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:0 24px 16px 24px;">
    ${createCompactSectionHeading("Clinical Acuity")}
    ${acuityCards}
</td>
</tr>

<tr>
<td style="padding:0 24px 16px 24px;">
<table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="width:100%;border-collapse:collapse;"
>
<tr>
<td width="49%" valign="top" style="width:49%;padding:0 8px 0 0;">
    ${createCompactSectionHeading("Primary Drivers")}
    ${driverMarkup}
</td>

<td width="2%" style="width:2%;font-size:1px;line-height:1px;">&nbsp;</td>

<td width="49%" valign="top" style="width:49%;padding:0 0 0 8px;">
    ${createCompactSectionHeading("Recommended Actions")}
    ${recommendationMarkup}
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:0 24px 20px 24px;">
    ${createCompactSectionHeading("Operational Outlook")}
    <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="
            width:100%;
            background:#f4f6f9;
            border:1px solid #d8dee8;
            border-radius:8px;
        "
    >
    <tr>
    <td style="padding:13px 15px;">
        <div
            style="
                color:#172033;
                font-size:14px;
                line-height:19px;
                font-weight:700;
            "
        >
            ${escapeHtml(report.outlook.heading)}
        </div>
        <div
            style="
                margin-top:4px;
                color:#5f6b7a;
                font-size:12px;
                line-height:18px;
            "
        >
            ${escapeHtml(report.outlook.description)}
        </div>
    </td>
    </tr>
    </table>
</td>
</tr>

<tr>
<td
    style="
        padding:16px 24px;
        background:#172033;
        color:#dfe5ee;
        font-size:10px;
        line-height:15px;
    "
>
    The complete Executive Assessment Report is attached as a PDF.
    <br><br>
    The Hospital Readiness Index is an operational decision-support tool.
    Results should be interpreted with clinical and administrative judgment
    and local surge policies.
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;

}


function createStatusCell(
    label:string,
    value:string,
    emphasized:boolean = false
):string {

    return `
        <td
            valign="top"
            align="center"
            style="
                padding:13px 7px;
                border-right:1px solid #d8dee8;
            "
        >
            <div
                style="
                    color:#5f6b7a;
                    font-size:9px;
                    line-height:12px;
                    font-weight:700;
                    text-transform:uppercase;
                "
            >
                ${escapeHtml(label)}
            </div>

            <div
                style="
                    margin-top:3px;
                    color:#172033;
                    font-size:${emphasized ? "24px" : "15px"};
                    line-height:${emphasized ? "27px" : "20px"};
                    font-weight:700;
                "
            >
                ${escapeHtml(value)}
            </div>
        </td>
    `;

}


function createCompactSectionHeading(
    title:string
):string {

    return `
        <div
            style="
                margin:0 0 7px 0;
                color:#172033;
                font-size:13px;
                line-height:17px;
                font-weight:700;
            "
        >
            ${escapeHtml(title)}
        </div>
    `;

}


function createEmailCardRow(
    cards:Array<{
        label:string;
        value:string;
        detail:string;
    }>
):string {

    if(cards.length === 0){
        return "";
    }

    const width =
        100 / cards.length;

    return `
        <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="width:100%;border-collapse:collapse;"
        >
        <tr>
            ${cards.map(
                card => `
                    <td
                        width="${width}%"
                        valign="top"
                        style="
                            width:${width}%;
                            padding:0 4px;
                        "
                    >
                        <div
                            style="
                                min-height:58px;
                                padding:9px 10px;
                                border:1px solid #d8dee8;
                                border-radius:7px;
                            "
                        >
                            <div
                                style="
                                    color:#5f6b7a;
                                    font-size:9px;
                                    line-height:12px;
                                    font-weight:700;
                                "
                            >
                                ${escapeHtml(card.label)}
                            </div>

                            <div
                                style="
                                    margin-top:3px;
                                    color:#172033;
                                    font-size:15px;
                                    line-height:19px;
                                    font-weight:700;
                                "
                            >
                                ${escapeHtml(card.value)}
                            </div>

                            <div
                                style="
                                    margin-top:2px;
                                    color:#5f6b7a;
                                    font-size:9px;
                                    line-height:12px;
                                "
                            >
                                ${escapeHtml(card.detail)}
                            </div>
                        </div>
                    </td>
                `
            ).join("")}
        </tr>
        </table>
    `;

}


function createKeyValuePanel(
    rows:Array<[string, string]>
):string {

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
                border:1px solid #d8dee8;
            "
        >
            ${rows.map(
                ([label, value], index) => `
                    <tr>
                        <td
                            valign="top"
                            style="
                                padding:7px 9px;
                                color:#5f6b7a;
                                font-size:10px;
                                line-height:14px;
                                ${index < rows.length - 1 ? "border-bottom:1px solid #e4e8ef;" : ""}
                            "
                        >
                            ${escapeHtml(label)}
                        </td>

                        <td
                            valign="top"
                            align="right"
                            style="
                                padding:7px 9px;
                                color:#172033;
                                font-size:11px;
                                line-height:14px;
                                font-weight:700;
                                white-space:nowrap;
                                ${index < rows.length - 1 ? "border-bottom:1px solid #e4e8ef;" : ""}
                            "
                        >
                            ${escapeHtml(value)}
                        </td>
                    </tr>
                `
            ).join("")}
        </table>
    `;

}


function createCompactEmailList(
    items:ExecutiveReportPayload["drivers"],
    emptyMessage:string
):string {

    if(items.length === 0){
        return `
            <div
                style="
                    color:#5f6b7a;
                    font-size:11px;
                    line-height:16px;
                "
            >
                ${escapeHtml(emptyMessage)}
            </div>
        `;
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
                border:1px solid #d8dee8;
            "
        >
            ${items.map(
                (item, index) => `
                    <tr>
                        <td
                            valign="top"
                            style="
                                padding:8px 9px;
                                ${index < items.length - 1 ? "border-bottom:1px solid #e4e8ef;" : ""}
                            "
                        >
                            <div
                                style="
                                    color:#172033;
                                    font-size:11px;
                                    line-height:15px;
                                    font-weight:700;
                                "
                            >
                                ${escapeHtml(item.title)}
                            </div>

                            <div
                                style="
                                    margin-top:2px;
                                    color:#5f6b7a;
                                    font-size:10px;
                                    line-height:14px;
                                "
                            >
                                ${escapeHtml(item.description)}
                            </div>
                        </td>

                        <td
                            width="76"
                            valign="top"
                            align="right"
                            style="
                                width:76px;
                                padding:8px 9px;
                                color:#5f6b7a;
                                font-size:9px;
                                line-height:13px;
                                font-weight:700;
                                text-transform:uppercase;
                                white-space:nowrap;
                                ${index < items.length - 1 ? "border-bottom:1px solid #e4e8ef;" : ""}
                            "
                        >
                            ${escapeHtml(item.label)}
                        </td>
                    </tr>
                `
            ).join("")}
        </table>
    `;

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

        "HRI Trend",

        ...createHriTrendText(
            report
        ),

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



function createHriTrendHtml(report:ExecutiveReportPayload):string {

    if(report.trend.length === 0){
        return `<div style="color:#5f6b7a;font-size:13px;line-height:19px;">
            No saved historical assessments are available.
        </div>`;
    }

    const recentPoints = report.trend.slice(-12);

    const cells = recentPoints.map(
        point => `
            <td valign="bottom" align="center"
                style="width:${100 / recentPoints.length}%;padding:4px 2px;">
                <div style="color:#172033;font-size:12px;line-height:16px;font-weight:700;">
                    ${Math.round(point.score)}
                </div>
                <div style="
                    height:${Math.max(6, Math.round(point.score * 0.55))}px;
                    margin:4px auto 5px auto;
                    width:8px;
                    background:${escapeAttribute(getTrendLevelColor(point.operationalLevel))};
                    border-radius:3px 3px 0 0;">
                </div>
                <div style="color:#5f6b7a;font-size:9px;line-height:12px;">
                    ${escapeHtml(formatTrendDate(point.timestamp))}
                </div>
            </td>`
    ).join("");

    const latest = recentPoints[recentPoints.length - 1];

    return `
        <div style="border:1px solid #d8dee8;border-radius:8px;padding:12px 12px 10px 12px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                border="0" style="width:100%;border-collapse:collapse;">
                <tr>${cells}</tr>
            </table>
            <div style="margin-top:8px;color:#5f6b7a;font-size:11px;line-height:16px;text-align:right;">
                Latest: HRI ${Math.round(latest.score)} · ${escapeHtml(latest.operationalLevel)}
            </div>
        </div>`;
}


function createHriTrendText(report:ExecutiveReportPayload):string[] {

    if(report.trend.length === 0){
        return ["No saved historical assessments are available."];
    }

    return report.trend.slice(-12).map(
        point =>
            `${formatTrendDateTime(point.timestamp)}: HRI ${Math.round(point.score)} (${point.operationalLevel})`
    );
}


function getTrendLevelColor(level:string):string {

    switch(level){
        case "Echo": return "#8f1d2c";
        case "Delta": return "#c65d1e";
        case "Charlie": return "#b88900";
        case "Bravo": return "#1565c0";
        default: return "#2e7d32";
    }
}


function formatTrendDate(value:string):string {

    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return "--";

    return date.toLocaleDateString(
        "en-US",
        { month:"numeric", day:"numeric" }
    );
}


function formatTrendDateTime(value:string):string {

    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return value;

    return date.toLocaleString(
        "en-US",
        {
            month:"short",
            day:"numeric",
            hour:"numeric",
            minute:"2-digit",
            timeZoneName:"short"
        }
    );
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