/**
 * ExecutiveReportDistribution
 *
 * Administrator interface for:
 *
 * - Executive Assessment Report recipients
 * - Daily transactional-email usage
 * - Distribution history
 *
 * Actual report sending is handled separately from
 * this configuration interface.
 */

import {

    createExecutiveReportRecipient,
    loadExecutiveReportDailyUsage,
    loadExecutiveReportDistributionHistory,
    loadExecutiveReportRecipients,
    updateExecutiveReportRecipient

}

from "../services/ExecutiveReportDistributionApiService";


import type {

    ExecutiveReportDailyUsage,
    ExecutiveReportDistribution as DistributionRecord,
    ExecutiveReportRecipient

}

from "../services/ExecutiveReportDistributionApiService";


let recipients:ExecutiveReportRecipient[] = [];

let distributions:DistributionRecord[] = [];

let dailyUsage:ExecutiveReportDailyUsage = {

    dailyLimit:
        300,

    used:
        0,

    remaining:
        300

};


let editingRecipientId:string | null = null;

let initialized = false;


/**
 * Render the Administration interface.
 */
export function ExecutiveReportDistribution():string {

    return `

        <section
            id="executiveReportDistribution"
            class="executive-report-distribution"
        >

            <div class="executive-report-distribution-header">

                <div>

                    <span class="application-page-eyebrow">
                        Administration
                    </span>

                    <h2>
                        Executive Report Distribution
                    </h2>

                    <p>
                        Manage recipients for the Executive Assessment Report and review email distribution activity.
                    </p>

                </div>


                <div class="executive-report-distribution-header-actions">

                    <button
                        id="addExecutiveReportRecipientButton"
                        class="button button-primary"
                        type="button"
                    >
                        + Add Recipient
                    </button>

                </div>

            </div>


            <div
                id="executiveReportDistributionMessage"
                class="executive-report-distribution-message"
                aria-live="polite"
            ></div>


            <div class="executive-report-distribution-summary">

                <article class="executive-report-distribution-summary-card">

                    <span>
                        Enabled Recipients
                    </span>

                    <strong id="executiveReportEnabledRecipientCount">
                        --
                    </strong>

                    <small id="executiveReportRecipientSummary">
                        Loading recipients...
                    </small>

                </article>


                <article class="executive-report-distribution-summary-card">

                    <span>
                        Daily Email Usage
                    </span>

                    <strong id="executiveReportDailyUsageValue">
                        -- / --
                    </strong>

                    <small id="executiveReportDailyUsageRemaining">
                        Loading usage...
                    </small>

                </article>


                <article class="executive-report-distribution-summary-card">

                    <span>
                        Reports Distributed
                    </span>

                    <strong id="executiveReportDistributionCount">
                        --
                    </strong>

                    <small>
                        Recent distribution history
                    </small>

                </article>

            </div>


            <div class="executive-report-distribution-workspace">

                <section class="executive-report-distribution-section">

                    <div class="executive-report-distribution-section-heading">

                        <div>

                            <h3>
                                Recipients
                            </h3>

                            <p>
                                Enabled recipients will receive future Executive Assessment Report distributions.
                            </p>

                        </div>

                    </div>


                    <div
                        id="executiveReportRecipientTableContainer"
                        class="executive-report-recipient-table-container"
                    >

                        <div class="executive-report-distribution-empty">
                            Loading recipients...
                        </div>

                    </div>

                </section>


                <section class="executive-report-distribution-section">

                    <div class="executive-report-distribution-section-heading">

                        <div>

                            <h3>
                                Distribution History
                            </h3>

                            <p>
                                Recent Executive Assessment Report email activity.
                            </p>

                        </div>

                    </div>


                    <div
                        id="executiveReportDistributionHistoryContainer"
                        class="executive-report-distribution-history-container"
                    >

                        <div class="executive-report-distribution-empty">
                            Loading distribution history...
                        </div>

                    </div>

                </section>

            </div>


            ${createRecipientEditorModal()}

        </section>

    `;

}


/**
 * Initialize Administration behavior.
 */
export function initializeExecutiveReportDistribution():void {

    if(initialized){

        void refreshExecutiveReportDistribution();

        return;

    }


    initialized =
        true;


    document
        .getElementById(
            "addExecutiveReportRecipientButton"
        )
        ?.addEventListener(
            "click",
            openCreateRecipientEditor
        );


    document
        .getElementById(
            "executiveReportRecipientCancelButton"
        )
        ?.addEventListener(
            "click",
            closeRecipientEditor
        );


    document
        .getElementById(
            "executiveReportRecipientSaveButton"
        )
        ?.addEventListener(

            "click",

            () => {

                void saveRecipientEditor();

            }

        );


    void refreshExecutiveReportDistribution();

}


/**
 * Refresh all Administration data.
 */
async function refreshExecutiveReportDistribution():

Promise<void> {

    try {

        const [

            loadedRecipients,

            loadedDistributions,

            loadedUsage

        ] =

            await Promise.all([

                loadExecutiveReportRecipients(),

                loadExecutiveReportDistributionHistory(
                    50
                ),

                loadExecutiveReportDailyUsage()

            ]);


        recipients =
            loadedRecipients;


        distributions =
            loadedDistributions;


        dailyUsage =
            loadedUsage;


        renderRecipients();

        renderDistributionHistory();

        renderSummary();

    }
    catch(error){

        showPageMessage(

            getErrorMessage(

                error,

                "Hospital Readiness could not load Executive Report distribution settings."

            ),

            true

        );

    }

}


/**
 * Render summary cards.
 */
function renderSummary():void {

    const enabledCount =

        recipients.filter(
            recipient =>
                recipient.enabled
        ).length;


    const disabledCount =

        recipients.length
        -
        enabledCount;


    setText(

        "executiveReportEnabledRecipientCount",

        String(
            enabledCount
        )

    );


    setText(

        "executiveReportRecipientSummary",

        `${recipients.length} configured · ${disabledCount} disabled`

    );


    setText(

        "executiveReportDailyUsageValue",

        `${dailyUsage.used} / ${dailyUsage.dailyLimit}`

    );


    setText(

        "executiveReportDailyUsageRemaining",

        `${dailyUsage.remaining} recipient deliver${dailyUsage.remaining === 1 ? "y" : "ies"} remaining today`

    );


    setText(

        "executiveReportDistributionCount",

        String(
            distributions.length
        )

    );

}


/**
 * Render recipient table.
 */
function renderRecipients():void {

    const container =

        document.getElementById(
            "executiveReportRecipientTableContainer"
        );


    if(!container){

        return;

    }


    if(recipients.length === 0){

        container.innerHTML = `

            <div class="executive-report-distribution-empty">

                <strong>
                    No recipients configured
                </strong>

                <p>
                    Add a recipient to begin building the Executive Assessment Report distribution list.
                </p>

            </div>

        `;


        return;

    }


    container.innerHTML = `

        <table class="executive-report-recipient-table">

            <thead>

                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                </tr>

            </thead>

            <tbody>

                ${recipients

                    .map(
                        createRecipientRow
                    )

                    .join("")
                }

            </tbody>

        </table>

    `;


    container
        .querySelectorAll<HTMLButtonElement>(
            "[data-edit-executive-report-recipient]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        openEditRecipientEditor(

                            button.dataset
                                .editExecutiveReportRecipient

                            ?? ""

                        );

                    }

                );

            }

        );

}


/**
 * Render one recipient.
 */
function createRecipientRow(

    recipient:ExecutiveReportRecipient

):string {

    return `

        <tr>

            <td>

                <strong>
                    ${escapeHtml(
                        recipient.displayName
                    )}
                </strong>

            </td>

            <td>
                ${escapeHtml(
                    recipient.email
                )}
            </td>

            <td>

                <span class="
                    executive-report-recipient-status
                    ${
                        recipient.enabled
                            ? "executive-report-recipient-status-enabled"
                            : "executive-report-recipient-status-disabled"
                    }
                ">

                    ${
                        recipient.enabled
                            ? "Enabled"
                            : "Disabled"
                    }

                </span>

            </td>

            <td>
                ${escapeHtml(
                    formatDateTime(
                        recipient.updatedAt
                    )
                )}
            </td>

            <td>

                <button
                    type="button"
                    class="button button-secondary"
                    data-edit-executive-report-recipient="${escapeAttribute(
                        recipient.id
                    )}"
                >
                    Edit
                </button>

            </td>

        </tr>

    `;

}


/**
 * Render distribution history.
 */
function renderDistributionHistory():void {

    const container =

        document.getElementById(
            "executiveReportDistributionHistoryContainer"
        );


    if(!container){

        return;

    }


    if(distributions.length === 0){

        container.innerHTML = `

            <div class="executive-report-distribution-empty">

                <strong>
                    No reports distributed yet
                </strong>

                <p>
                    Executive Assessment Report distributions will appear here after the email-send feature is enabled.
                </p>

            </div>

        `;


        return;

    }


    container.innerHTML = `

        <table class="executive-report-distribution-history-table">

            <thead>

                <tr>
                    <th>Sent</th>
                    <th>Assessment</th>
                    <th>HRI</th>
                    <th>Recipients</th>
                    <th>Status</th>
                    <th>Initiated By</th>
                </tr>

            </thead>

            <tbody>

                ${distributions

                    .map(
                        createDistributionHistoryRow
                    )

                    .join("")
                }

            </tbody>

        </table>

    `;

}


/**
 * Render one distribution-history row.
 */
function createDistributionHistoryRow(

    distribution:DistributionRecord

):string {

    const statusLabel =

        formatDistributionStatus(
            distribution.status
        );


    return `

        <tr>

            <td>
                ${escapeHtml(
                    formatDateTime(
                        distribution.createdAt
                    )
                )}
            </td>

            <td>
                ${escapeHtml(
                    formatDateTime(
                        distribution.assessmentTimestamp
                    )
                )}
            </td>

            <td>

                <strong>
                    ${formatNumber(
                        distribution.hriScore
                    )}
                </strong>

                <span class="executive-report-distribution-level">
                    ${escapeHtml(
                        distribution.operationalLevel
                    )}
                </span>

            </td>

            <td>
                ${distribution.recipientCount}
            </td>

            <td>

                <span class="
                    executive-report-distribution-status
                    executive-report-distribution-status-${escapeAttribute(
                        distribution.status
                    )}
                ">
                    ${escapeHtml(
                        statusLabel
                    )}
                </span>

            </td>

            <td>
                ${escapeHtml(
                    distribution.initiatedByDisplayName
                )}
            </td>

        </tr>

    `;

}


/**
 * Open editor for a new recipient.
 */
function openCreateRecipientEditor():void {

    editingRecipientId =
        null;


    setText(

        "executiveReportRecipientEditorTitle",

        "Add Recipient"

    );


    setInput(

        "executiveReportRecipientNameInput",

        ""

    );


    setInput(

        "executiveReportRecipientEmailInput",

        ""

    );


    setCheckbox(

        "executiveReportRecipientEnabledInput",

        true

    );


    const enabledGroup =

        document.getElementById(
            "executiveReportRecipientEnabledGroup"
        );


    if(enabledGroup){

        enabledGroup.hidden =
            true;

    }


    showEditorMessage(
        "",
        false
    );


    showModal(
        "executiveReportRecipientEditorModal"
    );

}


/**
 * Open editor for an existing recipient.
 */
function openEditRecipientEditor(

    recipientId:string

):void {

    const recipient =

        recipients.find(

            candidate =>
                candidate.id === recipientId

        );


    if(!recipient){

        return;

    }


    editingRecipientId =
        recipient.id;


    setText(

        "executiveReportRecipientEditorTitle",

        "Edit Recipient"

    );


    setInput(

        "executiveReportRecipientNameInput",

        recipient.displayName

    );


    setInput(

        "executiveReportRecipientEmailInput",

        recipient.email

    );


    setCheckbox(

        "executiveReportRecipientEnabledInput",

        recipient.enabled

    );


    const enabledGroup =

        document.getElementById(
            "executiveReportRecipientEnabledGroup"
        );


    if(enabledGroup){

        enabledGroup.hidden =
            false;

    }


    showEditorMessage(
        "",
        false
    );


    showModal(
        "executiveReportRecipientEditorModal"
    );

}


/**
 * Save recipient editor.
 */
async function saveRecipientEditor():Promise<void> {

    const displayName =

        getInputValue(
            "executiveReportRecipientNameInput"
        );


    const email =

        getInputValue(
            "executiveReportRecipientEmailInput"
        );


    const enabled =

        getCheckboxValue(
            "executiveReportRecipientEnabledInput"
        );


    if(
        !displayName
        ||
        !email
    ){

        showEditorMessage(

            "Recipient name and email address are required.",

            true

        );


        return;

    }


    if(!isValidEmail(email)){

        showEditorMessage(

            "Enter a valid email address.",

            true

        );


        return;

    }


    setEditorSaving(
        true
    );


    try {

        if(editingRecipientId){

            await updateExecutiveReportRecipient(

                editingRecipientId,

                {
                    displayName,
                    email,
                    enabled
                }

            );


            showPageMessage(

                "Executive Report recipient updated successfully.",

                false

            );

        }
        else {

            await createExecutiveReportRecipient({

                displayName,
                email

            });


            showPageMessage(

                "Executive Report recipient added successfully.",

                false

            );

        }


        closeRecipientEditor();


        await refreshExecutiveReportDistribution();

    }
    catch(error){

        showEditorMessage(

            getErrorMessage(

                error,

                "Hospital Readiness could not save the Executive Report recipient."

            ),

            true

        );

    }
    finally {

        setEditorSaving(
            false
        );

    }

}


/**
 * Create recipient editor.
 */
function createRecipientEditorModal():string {

    return `

        <div
            id="executiveReportRecipientEditorModal"
            class="user-editor-modal"
            hidden
        >

            <div class="user-editor-dialog">

                <h3 id="executiveReportRecipientEditorTitle">
                    Add Recipient
                </h3>


                <div class="user-editor-grid">

                    <label class="user-editor-field">

                        <span>
                            Recipient Name
                        </span>

                        <input
                            id="executiveReportRecipientNameInput"
                            type="text"
                            autocomplete="name"
                        />

                    </label>


                    <label class="user-editor-field">

                        <span>
                            Email Address
                        </span>

                        <input
                            id="executiveReportRecipientEmailInput"
                            type="email"
                            autocomplete="email"
                        />

                    </label>


                    <label
                        id="executiveReportRecipientEnabledGroup"
                        class="user-editor-checkbox"
                    >

                        <input
                            id="executiveReportRecipientEnabledInput"
                            type="checkbox"
                            checked
                        />

                        <span>
                            Enabled recipient
                        </span>

                    </label>

                </div>


                <div
                    id="executiveReportRecipientEditorMessage"
                    class="user-management-message"
                    aria-live="polite"
                ></div>


                <div class="user-editor-actions">

                    <button
                        id="executiveReportRecipientCancelButton"
                        class="button button-secondary"
                        type="button"
                    >
                        Cancel
                    </button>

                    <button
                        id="executiveReportRecipientSaveButton"
                        class="button button-primary"
                        type="button"
                    >
                        Save Recipient
                    </button>

                </div>

            </div>

        </div>

    `;

}


/**
 * Close recipient editor.
 */
function closeRecipientEditor():void {

    editingRecipientId =
        null;


    hideModal(
        "executiveReportRecipientEditorModal"
    );

}


/**
 * Update editor saving state.
 */
function setEditorSaving(

    saving:boolean

):void {

    const button =

        document.getElementById(
            "executiveReportRecipientSaveButton"
        ) as HTMLButtonElement | null;


    if(!button){

        return;

    }


    button.disabled =
        saving;


    button.textContent =
        saving
            ? "Saving..."
            : "Save Recipient";

}


/**
 * Display page-level message.
 */
function showPageMessage(

    message:string,

    error:boolean

):void {

    const element =

        document.getElementById(
            "executiveReportDistributionMessage"
        );


    if(!element){

        return;

    }


    element.textContent =
        message;


    element.classList.toggle(

        "executive-report-distribution-message-error",

        error

    );


    element.classList.toggle(

        "executive-report-distribution-message-success",

        !error
        &&
        Boolean(message)

    );

}


/**
 * Display editor message.
 */
function showEditorMessage(

    message:string,

    error:boolean

):void {

    const element =

        document.getElementById(
            "executiveReportRecipientEditorMessage"
        );


    if(!element){

        return;

    }


    element.textContent =
        message;


    element.classList.toggle(

        "user-management-message-error",

        error

    );

}


/**
 * Show modal.
 */
function showModal(

    id:string

):void {

    const modal =

        document.getElementById(
            id
        );


    if(modal){

        modal.hidden =
            false;

    }

}


/**
 * Hide modal.
 */
function hideModal(

    id:string

):void {

    const modal =

        document.getElementById(
            id
        );


    if(modal){

        modal.hidden =
            true;

    }

}


/**
 * Read text input.
 */
function getInputValue(

    id:string

):string {

    return (

        document.getElementById(
            id
        ) as HTMLInputElement | null

    )?.value.trim()
    ?? "";

}


/**
 * Read checkbox.
 */
function getCheckboxValue(

    id:string

):boolean {

    return (

        document.getElementById(
            id
        ) as HTMLInputElement | null

    )?.checked
    ?? false;

}


/**
 * Set input.
 */
function setInput(

    id:string,

    value:string

):void {

    const element =

        document.getElementById(
            id
        ) as HTMLInputElement | null;


    if(element){

        element.value =
            value;

    }

}


/**
 * Set checkbox.
 */
function setCheckbox(

    id:string,

    value:boolean

):void {

    const element =

        document.getElementById(
            id
        ) as HTMLInputElement | null;


    if(element){

        element.checked =
            value;

    }

}


/**
 * Set text.
 */
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


/**
 * Basic client-side email validation.
 */
function isValidEmail(

    value:string

):boolean {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        value.trim()
    );

}


/**
 * Format distribution status.
 */
function formatDistributionStatus(

    status:DistributionRecord["status"]

):string {

    switch(status){

        case "accepted":

            return "Sent";

        case "partial":

            return "Partially Sent";

        case "failed":

            return "Failed";

        case "sandbox":

            return "Sandbox";

        case "pending":

            return "Pending";

    }

}


/**
 * Format date/time.
 */
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

        [],

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
                "2-digit"
        }

    );

}


/**
 * Format number.
 */
function formatNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    return Number.isInteger(value)

        ? String(value)

        : value
            .toFixed(1)
            .replace(
                /\.0$/,
                ""
            );

}


/**
 * Return a useful error message.
 */
function getErrorMessage(

    error:unknown,

    fallback:string

):string {

    return error instanceof Error

        ? error.message

        : fallback;

}


/**
 * Escape HTML.
 */
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


/**
 * Escape HTML attributes.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(
        value
    );

}