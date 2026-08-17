/**
 * HistoryRestoreCenter
 *
 * Validates and restores Hospital Readiness snapshot-history
 * backups exported by DataExportCenter.
 *
 * Restoring history:
 *
 * - Does not recalculate Hospital Readiness
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
                        Validate and restore a previously exported Hospital Readiness JSON backup
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
                    Select Hospital Readiness history backup
                </label>


                <input
                    id="historyRestoreFileInput"
                    class="history-restore-file-input"
                    type="file"
                    accept=".json,application/json"
                >


                <p class="history-restore-help">
                    Select a JSON backup created by the Hospital Readiness Data Export Center.
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

            "Select a JSON file created by the Hospital Readiness Data Export Center.",

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

                "The selected backup does not contain any valid Hospital Readiness snapshots.",

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

            "Unable to validate Hospital Readiness backup:",

            error

        );


        showRestoreMessage(

            "The selected file is not a valid Hospital Readiness history backup.",

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

        schemaVersion?:unknown;

        enteredByUserId?:unknown;

        enteredByDisplayName?:unknown;

        enteredByUsername?:unknown;

        score?:unknown;

        status?:unknown;

        operationalState?:unknown;

        day?:unknown;

        hour?:unknown;

        forecastHours?:unknown;

        totalEDVolume?:unknown;

        boardedPatients?:unknown;

        esi1?:unknown;

        esi2?:unknown;

        staffedAcuteCareBeds?:unknown;

        occupiedAcuteCareBeds?:unknown;

        staffedCriticalCareBeds?:unknown;

        occupiedCriticalCareBeds?:unknown;

        currentEDAdmissions?:unknown;

        currentDirectAdmissions?:unknown;

        currentSurgicalAdmissions?:unknown;

        currentHospitalInflow?:unknown;

        expectedEDVolume?:unknown;

        expectedEDBoarders?:unknown;

        knownNonEDInflow?:unknown;

        expectedNonEDInflow?:unknown;

        expectedStaffedAcuteCareBeds?:unknown;

        expectedOccupiedAcuteCareBeds?:unknown;

        expectedAvailableAcuteCareBeds?:unknown;

        projectedDirectAdmissions?:unknown;

        projectedSurgicalAdmissions?:unknown;

        projectedNewAdmissions?:unknown;

        projectedTotalBedDemand?:unknown;

        historicalProjectedBedDemand4h?:unknown;

        historicalProjectedBedBalance4h?:unknown;

        projectedCapacityVariance?:unknown;

        expectedEDAdmissions4h?:unknown;

        expectedDirectAdmissions4h?:unknown;

        expectedSurgicalAdmissions4h?:unknown;

        expectedHospitalInflow4h?:unknown;

        expectedInpatientDepartures4h?:unknown;

        projectedHospitalInflow?:unknown;

        currentAvailableAcuteCareBeds?:unknown;

        projectedAvailableAcuteCareBeds?:unknown;

        edPressureScore?:unknown;

        acuteCapacityScore?:unknown;

        criticalCapacityScore?:unknown;

        inflowScore?:unknown;

        projectedCapacityScore?:unknown;

        edVolumeScore?:unknown;

        edBoardingScore?:unknown;

        edAcuityScore?:unknown;

        scoreChange?:unknown;

        trendDirection?:unknown;

        activeTriggerIds?:unknown;

        activeTriggerTitles?:unknown;

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


    const currentEDAdmissions =
        normalizeNonnegativeNumber(
            candidate.currentEDAdmissions
        )
        ?? 0;


    const currentDirectAdmissions =
        normalizeNonnegativeNumber(
            candidate.currentDirectAdmissions
        )
        ?? 0;


    const currentSurgicalAdmissions =
        normalizeNonnegativeNumber(
            candidate.currentSurgicalAdmissions
        )
        ?? 0;


    const calculatedCurrentHospitalInflow =

        currentEDAdmissions

        +

        currentDirectAdmissions

        +

        currentSurgicalAdmissions;


    const expectedEDAdmissions4h =
        normalizeNonnegativeNumber(
            candidate.expectedEDAdmissions4h
        )
        ?? 0;


    const expectedDirectAdmissions4h =
        normalizeNonnegativeNumber(
            candidate.expectedDirectAdmissions4h
        )
        ?? 0;


    const expectedSurgicalAdmissions4h =
        normalizeNonnegativeNumber(
            candidate.expectedSurgicalAdmissions4h
        )
        ?? 0;


    const calculatedExpectedHospitalInflow4h =

        expectedEDAdmissions4h

        +

        expectedDirectAdmissions4h

        +

        expectedSurgicalAdmissions4h;


    const currentHospitalInflow =
        normalizeNonnegativeNumber(
            candidate.currentHospitalInflow
        )
        ?? calculatedCurrentHospitalInflow;


    const expectedHospitalInflow4h =
        normalizeNonnegativeNumber(
            candidate.expectedHospitalInflow4h
        )
        ?? calculatedExpectedHospitalInflow4h;


    const projectedHospitalInflow =
        normalizeNonnegativeNumber(
            candidate.projectedHospitalInflow
        )
        ?? Math.max(
            currentHospitalInflow,
            expectedHospitalInflow4h
        );


    const staffedAcuteCareBeds =
        normalizePositiveNumber(
            candidate.staffedAcuteCareBeds
        )
        ?? 1;


    const occupiedAcuteCareBeds =
        normalizeNonnegativeNumber(
            candidate.occupiedAcuteCareBeds
        )
        ?? 0;


    const currentAvailableAcuteCareBeds =
        normalizeNumber(
            candidate.currentAvailableAcuteCareBeds
        )
        ?? (
            staffedAcuteCareBeds
            -
            occupiedAcuteCareBeds
        );


    const expectedInpatientDepartures4h =
        normalizeNonnegativeNumber(
            candidate.expectedInpatientDepartures4h
        )
        ?? 0;


    const knownNonEDInflow =
        normalizeNonnegativeNumber(
            candidate.knownNonEDInflow
        )
        ?? (
            currentDirectAdmissions
            +
            currentSurgicalAdmissions
        );


    const expectedNonEDInflow =
        normalizeNonnegativeNumber(
            candidate.expectedNonEDInflow
        )
        ?? (
            expectedDirectAdmissions4h
            +
            expectedSurgicalAdmissions4h
        );


    const expectedStaffedAcuteCareBeds =
        normalizePositiveNumber(
            candidate.expectedStaffedAcuteCareBeds
        )
        ?? staffedAcuteCareBeds;


    const expectedOccupiedAcuteCareBeds =
        normalizeNonnegativeNumber(
            candidate.expectedOccupiedAcuteCareBeds
        )
        ?? occupiedAcuteCareBeds;


    const expectedAvailableAcuteCareBeds =
        normalizeNumber(
            candidate.expectedAvailableAcuteCareBeds
        )
        ?? (
            expectedStaffedAcuteCareBeds
            -
            expectedOccupiedAcuteCareBeds
        );


    const projectedDirectAdmissions =
        normalizeNonnegativeNumber(
            candidate.projectedDirectAdmissions
        )
        ?? currentDirectAdmissions;


    const projectedSurgicalAdmissions =
        normalizeNonnegativeNumber(
            candidate.projectedSurgicalAdmissions
        )
        ?? currentSurgicalAdmissions;


    const projectedNewAdmissions =
        normalizeNonnegativeNumber(
            candidate.projectedNewAdmissions
        )
        ?? (
            expectedEDAdmissions4h
            +
            projectedDirectAdmissions
            +
            projectedSurgicalAdmissions
        );


    const boardedPatients =
        normalizeNonnegativeNumber(
            candidate.boardedPatients
        )
        ?? 0;


    const projectedTotalBedDemand =
        normalizeNonnegativeNumber(
            candidate.projectedTotalBedDemand
        )
        ?? (
            boardedPatients
            +
            projectedNewAdmissions
        );


    const historicalProjectedBedDemand4h =
        normalizeNonnegativeNumber(
            candidate.historicalProjectedBedDemand4h
        )
        ?? expectedHospitalInflow4h;


    const projectedAvailableAcuteCareBeds =
        normalizeNumber(
            candidate.projectedAvailableAcuteCareBeds
        )
        ?? (
            currentAvailableAcuteCareBeds
            +
            expectedInpatientDepartures4h
            -
            projectedTotalBedDemand
        );


    const historicalProjectedBedBalance4h =
        normalizeNumber(
            candidate.historicalProjectedBedBalance4h
        )
        ?? (
            expectedAvailableAcuteCareBeds
            +
            expectedInpatientDepartures4h
            -
            historicalProjectedBedDemand4h
        );


    const projectedCapacityVariance =
        normalizeNumber(
            candidate.projectedCapacityVariance
        )
        ?? (
            projectedAvailableAcuteCareBeds
            -
            historicalProjectedBedBalance4h
        );


    return {

        id:
            normalizeString(
                candidate.id
            )
            ?? createRestoredSnapshotId(
                timestamp
            ),

        timestamp,

        schemaVersion:
            normalizePositiveInteger(
                candidate.schemaVersion
            )
            ?? 3,

        enteredByUserId:
            normalizeString(
                candidate.enteredByUserId
            )
            ?? "",

        enteredByDisplayName:
            normalizeString(
                candidate.enteredByDisplayName
            )
            ?? "Legacy / Unknown",

        enteredByUsername:
            normalizeString(
                candidate.enteredByUsername
            )
            ?? "",

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
            ?? timestamp.getHours(),

        forecastHours:
            normalizePositiveInteger(
                candidate.forecastHours
            )
            ?? 4,

        totalEDVolume:
            normalizeNonnegativeNumber(
                candidate.totalEDVolume
            )
            ?? 0,

        boardedPatients,

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

        staffedAcuteCareBeds,

        occupiedAcuteCareBeds,

        staffedCriticalCareBeds:
            normalizePositiveNumber(
                candidate.staffedCriticalCareBeds
            )
            ?? 1,

        occupiedCriticalCareBeds:
            normalizeNonnegativeNumber(
                candidate.occupiedCriticalCareBeds
            )
            ?? 0,

        currentEDAdmissions,

        currentDirectAdmissions,

        currentSurgicalAdmissions,

        knownNonEDInflow,

        expectedNonEDInflow,

        currentHospitalInflow,

        expectedEDVolume:
            normalizeNonnegativeNumber(
                candidate.expectedEDVolume
            )
            ?? 0,

        expectedEDBoarders:
            normalizeNonnegativeNumber(
                candidate.expectedEDBoarders
            )
            ?? 0,

        expectedStaffedAcuteCareBeds,

        expectedOccupiedAcuteCareBeds,

        expectedAvailableAcuteCareBeds,

        expectedEDAdmissions4h,

        expectedDirectAdmissions4h,

        expectedSurgicalAdmissions4h,

        expectedHospitalInflow4h,

        expectedInpatientDepartures4h,

        projectedDirectAdmissions,

        projectedSurgicalAdmissions,

        projectedNewAdmissions,

        projectedTotalBedDemand,

        historicalProjectedBedDemand4h,

        projectedHospitalInflow,

        currentAvailableAcuteCareBeds,

        projectedAvailableAcuteCareBeds,

        historicalProjectedBedBalance4h,

        projectedCapacityVariance,

        edPressureScore:
            normalizeOptionalScore(
                candidate.edPressureScore
            )
            ?? 0,

        acuteCapacityScore:
            normalizeOptionalScore(
                candidate.acuteCapacityScore
            )
            ?? 0,

        criticalCapacityScore:
            normalizeOptionalScore(
                candidate.criticalCapacityScore
            )
            ?? 0,

        inflowScore:
            normalizeOptionalScore(
                candidate.inflowScore
            )
            ?? 0,

        projectedCapacityScore:
            normalizeOptionalScore(
                candidate.projectedCapacityScore
            )
            ?? 0,

        edVolumeScore:
            normalizeOptionalScore(
                candidate.edVolumeScore
            )
            ?? 0,

        edBoardingScore:
            normalizeOptionalScore(
                candidate.edBoardingScore
            )
            ?? 0,

        edAcuityScore:
            normalizeOptionalScore(
                candidate.edAcuityScore
            )
            ?? 0,

        scoreChange:
            normalizeOptionalScoreChange(
                candidate.scoreChange
            ),

        trendDirection:
            normalizeString(
                candidate.trendDirection
            ),

        activeTriggerIds:
            normalizeStringArray(
                candidate.activeTriggerIds
            ),

        activeTriggerTitles:
            normalizeStringArray(
                candidate.activeTriggerTitles
            )

    };

}


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

            "Unable to restore Hospital Readiness history:",

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
            The current Hospital Readiness form and calculated result will not be changed.

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
 * Normalize a positive integer.
 */
function normalizePositiveInteger(

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


    return Math.round(
        normalized
    );

}


/**
 * Normalize an optional signed score change.
 */
function normalizeOptionalScoreChange(

    value:unknown

):number | undefined {

    const normalized = normalizeNumber(
        value
    );


    return normalized === null
        ? undefined
        : normalized;

}


/**
 * Normalize an optional string array.
 */
function normalizeStringArray(

    value:unknown

):string[] | undefined {

    if(!Array.isArray(value)){

        return undefined;

    }


    const normalized = value

        .map(
            item => normalizeString(
                item
            )
        )

        .filter(
            (
                item
            ):item is string => item !== undefined
        );


    return normalized.length > 0
        ? normalized
        : undefined;

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