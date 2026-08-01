/**
 * AssessmentHistory
 *
 * Displays recently submitted EDORI assessments.
 *
 * SnapshotService is the single source of truth.
 *
 * This component:
 *
 * - Does not calculate EDORI
 * - Does not create snapshots
 * - Reads persistent history from SnapshotService
 * - Supports clearing history with confirmation
 * - Refreshes after result or history changes
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

    clearSnapshots,

    getSnapshots,

    getSnapshotCount

}

from "../services/SnapshotService";


import type {

    EdoriSnapshot

}

from "../types/EdoriSnapshot";


const MAX_VISIBLE_ASSESSMENTS = 10;


/**
 * Render the assessment-history panel.
 */
export function AssessmentHistory():string {

    return `

        <section class="history-container">

            <div class="panel-header history-panel-header">

                <div>

                    <h3>
                        Assessment History
                    </h3>

                    <p class="panel-description">
                        Most recently submitted operational assessments
                    </p>

                </div>


                <div class="history-header-actions">

                    <span
                        id="historyRecordCount"
                        class="history-record-count"
                    >
                        0 records
                    </span>


                    <button
                        id="clearHistoryButton"
                        class="danger-secondary-button history-clear-button"
                        type="button"
                        disabled
                    >
                        Clear History
                    </button>

                </div>

            </div>


            <div
                id="historyMessage"
                class="history-message"
                aria-live="polite"
            >
            </div>


            <div
                id="history-table"
                class="history-content"
            >

                <div class="history-empty-state">

                    <span class="empty-state-icon">
                        …
                    </span>

                    <p>
                        No submitted assessments are available.
                    </p>

                </div>

            </div>

        </section>

    `;

}


/**
 * Initialize the history panel.
 */
export function initializeAssessmentHistory():void {

    initializeClearHistoryButton();

    updateHistory();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateHistory

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateHistory

    );

}


/**
 * Initialize the clear-history action.
 */
function initializeClearHistoryButton():void {

    const button = document.getElementById(

        "clearHistoryButton"

    ) as HTMLButtonElement | null;


    if(!button){

        console.warn(

            "AssessmentHistory could not find clearHistoryButton."

        );

        return;

    }


    button.addEventListener(

        "click",

        clearHistoryWithConfirmation

    );

}


/**
 * Confirm and clear persistent EDORI history.
 */
function clearHistoryWithConfirmation():void {

    const recordCount = getSnapshotCount();


    if(recordCount === 0){

        showHistoryMessage(

            "There is no assessment history to clear.",

            "default"

        );

        return;

    }


    const confirmationMessage =

        recordCount === 1

            ? "Permanently remove the stored EDORI assessment history? This will remove 1 record from the trend chart and history table."

            : `Permanently remove the stored EDORI assessment history? This will remove ${recordCount} records from the trend chart and history table.`;


    const confirmed = window.confirm(

        confirmationMessage

    );


    if(!confirmed){

        showHistoryMessage(

            "Assessment history was not changed.",

            "default"

        );

        return;

    }


    try {

        clearSnapshots();


        showHistoryMessage(

            "Assessment history was cleared successfully.",

            "success"

        );

    }
    catch(error){

        console.error(

            "Unable to clear EDORI assessment history:",

            error

        );


        showHistoryMessage(

            "Assessment history could not be cleared.",

            "error"

        );

    }

}


/**
 * Refresh the history table from persistent
 * snapshots.
 */
function updateHistory():void {

    const container = document.getElementById(

        "history-table"

    );


    if(!container){

        return;

    }


    const allSnapshots = getSnapshots();


    updateHistoryRecordCount(

        allSnapshots.length

    );


    updateClearButtonState(

        allSnapshots.length > 0

    );


    const visibleSnapshots = allSnapshots

        .slice()

        .sort(

            (

                first,

                second

            ) =>

                second.timestamp.getTime()

                -

                first.timestamp.getTime()

        )

        .slice(

            0,

            MAX_VISIBLE_ASSESSMENTS

        );


    if(visibleSnapshots.length === 0){

        renderEmptyHistory(

            container

        );

        return;

    }


    container.innerHTML = createHistoryTable(

        visibleSnapshots,

        allSnapshots.length

    );

}


/**
 * Create the history table.
 */
function createHistoryTable(

    snapshots:EdoriSnapshot[],

    totalRecordCount:number

):string {

    const additionalRecordCount =

        Math.max(

            0,

            totalRecordCount -

            snapshots.length

        );


    const additionalRecordsMessage =

        additionalRecordCount > 0

            ? `

                <p class="history-truncation-message">

                    Showing the 10 most recent assessments.

                    ${additionalRecordCount}

                    older

                    ${additionalRecordCount === 1 ? "record is" : "records are"}

                    retained in browser history.

                </p>

            `

            : "";


    return `

        <div class="history-table-wrapper">

            <table class="history-table">

                <thead>

                    <tr>

                        <th scope="col">
                            Date
                        </th>

                        <th scope="col">
                            Time
                        </th>

                        <th scope="col">
                            Score
                        </th>

                        <th scope="col">
                            Operational State
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${snapshots

                        .map(

                            snapshot => createHistoryRow(

                                snapshot

                            )

                        )

                        .join("")}

                </tbody>

            </table>

        </div>


        ${additionalRecordsMessage}

    `;

}


/**
 * Create one history row.
 */
function createHistoryRow(

    snapshot:EdoriSnapshot

):string {

    const timestamp = normalizeTimestamp(

        snapshot.timestamp

    );


    const operationalState =

        snapshot.operationalState;


    const stateTitle = operationalState?.title

        ?? snapshot.status

        ?? "Unknown";


    const stateIcon = operationalState?.icon

        ?? "•";


    const stateColor = operationalState?.color

        ?? "#64748b";


    return `

        <tr>

            <td>

                ${formatDate(timestamp)}

            </td>


            <td>

                ${formatTime(timestamp)}

            </td>


            <td>

                <strong class="history-score">

                    ${Math.round(snapshot.score)}

                </strong>

            </td>


            <td>

                <span
                    class="history-state"
                    style="--history-state-color:${escapeAttribute(stateColor)};"
                >

                    <span
                        class="history-state-icon"
                        aria-hidden="true"
                    >

                        ${escapeHtml(stateIcon)}

                    </span>


                    ${escapeHtml(stateTitle)}

                </span>

            </td>

        </tr>

    `;

}


/**
 * Update the total history-record indicator.
 */
function updateHistoryRecordCount(

    count:number

):void {

    const element = document.getElementById(

        "historyRecordCount"

    );


    if(!element){

        return;

    }


    element.textContent =

        count === 1

            ? "1 record"

            : `${count} records`;

}


/**
 * Enable or disable the Clear History button.
 */
function updateClearButtonState(

    historyExists:boolean

):void {

    const button = document.getElementById(

        "clearHistoryButton"

    ) as HTMLButtonElement | null;


    if(!button){

        return;

    }


    button.disabled =

        !historyExists;

}


/**
 * Display the empty-history state.
 */
function renderEmptyHistory(

    container:HTMLElement

):void {

    container.innerHTML = `

        <div class="history-empty-state">

            <span class="empty-state-icon">
                …
            </span>

            <p>
                No submitted assessments are available.
            </p>

        </div>

    `;

}


/**
 * Update the history operation message.
 */
function showHistoryMessage(

    message:string,

    type:

        | "default"

        | "success"

        | "error"

):void {

    const element = document.getElementById(

        "historyMessage"

    );


    if(!element){

        return;

    }


    element.textContent = message;


    element.classList.remove(

        "history-message-default",

        "history-message-success",

        "history-message-error"

    );


    if(message.length === 0){

        return;

    }


    element.classList.add(

        `history-message-${type}`

    );

}


/**
 * Normalize a snapshot timestamp.
 */
function normalizeTimestamp(

    timestamp:Date

):Date {

    if(timestamp instanceof Date){

        return new Date(

            timestamp

        );

    }


    return new Date(

        timestamp

    );

}


/**
 * Format the history date.
 */
function formatDate(

    timestamp:Date

):string {

    if(Number.isNaN(timestamp.getTime())){

        return "Unknown";

    }


    return timestamp.toLocaleDateString(

        [],

        {

            year:"numeric",

            month:"short",

            day:"numeric"

        }

    );

}


/**
 * Format the history time.
 */
function formatTime(

    timestamp:Date

):string {

    if(Number.isNaN(timestamp.getTime())){

        return "Unknown";

    }


    return timestamp.toLocaleTimeString(

        [],

        {

            hour:"2-digit",

            minute:"2-digit"

        }

    );

}


/**
 * Escape text inserted into HTML.
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


/**
 * Escape a value used inside an HTML attribute.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}