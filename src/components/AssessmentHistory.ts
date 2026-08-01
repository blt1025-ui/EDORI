/**
 * AssessmentHistory
 *
 * Displays recently submitted EDORI assessments.
 *
 * This component:
 *
 * - Does not calculate EDORI.
 * - Does not create snapshots.
 * - Reads persistent history from SnapshotService.
 * - Refreshes only after a completed EDORI result.
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

    getSnapshots

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

            <div class="panel-header">

                <div>

                    <h3>
                        Assessment History
                    </h3>

                    <p class="panel-description">
                        Most recently submitted operational assessments
                    </p>

                </div>

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

    updateHistory();


    subscribe(

    APP_EVENTS.RESULT_CHANGED,

    updateHistory

);

}


/**
 * Refresh the history table from persistent
 * EDORI snapshots.
 */
function updateHistory():void {

    const container = document.getElementById(

        "history-table"

    );


    if(!container){

        return;

    }


    const snapshots = getSnapshots()

        .slice()

        .sort(

            (

                first,

                second

            ) => second.timestamp.getTime() -

                first.timestamp.getTime()

        )

        .slice(

            0,

            MAX_VISIBLE_ASSESSMENTS

        );


    if(snapshots.length === 0){

        renderEmptyHistory(

            container

        );

        return;

    }


    container.innerHTML = createHistoryTable(

        snapshots

    );

}


/**
 * Create the history table.
 */
function createHistoryTable(

    snapshots:EdoriSnapshot[]

):string {

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
 * Normalize the snapshot timestamp.
 */
function normalizeTimestamp(

    timestamp:Date

):Date {

    if(timestamp instanceof Date){

        return timestamp;

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
 * Render the empty-history state.
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