/**
 * DataExportCenter
 *
 * Exports the current EDORI assessment and saved
 * snapshot history to CSV or JSON files.
 *
 * This component does not:
 *
 * - Calculate EDORI
 * - Modify application state
 * - Change snapshot history
 * - Import or restore data
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

    createOperationalAssessment

}

from "../services/OperationalAssessmentService";


import {

    getLatestResult,

    getResultInvalidationReason

}

from "../services/ResultService";


import {

    getSnapshots

}

from "../services/SnapshotService";


import {

    getState,

    hasCommittedAssessment

}

from "../services/StateService";


import type {

    EdoriSnapshot

}

from "../types/EdoriSnapshot";


import type {

    OperationalAssessment

}

from "../types/OperationalAssessment";


type ExportMessageType =

    | "success"

    | "error"

    | "information";


/**
 * Render the Data Export Center.
 */
export function DataExportCenter():string {

    return `

        <section class="data-export-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Data Export Center
                    </h3>

                    <p class="panel-description">
                        Download the current assessment or saved EDORI history
                    </p>

                </div>

            </div>


            <div
                id="dataExportMessage"
                class="data-export-message"
                aria-live="polite"
            >
            </div>


            <div class="data-export-grid">

                <article class="data-export-card">

                    <div class="data-export-card-header">

                        <div>

                            <span class="data-export-card-label">
                                Current Assessment
                            </span>

                            <h4>
                                Current EDORI CSV
                            </h4>

                        </div>


                        <span
                            class="data-export-card-icon"
                            aria-hidden="true"
                        >
                            📄
                        </span>

                    </div>


                    <p>
                        Export the current calculated assessment, operational level,
                        score domains, inputs, expectations, and active-trigger summary.
                    </p>


                    <button
                        id="exportCurrentAssessmentButton"
                        class="data-export-button data-export-button-primary"
                        type="button"
                        disabled
                    >
                        Download Current CSV
                    </button>

                </article>


                <article class="data-export-card">

                    <div class="data-export-card-header">

                        <div>

                            <span class="data-export-card-label">
                                Assessment History
                            </span>

                            <h4>
                                History CSV
                            </h4>

                        </div>


                        <span
                            class="data-export-card-icon"
                            aria-hidden="true"
                        >
                            📊
                        </span>

                    </div>


                    <p>
                        Export all saved EDORI snapshots in a spreadsheet-friendly
                        format with one assessment per row.
                    </p>


                    <button
                        id="exportHistoryCsvButton"
                        class="data-export-button"
                        type="button"
                        disabled
                    >
                        Download History CSV
                    </button>

                </article>


                <article class="data-export-card">

                    <div class="data-export-card-header">

                        <div>

                            <span class="data-export-card-label">
                                Backup
                            </span>

                            <h4>
                                History JSON
                            </h4>

                        </div>


                        <span
                            class="data-export-card-icon"
                            aria-hidden="true"
                        >
                            💾
                        </span>

                    </div>


                    <p>
                        Export the complete saved snapshot objects as a structured
                        JSON backup for audit, development, or future restoration.
                    </p>


                    <button
                        id="exportHistoryJsonButton"
                        class="data-export-button"
                        type="button"
                        disabled
                    >
                        Download History JSON
                    </button>

                </article>

            </div>


            <div class="data-export-status">

                <div>

                    <span>
                        Current Assessment
                    </span>

                    <strong id="dataExportCurrentStatus">
                        Not available
                    </strong>

                </div>


                <div>

                    <span>
                        Saved Assessments
                    </span>

                    <strong id="dataExportHistoryCount">
                        0
                    </strong>

                </div>


                <div>

                    <span>
                        Export Format
                    </span>

                    <strong>
                        UTF-8
                    </strong>

                </div>

            </div>

        </section>

    `;

}


/**
 * Initialize export-center behavior.
 */
export function initializeDataExportCenter():void {

    document.getElementById(

        "exportCurrentAssessmentButton"

    )?.addEventListener(

        "click",

        exportCurrentAssessmentCsv

    );


    document.getElementById(

        "exportHistoryCsvButton"

    )?.addEventListener(

        "click",

        exportHistoryCsv

    );


    document.getElementById(

        "exportHistoryJsonButton"

    )?.addEventListener(

        "click",

        exportHistoryJson

    );


    updateDataExportCenter();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateDataExportCenter

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateDataExportCenter

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateDataExportCenter

    );

}


/**
 * Refresh export-button availability and counts.
 */
function updateDataExportCenter():void {

    clearExportMessage();


    const snapshots = getSnapshots();


    const currentAssessmentAvailable =

        hasCommittedAssessment()

        &&

        getLatestResult() !== null

        &&

        getResultInvalidationReason() === null;


    setButtonEnabled(

        "exportCurrentAssessmentButton",

        currentAssessmentAvailable

    );


    setButtonEnabled(

        "exportHistoryCsvButton",

        snapshots.length > 0

    );


    setButtonEnabled(

        "exportHistoryJsonButton",

        snapshots.length > 0

    );


    const currentStatus = document.getElementById(

        "dataExportCurrentStatus"

    );


    if(currentStatus){

        currentStatus.textContent =

            currentAssessmentAvailable

                ? "Ready"

                : getResultInvalidationReason()

                    ? "Recalculation required"

                    : "Not available";

    }


    const historyCount = document.getElementById(

        "dataExportHistoryCount"

    );


    if(historyCount){

        historyCount.textContent = String(

            snapshots.length

        );

    }

}


/**
 * Export the current authoritative assessment to
 * one-row CSV.
 */
function exportCurrentAssessmentCsv():void {

    const invalidationReason =

        getResultInvalidationReason();


    const result = getLatestResult();


    if(

        invalidationReason

        ||

        !result

        ||

        !hasCommittedAssessment()

    ){

        showExportMessage(

            "A current calculated assessment is required before exporting.",

            "error"

        );


        return;

    }


    try {

        const operationalAssessment =

            createOperationalAssessment({

                assessment:
                    getState(),

                result,

                snapshots:
                    getSnapshots(),

                evaluatedAt:
                    new Date()

            });


        const row = createCurrentAssessmentRow(

            operationalAssessment

        );


        const csv = createCsv(

            [row]

        );


        downloadTextFile(

            createTimestampedFilename(

                "edori-current-assessment",

                "csv"

            ),

            csv,

            "text/csv;charset=utf-8"

        );


        showExportMessage(

            "The current EDORI assessment CSV was downloaded.",

            "success"

        );

    }
    catch(error){

        console.error(

            "Unable to export the current assessment:",

            error

        );


        showExportMessage(

            "The current assessment could not be exported.",

            "error"

        );

    }

}


/**
 * Export all saved snapshots to CSV.
 */
function exportHistoryCsv():void {

    const snapshots = getSnapshots();


    if(snapshots.length === 0){

        showExportMessage(

            "No saved assessment history is available to export.",

            "information"

        );


        return;

    }


    try {

        const rows = snapshots.map(

            snapshot =>

                createSnapshotCsvRow(

                    snapshot

                )

        );


        const csv = createCsv(

            rows

        );


        downloadTextFile(

            createTimestampedFilename(

                "edori-assessment-history",

                "csv"

            ),

            csv,

            "text/csv;charset=utf-8"

        );


        showExportMessage(

            `${snapshots.length} saved assessments were exported to CSV.`,

            "success"

        );

    }
    catch(error){

        console.error(

            "Unable to export EDORI history CSV:",

            error

        );


        showExportMessage(

            "The assessment history CSV could not be exported.",

            "error"

        );

    }

}


/**
 * Export all saved snapshots as JSON.
 */
function exportHistoryJson():void {

    const snapshots = getSnapshots();


    if(snapshots.length === 0){

        showExportMessage(

            "No saved assessment history is available to export.",

            "information"

        );


        return;

    }


    try {

        const exportDocument = {

            exportType:
                "EDORI Snapshot History",

            schemaVersion:
                1,

            exportedAt:
                new Date().toISOString(),

            snapshotCount:
                snapshots.length,

            snapshots:
                snapshots.map(

                    snapshot =>

                        serializeSnapshotForExport(

                            snapshot

                        )

                )

        };


        const json = JSON.stringify(

            exportDocument,

            null,

            2

        );


        downloadTextFile(

            createTimestampedFilename(

                "edori-assessment-history-backup",

                "json"

            ),

            json,

            "application/json;charset=utf-8"

        );


        showExportMessage(

            `${snapshots.length} saved assessments were exported to JSON.`,

            "success"

        );

    }
    catch(error){

        console.error(

            "Unable to export EDORI history JSON:",

            error

        );


        showExportMessage(

            "The assessment history JSON backup could not be exported.",

            "error"

        );

    }

}


/**
 * Create one flat current-assessment export row.
 */
function createCurrentAssessmentRow(

    operationalAssessment:OperationalAssessment

):Record<string, unknown> {

    const assessment =

        operationalAssessment.assessment;


    const result =

        operationalAssessment.scoreResult;


    return {

        assessmentTime:
            normalizeDateForExport(

                assessment.assessmentTime

            ),

        day:
            assessment.day,

        hour:
            assessment.hour,

        edoriScore:
            result.score,

        finalOperationalLevel:
            operationalAssessment
                .finalOperationalState
                .title,

        scoreDerivedLevel:
            operationalAssessment
                .baseOperationalState
                .title,

        riskDirection:
            operationalAssessment.riskDirection,

        confidence:
            operationalAssessment.confidence,

        activeTriggerCount:
            operationalAssessment
                .activeTriggers
                .length,

        activeTriggerTitles:
            operationalAssessment
                .activeTriggers
                .map(

                    trigger =>

                        trigger.trigger.title

                )
                .join(" | "),

        recommendationCount:
            operationalAssessment
                .recommendations
                .length,

        recommendationTitles:
            operationalAssessment
                .recommendations
                .map(

                    recommendation =>

                        `${recommendation.priority}: ${recommendation.title}`

                )
                .join(" | "),

        totalEDVolume:
            assessment.totalEDVolume,

        boardedPatients:
            assessment.boardedPatients,

        occupiedMedicalBeds:
            assessment.occupiedMedicalBeds,

        esi1:
            assessment.esi1,

        esi2:
            assessment.esi2,

        esi3:
            assessment.esi3,

        esi4:
            assessment.esi4,

        esi5:
            assessment.esi5,

        expectedVolume:
            assessment.expectedVolume,

        expectedBoarders:
            assessment.expectedBoarders,

        expectedArrivals:
            assessment.expectedArrivals,

        expectedDepartures:
            assessment.expectedDepartures,

        demandScore:
            readOptionalResultNumber(

                result,

                "demandScore"

            ),

        boardingScore:
            readOptionalResultNumber(

                result,

                "boardingScore"

            ),

        hospitalScore:
            readOptionalResultNumber(

                result,

                "hospitalScore"

            ),

        acuityScore:
            readOptionalResultNumber(

                result,

                "acuityScore"

            ),

        forecastScore:
            readOptionalResultNumber(

                result,

                "forecastScore"

            )

    };

}


/**
 * Create one flat CSV history row.
 */
function createSnapshotCsvRow(

    snapshot:EdoriSnapshot

):Record<string, unknown> {

    return {

        id:
            snapshot.id

            ?? "",

        timestamp:
            normalizeDateForExport(

                snapshot.timestamp

            ),

        score:
            snapshot.score,

        status:
            snapshot.status,

        operationalLevel:
            snapshot.operationalState.title,

        operationalIcon:
            snapshot.operationalState.icon,

        operationalColor:
            snapshot.operationalState.color,

        day:
            snapshot.day

            ?? "",

        hour:
            snapshot.hour

            ?? "",

        totalEDVolume:
            snapshot.totalEDVolume

            ?? "",

        boardedPatients:
            snapshot.boardedPatients

            ?? "",

        occupiedMedicalBeds:
            snapshot.occupiedMedicalBeds

            ?? "",

        esi1:
            snapshot.esi1

            ?? "",

        esi2:
            snapshot.esi2

            ?? "",

        esi3:
            snapshot.esi3

            ?? "",

        esi4:
            snapshot.esi4

            ?? "",

        esi5:
            snapshot.esi5

            ?? "",

        expectedVolume:
            snapshot.expectedVolume

            ?? "",

        expectedBoarders:
            snapshot.expectedBoarders

            ?? "",

        expectedArrivals:
            snapshot.expectedArrivals

            ?? "",

        expectedDepartures:
            snapshot.expectedDepartures

            ?? "",

        demandScore:
            snapshot.demandScore

            ?? "",

        boardingScore:
            snapshot.boardingScore

            ?? "",

        hospitalScore:
            snapshot.hospitalScore

            ?? "",

        acuityScore:
            snapshot.acuityScore

            ?? "",

        forecastScore:
            snapshot.forecastScore

            ?? ""

    };

}


/**
 * Convert one snapshot to a structured JSON-safe
 * object.
 */
function serializeSnapshotForExport(

    snapshot:EdoriSnapshot

):Record<string, unknown> {

    return {

        ...snapshot,

        timestamp:
            normalizeDateForExport(

                snapshot.timestamp

            ),

        operationalState:{

            ...snapshot.operationalState

        }

    };

}


/**
 * Create CSV from an array of flat records.
 */
function createCsv(

    rows:Record<string, unknown>[]

):string {

    if(rows.length === 0){

        return "";

    }


    const headers = Array.from(

        rows.reduce(

            (

                headerSet,

                row

            ) => {

                Object.keys(

                    row

                ).forEach(

                    header =>

                        headerSet.add(

                            header

                        )

                );


                return headerSet;

            },

            new Set<string>()

        )

    );


    const headerLine = headers

        .map(

            escapeCsvValue

        )

        .join(",");


    const dataLines = rows.map(

        row =>

            headers

                .map(

                    header =>

                        escapeCsvValue(

                            normalizeCsvValue(

                                row[header]

                            )

                        )

                )

                .join(",")

    );


    return [

        headerLine,

        ...dataLines

    ].join(

        "\r\n"

    );

}


/**
 * Normalize unknown values for CSV output.
 */
function normalizeCsvValue(

    value:unknown

):string {

    if(

        value === null

        ||

        value === undefined

    ){

        return "";

    }


    if(value instanceof Date){

        return normalizeDateForExport(

            value

        );

    }


    if(typeof value === "object"){

        return JSON.stringify(

            value

        );

    }


    return String(

        value

    );

}


/**
 * Escape one CSV cell.
 */
function escapeCsvValue(

    value:unknown

):string {

    const text = String(

        value

        ?? ""

    );


    if(

        text.includes(",")

        ||

        text.includes("\"")

        ||

        text.includes("\n")

        ||

        text.includes("\r")

    ){

        return `"${text.replaceAll(
            "\"",
            "\"\""
        )}"`;

    }


    return text;

}


/**
 * Read an optional numeric property from the score
 * result without requiring every result interface
 * version to expose the field.
 */
function readOptionalResultNumber(

    result:OperationalAssessment["scoreResult"],

    propertyName:string

):number | "" {

    const candidate = result as unknown as

    Record<string, unknown>;


    const value = candidate[

        propertyName

    ];


    return typeof value === "number"

        &&

        Number.isFinite(

            value

        )

            ? value

            : "";

}


/**
 * Normalize a date for export.
 */
function normalizeDateForExport(

    value:Date | string

):string {

    const date = new Date(

        value

    );


    return Number.isNaN(

        date.getTime()

    )

        ? ""

        : date.toISOString();

}


/**
 * Create a timestamped export filename.
 */
function createTimestampedFilename(

    baseName:string,

    extension:string

):string {

    const timestamp = new Date()

        .toISOString()

        .replace(

            /[:.]/g,

            "-"

        );


    return `${baseName}-${timestamp}.${extension}`;

}


/**
 * Trigger a browser file download.
 */
function downloadTextFile(

    filename:string,

    content:string,

    mimeType:string

):void {

    const byteOrderMark = mimeType.startsWith(

        "text/csv"

    )

        ? "\uFEFF"

        : "";


    const blob = new Blob(

        [

            byteOrderMark,

            content

        ],

        {

            type:
                mimeType

        }

    );


    const objectUrl = URL.createObjectURL(

        blob

    );


    const anchor = document.createElement(

        "a"

    );


    anchor.href = objectUrl;

    anchor.download = filename;

    anchor.style.display =

        "none";


    document.body.appendChild(

        anchor

    );


    anchor.click();


    document.body.removeChild(

        anchor

    );


    window.setTimeout(

        () => {

            URL.revokeObjectURL(

                objectUrl

            );

        },

        0

    );

}


/**
 * Enable or disable one export button.
 */
function setButtonEnabled(

    elementId:string,

    enabled:boolean

):void {

    const button = document.getElementById(

        elementId

    ) as HTMLButtonElement | null;


    if(!button){

        return;

    }


    button.disabled = !enabled;

}


/**
 * Clear the export message.
 */
function clearExportMessage():void {

    const element = document.getElementById(

        "dataExportMessage"

    );


    if(!element){

        return;

    }


    element.className =

        "data-export-message";


    element.textContent = "";

}


/**
 * Display export feedback.
 */
function showExportMessage(

    message:string,

    type:ExportMessageType

):void {

    const element = document.getElementById(

        "dataExportMessage"

    );


    if(!element){

        return;

    }


    element.className =

        `data-export-message data-export-message-${type}`;


    element.textContent = message;

}