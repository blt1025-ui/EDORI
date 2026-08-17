/**
 * ConfigurationBackupCenter
 *
 * Administrative interface for exporting, validating,
 * previewing, and restoring a complete hospital-specific
 * EDORI configuration backup.
 *
 * Includes:
 *
 * - Hospital Readiness calculation model
 * - Operational trigger configuration
 * - Hospital Surge Plan configuration
 *
 * Assessment history and historical baseline data are
 * intentionally managed elsewhere.
 */

import {

    exportConfigurationBackup,

    restoreConfigurationBackup,

    validateConfigurationBackupText

}

from "../services/ConfigurationBackupService";


import type {

    ConfigurationBackupPreview

}

from "../services/ConfigurationBackupService";


/**
 * Currently validated backup waiting for explicit
 * administrator confirmation.
 */
let pendingBackup:

    ConfigurationBackupPreview | null = null;


/**
 * Render the Configuration Backup & Restore interface.
 */
export function ConfigurationBackupCenter():string {

    return `

        <section
            class="configuration-backup-center"
            aria-label="Configuration backup and restore"
        >

            <div class="configuration-backup-introduction">

                <p>
                    Export or restore the hospital-specific EDORI calculation model,
                    operational triggers, and Hospital Surge Plan configuration.
                </p>

                <div class="configuration-backup-scope">

                    ${createScopeItem(
                        "Calculation Model",
                        "Hospital settings, domain weights, ED pressure weights, and operational levels"
                    )}

                    ${createScopeItem(
                        "Operational Triggers",
                        "Trigger thresholds, conditions, escalation settings, and intervention mappings"
                    )}

                    ${createScopeItem(
                        "Hospital Surge Plan",
                        "Configured operational interventions and recommendation content"
                    )}

                </div>

            </div>


            <div class="configuration-backup-actions">

                <div class="configuration-backup-action-card">

                    <span class="configuration-backup-action-eyebrow">
                        Export
                    </span>

                    <h4>
                        Download Configuration Backup
                    </h4>

                    <p>
                        Save the current hospital-specific EDORI configuration as a portable JSON backup.
                    </p>

                    <button
                        id="downloadConfigurationBackupButton"
                        class="
                            button
                            button-primary
                        "
                        type="button"
                    >
                        Download Configuration Backup
                    </button>

                </div>


                <div class="configuration-backup-action-card">

                    <span class="configuration-backup-action-eyebrow">
                        Restore
                    </span>

                    <h4>
                        Select Configuration Backup
                    </h4>

                    <p>
                        Select a previously exported EDORI configuration backup for validation and review.
                    </p>

                    <label
                        class="configuration-backup-file-label"
                        for="configurationBackupFileInput"
                    >
                        Choose Backup File
                    </label>

                    <input
                        id="configurationBackupFileInput"
                        class="configuration-backup-file-input"
                        type="file"
                        accept="
                            application/json,
                            .json
                        "
                    >

                </div>

            </div>


            <div
                id="configurationBackupMessage"
                class="configuration-backup-message"
                hidden
                aria-live="polite"
            ></div>


            <div
                id="configurationBackupPreview"
                class="configuration-backup-preview"
                hidden
            ></div>

        </section>

    `;

}


/**
 * Initialize component behavior.
 */
export function initializeConfigurationBackupCenter():void {

    const downloadButton =

        document.getElementById(
            "downloadConfigurationBackupButton"
        );


    const fileInput =

        document.getElementById(
            "configurationBackupFileInput"
        ) as HTMLInputElement | null;


    if(downloadButton){

        downloadButton.addEventListener(

            "click",

            downloadConfigurationBackup

        );

    }


    if(fileInput){

        fileInput.addEventListener(

            "change",

            () => {

                void handleConfigurationBackupFile(
                    fileInput
                );

            }

        );

    }

}


/**
 * Download current configuration.
 */
function downloadConfigurationBackup():void {

    try {

        const json =

            exportConfigurationBackup();


        const blob =

            new Blob(

                [
                    json
                ],

                {
                    type:
                        "application/json;charset=utf-8"
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

            createConfigurationBackupFilename();


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        showMessage(
            "Configuration backup downloaded successfully.",
            "success"
        );

    }

    catch(error){

        console.error(
            "Configuration backup could not be downloaded.",
            error
        );


        showMessage(
            "The configuration backup could not be downloaded.",
            "error"
        );

    }

}


/**
 * Read and validate selected backup.
 */
async function handleConfigurationBackupFile(

    input:HTMLInputElement

):Promise<void> {

    clearPreview();


    const file =

        input.files?.[0];


    if(!file){

        return;

    }


    if(

        !file.name
            .toLowerCase()
            .endsWith(
                ".json"
            )

    ){

        showMessage(
            "Please select a JSON configuration backup.",
            "error"
        );

        input.value = "";

        return;

    }


    try {

        const text =

            await file.text();


        const result =

            validateConfigurationBackupText(
                text,
                file.name
            );


        if(!result.valid){

            showMessage(
                createValidationErrorMessage(
                    result.errors
                ),
                "error"
            );

            input.value = "";

            return;

        }


        pendingBackup =
            result.preview;


        showMessage(
            "Configuration backup validated. Review the backup below before restoring.",
            "success"
        );


        renderPreview(
            result.preview
        );

    }

    catch(error){

        console.error(
            "Configuration backup file could not be read.",
            error
        );


        showMessage(
            "The selected configuration backup could not be read.",
            "error"
        );


        input.value = "";

    }

}


/**
 * Render validated backup preview.
 */
function renderPreview(

    preview:ConfigurationBackupPreview

):void {

    const container =

        document.getElementById(
            "configurationBackupPreview"
        );


    if(!container){

        return;

    }


    container.innerHTML = `

        <div class="configuration-backup-preview-header">

            <div>

                <span class="configuration-backup-action-eyebrow">
                    Validated Backup
                </span>

                <h4>
                    Configuration Restore Preview
                </h4>

                <p>
                    Review the selected backup before replacing the current EDORI configuration.
                </p>

            </div>

        </div>


        <div class="configuration-backup-preview-metadata">

            ${createPreviewMetric(
                "Backup File",
                preview.filename
            )}

            ${createPreviewMetric(
                "Exported",
                formatDateTime(
                    preview.exportedAt
                )
            )}

            ${createPreviewMetric(
                "Calculation Model",
                createCustomizationLabel(
                    preview.modelCustomized
                )
            )}

            ${createPreviewMetric(
                "Operational Triggers",
                createCustomizationLabel(
                    preview.triggersCustomized
                )
            )}

            ${createPreviewMetric(
                "Hospital Surge Plan",
                createCustomizationLabel(
                    preview.surgePlanCustomized
                )
            )}

            ${createPreviewMetric(
                "Enabled Triggers",
                `${preview.enabledTriggerCount} of ${preview.totalTriggerCount}`
            )}

            ${createPreviewMetric(
                "Enabled Interventions",
                `${preview.enabledInterventionCount} of ${preview.totalInterventionCount}`
            )}

        </div>


        <div class="configuration-backup-warning">

            <strong>
                Configuration restore will replace the current hospital-specific configuration.
            </strong>

            <p>
                Restoring the calculation model may invalidate the current HRI result.
                A new assessment calculation may be required after restore.
            </p>

        </div>


        <div class="configuration-backup-preview-actions">

            <button
                id="restoreConfigurationBackupButton"
                class="
                    button
                    button-danger
                "
                type="button"
            >
                Restore Configuration
            </button>


            <button
                id="cancelConfigurationBackupButton"
                class="
                    button
                    button-secondary
                "
                type="button"
            >
                Cancel
            </button>

        </div>

    `;


    container.hidden =
        false;


    const restoreButton =

        document.getElementById(
            "restoreConfigurationBackupButton"
        );


    const cancelButton =

        document.getElementById(
            "cancelConfigurationBackupButton"
        );


    restoreButton?.addEventListener(

        "click",

        restorePendingConfigurationBackup

    );


    cancelButton?.addEventListener(

        "click",

        cancelConfigurationBackupRestore

    );

}


/**
 * Restore the validated pending backup.
 */
function restorePendingConfigurationBackup():void {

    if(!pendingBackup){

        showMessage(
            "No validated configuration backup is ready to restore.",
            "error"
        );

        return;

    }


    const confirmed =

        window.confirm(

            [
                "Restore this EDORI configuration backup?",
                "",
                "This will replace the current:",
                "",
                "• Hospital Readiness calculation model",
                "• Operational trigger configuration",
                "• Hospital Surge Plan configuration",
                "",
                "The current HRI result may be invalidated and require recalculation.",
                "",
                "Assessment history and historical baseline data will not be changed."
            ].join(
                "\n"
            )

        );


    if(!confirmed){

        return;

    }


    const result =

        restoreConfigurationBackup(
            pendingBackup.document
        );


    if(!result.valid){

        showMessage(
            createValidationErrorMessage(
                result.errors
            ),
            "error"
        );

        return;

    }


    clearPreview();


    resetFileInput();


    showMessage(
        "EDORI configuration restored successfully. Recalculate the current assessment before relying on the displayed HRI result.",
        "success"
    );

}


/**
 * Cancel pending restore.
 */
function cancelConfigurationBackupRestore():void {

    clearPreview();

    resetFileInput();

    hideMessage();

}


/**
 * Clear validated preview.
 */
function clearPreview():void {

    pendingBackup =
        null;


    const container =

        document.getElementById(
            "configurationBackupPreview"
        );


    if(!container){

        return;

    }


    container.innerHTML =
        "";


    container.hidden =
        true;

}


/**
 * Reset file selection.
 */
function resetFileInput():void {

    const input =

        document.getElementById(
            "configurationBackupFileInput"
        ) as HTMLInputElement | null;


    if(input){

        input.value =
            "";

    }

}


/**
 * Show status message.
 */
function showMessage(

    message:string,

    type:
        | "success"
        | "error"

):void {

    const container =

        document.getElementById(
            "configurationBackupMessage"
        );


    if(!container){

        return;

    }


    container.textContent =
        message;


    container.className =

        [
            "configuration-backup-message",
            `configuration-backup-message-${type}`
        ].join(
            " "
        );


    container.hidden =
        false;

}


/**
 * Hide status message.
 */
function hideMessage():void {

    const container =

        document.getElementById(
            "configurationBackupMessage"
        );


    if(!container){

        return;

    }


    container.textContent =
        "";


    container.hidden =
        true;

}


/**
 * Render one scope item.
 */
function createScopeItem(

    title:string,

    description:string

):string {

    return `

        <div class="configuration-backup-scope-item">

            <strong>
                ${escapeHtml(
                    title
                )}
            </strong>

            <span>
                ${escapeHtml(
                    description
                )}
            </span>

        </div>

    `;

}


/**
 * Render one preview metric.
 */
function createPreviewMetric(

    label:string,

    value:string

):string {

    return `

        <div class="configuration-backup-preview-metric">

            <span>
                ${escapeHtml(
                    label
                )}
            </span>

            <strong>
                ${escapeHtml(
                    value
                )}
            </strong>

        </div>

    `;

}


/**
 * Describe whether source layer was customized.
 */
function createCustomizationLabel(

    customized:boolean

):string {

    return customized

        ? "Customized"

        : "Built-In Defaults";

}


/**
 * Format export timestamp.
 */
function formatDateTime(

    value:string

):string {

    const date =

        new Date(
            value
        );


    if(

        Number.isNaN(
            date.getTime()
        )

    ){

        return value;

    }


    return date.toLocaleString();

}


/**
 * Create readable validation error message.
 */
function createValidationErrorMessage(

    errors:string[]

):string {

    if(errors.length === 0){

        return "The configuration backup is invalid.";

    }


    return [

        "The configuration backup could not be used:",

        ...errors.map(
            error =>
                `• ${error}`
        )

    ].join(
        "\n"
    );

}


/**
 * Create dated backup filename.
 */
function createConfigurationBackupFilename():string {

    const now =
        new Date();


    const date =

        [
            now.getFullYear(),
            padNumber(
                now.getMonth() + 1
            ),
            padNumber(
                now.getDate()
            )
        ].join(
            "-"
        );


    const time =

        [
            padNumber(
                now.getHours()
            ),
            padNumber(
                now.getMinutes()
            )
        ].join(
            ""
        );


    return `edori-configuration-backup-${date}-${time}.json`;

}


/**
 * Pad one date/time number.
 */
function padNumber(

    value:number

):string {

    return String(
        value
    ).padStart(
        2,
        "0"
    );

}


/**
 * Escape text inserted into generated HTML.
 */
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