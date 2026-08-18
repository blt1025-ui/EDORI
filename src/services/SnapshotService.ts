/**
 * SnapshotService
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Stores and restores persistent Hospital Readiness assessment history.
 * Schema 3 records preserve the complete Version 2.1 projected-demand
 * and projected-capacity model, including signed bed-balance values.
 */

import { APP_EVENTS } from "../config/appEvents";

import {
    clearServerSnapshots,
    loadServerSnapshots,
    saveServerSnapshot
} from "./AssessmentSnapshotApiService";

import {
    subscribe
} from "./EventService";
import { emit } from "./EventService";
import type { OperationalState } from "../config/operationalStates";
import type { OperationalStateTitle } from "../types/OperationalStateTitle";
import {
    EDORI_SNAPSHOT_SCHEMA_VERSION
} from "../types/EdoriSnapshot";
import type { EdoriSnapshot } from "../types/EdoriSnapshot";

const LEGACY_SNAPSHOT_STORAGE_KEY = "edori_snapshots_v2";
const MAXIMUM_SNAPSHOT_COUNT = 500;
const DUPLICATE_TIME_WINDOW_MILLISECONDS = 5_000;

let snapshots:EdoriSnapshot[] = [];

let serverHistoryInitialized = false;
let serverHistoryInitializationInProgress = false;


/**
 * Remove obsolete browser-persistent history from the old
 * localStorage implementation.
 */
clearLegacySnapshotStorage();


/**
 * AuthenticationService publishes USERS_CHANGED after the
 * server session has been restored or a login succeeds.
 * That gives SnapshotService a safe point to load
 * PostgreSQL history without changing main.ts.
 */
subscribe(
    APP_EVENTS.USERS_CHANGED,
    () => {
        void initializeServerSnapshotHistory();
    }
);

export function getSnapshots():EdoriSnapshot[] {
    return snapshots
        .slice()
        .sort(compareSnapshotsChronologically)
        .map(cloneSnapshot);
}

export function getLatestSnapshot():EdoriSnapshot | null {
    if(snapshots.length === 0){
        return null;
    }

    const sorted = snapshots
        .slice()
        .sort(compareSnapshotsChronologically);

    const latest = sorted[sorted.length - 1];

    return latest
        ? cloneSnapshot(latest)
        : null;
}

export function saveSnapshot(
    candidate:EdoriSnapshot
):boolean {
    const normalizedSnapshot = normalizeSnapshot(candidate);

    if(!normalizedSnapshot){
        console.warn(
            "SnapshotService rejected an invalid Version 2.1 Hospital Readiness snapshot.",
            candidate
        );
        return false;
    }

    if(isDuplicateSnapshot(normalizedSnapshot)){
        return false;
    }

    snapshots.push(cloneSnapshot(normalizedSnapshot));
    snapshots.sort(compareSnapshotsChronologically);

    trimSnapshotHistory();
    publishHistoryChanged();


    /*
     * Preserve the existing synchronous SnapshotService
     * contract while PostgreSQL persistence occurs through
     * the authenticated API.
     */
    void persistSnapshotToServer(
        normalizedSnapshot
    );


    return true;
}

export function addSnapshot(
    candidate:EdoriSnapshot
):boolean {
    return saveSnapshot(candidate);
}

export function recordSnapshot(
    candidate:EdoriSnapshot
):boolean {
    return saveSnapshot(candidate);
}

export function shouldSaveSnapshot(
    candidate:EdoriSnapshot
):boolean {
    const normalizedSnapshot = normalizeSnapshot(candidate);

    if(!normalizedSnapshot){
        return false;
    }

    return !isDuplicateSnapshot(normalizedSnapshot);
}

export function shouldCreateSnapshot(
    candidate:EdoriSnapshot
):boolean {
    return shouldSaveSnapshot(candidate);
}

export function replaceSnapshots(
    candidates:EdoriSnapshot[]
):void {
    const normalizedSnapshots = candidates
        .map(normalizeSnapshot)
        .filter(
            (snapshot):snapshot is EdoriSnapshot =>
                snapshot !== null
        )
        .sort(compareSnapshotsChronologically);

    snapshots = removeDuplicateSnapshots(normalizedSnapshots);

    trimSnapshotHistory();
    publishHistoryChanged();


    /*
     * Restore workflows replace the complete persisted
     * history. The server API remains authoritative.
     */
    void replaceServerSnapshotHistory(
        snapshots
    );
}

export function clearSnapshots():void {
    snapshots = [];

    publishHistoryChanged();


    void clearServerSnapshots()
        .catch(
            error => {
                console.error(
                    "SnapshotService could not clear PostgreSQL Hospital Readiness history.",
                    error
                );
            }
        );
}

export function getSnapshotCount():number {
    return snapshots.length;
}

/**
 * Load the authoritative assessment history from
 * PostgreSQL after authentication has been established.
 */
export async function initializeServerSnapshotHistory():

Promise<void> {

    if(
        serverHistoryInitialized
        ||
        serverHistoryInitializationInProgress
    ){
        return;
    }


    serverHistoryInitializationInProgress = true;


    try {
        const serverSnapshots =
            await loadServerSnapshots(
                MAXIMUM_SNAPSHOT_COUNT
            );


        const normalizedSnapshots = serverSnapshots
            .map(normalizeSnapshot)
            .filter(
                (snapshot):snapshot is EdoriSnapshot =>
                    snapshot !== null
            )
            .sort(compareSnapshotsChronologically);


        snapshots =
            removeDuplicateSnapshots(
                normalizedSnapshots
            );


        trimSnapshotHistory();


        serverHistoryInitialized = true;


        publishHistoryChanged();
    }
    catch(error){
        /*
         * A 401 before login or a temporary API outage must
         * not crash EDORI. USERS_CHANGED will provide
         * another initialization opportunity after login.
         */
        console.warn(
            "SnapshotService could not load PostgreSQL Hospital Readiness history.",
            error
        );
    }
    finally {
        serverHistoryInitializationInProgress = false;
    }
}


/**
 * Persist one accepted in-memory snapshot to PostgreSQL.
 */
async function persistSnapshotToServer(
    snapshot:EdoriSnapshot
):Promise<void> {
    try {
        const result =
            await saveServerSnapshot(
                snapshot
            );


        /*
         * The server overwrites entered-by attribution with
         * the authenticated session identity. Replace the
         * in-memory copy with that authoritative version.
         */
        const normalized =
            normalizeSnapshot(
                result.snapshot
            );


        if(normalized){
            const index =
                snapshots.findIndex(
                    existing =>
                        existing.id === normalized.id
                );


            if(index >= 0){
                snapshots[index] =
                    cloneSnapshot(
                        normalized
                    );


                snapshots.sort(
                    compareSnapshotsChronologically
                );


                publishHistoryChanged();
            }
        }
    }
    catch(error){
        console.error(
            "SnapshotService could not persist the completed assessment to PostgreSQL.",
            error
        );
    }
}


/**
 * Replace complete PostgreSQL history after an authorized
 * history-restore operation.
 */
async function replaceServerSnapshotHistory(
    replacementSnapshots:EdoriSnapshot[]
):Promise<void> {
    try {
        await clearServerSnapshots();


        for(const snapshot of replacementSnapshots){
            await saveServerSnapshot(
                snapshot
            );
        }


        /*
         * Reload after the server has applied authoritative
         * current-user attribution.
         */
        serverHistoryInitialized = false;


        await initializeServerSnapshotHistory();
    }
    catch(error){
        console.error(
            "SnapshotService could not replace PostgreSQL Hospital Readiness history.",
            error
        );
    }
}


/**
 * Remove the old browser-persistent snapshot history.
 */
function clearLegacySnapshotStorage():void {
    try {
        localStorage.removeItem(
            LEGACY_SNAPSHOT_STORAGE_KEY
        );
    }
    catch(error){
        console.warn(
            "SnapshotService could not clear legacy browser snapshot history.",
            error
        );
    }
}




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

    const candidate = value as Record<string, unknown>;

    const schemaVersion =
        normalizeInteger(candidate.schemaVersion);

    /*
     * Version 2.1 history is schema 3. Do not silently rebuild
     * schema 1/2 records using obsolete projected-flow formulas.
     */
    if(
        schemaVersion !== EDORI_SNAPSHOT_SCHEMA_VERSION
        &&
        schemaVersion !== 3
    ){
        return null;
    }

    const timestamp = normalizeDate(candidate.timestamp);
    const operationalState =
        normalizeOperationalState(candidate.operationalState);
    const score = normalizeScore(candidate.score);

    if(
        !timestamp
        ||
        !operationalState
        ||
        score === null
    ){
        return null;
    }

    const currentDirectAdmissions =
        normalizeNonNegativeNumber(
            candidate.currentDirectAdmissions
        ) ?? 0;

    const currentSurgicalAdmissions =
        normalizeNonNegativeNumber(
            candidate.currentSurgicalAdmissions
        ) ?? 0;

    const knownNonEDInflow =
        normalizeNonNegativeNumber(
            candidate.knownNonEDInflow
        )
        ??
        (
            currentDirectAdmissions
            +
            currentSurgicalAdmissions
        );

    const expectedDirectAdmissions4h =
        normalizeNonNegativeNumber(
            candidate.expectedDirectAdmissions4h
        ) ?? 0;

    const expectedSurgicalAdmissions4h =
        normalizeNonNegativeNumber(
            candidate.expectedSurgicalAdmissions4h
        ) ?? 0;

    const expectedNonEDInflow =
        normalizeNonNegativeNumber(
            candidate.expectedNonEDInflow
        )
        ??
        (
            expectedDirectAdmissions4h
            +
            expectedSurgicalAdmissions4h
        );

    const staffedAcuteCareBeds =
        normalizePositiveNumber(
            candidate.staffedAcuteCareBeds
        ) ?? 1;

    const occupiedAcuteCareBeds =
        normalizeNonNegativeNumber(
            candidate.occupiedAcuteCareBeds
        ) ?? 0;

    const currentAvailableAcuteCareBeds =
        normalizeFiniteNumber(
            candidate.currentAvailableAcuteCareBeds
        )
        ??
        (
            staffedAcuteCareBeds
            -
            occupiedAcuteCareBeds
        );

    const expectedStaffedAcuteCareBeds =
        normalizePositiveNumber(
            candidate.expectedStaffedAcuteCareBeds
        ) ?? staffedAcuteCareBeds;

    const expectedOccupiedAcuteCareBeds =
        normalizeNonNegativeNumber(
            candidate.expectedOccupiedAcuteCareBeds
        ) ?? occupiedAcuteCareBeds;

    const expectedAvailableAcuteCareBeds =
        normalizeFiniteNumber(
            candidate.expectedAvailableAcuteCareBeds
        )
        ??
        (
            expectedStaffedAcuteCareBeds
            -
            expectedOccupiedAcuteCareBeds
        );

    const expectedEDAdmissions4h =
        normalizeNonNegativeNumber(
            candidate.expectedEDAdmissions4h
        ) ?? 0;

    const expectedHospitalInflow4h =
        normalizeNonNegativeNumber(
            candidate.expectedHospitalInflow4h
        )
        ??
        (
            expectedEDAdmissions4h
            +
            expectedDirectAdmissions4h
            +
            expectedSurgicalAdmissions4h
        );

    const expectedInpatientDepartures4h =
        normalizeNonNegativeNumber(
            candidate.expectedInpatientDepartures4h
        ) ?? 0;

    const boardedPatients =
        normalizeNonNegativeNumber(
            candidate.boardedPatients
        ) ?? 0;

    const projectedDirectAdmissions =
        normalizeNonNegativeNumber(
            candidate.projectedDirectAdmissions
        ) ?? currentDirectAdmissions;

    const projectedSurgicalAdmissions =
        normalizeNonNegativeNumber(
            candidate.projectedSurgicalAdmissions
        ) ?? currentSurgicalAdmissions;

    const projectedNewAdmissions =
        normalizeNonNegativeNumber(
            candidate.projectedNewAdmissions
        )
        ??
        (
            expectedEDAdmissions4h
            +
            projectedDirectAdmissions
            +
            projectedSurgicalAdmissions
        );

    const projectedTotalBedDemand =
        normalizeNonNegativeNumber(
            candidate.projectedTotalBedDemand
        )
        ??
        (
            boardedPatients
            +
            projectedNewAdmissions
        );

    const historicalProjectedBedDemand4h =
        normalizeNonNegativeNumber(
            candidate.historicalProjectedBedDemand4h
        )
        ??
        expectedHospitalInflow4h;

    const projectedAvailableAcuteCareBeds =
        normalizeFiniteNumber(
            candidate.projectedAvailableAcuteCareBeds
        )
        ??
        (
            currentAvailableAcuteCareBeds
            +
            expectedInpatientDepartures4h
            -
            projectedTotalBedDemand
        );

    const historicalProjectedBedBalance4h =
        normalizeFiniteNumber(
            candidate.historicalProjectedBedBalance4h
        )
        ??
        (
            expectedAvailableAcuteCareBeds
            +
            expectedInpatientDepartures4h
            -
            historicalProjectedBedDemand4h
        );

    const projectedCapacityVariance =
        normalizeFiniteNumber(
            candidate.projectedCapacityVariance
        )
        ??
        (
            projectedAvailableAcuteCareBeds
            -
            historicalProjectedBedBalance4h
        );

    const normalized:EdoriSnapshot = {
        schemaVersion: EDORI_SNAPSHOT_SCHEMA_VERSION,

        id:
            normalizeString(candidate.id)
            ??
            createSnapshotId(timestamp),

        timestamp,

        enteredByUserId:
            schemaVersion === 3
                ? ""
                : (
                    normalizeString(
                        candidate.enteredByUserId
                    ) ?? ""
                ),

        enteredByDisplayName:
            schemaVersion === 3
                ? "Legacy / Unknown"
                : (
                    normalizeString(
                        candidate.enteredByDisplayName
                    ) ?? "Unknown"
                ),

        enteredByUsername:
            schemaVersion === 3
                ? ""
                : (
                    normalizeString(
                        candidate.enteredByUsername
                    ) ?? ""
                ),

        score,

        status:
            normalizeString(candidate.status)
            ??
            operationalState.title,

        operationalState,

        day:
            normalizeString(candidate.day)
            ??
            getDayName(timestamp),

        hour:
            normalizeHour(candidate.hour)
            ??
            timestamp.getHours(),

        forecastHours:
            normalizePositiveInteger(
                candidate.forecastHours
            ) ?? 4,

        totalEDVolume:
            normalizeNonNegativeNumber(
                candidate.totalEDVolume
            ) ?? 0,

        boardedPatients,

        esi1:
            normalizeNonNegativeNumber(
                candidate.esi1
            ) ?? 0,

        esi2:
            normalizeNonNegativeNumber(
                candidate.esi2
            ) ?? 0,

        staffedAcuteCareBeds,
        occupiedAcuteCareBeds,

        staffedCriticalCareBeds:
            normalizePositiveNumber(
                candidate.staffedCriticalCareBeds
            ) ?? 1,

        occupiedCriticalCareBeds:
            normalizeNonNegativeNumber(
                candidate.occupiedCriticalCareBeds
            ) ?? 0,

        currentDirectAdmissions,
        currentSurgicalAdmissions,
        knownNonEDInflow,
        expectedNonEDInflow,

        expectedEDVolume:
            normalizeNonNegativeNumber(
                candidate.expectedEDVolume
            ) ?? 0,

        expectedEDBoarders:
            normalizeNonNegativeNumber(
                candidate.expectedEDBoarders
            ) ?? 0,

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

        currentAvailableAcuteCareBeds,
        projectedAvailableAcuteCareBeds,
        historicalProjectedBedBalance4h,
        projectedCapacityVariance,

        edPressureScore:
            normalizeScore(
                candidate.edPressureScore
            ) ?? 0,

        acuteCapacityScore:
            normalizeScore(
                candidate.acuteCapacityScore
            ) ?? 0,

        criticalCapacityScore:
            normalizeScore(
                candidate.criticalCapacityScore
            ) ?? 0,

        inflowScore:
            normalizeScore(
                candidate.inflowScore
            ) ?? 0,

        projectedCapacityScore:
            normalizeScore(
                candidate.projectedCapacityScore
            ) ?? 0,

        edVolumeScore:
            normalizeScore(
                candidate.edVolumeScore
            ) ?? 0,

        edBoardingScore:
            normalizeScore(
                candidate.edBoardingScore
            ) ?? 0,

        edAcuityScore:
            normalizeScore(
                candidate.edAcuityScore
            ) ?? 0,

        currentEDAdmissions: 0,

        currentHospitalInflow:
            normalizeNonNegativeNumber(
                candidate.currentHospitalInflow
            )
            ??
            knownNonEDInflow,

        projectedHospitalInflow:
            normalizeNonNegativeNumber(
                candidate.projectedHospitalInflow
            )
            ??
            projectedNewAdmissions
    };

    const scoreChange =
        normalizeFiniteNumber(candidate.scoreChange);

    if(scoreChange !== undefined){
        normalized.scoreChange = scoreChange;
    }

    const trendDirection =
        normalizeString(candidate.trendDirection);

    if(trendDirection){
        normalized.trendDirection = trendDirection;
    }

    const activeTriggerIds =
        normalizeStringArray(candidate.activeTriggerIds);

    if(activeTriggerIds){
        normalized.activeTriggerIds = activeTriggerIds;
    }

    const activeTriggerTitles =
        normalizeStringArray(candidate.activeTriggerTitles);

    if(activeTriggerTitles){
        normalized.activeTriggerTitles =
            activeTriggerTitles;
    }

    return normalized;
}

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
        !isOperationalStateTitle(candidate.title)
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
        title: candidate.title,
        icon: candidate.icon.trim(),
        color: candidate.color.trim(),
        recommendation: candidate.recommendation.trim()
    };
}

function isOperationalStateTitle(
    value:unknown
):value is OperationalStateTitle {
    const titles:OperationalStateTitle[] = [
        "Alpha",
        "Bravo",
        "Charlie",
        "Delta",
        "Echo"
    ];

    return typeof value === "string"
        &&
        titles.includes(
            value as OperationalStateTitle
        );
}

function isDuplicateSnapshot(
    candidate:EdoriSnapshot
):boolean {
    const latest = getLatestSnapshot();

    if(!latest){
        return false;
    }

    const timeDifference = Math.abs(
        new Date(candidate.timestamp).getTime()
        -
        new Date(latest.timestamp).getTime()
    );

    if(
        timeDifference
        >
        DUPLICATE_TIME_WINDOW_MILLISECONDS
    ){
        return false;
    }

    return snapshotsContainSameAssessment(
        latest,
        candidate
    );
}

function snapshotsContainSameAssessment(
    previous:EdoriSnapshot,
    candidate:EdoriSnapshot
):boolean {
    return (
        previous.score === candidate.score
        &&
        previous.totalEDVolume === candidate.totalEDVolume
        &&
        previous.boardedPatients === candidate.boardedPatients
        &&
        previous.staffedAcuteCareBeds === candidate.staffedAcuteCareBeds
        &&
        previous.occupiedAcuteCareBeds === candidate.occupiedAcuteCareBeds
        &&
        previous.staffedCriticalCareBeds === candidate.staffedCriticalCareBeds
        &&
        previous.occupiedCriticalCareBeds === candidate.occupiedCriticalCareBeds
        &&
        previous.currentDirectAdmissions === candidate.currentDirectAdmissions
        &&
        previous.currentSurgicalAdmissions === candidate.currentSurgicalAdmissions
        &&
        previous.projectedTotalBedDemand === candidate.projectedTotalBedDemand
        &&
        previous.projectedCapacityVariance === candidate.projectedCapacityVariance
        &&
        previous.esi1 === candidate.esi1
        &&
        previous.esi2 === candidate.esi2
    );
}

function removeDuplicateSnapshots(
    candidates:EdoriSnapshot[]
):EdoriSnapshot[] {
    const uniqueSnapshots:EdoriSnapshot[] = [];

    candidates.forEach(
        candidate => {
            const previous =
                uniqueSnapshots[
                    uniqueSnapshots.length - 1
                ];

            if(!previous){
                uniqueSnapshots.push(
                    cloneSnapshot(candidate)
                );
                return;
            }

            const timeDifference = Math.abs(
                new Date(candidate.timestamp).getTime()
                -
                new Date(previous.timestamp).getTime()
            );

            if(
                timeDifference
                <=
                DUPLICATE_TIME_WINDOW_MILLISECONDS
                &&
                snapshotsContainSameAssessment(
                    previous,
                    candidate
                )
            ){
                return;
            }

            uniqueSnapshots.push(
                cloneSnapshot(candidate)
            );
        }
    );

    return uniqueSnapshots;
}

function cloneSnapshot(
    snapshot:EdoriSnapshot
):EdoriSnapshot {
    return {
        ...snapshot,

        timestamp:
            new Date(snapshot.timestamp),

        operationalState:{
            ...snapshot.operationalState
        },

        activeTriggerIds:
            snapshot.activeTriggerIds
                ? [...snapshot.activeTriggerIds]
                : undefined,

        activeTriggerTitles:
            snapshot.activeTriggerTitles
                ? [...snapshot.activeTriggerTitles]
                : undefined
    };
}

function compareSnapshotsChronologically(
    first:EdoriSnapshot,
    second:EdoriSnapshot
):number {
    return (
        new Date(first.timestamp).getTime()
        -
        new Date(second.timestamp).getTime()
    );
}

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

function normalizeFiniteNumber(
    value:unknown
):number | undefined {
    return (
        typeof value === "number"
        &&
        Number.isFinite(value)
    )
        ? value
        : undefined;
}

function normalizeNonNegativeNumber(
    value:unknown
):number | undefined {
    const normalized =
        normalizeFiniteNumber(value);

    if(normalized === undefined){
        return undefined;
    }

    return normalized >= 0
        ? normalized
        : undefined;
}

function normalizePositiveNumber(
    value:unknown
):number | undefined {
    const normalized =
        normalizeFiniteNumber(value);

    if(
        normalized === undefined
        ||
        normalized <= 0
    ){
        return undefined;
    }

    return normalized;
}

function normalizeScore(
    value:unknown
):number | null {
    const normalized =
        normalizeFiniteNumber(value);

    if(normalized === undefined){
        return null;
    }

    return Math.min(
        100,
        Math.max(
            0,
            normalized
        )
    );
}

function normalizeInteger(
    value:unknown
):number | null {
    if(
        typeof value !== "number"
        ||
        !Number.isFinite(value)
        ||
        !Number.isInteger(value)
    ){
        return null;
    }

    return value;
}

function normalizePositiveInteger(
    value:unknown
):number | undefined {
    const normalized =
        normalizeInteger(value);

    return (
        normalized !== null
        &&
        normalized > 0
    )
        ? normalized
        : undefined;
}

function normalizeHour(
    value:unknown
):number | undefined {
    const normalized =
        normalizeInteger(value);

    if(
        normalized === null
        ||
        normalized < 0
        ||
        normalized > 23
    ){
        return undefined;
    }

    return normalized;
}

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

function normalizeStringArray(
    value:unknown
):string[] | undefined {
    if(!Array.isArray(value)){
        return undefined;
    }

    const strings = value
        .map(normalizeString)
        .filter(
            (item):item is string =>
                item !== undefined
        );

    return strings.length > 0
        ? strings
        : undefined;
}

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

    const date =
        value instanceof Date
            ? new Date(value.getTime())
            : new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

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

function createSnapshotId(
    timestamp:Date
):string {
    return (
        `snapshot-${timestamp.getTime()}-`
        +
        Math.random()
            .toString(36)
            .slice(2, 10)
    );
}

function publishHistoryChanged():void {
    emit(
        APP_EVENTS.HISTORY_CHANGED,
        
    );
}