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

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hospital Readiness Executive Assessment Report</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f6;font-family:Arial,Helvetica,sans-serif;color:#172033;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#eef2f6" style="width:100%;background-color:#eef2f6;">
<tr>
<td align="center" style="padding:18px 8px;">

<table role="presentation" width="760" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff"
    style="width:760px;max-width:760px;background-color:#ffffff;border:1px solid #d8dee8;border-collapse:separate;">
<tr>
<td style="padding:22px 24px 12px 24px;">
    <div style="color:#5f6b7a;font-size:10px;line-height:14px;font-weight:bold;letter-spacing:1px;">
        HOSPITAL READINESS INDEX
    </div>
    <div style="padding-top:3px;color:#172033;font-size:24px;line-height:29px;font-weight:bold;">
        Executive Assessment Report
    </div>
    <div style="padding-top:5px;color:#5f6b7a;font-size:12px;line-height:17px;">
        Assessment ${escapeHtml(formatDateTime(report.assessmentTimestamp))}
    </div>
</td>
</tr>

<tr>
<td style="padding:0 24px 15px 24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc"
    style="width:100%;background-color:#f8fafc;border:1px solid #d8dee8;border-collapse:collapse;">
<tr>
<td width="37%" valign="middle" style="width:37%;padding:16px;">
    <div style="color:#172033;font-size:15px;line-height:20px;font-weight:bold;">Overall Hospital Readiness</div>
    <div style="padding-top:5px;color:#5f6b7a;font-size:11px;line-height:16px;">
        Current Hospital Readiness Index and surge status.
    </div>
</td>
<td width="34%" valign="middle" align="center" style="width:34%;padding:12px 8px;">
    ${createHriGaugeHtml(report)}
</td>
<td width="29%" valign="middle" align="center" style="width:29%;padding:12px 14px;">
    ${createSurgeStatusHtml(report)}
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:0 24px 15px 24px;">
    ${createCompactSectionHeading("Hospital Readiness Domains")}
    ${domainCards}
</td>
</tr>

<tr>
<td style="padding:0 24px 15px 24px;">
    ${createCompactSectionHeading("HRI Trend")}
    ${createHriTrendHtml(report)}
</td>
</tr>

<tr>
<td style="padding:0 24px 15px 24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
<tr>
<td width="49%" valign="top" style="width:49%;padding:0 7px 0 0;">
    ${createCompactSectionHeading("Current Conditions")}
    ${createKeyValuePanel([
        ["ED Volume", `${formatNumber(report.capacity.totalEDVolume)} (${formatNumber(report.capacity.edCapacityPercent)}%)`],
        ["ED High Acuity", `${formatNumber(report.acuity.highAcuityCount)} (${formatNumber(report.acuity.highAcuityPercent)}%)`],
        ["Boarding", `${formatNumber(report.capacity.boardedPatients)} (${formatNumber(report.capacity.boardingSharePercent)}%)`],
        ["Acute Beds (Occupied / Staffed)", `${formatNumber(report.capacity.occupiedAcuteCareBeds)} / ${formatNumber(report.capacity.staffedAcuteCareBeds)}`],
        ["Critical Beds (Occupied / Staffed)", `${formatNumber(report.capacity.occupiedCriticalCareBeds)} / ${formatNumber(report.capacity.staffedCriticalCareBeds)}`]
    ])}
</td>
<td width="2%" style="width:2%;font-size:1px;line-height:1px;">&nbsp;</td>
<td width="49%" valign="top" style="width:49%;padding:0 0 0 7px;">
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
<td style="padding:0 24px 15px 24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
<tr>
<td width="49%" valign="top" style="width:49%;padding:0 7px 0 0;">
    ${createCompactSectionHeading("Primary Drivers")}
    ${driverMarkup}
</td>
<td width="2%" style="width:2%;font-size:1px;line-height:1px;">&nbsp;</td>
<td width="49%" valign="top" style="width:49%;padding:0 0 0 7px;">
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
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f6f9"
        style="width:100%;background-color:#f4f6f9;border:1px solid #d8dee8;border-collapse:collapse;">
    <tr>
    <td style="padding:13px 15px;">
        <div style="color:#172033;font-size:14px;line-height:19px;font-weight:bold;">
            ${escapeHtml(report.outlook.heading)}
        </div>
        <div style="padding-top:4px;color:#5f6b7a;font-size:12px;line-height:18px;">
            ${escapeHtml(report.outlook.description)}
        </div>
    </td>
    </tr>
    </table>
</td>
</tr>

<tr>
<td bgcolor="#172033" style="padding:15px 24px;background-color:#172033;color:#dfe5ee;font-size:10px;line-height:15px;">
    The complete Executive Assessment Report is attached as a PDF.
    <br><br>
    The Hospital Readiness Index is an operational decision-support tool.
    Results should be interpreted with clinical and administrative judgment and local surge policies.
</td>
</tr>
</table>

</td>
</tr>
</table>
</body>
</html>`;

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



function createHriGaugeHtml(report:ExecutiveReportPayload):string {

    const score = Math.max(0, Math.min(100, Math.round(report.hriScore)));
    const pointer = Math.max(2, Math.min(98, score));

    /*
     * Deliberately built from ordinary HTML tables instead of SVG/data-URI
     * images. Outlook and several enterprise email clients block embedded
     * SVG/data images, while this renders reliably without downloading an
     * external image.
     */
    return `
        <table role="presentation" width="190" cellspacing="0" cellpadding="0" border="0"
            style="width:190px;border-collapse:collapse;">
            <tr>
                <td align="center" style="color:#172033;font-size:27px;line-height:29px;font-weight:700;">${score}</td>
            </tr>
            <tr>
                <td align="center" style="padding:0 0 5px 0;color:#5f6b7a;font-size:9px;line-height:12px;font-weight:700;">HRI</td>
            </tr>
            <tr>
                <td style="padding:0 0 2px 0;">
                    <div style="position:relative;width:190px;height:8px;font-size:1px;line-height:1px;">
                        <table role="presentation" width="190" cellspacing="0" cellpadding="0" border="0" style="width:190px;border-collapse:collapse;">
                            <tr>
                                <td width="38" height="8" bgcolor="#2E7D32" style="width:38px;height:8px;background:#2E7D32;">&nbsp;</td>
                                <td width="38" height="8" bgcolor="#F9C74F" style="width:38px;height:8px;background:#F9C74F;">&nbsp;</td>
                                <td width="38" height="8" bgcolor="#F28C28" style="width:38px;height:8px;background:#F28C28;">&nbsp;</td>
                                <td width="38" height="8" bgcolor="#D64545" style="width:38px;height:8px;background:#D64545;">&nbsp;</td>
                                <td width="38" height="8" bgcolor="#111111" style="width:38px;height:8px;background:#111111;">&nbsp;</td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="padding:0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td width="${pointer}%" style="width:${pointer}%;font-size:1px;line-height:1px;">&nbsp;</td>
                            <td width="1" align="center" style="width:1px;color:#172033;font-size:12px;line-height:10px;">▲</td>
                            <td style="font-size:1px;line-height:1px;">&nbsp;</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td align="left" style="color:#5f6b7a;font-size:8px;line-height:10px;">0</td>
                            <td align="right" style="color:#5f6b7a;font-size:8px;line-height:10px;">100</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>`;
}


function createSurgeStatusHtml(report:ExecutiveReportPayload):string {

    const level = escapeHtml(report.operationalLevel);
    const color = escapeAttribute(getSurgeStatusColor(report.operationalLevel));

    return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
            style="width:100%;border-collapse:separate;border-spacing:0;border:2px solid ${color};border-radius:7px;background:#ffffff;">
            <tr>
                <td align="center" style="padding:7px 8px 2px 8px;color:#5f6b7a;font-size:9px;line-height:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">
                    Current Surge Status
                </td>
            </tr>
            <tr>
                <td align="center" style="padding:0 8px 8px 8px;color:${color};font-size:23px;line-height:27px;font-weight:700;">
                    ${level}
                </td>
            </tr>
        </table>`;
}


function getSurgeStatusColor(level:string):string {
    switch(level.trim().toLowerCase()){
        case "echo": return "#111111";
        case "delta": return "#D64545";
        case "charlie": return "#F28C28";
        case "bravo": return "#C69A00";
        default: return "#2E7D32";
    }
}


function createHriTrendHtml(report:ExecutiveReportPayload):string {

    if(report.trend.length === 0){
        return `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                style="width:100%;border:1px solid #d8dee8;border-collapse:collapse;background-color:#ffffff;">
            <tr>
            <td style="padding:14px;color:#5f6b7a;font-size:11px;line-height:16px;">
                No saved historical assessments are available.
            </td>
            </tr>
            </table>
        `;
    }

    const recentPoints = report.trend.slice(-12);

    const pointCells = recentPoints.map(point => {

        const score =
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round(point.score)
                )
            );

        const timestamp =
            formatTrendEmailTimestamp(
                point.timestamp
            );

        const color =
            getSurgeStatusColor(
                point.operationalLevel
            );

        return `
            <td
                width="${100 / recentPoints.length}%"
                valign="bottom"
                align="center"
                style="
                    width:${100 / recentPoints.length}%;
                    padding:0 2px;
                "
            >
                <div
                    style="
                        color:#172033;
                        font-size:10px;
                        line-height:13px;
                        font-weight:bold;
                    "
                >
                    ${score}
                </div>

                <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                        width:100%;
                        border-collapse:collapse;
                        margin-top:4px;
                    "
                >
                <tr>
                <td
                    height="6"
                    bgcolor="${escapeAttribute(color)}"
                    style="
                        height:6px;
                        background-color:${escapeAttribute(color)};
                        font-size:1px;
                        line-height:1px;
                    "
                >
                    &nbsp;
                </td>
                </tr>
                </table>

                <div
                    style="
                        padding-top:5px;
                        color:#5f6b7a;
                        font-size:7px;
                        line-height:9px;
                        white-space:nowrap;
                    "
                >
                    ${escapeHtml(timestamp.date)}
                    <br>
                    ${escapeHtml(timestamp.time)}
                </div>
            </td>
        `;

    }).join("");

    return `
        <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            bgcolor="#ffffff"
            style="
                width:100%;
                background-color:#ffffff;
                border:1px solid #d8dee8;
                border-collapse:collapse;
            "
        >
        <tr>
        <td style="padding:12px 10px 10px 10px;">

            <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                    width:100%;
                    border-collapse:collapse;
                    table-layout:fixed;
                "
            >
            <tr>
                ${pointCells}
            </tr>
            </table>


        </td>
        </tr>
        </table>
    `;

}


function formatTrendEmailTimestamp(value:string):{date:string;time:string} {

    const date = new Date(value);

    if(Number.isNaN(date.getTime())){
        return {date:"--", time:"--"};
    }

    return {
        date:date.toLocaleDateString(
            "en-US",
            {month:"numeric", day:"numeric"}
        ),
        time:date.toLocaleTimeString(
            "en-US",
            {hour:"numeric", minute:"2-digit"}
        )
    };

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