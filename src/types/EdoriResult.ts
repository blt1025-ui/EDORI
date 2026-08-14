/**
 * EdoriResult
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Authoritative output of the Hospital Readiness
 * calculation engine.
 */

import type {

    Driver

}

from "./Driver";


import type {

    OperationalState

}

from "../config/operationalStates";


export interface EdoriResult {

    /*
     * Overall Hospital Readiness
     */

    score:number;

    status:string;

    operationalState:OperationalState;


    /*
     * Authoritative weighted domains
     */

    edPressureScore:number;

    acuteCapacityScore:number;

    criticalCapacityScore:number;

    inflowScore:number;

    projectedCapacityScore:number;


    /*
     * ED subdomains
     */

    edVolumeScore:number;

    edBoardingScore:number;

    edAcuityScore:number;


    /*
     * =================================================
     * Version 2.1 Hospital Flow Detail
     * =================================================
     */

    /**
     * Known non-ED inflow entered by the user:
     *
     * direct admissions
     * + surgical/procedural admissions
     */
    knownNonEDInflow:number;


    /**
     * Historical expected non-ED inflow:
     *
     * expected direct admissions 4h
     * + expected surgical/procedural admissions 4h
     */
    expectedNonEDInflow:number;


    /**
     * Direct admissions used by the forecast.
     */
    projectedDirectAdmissions:number;


    /**
     * Surgical/procedural admissions used by the
     * forecast.
     */
    projectedSurgicalAdmissions:number;


    /**
     * NEW admissions expected over the four-hour
     * horizon, excluding current ED boarders.
     */
    projectedNewAdmissions:number;


    /**
     * Total projected four-hour acute-care bed demand:
     *
     * current ED boarders
     * + new ED admissions
     * + projected direct admissions
     * + projected surgical/procedural admissions
     */
    projectedTotalBedDemand:number;


    /**
     * Historical projected bed demand for the same
     * weekday/hour.
     */
    historicalProjectedBedDemand:number;


    /**
     * Historical expected inpatient departures over
     * the four-hour horizon.
     */
    expectedInpatientDepartures:number;


    /**
     * Current staffed acute-care beds not occupied.
     */
    currentAvailableAcuteCareBeds:number;


    /**
     * Actual projected staffed acute-care bed balance
     * at the end of the four-hour horizon.
     *
     * Negative values are intentionally preserved.
     */
    projectedAvailableAcuteCareBeds:number;


    /**
     * Historical projected staffed acute-care bed
     * balance for the same weekday/hour.
     *
     * Negative values are valid.
     */
    historicalProjectedBedBalance:number;


    /**
     * Actual projected balance minus historical
     * projected balance.
     *
     * Negative = worse than historical norm.
     * Positive = better than historical norm.
     */
    projectedCapacityVariance:number;


    /*
     * =================================================
     * Temporary compatibility aliases
     * =================================================
     *
     * These remain during UI/report migration so
     * existing components continue compiling.
     */

    currentHospitalInflow:number;

    expectedHospitalInflow:number;

    projectedHospitalInflow:number;


    /*
     * Operational interpretation
     */

    drivers:Driver[];

    recommendations:string[];

    timestamp:Date;

}