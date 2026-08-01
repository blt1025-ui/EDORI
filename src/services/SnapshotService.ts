/**
 * SnapshotService
 *
 * Persistent storage for EDORI assessment history.
 *
 * SnapshotService is the single source of truth for:
 *
 * - Trend charts
 * - Assessment history
 * - Historical score review
 *
 * Responsibilities:
 *
 * - Validate restored snapshots
 * - Save snapshots in chronological order
 * - Prevent duplicate snapshots
 * - Limit browser storage growth
 * - Clear persistent history
 * - Notify history-driven components
 *
 * This service does not calculate EDORI.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    emit

}

from "./EventService";


import type {

    OperationalState

}

from "../config/operationalStates";


import type {

    EdoriSnapshot

}

from "../types/EdoriSnapshot";


const STORAGE_KEY =

    "edori_snapshots";


/**
 * Maximum number of snapshots retained locally.
 *
 * At one assessment per hour, 500 records provide
 * approximately three weeks of continuous history.
 */
const MAXIMUM_SNAPSHOTS = 500;


/**
 * Minimum time between identical-score snapshots.
 */
const DUPLICATE_TIME_WINDOW_MS =

    15 * 60 * 1000;


/**
 * Save a new validated EDORI snapshot.
 */
export function saveSnapshot(

    snapshot:EdoriSnapshot

):void {

    const normalizedSnapshot =

        normalizeSnapshot(

            snapshot

        );


    if(!normalizedSnapshot){

        throw new Error(

            "The EDORI snapshot is invalid and could not be saved."

        );

    }


    const history = getSnapshots();


    history.push(

        normalizedSnapshot

    );


    const normalizedHistory = history

        .sort(

            compareSnapshots

        )

        .slice(

            -MAXIMUM_SNAPSHOTS

        );


    persistSnapshots(

        normalizedHistory

    );

}


/**
 * Return all valid snapshots in chronological order.
 *
 * Defensive copies are returned so dashboard
 * components cannot mutate stored history.
 */
export function getSnapshots():

EdoriSnapshot[] {

    const storedSnapshots =

        loadStoredSnapshots();


    return storedSnapshots

        .sort(

            compareSnapshots

        )

        .map(

            cloneSnapshot

        );

}


/**
 * Return the most recent snapshots.
 */
export function getRecentSnapshots(

    maximumSnapshots:number = 50

):EdoriSnapshot[] {

    const safeMaximum = normalizeMaximum(

        maximumSnapshots

    );


    if(safeMaximum === 0){

        return [];

    }


    return getSnapshots().slice(

        -safeMaximum

    );

}


/**
 * Return the newest stored snapshot.
 */
export function getLatestSnapshot():

EdoriSnapshot | null {

    const history = getSnapshots();


    if(history.length === 0){

        return null;

    }


    return cloneSnapshot(

        history[

            history.length - 1

        ]

    );

}


/**
 * Return the current number of stored snapshots.
 */
export function getSnapshotCount():number {

    return getSnapshots().length;

}


/**
 * Determine whether a new snapshot should be saved.
 *
 * A snapshot is saved when:
 *
 * - no prior history exists;
 * - the EDORI score changed;
 * - the operational state changed;
 * - at least 15 minutes passed since the previous
 *   snapshot.
 */
export function shouldCreateSnapshot(

    snapshot:EdoriSnapshot

):boolean {

    const candidate = normalizeSnapshot(

        snapshot

    );


    if(!candidate){

        return false;

    }


    const previous = getLatestSnapshot();


    if(!previous){

        return true;

    }


    const scoreChanged =

        previous.score

        !==

        candidate.score;


    const statusChanged =

        previous.status

        !==

        candidate.status;


    const operationalStateChanged =

        previous.operationalState.title

        !==

        candidate.operationalState.title;


    const elapsedMilliseconds =

        candidate.timestamp.getTime()

        -

        previous.timestamp.getTime();


    const minimumTimePassed =

        elapsedMilliseconds

        >=

        DUPLICATE_TIME_WINDOW_MS;


    /*
     * If the candidate timestamp is earlier than the
     * latest stored snapshot, do not create a new
     * automatic snapshot.
     */

    if(elapsedMilliseconds < 0){

        return false;

    }


    return scoreChanged

        ||

        statusChanged

        ||

        operationalStateChanged

        ||

        minimumTimePassed;

}


/**
 * Remove all persistent EDORI history.
 */
export function clearSnapshots():void {

    localStorage.removeItem(

        STORAGE_KEY

    );


    emit(

        APP_EVENTS.HISTORY_CHANGED

    );

}


/**
 * Replace all snapshot history.
 *
 * This will support future history import,
 * synchronization, and test fixtures.
 */
export function replaceSnapshots(

    snapshots:EdoriSnapshot[]

):void {

    const validSnapshots = snapshots

        .map(

            normalizeSnapshot

        )

        .filter(

            (

                snapshot

            ):snapshot is EdoriSnapshot =>

                snapshot !== null

        )

        .sort(

            compareSnapshots

        )

        .slice(

            -MAXIMUM_SNAPSHOTS

        );


    if(validSnapshots.length !== snapshots.length){

        throw new Error(

            "One or more EDORI snapshots were invalid."

        );

    }


    persistSnapshots(

        validSnapshots

    );


    emit(

        APP_EVENTS.HISTORY_CHANGED

    );

}


/**
 * Load snapshots safely from browser storage.
 */
function loadStoredSnapshots():

EdoriSnapshot[] {

    try {

        const stored = localStorage.getItem(

            STORAGE_KEY

        );


        if(!stored){

            return [];

        }


        const parsed = JSON.parse(

            stored

        ) as unknown;


        if(!Array.isArray(parsed)){

            throw new Error(

                "Stored EDORI history is not an array."

            );

        }


        const normalizedSnapshots = parsed

            .map(

                normalizeSnapshot

            )

            .filter(

                (

                    snapshot

                ):snapshot is EdoriSnapshot =>

                    snapshot !== null

            );


        /*
         * Reject the complete stored history when
         * any record is invalid. A partial history
         * could produce misleading trend analysis.
         */

        if(

            normalizedSnapshots.length

            !==

            parsed.length

        ){

            throw new Error(

                "Stored EDORI history contains invalid records."

            );

        }


        return normalizedSnapshots

            .sort(

                compareSnapshots

            )

            .slice(

                -MAXIMUM_SNAPSHOTS

            );

    }
    catch(error){

        console.error(

            "Unable to restore EDORI snapshot history:",

            error

        );


        localStorage.removeItem(

            STORAGE_KEY

        );


        return [];

    }

}


/**
 * Persist a validated snapshot collection.
 */
function persistSnapshots(

    snapshots:EdoriSnapshot[]

):void {

    try {

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(

                snapshots

            )

        );

    }
    catch(error){

        console.error(

            "Unable to save EDORI snapshot history:",

            error

        );


        throw new Error(

            "EDORI history could not be saved to browser storage."

        );

    }

}


/**
 * Convert an unknown object into a valid snapshot.
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

        score?:unknown;

        status?:unknown;

        operationalState?:unknown;

        timestamp?:unknown;

    };


    if(

        typeof candidate.score !== "number"

        ||

        !Number.isFinite(

            candidate.score

        )

        ||

        candidate.score < 0

        ||

        candidate.score > 100

    ){

        return null;

    }


    if(

        typeof candidate.status !== "string"

        ||

        candidate.status.trim().length === 0

    ){

        return null;

    }


    const operationalState =

        normalizeOperationalState(

            candidate.operationalState

        );


    if(!operationalState){

        return null;

    }


    const timestamp = normalizeTimestamp(

        candidate.timestamp

    );


    if(!timestamp){

        return null;

    }


    return {

        score:
            Math.round(

                candidate.score

            ),

        status:
            candidate.status.trim(),

        operationalState,

        timestamp

    };

}


/**
 * Validate and copy an operational state.
 */
function normalizeOperationalState(

    value:unknown

):OperationalState | null {

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


    if(

        typeof candidate.title !== "string"

        ||

        candidate.title.trim().length === 0

        ||

        typeof candidate.icon !== "string"

        ||

        candidate.icon.trim().length === 0

        ||

        typeof candidate.color !== "string"

        ||

        candidate.color.trim().length === 0

        ||

        typeof candidate.recommendation !== "string"

        ||

        candidate.recommendation.trim().length === 0

    ){

        return null;

    }


    return {

        title:
            candidate.title.trim(),

        icon:
            candidate.icon.trim(),

        color:
            candidate.color.trim(),

        recommendation:
            candidate.recommendation.trim()

    };

}


/**
 * Convert an unknown timestamp into a valid Date.
 */
function normalizeTimestamp(

    value:unknown

):Date | null {

    const timestamp = value instanceof Date

        ? new Date(

            value.getTime()

        )

        : typeof value === "string"

            ||

            typeof value === "number"

                ? new Date(

                    value

                )

                : null;


    if(

        !timestamp

        ||

        Number.isNaN(

            timestamp.getTime()

        )

    ){

        return null;

    }


    return timestamp;

}


/**
 * Sort snapshots from oldest to newest.
 */
function compareSnapshots(

    first:EdoriSnapshot,

    second:EdoriSnapshot

):number {

    return first.timestamp.getTime()

        -

        second.timestamp.getTime();

}


/**
 * Return a defensive snapshot copy.
 */
function cloneSnapshot(

    snapshot:EdoriSnapshot

):EdoriSnapshot {

    return {

        score:
            snapshot.score,

        status:
            snapshot.status,

        operationalState:{

            ...snapshot.operationalState

        },

        timestamp:new Date(

            snapshot.timestamp

        )

    };

}


/**
 * Normalize a requested history limit.
 */
function normalizeMaximum(

    value:number

):number {

    if(!Number.isFinite(value)){

        return 0;

    }


    return Math.min(

        MAXIMUM_SNAPSHOTS,

        Math.max(

            0,

            Math.floor(

                value

            )

        )

    );

}