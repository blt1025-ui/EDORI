/**
 * OperationalTimeline
 *
 * Displays a readable chronological history of
 * saved EDORI assessments.
 *
 * Timeline entries are derived only from persistent
 * SnapshotService data.
 *
 * This component does not:
 *
 * - Calculate EDORI
 * - Evaluate current triggers
 * - Modify snapshot history
 * - Save application state
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
 * Maximum number of entries displayed in the
 * operational timeline.
 */
const MAXIMUM_TIMELINE_ENTRIES = 20;


/**
 * Internal display model for one timeline entry.
 */
interface OperationalTimelineEntry {

    snapshot:EdoriSnapshot;

    previousSnapshot:EdoriSnapshot | null;

    scoreChange:number | null;

    levelChanged:boolean;

}


/**
 * Render the Operational Timeline panel.
 */
export function OperationalTimeline():string {

    return `

        <section class="operational-timeline-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Operational Timeline
                    </h3>

                    <p class="panel-description">
                        Chronological HRI score and operational-level changes
                    </p>

                </div>


                <span
                    id="operationalTimelineCount"
                    class="operational-timeline-count"
                >
                    0 entries
                </span>

            </div>


            <div
                id="operationalTimelineContent"
                class="operational-timeline-content"
                aria-live="polite"
            >

                ${createEmptyTimelineState()}

            </div>

        </section>

    `;

}


/**
 * Initialize the Operational Timeline.
 */
export function initializeOperationalTimeline():void {

    updateOperationalTimeline();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateOperationalTimeline

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateOperationalTimeline

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateOperationalTimeline

    );

}


/**
 * Refresh the timeline from SnapshotService.
 */
function updateOperationalTimeline():void {

    const container = document.getElementById(

        "operationalTimelineContent"

    );


    if(!container){

        return;

    }


    try {

        const snapshots = getValidChronologicalSnapshots();


        updateTimelineCount(

            snapshots.length

        );


        if(snapshots.length === 0){

            container.innerHTML =

                createEmptyTimelineState();


            return;

        }


        const entries = createTimelineEntries(

            snapshots

        );


        container.innerHTML = `

            <div class="operational-timeline-list">

                ${entries

                    .slice(

                        -MAXIMUM_TIMELINE_ENTRIES

                    )

                    .reverse()

                    .map(

                        entry =>

                            createTimelineEntryMarkup(

                                entry

                            )

                    )

                    .join("")}

            </div>


            ${snapshots.length > MAXIMUM_TIMELINE_ENTRIES

                ? `

                    <div class="operational-timeline-limit-note">

                        Showing the most recent
                        ${MAXIMUM_TIMELINE_ENTRIES}
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

            "Unable to update the operational timeline:",

            error

        );


        updateTimelineCount(

            0

        );


        container.innerHTML = `

            <div class="operational-timeline-empty error">

                <strong>
                    Timeline unavailable
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
 * Create timeline entries and compare each
 * assessment with the preceding assessment.
 */
function createTimelineEntries(

    snapshots:EdoriSnapshot[]

):OperationalTimelineEntry[] {

    return snapshots.map(

        (

            snapshot,

            index

        ) => {

            const previousSnapshot = index > 0

                ? snapshots[index - 1]

                : null;


            const scoreChange = previousSnapshot

                ? snapshot.score

                    -

                    previousSnapshot.score

                : null;


            const currentLevel = getConfiguredOperationalState(

                snapshot.score

            );


            const previousLevel = previousSnapshot

                ? getConfiguredOperationalState(

                    previousSnapshot.score

                )

                : null;


            return {

                snapshot,

                previousSnapshot,

                scoreChange,

                levelChanged:

                    previousLevel !== null

                    &&

                    currentLevel.title

                    !==

                    previousLevel.title

            };

        }

    );

}


/**
 * Create one timeline entry.
 */
function createTimelineEntryMarkup(

    entry:OperationalTimelineEntry

):string {

    const {

        snapshot,

        previousSnapshot,

        scoreChange,

        levelChanged

    } = entry;


    const currentState = getConfiguredOperationalState(

        snapshot.score

    );


    const previousState = previousSnapshot

        ? getConfiguredOperationalState(

            previousSnapshot.score

        )

        : null;


    const safeScore = Math.min(

        100,

        Math.max(

            0,

            Math.round(

                snapshot.score

            )

        )

    );


    const direction = determineScoreDirection(

        scoreChange

    );


    const directionClass = createDirectionClass(

        direction

    );


    const stateClass = createStateClass(

        currentState.title

    );


    return `

        <article class="operational-timeline-entry">

            <div class="operational-timeline-marker-column">

                <div
                    class="
                        operational-timeline-marker
                        ${stateClass}
                    "
                    style="
                        --timeline-level-color:
                        ${escapeAttribute(
                            currentState.color
                        )};
                    "
                    aria-hidden="true"
                >

                    ${escapeHtml(
                        currentState.icon
                    )}

                </div>


                <div class="operational-timeline-line">
                </div>

            </div>


            <div class="operational-timeline-entry-content">

                <div class="operational-timeline-entry-header">

                    <div>

                        <time
                            datetime="${escapeAttribute(
                                new Date(
                                    snapshot.timestamp
                                ).toISOString()
                            )}"
                        >

                            ${escapeHtml(
                                formatTimelineDate(
                                    new Date(
                                        snapshot.timestamp
                                    )
                                )
                            )}

                        </time>


                        <div class="operational-timeline-level">

                            <strong>

                                ${escapeHtml(
                                    currentState.title
                                )}

                            </strong>


                            <span>

                                HRI ${safeScore}

                            </span>

                        </div>

                    </div>


                    <span
                        class="
                            operational-timeline-direction
                            ${directionClass}
                        "
                    >

                        ${escapeHtml(
                            createDirectionLabel(
                                direction,
                                scoreChange
                            )
                        )}

                    </span>

                </div>


                <div class="operational-timeline-description">

                    ${escapeHtml(
                        createTimelineDescription(
                            currentState.title,
                            previousState
                                ?.title
                                ?? null,
                            scoreChange,
                            levelChanged
                        )
                    )}

                </div>


                ${levelChanged

                    &&

                    previousState

                        ? `

                            <div class="operational-timeline-transition">

                                Level changed:

                                <strong>

                                    ${escapeHtml(
                                        previousState.title
                                    )}

                                </strong>

                                <span aria-hidden="true">
                                    →
                                </span>

                                <strong>

                                    ${escapeHtml(
                                        currentState.title
                                    )}

                                </strong>

                            </div>

                        `

                        : ""

                }

            </div>

        </article>

    `;

}


/**
 * Determine score movement.
 */
function determineScoreDirection(

    scoreChange:number | null

):

    | "initial"

    | "improving"

    | "stable"

    | "increasing"

    | "rapidly-increasing" {

    if(scoreChange === null){

        return "initial";

    }


    if(scoreChange <= -5){

        return "improving";

    }


    if(scoreChange >= 10){

        return "rapidly-increasing";

    }


    if(scoreChange > 0){

        return "increasing";

    }


    return "stable";

}


/**
 * Create the direction badge text.
 */
function createDirectionLabel(

    direction:

        | "initial"

        | "improving"

        | "stable"

        | "increasing"

        | "rapidly-increasing",

    scoreChange:number | null

):string {

    if(direction === "initial"){

        return "Initial entry";

    }


    if(scoreChange === null){

        return "No comparison";

    }


    if(direction === "improving"){

        return `${formatSignedNumber(scoreChange)} improving`;

    }


    if(direction === "rapidly-increasing"){

        return `${formatSignedNumber(scoreChange)} rapid increase`;

    }


    if(direction === "increasing"){

        return `${formatSignedNumber(scoreChange)} increase`;

    }


    return scoreChange === 0

        ? "No change"

        : `${formatSignedNumber(scoreChange)} stable`;

}


/**
 * Create a readable event description.
 */
function createTimelineDescription(

    currentLevel:string,

    previousLevel:string | null,

    scoreChange:number | null,

    levelChanged:boolean

):string {

    if(previousLevel === null){

        return `The first saved operational assessment was recorded at level ${currentLevel}.`;

    }


    if(levelChanged){

        return `The operational level changed from ${previousLevel} to ${currentLevel}.`;

    }


    if(scoreChange === null || scoreChange === 0){

        return `The HRI score remained stable within level ${currentLevel}.`;

    }


    if(scoreChange < 0){

        return `The HRI score improved while remaining within level ${currentLevel}.`;

    }


    return `The HRI score increased while remaining within level ${currentLevel}.`;

}


/**
 * Format one timeline timestamp.
 */
function formatTimelineDate(

    date:Date

):string {

    return date.toLocaleString(

        [],

        {

            month:
                "short",

            day:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"

        }

    );

}


/**
 * Create a state-specific CSS class.
 */
function createStateClass(

    title:string

):string {

    return `timeline-level-${title

        .toLowerCase()

        .replace(

            /[^a-z0-9]+/g,

            "-"

        )}`;

}


/**
 * Create a movement-specific CSS class.
 */
function createDirectionClass(

    direction:string

):string {

    return `timeline-direction-${direction}`;

}


/**
 * Update the timeline count.
 */
function updateTimelineCount(

    count:number

):void {

    const element = document.getElementById(

        "operationalTimelineCount"

    );


    if(!element){

        return;

    }


    element.textContent = count === 1

        ? "1 entry"

        : `${count} entries`;

}


/**
 * Create the empty state.
 */
function createEmptyTimelineState():string {

    return `

        <div class="operational-timeline-empty">

            <strong>
                No timeline entries
            </strong>

            <p>
                Saved HRI assessments will appear here after calculation.
            </p>

        </div>

    `;

}


/**
 * Format a signed score change.
 */
function formatSignedNumber(

    value:number

):string {

    const rounded = Math.round(

        value

    );


    if(rounded > 0){

        return `+${rounded}`;

    }


    return String(

        rounded

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
 * Escape text inserted into HTML attributes.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}