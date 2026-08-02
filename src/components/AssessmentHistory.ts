/**
 * AssessmentHistory
 *
 * Displays persistent EDORI assessment history
 * using the Alpha–Echo operational-level model.
 *
 * This component does not:
 *
 * - Calculate EDORI
 * - Evaluate operational triggers
 * - Save or alter snapshots
 * - Reconstruct past trigger-adjusted levels
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    getOperationalState

}

from "../config/operationalStates";


import {

    subscribe

}

from "../services/EventService";


import {

    clearSnapshots,

    getSnapshots

}

from "../services/SnapshotService";


import type {

    EdoriSnapshot

}

from "../types/EdoriSnapshot";


/**
 * Maximum number of rows displayed at once.
 */
const MAXIMUM_DISPLAYED_ROWS = 50;


/**
 * Render the Assessment History panel.
 */
export function AssessmentHistory():string {

    return `

        <section class="assessment-history-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Assessment History
                    </h3>

                    <p class="panel-description">
                        Saved EDORI assessments and Alpha–Echo levels
                    </p>

                </div>


                <div class="assessment-history-header-actions">

                    <span
                        id="assessmentHistoryCount"
                        class="assessment-history-count"
                    >
                        0 assessments
                    </span>


                    <button
                        id="clearAssessmentHistoryButton"
                        class="assessment-history-clear-button"
                        type="button"
                        disabled
                    >
                        Clear History
                    </button>

                </div>

            </div>


            <div
                id="assessmentHistoryContent"
                class="assessment-history-content"
                aria-live="polite"
            >

                ${createEmptyHistoryState()}

            </div>

        </section>

    `;

}


/**
 * Initialize assessment-history behavior.
 */
export function initializeAssessmentHistory():void {

    const clearButton = document.getElementById(

        "clearAssessmentHistoryButton"

    );


    clearButton?.addEventListener(

        "click",

        handleClearHistory

    );


    updateAssessmentHistory();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateAssessmentHistory

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateAssessmentHistory

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateAssessmentHistory

    );

}


/**
 * Refresh history from SnapshotService.
 */
function updateAssessmentHistory():void {

    const container = document.getElementById(

        "assessmentHistoryContent"

    );


    if(!container){

        return;

    }


    try {

        const snapshots =

            getValidChronologicalSnapshots();


        updateHistoryCount(

            snapshots.length

        );


        updateClearButton(

            snapshots.length > 0

        );


        if(snapshots.length === 0){

            container.innerHTML =

                createEmptyHistoryState();


            return;

        }


        const rows = createHistoryRows(

            snapshots

        );


        container.innerHTML = `

            <div class="assessment-history-table-wrapper">

                <table class="assessment-history-table">

                    <thead>

                        <tr>

                            <th scope="col">
                                Time
                            </th>

                            <th scope="col">
                                Level
                            </th>

                            <th scope="col">
                                Score
                            </th>

                            <th scope="col">
                                Change
                            </th>

                            <th scope="col">
                                ED Volume
                            </th>

                            <th scope="col">
                                Boarding
                            </th>

                            <th scope="col">
                                Medical Beds
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${rows

                            .slice(

                                -MAXIMUM_DISPLAYED_ROWS

                            )

                            .reverse()

                            .map(

                                row =>

                                    createHistoryRowMarkup(

                                        row

                                    )

                            )

                            .join("")}

                    </tbody>

                </table>

            </div>


            ${snapshots.length > MAXIMUM_DISPLAYED_ROWS

                ? `

                    <div class="assessment-history-limit-note">

                        Showing the most recent
                        ${MAXIMUM_DISPLAYED_ROWS}
                        of
                        ${snapshots.length}
                        saved assessments.

                    </div>

                `

                : ""

            }

        `;

    }
    catch(error){

        console.error(

            "Unable to update assessment history:",

            error

        );


        updateHistoryCount(

            0

        );


        updateClearButton(

            false

        );


        container.innerHTML = `

            <div class="assessment-history-empty error">

                <strong>
                    Assessment history unavailable
                </strong>

                <p>
                    Review the browser console for additional details.
                </p>

            </div>

        `;

    }

}


/**
 * Return valid snapshots in chronological order.
 */
function getValidChronologicalSnapshots():

EdoriSnapshot[] {

    return getSnapshots()

        .filter(

            snapshot =>

                Number.isFinite(

                    snapshot.score

                )

                &&

                !Number.isNaN(

                    new Date(

                        snapshot.timestamp

                    ).getTime()

                )

        )

        .map(

            snapshot => ({

                ...snapshot,

                operationalState:{

                    ...snapshot.operationalState

                },

                timestamp:new Date(

                    snapshot.timestamp

                )

            })

        )

        .sort(

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

}


/**
 * Create history rows with score-change data.
 */
function createHistoryRows(

    snapshots:EdoriSnapshot[]

):Array<{

    snapshot:EdoriSnapshot;

    scoreChange:number | null;

}> {

    return snapshots.map(

        (

            snapshot,

            index

        ) => {

            const previousSnapshot = index > 0

                ? snapshots[index - 1]

                : null;


            return {

                snapshot,

                scoreChange:previousSnapshot

                    ? snapshot.score

                        -

                        previousSnapshot.score

                    : null

            };

        }

    );

}


/**
 * Create one history-table row.
 */
function createHistoryRowMarkup(

    row:{

        snapshot:EdoriSnapshot;

        scoreChange:number | null;

    }

):string {

    const state = getOperationalState(

        row.snapshot.score

    );


    const safeScore = Math.min(

        100,

        Math.max(

            0,

            Math.round(

                row.snapshot.score

            )

        )

    );


    const scoreChangeClass =

        createScoreChangeClass(

            row.scoreChange

        );


    const scoreChangeText =

        createScoreChangeText(

            row.scoreChange

        );


    return `

        <tr>

            <td>

                <time
                    datetime="${escapeAttribute(
                        new Date(
                            row.snapshot.timestamp
                        ).toISOString()
                    )}"
                >

                    ${escapeHtml(
                        formatAssessmentDate(
                            new Date(
                                row.snapshot.timestamp
                            )
                        )
                    )}

                </time>

            </td>


            <td>

                <span
                    class="assessment-history-level"
                    style="
                        --history-level-color:
                        ${escapeAttribute(
                            state.color
                        )};
                    "
                >

                    <span
                        class="assessment-history-level-icon"
                        aria-hidden="true"
                    >

                        ${escapeHtml(
                            state.icon
                        )}

                    </span>


                    <strong>

                        ${escapeHtml(
                            state.title
                        )}

                    </strong>

                </span>

            </td>


            <td>

                <strong class="assessment-history-score">

                    ${safeScore}

                </strong>

            </td>


            <td>

                <span
                    class="
                        assessment-history-change
                        ${scoreChangeClass}
                    "
                >

                    ${escapeHtml(
                        scoreChangeText
                    )}

                </span>

            </td>


            <td>

                ${formatSnapshotValue(
                    row.snapshot.totalEDVolume
                )}

            </td>


            <td>

                ${formatSnapshotValue(
                    row.snapshot.boardedPatients
                )}

            </td>


            <td>

                ${formatSnapshotValue(
                    row.snapshot.occupiedMedicalBeds
                )}

            </td>

        </tr>

    `;

}


/**
 * Clear saved snapshot history after confirmation.
 */
function handleClearHistory():void {

    const snapshots = getSnapshots();


    if(snapshots.length === 0){

        return;

    }


    const confirmed = window.confirm(

        "Clear all saved EDORI assessment history? This cannot be undone."

    );


    if(!confirmed){

        return;

    }


    try {

        clearSnapshots();

    }
    catch(error){

        console.error(

            "Unable to clear assessment history:",

            error

        );


        window.alert(

            "Assessment history could not be cleared."

        );

    }

}


/**
 * Update the saved-assessment count.
 */
function updateHistoryCount(

    count:number

):void {

    const element = document.getElementById(

        "assessmentHistoryCount"

    );


    if(!element){

        return;

    }


    element.textContent = count === 1

        ? "1 assessment"

        : `${count} assessments`;

}


/**
 * Enable or disable the clear-history button.
 */
function updateClearButton(

    enabled:boolean

):void {

    const button = document.getElementById(

        "clearAssessmentHistoryButton"

    ) as HTMLButtonElement | null;


    if(!button){

        return;

    }


    button.disabled = !enabled;

}


/**
 * Create score-change text.
 */
function createScoreChangeText(

    scoreChange:number | null

):string {

    if(scoreChange === null){

        return "Initial";

    }


    const rounded = Math.round(

        scoreChange

    );


    if(rounded > 0){

        return `+${rounded}`;

    }


    return String(

        rounded

    );

}


/**
 * Create score-change styling.
 */
function createScoreChangeClass(

    scoreChange:number | null

):string {

    if(scoreChange === null){

        return "history-change-initial";

    }


    if(scoreChange <= -5){

        return "history-change-improving";

    }


    if(scoreChange >= 10){

        return "history-change-critical";

    }


    if(scoreChange > 0){

        return "history-change-increasing";

    }


    return "history-change-stable";

}


/**
 * Format the assessment timestamp.
 */
function formatAssessmentDate(

    date:Date

):string {

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
 * Format a saved snapshot value.
 */
function formatSnapshotValue(

    value:number | undefined

):string {

    if(

        value === undefined

        ||

        !Number.isFinite(value)

    ){

        return "--";

    }


    if(Number.isInteger(value)){

        return String(value);

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


/**
 * Create the empty-history state.
 */
function createEmptyHistoryState():string {

    return `

        <div class="assessment-history-empty">

            <strong>
                No saved assessments
            </strong>

            <p>
                Completed EDORI calculations will appear here.
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
 * Escape text inserted into HTML attributes.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}