/**
 * AssessmentHistory
 *
 * Displays a compact recent-history view of persistent
 * Hospital Readiness assessments using the Alpha–Echo
 * operational-level model.
 *
 * This component does not:
 *
 * - Calculate Hospital Readiness
 * - Evaluate operational triggers
 * - Save or alter snapshots
 * - Reconstruct past trigger-adjusted levels
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    getConfiguredOperationalState

}

from "../services/OperationalStateService";


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


/**
 * Render the Assessment History panel.
 */
export function AssessmentHistory():string {

    return `

        <section class="assessment-history-container">

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

        if(snapshots.length === 0){

            container.innerHTML =
                createEmptyHistoryState();

            return;
        }

        const rows = createHistoryRows(
            snapshots
        );

        container.innerHTML = `

            <div class="assessment-history-card-list">

                ${rows
                    .reverse()
                    .map(
                        row =>
                            createHistoryRowMarkup(
                                row
                            )
                    )
                    .join("")}

            </div>

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

    const state = getConfiguredOperationalState(
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

        <article class="assessment-history-card">

            <div class="assessment-history-card-header">

                <div class="assessment-history-card-identity">

                    <time
                        class="assessment-history-card-time"
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

                    <div class="assessment-history-card-entered-by">

                        <span>
                            Entered by
                        </span>

                        <strong>
                            ${escapeHtml(
                                row.snapshot.enteredByDisplayName
                            )}
                        </strong>

                        ${row.snapshot.enteredByUsername

                            ? `

                                <small>
                                    ${escapeHtml(
                                        row.snapshot.enteredByUsername
                                    )}
                                </small>

                            `

                            : ""

                        }

                    </div>

                </div>


                <div class="assessment-history-card-result">

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


                    <div class="assessment-history-card-score">

                        <span>
                            HRI
                        </span>

                        <strong>
                            ${safeScore}
                        </strong>

                    </div>


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

                </div>

            </div>


            <div class="assessment-history-card-data">

                ${createHistoryDataPoint(
                    "ED Volume",
                    formatSnapshotValue(
                        row.snapshot.totalEDVolume
                    )
                )}

                ${createHistoryDataPoint(
                    "Boarding Patients",
                    formatSnapshotValue(
                        row.snapshot.boardedPatients
                    )
                )}

                ${createHistoryDataPoint(
                    "ESI 1",
                    formatSnapshotValue(
                        row.snapshot.esi1
                    )
                )}

                ${createHistoryDataPoint(
                    "ESI 2",
                    formatSnapshotValue(
                        row.snapshot.esi2
                    )
                )}

                ${createHistoryDataPoint(
                    "Acute Staffed",
                    formatSnapshotValue(
                        row.snapshot.staffedAcuteCareBeds
                    )
                )}

                ${createHistoryDataPoint(
                    "Acute Occupied",
                    formatSnapshotValue(
                        row.snapshot.occupiedAcuteCareBeds
                    )
                )}

                ${createHistoryDataPoint(
                    "Critical Staffed",
                    formatSnapshotValue(
                        row.snapshot.staffedCriticalCareBeds
                    )
                )}

                ${createHistoryDataPoint(
                    "Critical Occupied",
                    formatSnapshotValue(
                        row.snapshot.occupiedCriticalCareBeds
                    )
                )}

                ${createHistoryDataPoint(
                    "Direct Admissions",
                    formatSnapshotValue(
                        row.snapshot.currentDirectAdmissions
                    )
                )}

                ${createHistoryDataPoint(
                    "Surgical / Procedural",
                    formatSnapshotValue(
                        row.snapshot.currentSurgicalAdmissions
                    )
                )}

            </div>

        </article>

    `;

}


function createHistoryDataPoint(

    label:string,

    value:string

):string {

    return `

        <div class="assessment-history-data-point">

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

        return `↑ +${rounded}`;

    }


    if(rounded < 0){

        return `↓ ${Math.abs(
            rounded
        )}`;

    }


    return "— 0";

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
                Completed Hospital Readiness assessments will appear here.
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