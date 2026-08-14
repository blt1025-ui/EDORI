/**
 * EdoriSnapshot
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Persisted historical record of one completed
 * Hospital Readiness assessment.
 */

import type {

    OperationalState

}

from "../config/operationalStates";


export const EDORI_SNAPSHOT_SCHEMA_VERSION = 3;


export interface EdoriSnapshot {

    id:string;

    timestamp:Date | string;

    schemaVersion:number;


    /*
     * Overall Hospital Readiness
     */

    score:number;

    status:string;

    operationalState:OperationalState;


    /*
     * Assessment period
     */

    day:string;

    hour:number;

    forecastHours:number;


    /*
     * Emergency Department
     */

    totalEDVolume:number;

    boardedPatients:number;

    esi1:number;

    esi2:number;


    /*
     * Acute-care capacity
     */

    staffedAcuteCareBeds:number;

    occupiedAcuteCareBeds:number;


    /*
     * Critical-care capacity
     */

    staffedCriticalCareBeds:number;

    occupiedCriticalCareBeds:number;


    /*
     * Known non-ED demand
     */

    currentDirectAdmissions:number;

    currentSurgicalAdmissions:number;

    knownNonEDInflow:number;

    expectedNonEDInflow:number;


    /*
     * Historical ED expectations
     */

    expectedEDVolume:number;

    expectedEDBoarders:number;


    /*
     * Historical acute-care baseline
     */

    expectedStaffedAcuteCareBeds:number;

    expectedOccupiedAcuteCareBeds:number;

    expectedAvailableAcuteCareBeds:number;


    /*
     * Historical four-hour flow
     */

    expectedEDAdmissions4h:number;

    expectedDirectAdmissions4h:number;

    expectedSurgicalAdmissions4h:number;

    expectedHospitalInflow4h:number;

    expectedInpatientDepartures4h:number;


    /*
     * Four-hour projected demand
     */

    projectedDirectAdmissions:number;

    projectedSurgicalAdmissions:number;

    projectedNewAdmissions:number;

    projectedTotalBedDemand:number;

    historicalProjectedBedDemand4h:number;


    /*
     * Four-hour projected capacity
     */

    currentAvailableAcuteCareBeds:number;

    projectedAvailableAcuteCareBeds:number;

    historicalProjectedBedBalance4h:number;

    projectedCapacityVariance:number;


    /*
     * Hospital Readiness domains
     */

    edPressureScore:number;

    acuteCapacityScore:number;

    criticalCapacityScore:number;

    inflowScore:number;

    projectedCapacityScore:number;


    /*
     * ED Operational Pressure subdomains
     */

    edVolumeScore:number;

    edBoardingScore:number;

    edAcuityScore:number;


    /*
     * Temporary compatibility fields
     */

    currentEDAdmissions:number;

    currentHospitalInflow:number;

    projectedHospitalInflow:number;


    /*
     * Optional trend / operational metadata
     */

    scoreChange?:number;

    trendDirection?:string;

    activeTriggerIds?:string[];

    activeTriggerTitles?:string[];

}