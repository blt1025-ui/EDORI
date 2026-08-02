/**
 * SnapshotService
 *
 * Stores and restores persistent EDORI assessment
 * history.
 *
 * Responsibilities:
 *
 * - Validate incoming snapshots
 * - Preserve expanded assessment fields
 * - Prevent accidental duplicate snapshots
 * - Persist history in localStorage
 * - Restore valid history on application startup
 * - Return defensive copies
 * - Clear history
 * - Notify subscribed components when history changes
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

    OperationalStateTitle

}

from "../types/OperationalStateTitle";


import type {

    EdoriSnapshot

}

from "../types/EdoriSnapshot";


/**
 * Browser-storage key.
 */
const SNAPSHOT_STORAGE_KEY =

    "edori_snapshots";


/**
 * Maximum number of snapshots retained locally.
 *
 * This prevents localStorage from growing without
 * limit during development and extended use.
 */
const MAXIMUM_SNAPSHOT_COUNT = 500;


/**
 * Snapshots created within this time window with
 * the same score and assessment values are treated
 * as duplicates.
 */
const DUPLICATE_TIME_WINDOW_MILLISECONDS =

    5_000;


/**
 * In-memory authoritative history.
 */
let snapshots:EdoriSnapshot[] =

    restoreSnapshots();


/**
 * Return a defensive copy of all snapshots in
 * chronological order.
 */
export function getSnapshots():EdoriSnapshot[] {

    return snapshots

        .slice()

        .sort(

            compareSnapshotsChronologically

        )

        .map(

            snapshot =>

                cloneSnapshot(

                    snapshot

                )

        );

}


/**
 * Return the newest saved snapshot.
 */
export function getLatestSnapshot():

EdoriSnapshot | null {

    if(snapshots.length === 0){

        return null;

    }


    const latestSnapshot = snapshots

        .slice()

        .sort(

            compareSnapshotsChronologically

        )[

            snapshots.length - 1

        ];


    return latestSnapshot

        ? cloneSnapshot(

            latestSnapshot

        )

        : null;

}


/**
 * Save one completed EDORI snapshot.
 *
 * Returns true when the snapshot was saved.
 * Returns false when it was invalid or duplicated.
 */
export function saveSnapshot(

    candidate:EdoriSnapshot

):boolean {

    const normalizedSnapshot = normalizeSnapshot(

        candidate

    );


    if(!normalizedSnapshot){

        console.warn(

            "SnapshotService rejected an invalid EDORI snapshot.",

            candidate

        );


        return false;

    }


    if(

        isDuplicateSnapshot(

            normalizedSnapshot

        )

    ){

        return false;

    }


    snapshots.push(

        cloneSnapshot(

            normalizedSnapshot

        )

    );


    snapshots.sort(

        compareSnapshotsChronologically

    );


    trimSnapshotHistory();


    persistSnapshots();


    publishHistoryChanged();


    return true;

}


/**
 * Compatibility alias for code that uses
 * addSnapshot().
 */
export function addSnapshot(

    candidate:EdoriSnapshot

):boolean {

    return saveSnapshot(

        candidate

    );

}


/**
 * Compatibility alias for code that uses
 * recordSnapshot().
 */
export function recordSnapshot(

    candidate:EdoriSnapshot

):boolean {

    return saveSnapshot(

        candidate

    );

}


/**
 * Determine whether an incoming snapshot should be
 * stored.
 *
 * This function does not mutate history.
 */
export function shouldSaveSnapshot(

    candidate:EdoriSnapshot

):boolean {

    const normalizedSnapshot = normalizeSnapshot(

        candidate

    );


    if(!normalizedSnapshot){

        return false;

    }


    return !isDuplicateSnapshot(

        normalizedSnapshot

    );

}

/**
 * Compatibility alias used by EdoriEngine.
 */
export function shouldCreateSnapshot(

    candidate:EdoriSnapshot

):boolean {

    return shouldSaveSnapshot(

        candidate

    );

}

/**
 * Replace the complete snapshot history.
 *
 * Useful for import, restoration, and testing.
 */
export function replaceSnapshots(

    candidates:EdoriSnapshot[]

):void {

    const normalizedSnapshots = candidates

        .map(

            candidate =>

                normalizeSnapshot(

                    candidate

                )

        )

        .filter(

            (

                snapshot

            ):snapshot is EdoriSnapshot =>

                snapshot !== null

        )

        .sort(

            compareSnapshotsChronologically

        );


    snapshots = removeDuplicateSnapshots(

        normalizedSnapshots

    );


    trimSnapshotHistory();


    persistSnapshots();


    publishHistoryChanged();

}


/**
 * Clear all persistent assessment history.
 */
export function clearSnapshots():void {

    snapshots = [];


    try {

        localStorage.removeItem(

            SNAPSHOT_STORAGE_KEY

        );

    }
    catch(error){

        console.error(

            "SnapshotService could not remove saved history.",

            error

        );

    }


    publishHistoryChanged();

}


/**
 * Return the number of stored snapshots.
 */
export function getSnapshotCount():number {

    return snapshots.length;

}


/**
 * Restore persistent snapshots from localStorage.
 */
function restoreSnapshots():EdoriSnapshot[] {

    let storedValue:string | null = null;


    try {

        storedValue = localStorage.getItem(

            SNAPSHOT_STORAGE_KEY

        );

    }
    catch(error){

        console.error(

            "SnapshotService could not read saved history.",

            error

        );


        return [];

    }


    if(!storedValue){

        return [];

    }


    try {

        const parsed:unknown = JSON.parse(

            storedValue

        );


        if(!Array.isArray(parsed)){

            removeCorruptedStorage();


            return [];

        }


        const restoredSnapshots = parsed

            .map(

                candidate =>

                    normalizeSnapshot(

                        candidate

                    )

            )

            .filter(

                (

                    snapshot

                ):snapshot is EdoriSnapshot =>

                    snapshot !== null

            )

            .sort(

                compareSnapshotsChronologically

            );


        const uniqueSnapshots =

            removeDuplicateSnapshots(

                restoredSnapshots

            );


        return uniqueSnapshots.slice(

            -MAXIMUM_SNAPSHOT_COUNT

        );

    }
    catch(error){

        console.warn(

            "SnapshotService discarded corrupted saved history.",

            error

        );


        removeCorruptedStorage();


        return [];

    }

}


/**
 * Persist the complete expanded snapshot objects.
 */
function persistSnapshots():void {

    try {

        const serializedSnapshots = snapshots.map(

            snapshot =>

                serializeSnapshot(

                    snapshot

                )

        );


        localStorage.setItem(

            SNAPSHOT_STORAGE_KEY,

            JSON.stringify(

                serializedSnapshots

            )

        );

    }
    catch(error){

        console.error(

            "SnapshotService could not persist assessment history.",

            error

        );

    }

}


/**
 * Convert one snapshot into a JSON-safe object.
 *
 * All expanded fields are intentionally retained.
 */
function serializeSnapshot(

    snapshot:EdoriSnapshot

):Record<string, unknown> {

    return {

        score:
            snapshot.score,

        status:
            snapshot.status,

        operationalState:{

            title:
                snapshot.operationalState.title,

            icon:
                snapshot.operationalState.icon,

            color:
                snapshot.operationalState.color,

            recommendation:
                snapshot.operationalState
                    .recommendation

        },

        timestamp:
            new Date(

                snapshot.timestamp

            ).toISOString(),

        id:
            snapshot.id,

        totalEDVolume:
            snapshot.totalEDVolume,

        boardedPatients:
            snapshot.boardedPatients,

        occupiedMedicalBeds:
            snapshot.occupiedMedicalBeds,

        esi1:
            snapshot.esi1,

        esi2:
            snapshot.esi2,

        esi3:
            snapshot.esi3,

        esi4:
            snapshot.esi4,

        esi5:
            snapshot.esi5,

        expectedVolume:
            snapshot.expectedVolume,

        expectedBoarders:
            snapshot.expectedBoarders,

        expectedArrivals:
            snapshot.expectedArrivals,

        expectedDepartures:
            snapshot.expectedDepartures,

        demandScore:
            snapshot.demandScore,

        boardingScore:
            snapshot.boardingScore,

        hospitalScore:
            snapshot.hospitalScore,

        acuityScore:
            snapshot.acuityScore,

        forecastScore:
            snapshot.forecastScore,

        day:
            snapshot.day,

        hour:
            snapshot.hour

    };

}


/**
 * Validate and normalize an unknown snapshot.
 *
 * The four legacy fields remain required:
 *
 * - score
 * - status
 * - operationalState
 * - timestamp
 *
 * Expanded assessment fields remain optional for
 * compatibility with older history records.
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

        id?:unknown;

        totalEDVolume?:unknown;

        boardedPatients?:unknown;

        occupiedMedicalBeds?:unknown;

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


    const score = normalizeRequiredNumber(

        candidate.score

    );


    const timestamp = normalizeDate(

        candidate.timestamp

    );


    const operationalState =

        normalizeOperationalState(

            candidate.operationalState

        );


    if(

        score === null

        ||

        timestamp === null

        ||

        operationalState === null

    ){

        return null;

    }


    const status =

        typeof candidate.status === "string"

        &&

        candidate.status.trim().length > 0

            ? candidate.status.trim()

            : operationalState.title;


    return {

        score:
            clampScore(

                score

            ),

        status,

        operationalState,

        timestamp,

        id:
            normalizeOptionalString(

                candidate.id

            ),

        totalEDVolume:
            normalizeOptionalNonNegativeNumber(

                candidate.totalEDVolume

            ),

        boardedPatients:
            normalizeOptionalNonNegativeNumber(

                candidate.boardedPatients

            ),

        occupiedMedicalBeds:
            normalizeOptionalNonNegativeNumber(

                candidate.occupiedMedicalBeds

            ),

        esi1:
            normalizeOptionalNonNegativeNumber(

                candidate.esi1

            ),

        esi2:
            normalizeOptionalNonNegativeNumber(

                candidate.esi2

            ),

        esi3:
            normalizeOptionalNonNegativeNumber(

                candidate.esi3

            ),

        esi4:
            normalizeOptionalNonNegativeNumber(

                candidate.esi4

            ),

        esi5:
            normalizeOptionalNonNegativeNumber(

                candidate.esi5

            ),

        expectedVolume:
            normalizeOptionalNonNegativeNumber(

                candidate.expectedVolume

            ),

        expectedBoarders:
            normalizeOptionalNonNegativeNumber(

                candidate.expectedBoarders

            ),

        expectedArrivals:
            normalizeOptionalNonNegativeNumber(

                candidate.expectedArrivals

            ),

        expectedDepartures:
            normalizeOptionalNonNegativeNumber(

                candidate.expectedDepartures

            ),

        demandScore:
            normalizeOptionalScore(

                candidate.demandScore

            ),

        boardingScore:
            normalizeOptionalScore(

                candidate.boardingScore

            ),

        hospitalScore:
            normalizeOptionalScore(

                candidate.hospitalScore

            ),

        acuityScore:
            normalizeOptionalScore(

                candidate.acuityScore

            ),

        forecastScore:
            normalizeOptionalScore(

                candidate.forecastScore

            ),

        day:
            normalizeOptionalString(

                candidate.day

            ),

        hour:
            normalizeOptionalHour(

                candidate.hour

            )

    };

}


/**
 * Validate and normalize an operational state.
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

        !isOperationalStateTitle(

            candidate.title

        )

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
            candidate.title,

        icon:
            candidate.icon.trim(),

        color:
            candidate.color.trim(),

        recommendation:
            candidate.recommendation.trim()

    };

}


/**
 * Determine whether a value is a supported
 * Alpha–Echo operational title.
 */
function isOperationalStateTitle(

    value:unknown

):value is OperationalStateTitle {

    if(typeof value !== "string"){

        return false;

    }


    const titles:OperationalStateTitle[] = [

        "Alpha",

        "Bravo",

        "Charlie",

        "Delta",

        "Echo"

    ];


    return titles.includes(

        value as OperationalStateTitle

    );

}


/**
 * Create a defensive copy of one snapshot.
 *
 * Every expanded field is retained.
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

        ),

        id:
            snapshot.id,

        totalEDVolume:
            snapshot.totalEDVolume,

        boardedPatients:
            snapshot.boardedPatients,

        occupiedMedicalBeds:
            snapshot.occupiedMedicalBeds,

        esi1:
            snapshot.esi1,

        esi2:
            snapshot.esi2,

        esi3:
            snapshot.esi3,

        esi4:
            snapshot.esi4,

        esi5:
            snapshot.esi5,

        expectedVolume:
            snapshot.expectedVolume,

        expectedBoarders:
            snapshot.expectedBoarders,

        expectedArrivals:
            snapshot.expectedArrivals,

        expectedDepartures:
            snapshot.expectedDepartures,

        demandScore:
            snapshot.demandScore,

        boardingScore:
            snapshot.boardingScore,

        hospitalScore:
            snapshot.hospitalScore,

        acuityScore:
            snapshot.acuityScore,

        forecastScore:
            snapshot.forecastScore,

        day:
            snapshot.day,

        hour:
            snapshot.hour

    };

}


/**
 * Determine whether a snapshot duplicates the most
 * recently saved assessment.
 */
function isDuplicateSnapshot(

    candidate:EdoriSnapshot

):boolean {

    const latestSnapshot = snapshots

        .slice()

        .sort(

            compareSnapshotsChronologically

        )[

            snapshots.length - 1

        ];


    if(!latestSnapshot){

        return false;

    }


    const timeDifference = Math.abs(

        new Date(

            candidate.timestamp

        ).getTime()

        -

        new Date(

            latestSnapshot.timestamp

        ).getTime()

    );


    if(

        timeDifference

        >

        DUPLICATE_TIME_WINDOW_MILLISECONDS

    ){

        return false;

    }


    return snapshotsContainSameAssessment(

        latestSnapshot,

        candidate

    );

}


/**
 * Compare values that identify one assessment.
 */
function snapshotsContainSameAssessment(

    previous:EdoriSnapshot,

    candidate:EdoriSnapshot

):boolean {

    return previous.score === candidate.score

        &&

        previous.status === candidate.status

        &&

        previous.operationalState.title

            ===

            candidate.operationalState.title

        &&

        previous.totalEDVolume

            ===

            candidate.totalEDVolume

        &&

        previous.boardedPatients

            ===

            candidate.boardedPatients

        &&

        previous.occupiedMedicalBeds

            ===

            candidate.occupiedMedicalBeds

        &&

        previous.esi1 === candidate.esi1

        &&

        previous.esi2 === candidate.esi2

        &&

        previous.esi3 === candidate.esi3

        &&

        previous.esi4 === candidate.esi4

        &&

        previous.esi5 === candidate.esi5;

}


/**
 * Remove duplicated restored records.
 */
function removeDuplicateSnapshots(

    candidates:EdoriSnapshot[]

):EdoriSnapshot[] {

    const uniqueSnapshots:EdoriSnapshot[] = [];


    candidates.forEach(

        candidate => {

            const previousSnapshot =

                uniqueSnapshots[

                    uniqueSnapshots.length - 1

                ];


            if(!previousSnapshot){

                uniqueSnapshots.push(

                    cloneSnapshot(

                        candidate

                    )

                );


                return;

            }


            const timeDifference = Math.abs(

                new Date(

                    candidate.timestamp

                ).getTime()

                -

                new Date(

                    previousSnapshot.timestamp

                ).getTime()

            );


            const duplicated =

                timeDifference

                <=

                DUPLICATE_TIME_WINDOW_MILLISECONDS

                &&

                snapshotsContainSameAssessment(

                    previousSnapshot,

                    candidate

                );


            if(!duplicated){

                uniqueSnapshots.push(

                    cloneSnapshot(

                        candidate

                    )

                );

            }

        }

    );


    return uniqueSnapshots;

}


/**
 * Keep only the newest configured number of
 * snapshots.
 */
function trimSnapshotHistory():void {

    if(

        snapshots.length

        <=

        MAXIMUM_SNAPSHOT_COUNT

    ){

        return;

    }


    snapshots = snapshots.slice(

        -MAXIMUM_SNAPSHOT_COUNT

    );

}


/**
 * Sort oldest to newest.
 */
function compareSnapshotsChronologically(

    first:EdoriSnapshot,

    second:EdoriSnapshot

):number {

    return new Date(

        first.timestamp

    ).getTime()

    -

    new Date(

        second.timestamp

    ).getTime();

}


/**
 * Normalize a required finite number.
 */
function normalizeRequiredNumber(

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
function normalizeOptionalNonNegativeNumber(

    value:unknown

):number | undefined {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(value)

    ){

        return undefined;

    }


    return Math.max(

        0,

        value

    );

}


/**
 * Normalize an optional score.
 */
function normalizeOptionalScore(

    value:unknown

):number | undefined {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(value)

    ){

        return undefined;

    }


    return clampScore(

        value

    );

}


/**
 * Normalize an optional hour.
 */
function normalizeOptionalHour(

    value:unknown

):number | undefined {

    if(

        typeof value !== "number"

        ||

        !Number.isFinite(value)

    ){

        return undefined;

    }


    const roundedHour = Math.round(

        value

    );


    if(

        roundedHour < 0

        ||

        roundedHour > 23

    ){

        return undefined;

    }


    return roundedHour;

}


/**
 * Normalize an optional nonempty string.
 */
function normalizeOptionalString(

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
 * Normalize a date.
 */
function normalizeDate(

    value:unknown

):Date | null {

    if(

        !isDateInput(

            value

        )

    ){

        return null;

    }


    const date = value instanceof Date

        ? new Date(

            value.getTime()

        )

        : new Date(

            value

        );


    return Number.isNaN(

        date.getTime()

    )

        ? null

        : date;

}


/**
 * Narrow supported Date-constructor inputs.
 */
function isDateInput(

    value:unknown

):value is Date | string | number {

    return value instanceof Date

        ||

        typeof value === "string"

        ||

        typeof value === "number";

}


/**
 * Clamp a numerical EDORI score to 0–100.
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
 * Remove corrupted localStorage history.
 */
function removeCorruptedStorage():void {

    try {

        localStorage.removeItem(

            SNAPSHOT_STORAGE_KEY

        );

    }
    catch(error){

        console.error(

            "SnapshotService could not remove corrupted history.",

            error

        );

    }

}


/**
 * Notify subscribed dashboard components.
 */
function publishHistoryChanged():void {

    emit(

        APP_EVENTS.HISTORY_CHANGED

    );

}