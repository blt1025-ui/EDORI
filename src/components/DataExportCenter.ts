/**
 * DataExportCenter
 *
 * Exports the current Hospital Readiness assessment and saved
 * snapshot history to CSV or JSON files.
 *
 * This component does not:
 *
 * - Calculate Hospital Readiness
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
                        Download the current assessment or saved Hospital Readiness history
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
                                Current Hospital Readiness CSV
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
                        Export all saved Hospital Readiness snapshots in a spreadsheet-friendly
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

            operationalAssessment,

            getSnapshots()

        );


        const csv = createCsv(

            [row]

        );


        downloadTextFile(

            createTimestampedFilename(

                "hospital-readiness-current-assessment",

                "csv"

            ),

            csv,

            "text/csv;charset=utf-8"

        );


        showExportMessage(

            "The current Hospital Readiness assessment CSV was downloaded.",

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

                "hospital-readiness-assessment-history",

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

            "Unable to export Hospital Readiness history CSV:",

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
                "Hospital Readiness Snapshot History",

            schemaVersion:
                2,

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

                "hospital-readiness-assessment-history-backup",

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

            "Unable to export Hospital Readiness history JSON:",

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

    operationalAssessment:OperationalAssessment,

    snapshots:EdoriSnapshot[]

):Record<string, unknown> {

    const assessment =
        operationalAssessment.assessment;

    const result =
        operationalAssessment.scoreResult;

    const highAcuityCount =
        assessment.esi1 + assessment.esi2;

    const inferredEsi3To5 = Math.max(
        0,
        assessment.totalEDVolume - highAcuityCount
    );

    const attribution =
        getAssessmentAttribution(
            snapshots,
            assessment.assessmentTime
        );

    return {

        assessmentTime:
            normalizeDateForExport(
                assessment.assessmentTime
            ),

        enteredByUserId:
            attribution.userId,

        enteredByDisplayName:
            attribution.displayName,

        enteredByUsername:
            attribution.username,

        day:
            assessment.day,

        hour:
            assessment.hour,

        forecastHours:
            assessment.forecastHours,

        hospitalReadinessScore:
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

        esi1:
            assessment.esi1,

        esi2:
            assessment.esi2,

        inferredEsi3To5,

        staffedAcuteCareBeds:
            assessment.staffedAcuteCareBeds,

        occupiedAcuteCareBeds:
            assessment.occupiedAcuteCareBeds,

        staffedCriticalCareBeds:
            assessment.staffedCriticalCareBeds,

        occupiedCriticalCareBeds:
            assessment.occupiedCriticalCareBeds,


        currentDirectAdmissions:
            assessment.currentDirectAdmissions,

        currentSurgicalAdmissions:
            assessment.currentSurgicalAdmissions,

        expectedEDVolume:
            assessment.expectedEDVolume,

        expectedEDBoarders:
            assessment.expectedEDBoarders,

        expectedEDAdmissions4h:
            assessment.expectedEDAdmissions4h,

        expectedDirectAdmissions4h:
            assessment.expectedDirectAdmissions4h,

        expectedSurgicalAdmissions4h:
            assessment.expectedSurgicalAdmissions4h,

        expectedHospitalInflow4h:
            assessment.expectedHospitalInflow4h,

        expectedInpatientDepartures4h:
            assessment.expectedInpatientDepartures4h,

        edPressureScore:
            result.edPressureScore,

        acuteCapacityScore:
            result.acuteCapacityScore,

        criticalCapacityScore:
            result.criticalCapacityScore,

        inflowScore:
            result.inflowScore,

        projectedCapacityScore:
            result.projectedCapacityScore,

        edVolumeScore:
            result.edVolumeScore,

        edBoardingScore:
            result.edBoardingScore,

        edAcuityScore:
            result.edAcuityScore,

       knownNonEDInflow:
    result.currentHospitalInflow,

        expectedHospitalInflow:
            result.expectedHospitalInflow,

        projectedHospitalInflow:
            result.projectedHospitalInflow,

        expectedInpatientDepartures:
            result.expectedInpatientDepartures,

        currentAvailableAcuteCareBeds:
            result.currentAvailableAcuteCareBeds,

        projectedAvailableAcuteCareBeds:
            result.projectedAvailableAcuteCareBeds

    };

}


/**
 * Create one flat CSV history row.
 */
function createSnapshotCsvRow(

    snapshot:EdoriSnapshot

):Record<string, unknown> {

    const highAcuityCount =

        snapshot.esi1

        +

        snapshot.esi2;


    const inferredEsi3To5 = Math.max(

        0,

        snapshot.totalEDVolume

        -

        highAcuityCount

    );


    return {

        id:
            snapshot.id,

        timestamp:
            normalizeDateForExport(

                snapshot.timestamp

            ),

        schemaVersion:
            snapshot.schemaVersion,

        enteredByUserId:
            snapshot.enteredByUserId,

        enteredByDisplayName:
            snapshot.enteredByDisplayName,

        enteredByUsername:
            snapshot.enteredByUsername,

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
            snapshot.day,

        hour:
            snapshot.hour,

        forecastHours:
            snapshot.forecastHours,

        totalEDVolume:
            snapshot.totalEDVolume,

        boardedPatients:
            snapshot.boardedPatients,

        esi1:
            snapshot.esi1,

        esi2:
            snapshot.esi2,

        inferredEsi3To5,

        staffedAcuteCareBeds:
            snapshot.staffedAcuteCareBeds,

        occupiedAcuteCareBeds:
            snapshot.occupiedAcuteCareBeds,

       staffedCriticalCareBeds:
    snapshot.staffedCriticalCareBeds,

occupiedCriticalCareBeds:
    snapshot.occupiedCriticalCareBeds,

currentDirectAdmissions:
    snapshot.currentDirectAdmissions,

currentSurgicalAdmissions:
    snapshot.currentSurgicalAdmissions,

        knownNonEDInflow:
    snapshot.currentHospitalInflow,

        expectedEDVolume:
            snapshot.expectedEDVolume,

        expectedEDBoarders:
            snapshot.expectedEDBoarders,

        expectedEDAdmissions4h:
            snapshot.expectedEDAdmissions4h,

        expectedDirectAdmissions4h:
            snapshot.expectedDirectAdmissions4h,

        expectedSurgicalAdmissions4h:
            snapshot.expectedSurgicalAdmissions4h,

        expectedHospitalInflow4h:
            snapshot.expectedHospitalInflow4h,

        expectedInpatientDepartures4h:
            snapshot.expectedInpatientDepartures4h,

        projectedHospitalInflow:
            snapshot.projectedHospitalInflow,

        currentAvailableAcuteCareBeds:
            snapshot.currentAvailableAcuteCareBeds,

        projectedAvailableAcuteCareBeds:
            snapshot.projectedAvailableAcuteCareBeds,

        edPressureScore:
            snapshot.edPressureScore,

        acuteCapacityScore:
            snapshot.acuteCapacityScore,

        criticalCapacityScore:
            snapshot.criticalCapacityScore,

        inflowScore:
            snapshot.inflowScore,

        projectedCapacityScore:
            snapshot.projectedCapacityScore,

        edVolumeScore:
            snapshot.edVolumeScore,

        edBoardingScore:
            snapshot.edBoardingScore,

        edAcuityScore:
            snapshot.edAcuityScore,

        scoreChange:
            snapshot.scoreChange ?? "",

        trendDirection:
            snapshot.trendDirection ?? "",

        activeTriggerIds:
            snapshot.activeTriggerIds?.join(" | ") ?? "",

        activeTriggerTitles:
            snapshot.activeTriggerTitles?.join(" | ") ?? ""

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
 * Normalize a date for export.
 */

/**
 * Resolve audit attribution for the committed assessment.
 *
 * Assessment snapshots are the authoritative audit record.
 * The snapshot nearest to the assessment timestamp is used.
 */
function getAssessmentAttribution(

    snapshots:EdoriSnapshot[],

    assessmentTime:Date | string

):{

    displayName:string;

    username:string;

    userId:string;

} {

    const assessmentTimestamp =
        new Date(
            assessmentTime
        ).getTime();


    const matchingSnapshot = snapshots
        .slice()
        .sort(
            (first, second) => {

                const firstDistance = Math.abs(
                    new Date(first.timestamp).getTime()
                    -
                    assessmentTimestamp
                );

                const secondDistance = Math.abs(
                    new Date(second.timestamp).getTime()
                    -
                    assessmentTimestamp
                );

                return firstDistance - secondDistance;

            }
        )[0];


    if(!matchingSnapshot){

        return {

            displayName:
                "Legacy / Unknown",

            username:
                "unknown",

            userId:
                "legacy-unknown"

        };

    }


    return {

        displayName:
            matchingSnapshot.enteredByDisplayName
            || "Legacy / Unknown",

        username:
            matchingSnapshot.enteredByUsername
            || "unknown",

        userId:
            matchingSnapshot.enteredByUserId
            || "legacy-unknown"

    };

}


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