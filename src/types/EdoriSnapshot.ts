/**
 * EdoriSnapshot
 *
 * Persistent historical record created after a
 * successful EDORI calculation.
 *
 * The core snapshot fields remain required for
 * compatibility with the current EdoriEngine and
 * SnapshotService.
 *
 * Expanded operational fields are optional during
 * the transition to the richer snapshot model.
 */

import type {

    OperationalState

}

from "../config/operationalStates";


export interface EdoriSnapshot {

    /**
     * Final numerical EDORI score.
     */
    score:number;


    /**
     * Existing readable status stored by the
     * current snapshot architecture.
     */
    status:string;


    /**
     * Score-derived Alpha–Echo operational state.
     */
    operationalState:OperationalState;


    /**
     * Date and time the snapshot was created.
     */
    timestamp:Date;


    /**
     * Optional unique identifier.
     *
     * The current engine does not yet provide this
     * field when creating every snapshot.
     */
    id?:string;


    /**
     * Current operational inputs.
     *
     * These fields are optional until EdoriEngine
     * is updated to include the completed
     * SituationAssessment when creating snapshots.
     */
    totalEDVolume?:number;

    boardedPatients?:number;

    occupiedMedicalBeds?:number;


    /**
     * Current ESI distribution.
     */
    esi1?:number;

    esi2?:number;

    esi3?:number;

    esi4?:number;

    esi5?:number;


    /**
     * Historical expectations used during the
     * calculation.
     */
    expectedVolume?:number;

    expectedBoarders?:number;

    expectedArrivals?:number;

    expectedDepartures?:number;


    /**
     * EDORI domain scores.
     */
    demandScore?:number;

    boardingScore?:number;

    hospitalScore?:number;

    acuityScore?:number;

    forecastScore?:number;


    /**
     * Day and hour associated with the assessment.
     */
    day?:string;

    hour?:number;

}