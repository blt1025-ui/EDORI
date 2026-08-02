/**
 * HistoryRestoreCenter
 *
 * Validates and restores EDORI snapshot-history
 * backups exported by DataExportCenter.
 *
 * Restoring history:
 *
 * - Does not recalculate EDORI
 * - Does not alter the current form
 * - Does not alter the current result
 * - Replaces only saved snapshot history
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    subscribe

}

from "../services/EventService";


import {

    getSnapshots,

    replaceSnapshots

}

from "../services/SnapshotService";


import type {

    EdoriSnapshot

}

from "../types/EdoriSnapshot";


interface HistoryBackupDocument {

    exportType?:unknown;

    schemaVersion?:unknown;

    exportedAt?:unknown;

    snapshotCount?:unknown;

    snapshots?:unknown;

}


interface RestorePreview {

    filename:string;

    snapshots:EdoriSnapshot[];

    invalidRecordCount:number;

    exportedAt:string | null;

}


let pendingRestore:RestorePreview | null = null;


/**
 * Render the History Restore Center.
 */
export function HistoryRestoreCenter():string {

    return `

        <section class="history-restore-container">

            <div class="panel-header">

                <div>

                    <h3>
                        History Restore Center
                    </h3>

                    <p class="panel-description">
                        Validate and restore a previously exported EDORI JSON backup
                    </p>

                </div>

            </div>


            <div
                id="historyRestoreMessage"
                class="history-restore-message"
                aria-live="polite"
            >
            </div>


            <div class="history-restore-upload">

                <label
                    class="history-restore-file-label"
                    for="historyRestoreFileInput"
                >
                    Select EDORI history backup
                </label>


                <input
                    id="historyRestoreFileInput"
                    class="history-restore-file-input"
                    type="file"
                    accept=".json,application/json"
                >


                <p class="history-restore-help">
                    Select a JSON backup created by the EDORI Data Export Center.
                    The file will be validated before any saved history is changed.
                </p>

            </div>


            <div
                id="historyRestorePreview"
                class="history-restore-preview"
            >

                ${createEmptyPreview()}

            </div>


            <div class="history-restore-actions">

                <button
                    id="applyHistoryRestoreButton"
                    class="history-restore-apply-button"
                    type="button"
                    disabled
                >
                    Replace Saved History
                </button>


                <button
                    id="cancelHistoryRestoreButton"
                    class="history-restore-cancel-button"
                    type="button"
                    disabled
                >
                    Cancel Preview
                </button>

            </div>


            <div class="history-restore-current">

                <span>
                    Currently Saved Assessments
                </span>

                <strong id="historyRestoreCurrentCount">
                    0
                </strong>

            </div>

        </section>

    `;

}


/**
 * Initialize restore behavior.
 */
export function initializeHistoryRestoreCenter():void {

    const fileInput = document.getElementById(

        "historyRestoreFileInput"

    ) as HTMLInputElement | null;


    const applyButton = document.getElementById(

        "applyHistoryRestoreButton"

    );


    const cancelButton = document.getElementById(

        "cancelHistoryRestoreButton"

    );


    fileInput?.addEventListener(

        "change",

        handleRestoreFileSelection

    );


    applyButton?.addEventListener(

        "click",

        applyPendingRestore

    );


    cancelButton?.addEventListener(

        "click",

        cancelPendingRestore

    );


    updateCurrentHistoryCount();


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateCurrentHistoryCount

    );

}


/**
 * Read and validate the selected backup file.
 */
async function handleRestoreFileSelection(

    event:Event

):Promise<void> {

    const input = event.currentTarget as HTMLInputElement;


    const file = input.files?.[0];


    clearRestoreMessage();

    resetPendingRestore();


    if(!file){

        return;

    }


    if(

        !file.name.toLowerCase().endsWith(

            ".json"

        )

    ){

        showRestoreMessage(

            "Select a JSON file created by the EDORI Data Export Center.",

            "error"

        );


        input.value = "";


        return;

    }


    try {

        const fileText = await file.text();


        const parsed:unknown = JSON.parse(

            fileText

        );


        const preview = validateBackupDocument(

            parsed,

            file.name

        );


        if(preview.snapshots.length === 0){

            showRestoreMessage(

                "The selected backup does not contain any valid EDORI snapshots.",

                "error"

            );


            input.value = "";


            return;

        }


        pendingRestore = preview;


        renderRestorePreview(

            preview

        );


        updateRestoreButtons(

            true

        );


        const validationMessage =

            preview.invalidRecordCount === 0

                ? `${preview.snapshots.length} valid snapshots are ready for review.`

                : `${preview.snapshots.length} valid snapshots were found. ${preview.invalidRecordCount} invalid records will be excluded.`;


        showRestoreMessage(

            validationMessage,

            preview.invalidRecordCount === 0

                ? "success"

                : "warning"

        );

    }
    catch(error){

        console.error(

            "Unable to validate EDORI backup:",

            error

        );


        showRestoreMessage(

            "The selected file is not a valid EDORI history backup.",

            "error"

        );


        input.value = "";

    }

}


/**
 * Validate the top-level backup document.
 */
function validateBackupDocument(

    value:unknown,

    filename:string

):RestorePreview {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        throw new Error(

            "Backup document must be an object."

        );

    }


    const document = value as HistoryBackupDocument;


    if(!Array.isArray(document.snapshots)){

        throw new Error(

            "Backup document does not contain a snapshots array."

        );

    }


    const normalizedSnapshots:EdoriSnapshot[] = [];

    let invalidRecordCount = 0;


    document.snapshots.forEach(

        candidate => {

            const snapshot = normalizeSnapshot(

                candidate

            );


            if(snapshot){

                normalizedSnapshots.push(

                    snapshot

                );

            }
            else {

                invalidRecordCount += 1;

            }

        }

    );


    normalizedSnapshots.sort(

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


    return {

        filename,

        snapshots:
            normalizedSnapshots,

        invalidRecordCount,

        exportedAt:
            normalizeOptionalDateText(

                document.exportedAt

            )

    };

}


/**
 * Normalize one restored snapshot.
 */
function normalizeSnapshot(

    value:unknown

):EdoriSnapshot | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate = value as {

        id?:unknown;

        timestamp?:unknown;

        score?:unknown;

        status?:unknown;

        operationalState?:unknown;

        totalEDVolume?:unknown;

        boardedPatients?:unknown;

        occupiedMedicalBeds?:unknown;

        staffedMedicalBeds?:unknown;

        esi1?:unknown;

        esi2?:unknown;

        esi3?:unknown;

        esi4?:unknown;

        esi5?:unknown;

        expectedVolume?:unknown;

        expectedBoarders?:unknown;

        expectedArrivals?:unknown;

        expectedDepartures?:unknown;

        demandScore?:unknown;

        boardingScore?:unknown;

        hospitalScore?:unknown;

        acuityScore?:unknown;

        forecastScore?:unknown;

        day?:unknown;

        hour?:unknown;

    };


    const timestamp = normalizeDate(

        candidate.timestamp

    );


    const score = normalizeNumber(

        candidate.score

    );


    const operationalState = normalizeOperationalState(

        candidate.operationalState

    );


    if(

        timestamp === null

        ||

        score === null

        ||

        operationalState === null

    ){

        return null;

    }


    return {

        id:
            normalizeString(

                candidate.id

            )

            ?? createRestoredSnapshotId(

                timestamp

            ),

        timestamp,

        score:
            clampScore(

                score

            ),

        status:
            normalizeString(

                candidate.status

            )

            ?? operationalState.title,

        operationalState,

        totalEDVolume:
            normalizeNonnegativeNumber(

                candidate.totalEDVolume

            )

            ?? 0,

        boardedPatients:
            normalizeNonnegativeNumber(

                candidate.boardedPatients

            )

            ?? 0,

        occupiedMedicalBeds:
            normalizeNonnegativeNumber(

                candidate.occupiedMedicalBeds

            )

            ?? 0,

        staffedMedicalBeds:
            normalizePositiveNumber(

                candidate.staffedMedicalBeds

            )

            ?? 273,

        esi1:
            normalizeNonnegativeNumber(

                candidate.esi1

            )

            ?? 0,

        esi2:
            normalizeNonnegativeNumber(

                candidate.esi2

            )

            ?? 0,

        esi3:
            normalizeNonnegativeNumber(

                candidate.esi3

            )

            ?? 0,

        esi4:
            normalizeNonnegativeNumber(

                candidate.esi4

            )

            ?? 0,

        esi5:
            normalizeNonnegativeNumber(

                candidate.esi5

            )

            ?? 0,

        expectedVolume:
            normalizeNonnegativeNumber(

                candidate.expectedVolume

            )

            ?? 0,

        expectedBoarders:
            normalizeNonnegativeNumber(

                candidate.expectedBoarders

            )

            ?? 0,

        expectedArrivals:
            normalizeNonnegativeNumber(

                candidate.expectedArrivals

            )

            ?? 0,

        expectedDepartures:
            normalizeNonnegativeNumber(

                candidate.expectedDepartures

            )

            ?? 0,

        demandScore:
            normalizeOptionalScore(

                candidate.demandScore

            )

            ?? 0,

        boardingScore:
            normalizeOptionalScore(

                candidate.boardingScore

            )

            ?? 0,

        hospitalScore:
            normalizeOptionalScore(

                candidate.hospitalScore

            )

            ?? 0,

        acuityScore:
            normalizeOptionalScore(

                candidate.acuityScore

            )

            ?? 0,

        forecastScore:
            normalizeOptionalScore(

                candidate.forecastScore

            )

            ?? 0,

        day:
            normalizeString(

                candidate.day

            )

            ?? getDayName(

                timestamp

            ),

        hour:
            normalizeHour(

                candidate.hour

            )

            ?? timestamp.getHours()

    };

}


/**
 * Normalize an operational state from backup data.
 */
/**
 * Normalize an operational state from backup data.
 */
function normalizeOperationalState(

    value:unknown

):EdoriSnapshot["operationalState"] | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate = value as {

        title?:unknown;

        icon?:unknown;

        color?:unknown;

        recommendation?:unknown;

    };


    const title = normalizeOperationalTitle(

        candidate.title

    );


    const icon = normalizeString(

        candidate.icon

    );


    const color = normalizeString(

        candidate.color

    );


    const recommendation = normalizeString(

        candidate.recommendation

    );


    if(

        title === null

        ||

        icon === undefined

        ||

        color === undefined

        ||

        recommendation === undefined

    ){

        return null;

    }


    return {

        title,

        icon,

        color,

        recommendation

    };

}


/**
 * Apply the validated restore after confirmation.
 */
function applyPendingRestore():void {

    if(!pendingRestore){

        return;

    }


    const currentCount = getSnapshots().length;


    const confirmed = window.confirm(

        `This will replace ${currentCount} currently saved assessment${currentCount === 1 ? "" : "s"} with ${pendingRestore.snapshots.length} restored assessment${pendingRestore.snapshots.length === 1 ? "" : "s"}. Continue?`

    );


    if(!confirmed){

        showRestoreMessage(

            "History restore was cancelled. No saved records were changed.",

            "warning"

        );


        return;

    }


    try {

        replaceSnapshots(

            pendingRestore.snapshots

        );


        const restoredCount =

            pendingRestore.snapshots.length;


        showRestoreMessage(

            `${restoredCount} assessment${restoredCount === 1 ? "" : "s"} were restored successfully.`,

            "success"

        );


        resetPendingRestore();

        resetFileInput();

        updateCurrentHistoryCount();

    }
    catch(error){

        console.error(

            "Unable to restore EDORI history:",

            error

        );


        showRestoreMessage(

            "The saved history could not be replaced.",

            "error"

        );

    }

}


/**
 * Cancel the current preview.
 */
function cancelPendingRestore():void {

    resetPendingRestore();

    resetFileInput();

    clearRestoreMessage();


    showRestoreMessage(

        "Restore preview cleared. No saved history was changed.",

        "information"

    );

}


/**
 * Display the validated backup preview.
 */
function renderRestorePreview(

    preview:RestorePreview

):void {

    const container = document.getElementById(

        "historyRestorePreview"

    );


    if(!container){

        return;

    }


    const firstSnapshot = preview.snapshots[0];

    const lastSnapshot = preview.snapshots[

        preview.snapshots.length - 1

    ];


    container.innerHTML = `

        <div class="history-restore-preview-header">

            <div>

                <span>
                    Selected Backup
                </span>

                <strong>

                    ${escapeHtml(
                        preview.filename
                    )}

                </strong>

            </div>


            <span class="history-restore-valid-badge">
                Validated
            </span>

        </div>


        <div class="history-restore-preview-grid">

            ${createPreviewMetric(

                "Valid Records",

                String(
                    preview.snapshots.length
                )

            )}


            ${createPreviewMetric(

                "Invalid Records",

                String(
                    preview.invalidRecordCount
                )

            )}


            ${createPreviewMetric(

                "First Assessment",

                firstSnapshot

                    ? formatDate(
                        firstSnapshot.timestamp
                    )

                    : "Unavailable"

            )}


            ${createPreviewMetric(

                "Latest Assessment",

                lastSnapshot

                    ? formatDate(
                        lastSnapshot.timestamp
                    )

                    : "Unavailable"

            )}

        </div>


        ${preview.exportedAt

            ? `

                <p class="history-restore-export-date">

                    Backup exported:

                    <strong>

                        ${escapeHtml(
                            preview.exportedAt
                        )}

                    </strong>

                </p>

            `

            : ""

        }


        <div class="history-restore-warning">

            Applying this backup will replace the currently saved assessment history.
            The current EDORI form and calculated result will not be changed.

        </div>

    `;

}


/**
 * Create one preview metric.
 */
function createPreviewMetric(

    label:string,

    value:string

):string {

    return `

        <div class="history-restore-preview-metric">

            <span>

                ${escapeHtml(label)}

            </span>

            <strong>

                ${escapeHtml(value)}

            </strong>

        </div>

    `;

}


/**
 * Create the initial preview state.
 */
function createEmptyPreview():string {

    return `

        <div class="history-restore-empty-preview">

            <strong>
                No backup selected
            </strong>

            <p>
                Choose a JSON history backup to validate its records.
            </p>

        </div>

    `;

}


/**
 * Reset preview state.
 */
function resetPendingRestore():void {

    pendingRestore = null;


    const preview = document.getElementById(

        "historyRestorePreview"

    );


    if(preview){

        preview.innerHTML =

            createEmptyPreview();

    }


    updateRestoreButtons(

        false

    );

}


/**
 * Reset the file input.
 */
function resetFileInput():void {

    const input = document.getElementById(

        "historyRestoreFileInput"

    ) as HTMLInputElement | null;


    if(input){

        input.value = "";

    }

}


/**
 * Update action-button availability.
 */
function updateRestoreButtons(

    enabled:boolean

):void {

    const applyButton = document.getElementById(

        "applyHistoryRestoreButton"

    ) as HTMLButtonElement | null;


    const cancelButton = document.getElementById(

        "cancelHistoryRestoreButton"

    ) as HTMLButtonElement | null;


    if(applyButton){

        applyButton.disabled = !enabled;

    }


    if(cancelButton){

        cancelButton.disabled = !enabled;

    }

}


/**
 * Update the current saved-history count.
 */
function updateCurrentHistoryCount():void {

    const element = document.getElementById(

        "historyRestoreCurrentCount"

    );


    if(element){

        element.textContent = String(

            getSnapshots().length

        );

    }

}


/**
 * Normalize an Alpha–Echo title.
 */
function normalizeOperationalTitle(

    value:unknown

):EdoriSnapshot["operationalState"]["title"] | null {

    if(

        value === "Alpha"

        ||

        value === "Bravo"

        ||

        value === "Charlie"

        ||

        value === "Delta"

        ||

        value === "Echo"

    ){

        return value;

    }


    return null;

}


/**
 * Normalize a date.
 */
function normalizeDate(

    value:unknown

):Date | null {

    if(

        !(

            value instanceof Date

            ||

            typeof value === "string"

            ||

            typeof value === "number"

        )

    ){

        return null;

    }


    const date = new Date(

        value

    );


    return Number.isNaN(

        date.getTime()

    )

        ? null

        : date;

}


/**
 * Normalize optional exported date text.
 */
function normalizeOptionalDateText(

    value:unknown

):string | null {

    const date = normalizeDate(

        value

    );


    return date

        ? formatDate(

            date

        )

        : null;

}


/**
 * Normalize a required number.
 */
function normalizeNumber(

    value:unknown

):number | null {

    return typeof value === "number"

        &&

        Number.isFinite(value)

            ? value

            : null;

}


/**
 * Normalize an optional nonnegative number.
 */
function normalizeNonnegativeNumber(

    value:unknown

):number | undefined {

    const normalized = normalizeNumber(

        value

    );


    return normalized === null

        ? undefined

        : Math.max(

            0,

            normalized

        );

}


/**
 * Normalize a positive number.
 */
function normalizePositiveNumber(

    value:unknown

):number | undefined {

    const normalized = normalizeNumber(

        value

    );


    if(

        normalized === null

        ||

        normalized <= 0

    ){

        return undefined;

    }


    return normalized;

}


/**
 * Create a stable fallback identifier for an older
 * restored record that does not contain an ID.
 */
function createRestoredSnapshotId(

    timestamp:Date

):string {

    return `restored-${timestamp.getTime()}`;

}


/**
 * Return the weekday name associated with a date.
 */
function getDayName(

    value:Date

):string {

    const days = [

        "Sunday",

        "Monday",

        "Tuesday",

        "Wednesday",

        "Thursday",

        "Friday",

        "Saturday"

    ];


    return days[value.getDay()]

        ?? "Sunday";

}


/**
 * Normalize an optional score.
 */
function normalizeOptionalScore(

    value:unknown

):number | undefined {

    const normalized = normalizeNumber(

        value

    );


    return normalized === null

        ? undefined

        : clampScore(

            normalized

        );

}


/**
 * Normalize an optional hour.
 */
function normalizeHour(

    value:unknown

):number | undefined {

    const normalized = normalizeNumber(

        value

    );


    if(normalized === null){

        return undefined;

    }


    const hour = Math.round(

        normalized

    );


    return hour >= 0

        &&

        hour <= 23

            ? hour

            : undefined;

}


/**
 * Normalize optional text.
 */
function normalizeString(

    value:unknown

):string | undefined {

    if(typeof value !== "string"){

        return undefined;

    }


    const normalized = value.trim();


    return normalized.length > 0

        ? normalized

        : undefined;

}


/**
 * Clamp score to 0–100.
 */
function clampScore(

    value:number

):number {

    return Math.min(

        100,

        Math.max(

            0,

            value

        )

    );

}


/**
 * Format date for preview.
 */
function formatDate(

    value:Date | string

):string {

    const date = new Date(

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
 * Clear restore feedback.
 */
function clearRestoreMessage():void {

    const element = document.getElementById(

        "historyRestoreMessage"

    );


    if(!element){

        return;

    }


    element.className =

        "history-restore-message";


    element.textContent = "";

}


/**
 * Display restore feedback.
 */
function showRestoreMessage(

    message:string,

    type:

        | "success"

        | "warning"

        | "error"

        | "information"

):void {

    const element = document.getElementById(

        "historyRestoreMessage"

    );


    if(!element){

        return;

    }


    element.className =

        `history-restore-message history-restore-message-${type}`;


    element.textContent = message;

}


/**
 * Escape text inserted into HTML.
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