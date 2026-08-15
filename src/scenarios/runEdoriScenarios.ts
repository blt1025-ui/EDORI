/**
 * Hospital Readiness Scenario Runner
 *
 * Evaluates development scenarios against the
 * pure EdoriService calculation.
 *
 * This runner does not:
 *
 * - Modify StateService
 * - Modify ResultService
 * - Save snapshots
 * - Emit events
 * - Access localStorage
 */

import {

    calculateEdori

}

from "../services/EdoriService";


import {

    WEIGHTS

}

from "../config/weights";


import {

    EDORI_SCENARIOS

}

from "./edoriScenarios";


import type {

    EdoriScenario

}

from "../types/EdoriScenario";


import type {

    EdoriScenarioResult

}

from "../types/EdoriScenarioResult";


/**
 * Compact scenario output used for calibration.
 */
export interface EdoriScenarioCalibrationRow {

    id:string;

    scenario:string;

    score:number;

    expectedMinimum:number;

    expectedMaximum:number;

    operationalState:string;

    expectedOperationalState:string | null;

    edPressureScore:number;

    acuteCapacityScore:number;

    criticalCapacityScore:number;

    inflowScore:number;

    projectedCapacityScore:number;

    baseScore:number;

    severeDomainAdjustment:number;

    scorePassed:boolean;

    statePassed:boolean;

    passed:boolean;

    scoreDeviation:number;

    drivers:string[];

}

/**
 * Run all configured Hospital Readiness scenarios.
 */
export function runAllEdoriScenarios():

EdoriScenarioResult[] {

    return EDORI_SCENARIOS.map(

        runSingleEdoriScenario

    );

}


/**
 * Run one scenario by its identifier.
 */
export function runEdoriScenarioById(

    scenarioId:string

):EdoriScenarioResult | null {

    const scenario = EDORI_SCENARIOS.find(

        item => item.id === scenarioId

    );


    if(!scenario){

        return null;

    }


    return runSingleEdoriScenario(

        scenario

    );

}

/**
 * Return compact calibration results for every
 * configured operational scenario.
 */
export function getEdoriScenarioCalibrationRows():

EdoriScenarioCalibrationRow[] {

    return runAllEdoriScenarios().map(

        scenarioResult => ({

            id:
                scenarioResult.scenario.id,

            scenario:
                scenarioResult.scenario.name,

            score:
                scenarioResult.result.score,

            expectedMinimum:
                scenarioResult.scenario.expectedScore.minimum,

            expectedMaximum:
                scenarioResult.scenario.expectedScore.maximum,

            operationalState:
                scenarioResult.result.operationalState.title,

            expectedOperationalState:
                scenarioResult.scenario.expectedOperationalState

                ?? null,

            edPressureScore:
                scenarioResult.result.edPressureScore,

            acuteCapacityScore:
                scenarioResult.result.acuteCapacityScore,

            criticalCapacityScore:
                scenarioResult.result.criticalCapacityScore,

            inflowScore:
                scenarioResult.result.inflowScore,

            projectedCapacityScore:
                scenarioResult.result.projectedCapacityScore,

            baseScore:
                calculateBaseScore(
                    scenarioResult.result.edPressureScore,
                    scenarioResult.result.acuteCapacityScore,
                    scenarioResult.result.criticalCapacityScore,
                    scenarioResult.result.inflowScore,
                    scenarioResult.result.projectedCapacityScore
                ),

            severeDomainAdjustment:
                calculateAppliedSevereDomainAdjustment(
                    scenarioResult.result.score,
                    calculateBaseScore(
                        scenarioResult.result.edPressureScore,
                        scenarioResult.result.acuteCapacityScore,
                        scenarioResult.result.criticalCapacityScore,
                        scenarioResult.result.inflowScore,
                        scenarioResult.result.projectedCapacityScore
                    )
                ),

            scorePassed:
                scenarioResult.scorePassed,

            statePassed:
                scenarioResult.statePassed,

            passed:
                scenarioResult.passed,

            scoreDeviation:
                scenarioResult.scoreDeviation,

            drivers:
                scenarioResult.result.drivers.map(

                    driver => driver.title

                )

        })

    );

}


/**
 * Copy scenario results as formatted JSON.
 */
export async function copyEdoriScenarioResults():

Promise<void> {

    const rows =

        getEdoriScenarioCalibrationRows();


    const json = JSON.stringify(

        rows,

        null,

        2

    );


    try {

        await navigator.clipboard.writeText(

            json

        );


        console.log(

            "Hospital Readiness scenario results were copied to the clipboard."

        );

    }
    catch(error){

        console.warn(

            "Clipboard access was unavailable. Copy the JSON below manually.",

            error

        );


        console.log(

            json

        );

    }

}


/**
 * Print only the compact calibration table.
 */
export function printEdoriCalibrationTable():void {

    const rows =

        getEdoriScenarioCalibrationRows();


    console.table(

        rows.map(

            row => ({

                Scenario:
                    row.scenario,

                Score:
                    row.score,

                Expected:
                    `${row.expectedMinimum}-${row.expectedMaximum}`,

                State:
                    row.operationalState,

                ExpectedState:
                    row.expectedOperationalState

                    ?? "Not specified",

                "ED Pressure":
                    row.edPressureScore,

                "Acute Capacity":
                    row.acuteCapacityScore,

                "Critical Capacity":
                    row.criticalCapacityScore,

                Inflow:
                    row.inflowScore,

                "Projected Capacity":
                    row.projectedCapacityScore,

                "Base HRI":
                    row.baseScore,

                "Severe Adjustment":
                    row.severeDomainAdjustment,

                "Final HRI":
                    row.score,

                Deviation:
                    row.scoreDeviation,

                Result:
                    row.passed

                        ? "PASS"

                        : "FAIL"

            })

        )

    );

}

/**
 * Evaluate one Hospital Readiness scenario.
 */
export function runSingleEdoriScenario(

    scenario:EdoriScenario

):EdoriScenarioResult {

    const result = calculateEdori(

        {

            ...scenario.assessment

        }

    );


    const scorePassed =

        result.score

        >=

        scenario.expectedScore.minimum

        &&

        result.score

        <=

        scenario.expectedScore.maximum;


    const statePassed =

        scenario.expectedOperationalState

        ===

        undefined

        ||

        result.operationalState.title

        ===

        scenario.expectedOperationalState;


    return {

        scenario,

        result,

        scorePassed,

        statePassed,

        passed:

            scorePassed

            &&

            statePassed,

        scoreDeviation:
            calculateScoreDeviation(

                result.score,

                scenario.expectedScore.minimum,

                scenario.expectedScore.maximum

            )

    };

}


/**
 * Print a readable scenario report.
 */
export function printEdoriScenarioReport():void {

    const results = runAllEdoriScenarios();


    const passedCount = results.filter(

        result => result.passed

    ).length;


    const failedCount =

        results.length

        -

        passedCount;


    console.group(

        `Hospital Readiness Scenario Report — ${passedCount}/${results.length} Passed`

    );


    results.forEach(

        scenarioResult => {

            printScenarioResult(

                scenarioResult

            );

        }

    );


    console.table(

        results.map(

            scenarioResult => ({

                Scenario:
                    scenarioResult.scenario.name,

                Score:
                    scenarioResult.result.score,

                Expected:
                    `${scenarioResult.scenario.expectedScore.minimum}-${scenarioResult.scenario.expectedScore.maximum}`,

                State:
                    scenarioResult.result.operationalState.title,

                ExpectedState:
                    scenarioResult.scenario.expectedOperationalState

                    ?? "Not specified",

                Result:
                    scenarioResult.passed

                        ? "PASS"

                        : "FAIL",

                "ED Pressure":
                    scenarioResult.result.edPressureScore,

                "Acute Capacity":
                    scenarioResult.result.acuteCapacityScore,

                "Critical Capacity":
                    scenarioResult.result.criticalCapacityScore,

                Inflow:
                    scenarioResult.result.inflowScore,

                "Projected Capacity":
                    scenarioResult.result.projectedCapacityScore,

                "Base HRI":
                    calculateBaseScore(
                        scenarioResult.result.edPressureScore,
                        scenarioResult.result.acuteCapacityScore,
                        scenarioResult.result.criticalCapacityScore,
                        scenarioResult.result.inflowScore,
                        scenarioResult.result.projectedCapacityScore
                    ),

                "Severe Adjustment":
                    calculateAppliedSevereDomainAdjustment(
                        scenarioResult.result.score,
                        calculateBaseScore(
                            scenarioResult.result.edPressureScore,
                            scenarioResult.result.acuteCapacityScore,
                            scenarioResult.result.criticalCapacityScore,
                            scenarioResult.result.inflowScore,
                            scenarioResult.result.projectedCapacityScore
                        )
                    ),

                "Final HRI":
                    scenarioResult.result.score

            })

        )

    );


    console.log(

        `Passed: ${passedCount}`

    );


    console.log(

        `Failed: ${failedCount}`

    );


    console.groupEnd();

}


/**
 * Print one scenario result.
 */
function printScenarioResult(

    scenarioResult:EdoriScenarioResult

):void {

    const {

        scenario,

        result

    } = scenarioResult;


    const label = scenarioResult.passed

        ? `PASS — ${scenario.name}`

        : `FAIL — ${scenario.name}`;


    console.group(

        label

    );


    console.log(

        "Description:",

        scenario.description

    );


    console.log(

        "Actual score:",

        result.score

    );


    console.log(

        "Expected score range:",

        `${scenario.expectedScore.minimum}-${scenario.expectedScore.maximum}`

    );


    console.log(

        "Actual state:",

        result.operationalState.title

    );


    console.log(

        "Expected state:",

        scenario.expectedOperationalState

        ?? "Not specified"

    );


    console.log(

        "Domain scores:",

        {

            edPressure:
                result.edPressureScore,

            acuteCapacity:
                result.acuteCapacityScore,

            criticalCapacity:
                result.criticalCapacityScore,

            inflow:
                result.inflowScore,

            projectedCapacity:
                result.projectedCapacityScore

        }

    );


    const baseScore = calculateBaseScore(
        result.edPressureScore,
        result.acuteCapacityScore,
        result.criticalCapacityScore,
        result.inflowScore,
        result.projectedCapacityScore
    );


    const severeDomainAdjustment =
        calculateAppliedSevereDomainAdjustment(
            result.score,
            baseScore
        );


    console.log(
        "Base weighted HRI:",
        baseScore
    );


    console.log(
        "Severe-domain adjustment:",
        severeDomainAdjustment
    );


    console.log(
        "Final HRI:",
        result.score
    );


    console.log(

        "Drivers:",

        result.drivers.map(

            driver => driver.title

        )

    );


    console.log(

        "Rationale:",

        scenario.rationale

    );


    if(!scenarioResult.scorePassed){

        console.warn(

            `Score is outside the expected range by ${scenarioResult.scoreDeviation} points.`

        );

    }


    if(!scenarioResult.statePassed){

        console.warn(

            "Operational state does not match the expected state."

        );

    }


    console.groupEnd();

}


/**
 * Reconstruct the weighted HRI before the
 * severe-domain adjustment.
 */
function calculateBaseScore(
    edPressureScore:number,
    acuteCapacityScore:number,
    criticalCapacityScore:number,
    inflowScore:number,
    projectedCapacityScore:number
):number {

    return roundCalibrationScore(
        edPressureScore * WEIGHTS.edPressure
        + acuteCapacityScore * WEIGHTS.acuteCapacity
        + criticalCapacityScore * WEIGHTS.criticalCapacity
        + inflowScore * WEIGHTS.inflow
        + projectedCapacityScore * WEIGHTS.projectedCapacity
    );

}


/**
 * Return the severe-domain adjustment actually
 * visible in the capped final HRI.
 */
function calculateAppliedSevereDomainAdjustment(
    finalScore:number,
    baseScore:number
):number {

    return roundCalibrationScore(
        Math.max(
            0,
            finalScore - baseScore
        )
    );

}


function roundCalibrationScore(
    value:number
):number {

    return Math.round(value * 10) / 10;

}


/**
 * Calculate distance from the acceptable range.
 */
function calculateScoreDeviation(

    score:number,

    minimum:number,

    maximum:number

):number {

    if(score < minimum){

        return minimum -

            score;

    }


    if(score > maximum){

        return score -

            maximum;

    }


    return 0;

}