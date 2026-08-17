/**
 * SecurityAuditLog
 *
 * Read-only Administrator view of EDORI security and
 * account-management audit events.
 */

import {

    getSecurityAuditLog

}

from "../services/SecurityAuditService";


import type {

    SecurityAuditEventType,
    SecurityAuditRecord

}

from "../services/SecurityAuditService";


const EVENT_LABELS:
Record<SecurityAuditEventType,string> = {

    "authentication.login.success":
        "Login successful",

    "authentication.login.failed":
        "Login failed",

    "authentication.login.locked":
        "Account locked",

    "authentication.logout":
        "Logout",

    "authentication.password.changed":
        "Password changed",

    "authentication.password.reset":
        "Password reset",

    "user.created":
        "User created",

    "user.updated":
        "User updated",

    "user.role.changed":
        "Role changed",

    "user.status.changed":
        "Account status changed"

};


export function SecurityAuditLog():string {

    return `

        <section
            id="securityAuditLogPanel"
            class="security-audit-log-panel"
            aria-labelledby="securityAuditLogTitle"
        >

            <div class="security-audit-header">

                <div>

                    <span class="application-page-eyebrow">
                        Security
                    </span>

                    <h3 id="securityAuditLogTitle">
                        Security Audit Log
                    </h3>

                    <p>
                        Review authentication and account-management activity. Audit records are read-only.
                    </p>

                </div>


                <div class="security-audit-header-actions">

                    <button
                        id="copySecurityAuditButton"
                        class="button button-secondary"
                        type="button"
                    >
                        Copy Audit Log
                    </button>

                    <button
                        id="exportSecurityAuditCsvButton"
                        class="button button-secondary"
                        type="button"
                    >
                        Export CSV
                    </button>

                </div>

            </div>


            <div class="security-audit-filters">

                <label>

                    <span>
                        Event
                    </span>

                    <select id="securityAuditEventFilter">

                        <option value="">
                            All events
                        </option>

                        ${Object.entries(EVENT_LABELS)

                            .map(

                                ([value, label]) => `

                                    <option value="${escapeHtml(value)}">
                                        ${escapeHtml(label)}
                                    </option>

                                `

                            )

                            .join("")
                        }

                    </select>

                </label>


                <label>

                    <span>
                        Result
                    </span>

                    <select id="securityAuditResultFilter">

                        <option value="">
                            All results
                        </option>

                        <option value="success">
                            Successful
                        </option>

                        <option value="failure">
                            Failed / blocked
                        </option>

                    </select>

                </label>


                <div class="security-audit-count">

                    <span>
                        Showing
                    </span>

                    <strong id="securityAuditVisibleCount">
                        0
                    </strong>

                    <span>
                        events
                    </span>

                </div>

            </div>


            <div
                id="securityAuditMessage"
                class="security-audit-message"
                hidden
                aria-live="polite"
            >
            </div>


            <div
                id="securityAuditTableContainer"
                class="security-audit-table-container"
            >
            </div>

        </section>

    `;

}


export function initializeSecurityAuditLog():void {

    const eventFilter =

        document.getElementById(

            "securityAuditEventFilter"

        ) as HTMLSelectElement | null;


    const resultFilter =

        document.getElementById(

            "securityAuditResultFilter"

        ) as HTMLSelectElement | null;


    const copyButton =

        document.getElementById(

            "copySecurityAuditButton"

        ) as HTMLButtonElement | null;


    const exportButton =

        document.getElementById(

            "exportSecurityAuditCsvButton"

        ) as HTMLButtonElement | null;


    eventFilter?.addEventListener(
        "change",
        renderSecurityAuditLog
    );


    resultFilter?.addEventListener(
        "change",
        renderSecurityAuditLog
    );


    copyButton?.addEventListener(

        "click",

        () => {

            void copyVisibleAuditLog();

        }

    );


    exportButton?.addEventListener(

        "click",

        exportVisibleAuditCsv

    );


    renderSecurityAuditLog();

}


function renderSecurityAuditLog():void {

    const container =

        document.getElementById(

            "securityAuditTableContainer"

        );


    if(!container){

        return;

    }


    const records =
        getVisibleRecords();


    setText(

        "securityAuditVisibleCount",

        String(
            records.length
        )

    );


    if(records.length === 0){

        container.innerHTML = `

            <div class="security-audit-empty">

                <strong>
                    No audit events match the selected filters.
                </strong>

                <span>
                    Authentication and account-management activity will appear here.
                </span>

            </div>

        `;


        return;

    }


    container.innerHTML = `

        <table class="security-audit-table">

            <thead>

                <tr>

                    <th>
                        Date / Time
                    </th>

                    <th>
                        Event
                    </th>

                    <th>
                        Actor
                    </th>

                    <th>
                        Affected User
                    </th>

                    <th>
                        Result
                    </th>

                    <th>
                        Details
                    </th>

                </tr>

            </thead>


            <tbody>

                ${records

                    .map(
                        createAuditRow
                    )

                    .join("")
                }

            </tbody>

        </table>

    `;

}


function createAuditRow(

    record:SecurityAuditRecord

):string {

    return `

        <tr>

            <td class="security-audit-time">

                <strong>
                    ${escapeHtml(
                        formatDateTime(
                            record.timestamp
                        )
                    )}
                </strong>

            </td>


            <td>

                <span class="security-audit-event">

                    ${escapeHtml(
                        EVENT_LABELS[
                            record.eventType
                        ]
                    )}

                </span>

            </td>


            <td>

                ${createIdentityMarkup(

                    record.actorDisplayName,

                    record.actorUsername,

                    "System / unauthenticated"

                )}

            </td>


            <td>

                ${createIdentityMarkup(

                    record.targetDisplayName,

                    record.targetUsername,

                    "—"

                )}

            </td>


            <td>

                <span
                    class="
                        security-audit-result
                        ${
                            record.success
                                ? "security-audit-result-success"
                                : "security-audit-result-failure"
                        }
                    "
                >

                    ${record.success
                        ? "Successful"
                        : "Failed / blocked"
                    }

                </span>

            </td>


            <td class="security-audit-details">

                <strong>
                    ${escapeHtml(
                        record.summary
                    )}
                </strong>

                ${createDetailsMarkup(
                    record.details
                )}

            </td>

        </tr>

    `;

}


function createIdentityMarkup(

    displayName:string,

    username:string,

    fallback:string

):string {

    if(

        !displayName

        &&

        !username

    ){

        return `

            <span class="security-audit-muted">
                ${escapeHtml(fallback)}
            </span>

        `;

    }


    return `

        <div class="security-audit-identity">

            <strong>
                ${escapeHtml(
                    displayName
                    || username
                )}
            </strong>

            ${username
                ? `
                    <span>
                        @${escapeHtml(username)}
                    </span>
                `
                : ""
            }

        </div>

    `;

}


function createDetailsMarkup(

    details:Record<
        string,
        string | number | boolean | null
    >

):string {

    const entries =
        Object.entries(
            details
        );


    if(entries.length === 0){

        return "";

    }


    return `

        <div class="security-audit-detail-list">

            ${entries

                .map(

                    ([key, value]) => `

                        <span>

                            <b>
                                ${escapeHtml(
                                    formatDetailKey(key)
                                )}:
                            </b>

                            ${escapeHtml(
                                formatDetailValue(value)
                            )}

                        </span>

                    `

                )

                .join("")
            }

        </div>

    `;

}


function getVisibleRecords():SecurityAuditRecord[] {

    const eventFilter =

        document.getElementById(

            "securityAuditEventFilter"

        ) as HTMLSelectElement | null;


    const resultFilter =

        document.getElementById(

            "securityAuditResultFilter"

        ) as HTMLSelectElement | null;


    const eventValue =
        eventFilter?.value
        ?? "";


    const resultValue =
        resultFilter?.value
        ?? "";


    return getSecurityAuditLog()

        .filter(

            record => {

                if(

                    eventValue

                    &&

                    record.eventType
                    !==
                    eventValue

                ){

                    return false;

                }


                if(

                    resultValue === "success"

                    &&

                    !record.success

                ){

                    return false;

                }


                if(

                    resultValue === "failure"

                    &&

                    record.success

                ){

                    return false;

                }


                return true;

            }

        );

}


async function copyVisibleAuditLog():Promise<void> {

    const records =
        getVisibleRecords();


    const text =

        records

            .map(

                record => [

                    formatDateTime(
                        record.timestamp
                    ),

                    EVENT_LABELS[
                        record.eventType
                    ],

                    formatIdentityText(
                        record.actorDisplayName,
                        record.actorUsername,
                        "System / unauthenticated"
                    ),

                    formatIdentityText(
                        record.targetDisplayName,
                        record.targetUsername,
                        "—"
                    ),

                    record.success
                        ? "Successful"
                        : "Failed / blocked",

                    record.summary,

                    formatDetailsText(
                        record.details
                    )

                ].join("\t")

            )

            .join("\n");


    try {

        await navigator.clipboard.writeText(
            text
        );


        showMessage(
            `Copied ${records.length} audit event${records.length === 1 ? "" : "s"}.`,
            false
        );

    }
    catch(error){

        console.error(
            "EDORI could not copy the security audit log.",
            error
        );


        showMessage(
            "The audit log could not be copied.",
            true
        );

    }

}


function exportVisibleAuditCsv():void {

    const records =
        getVisibleRecords();


    const rows = [

        [
            "Timestamp",
            "Event",
            "Actor Display Name",
            "Actor Username",
            "Target Display Name",
            "Target Username",
            "Result",
            "Summary",
            "Details"
        ],

        ...records.map(

            record => [

                record.timestamp,

                EVENT_LABELS[
                    record.eventType
                ],

                record.actorDisplayName,

                record.actorUsername,

                record.targetDisplayName,

                record.targetUsername,

                record.success
                    ? "Successful"
                    : "Failed / blocked",

                record.summary,

                formatDetailsText(
                    record.details
                )

            ]

        )

    ];


    const csv =

        rows

            .map(

                row =>

                    row

                        .map(
                            escapeCsvValue
                        )

                        .join(",")

            )

            .join("\r\n");


    const blob =

        new Blob(

            [csv],

            {
                type:
                    "text/csv;charset=utf-8"
            }

        );


    const url =

        URL.createObjectURL(
            blob
        );


    const link =

        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =

        `edori-security-audit-${createFileTimestamp()}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    showMessage(
        `Exported ${records.length} audit event${records.length === 1 ? "" : "s"}.`,
        false
    );

}


function formatIdentityText(

    displayName:string,

    username:string,

    fallback:string

):string {

    if(

        displayName

        &&

        username

    ){

        return `${displayName} (@${username})`;

    }


    return displayName
        || username
        || fallback;

}


function formatDetailsText(

    details:Record<
        string,
        string | number | boolean | null
    >

):string {

    return Object.entries(
        details
    )

        .map(

            ([key, value]) =>

                `${formatDetailKey(key)}: ${formatDetailValue(value)}`

        )

        .join("; ");

}


function formatDetailKey(

    value:string

):string {

    return value

        .replace(
            /([a-z])([A-Z])/g,
            "$1 $2"
        )

        .replace(
            /[_-]+/g,
            " "
        )

        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


function formatDetailValue(

    value:string | number | boolean | null

):string {

    if(value === null){

        return "None";

    }


    if(typeof value === "boolean"){

        return value
            ? "Yes"
            : "No";

    }


    return String(
        value
    );

}


function formatDateTime(

    timestamp:string

):string {

    const date =
        new Date(
            timestamp
        );


    if(

        Number.isNaN(
            date.getTime()
        )

    ){

        return timestamp;

    }


    return date.toLocaleString();

}


function escapeCsvValue(

    value:string

):string {

    return `"${value.replaceAll("\"", "\"\"")}"`;

}


function createFileTimestamp():string {

    const now =
        new Date();


    const pad =

        (value:number) =>

            String(value)
                .padStart(2, "0");


    return [

        now.getFullYear(),

        pad(
            now.getMonth() + 1
        ),

        pad(
            now.getDate()
        ),

        "-",

        pad(
            now.getHours()
        ),

        pad(
            now.getMinutes()
        )

    ].join("");

}


function showMessage(

    message:string,

    error:boolean

):void {

    const element =

        document.getElementById(

            "securityAuditMessage"

        );


    if(!element){

        return;

    }


    element.hidden =
        false;


    element.className =

        error
            ? "security-audit-message security-audit-message-error"
            : "security-audit-message security-audit-message-success";


    element.textContent =
        message;

}


function setText(

    id:string,

    value:string

):void {

    const element =
        document.getElementById(
            id
        );


    if(element){

        element.textContent =
            value;

    }

}


function escapeHtml(

    value:string

):string {

    return value

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll("\"", "&quot;")

        .replaceAll("'", "&#039;");

}