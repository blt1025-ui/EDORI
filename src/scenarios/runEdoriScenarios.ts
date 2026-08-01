/**
 * EDORI Scenario Runner
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

    demandScore:number;

    boardingScore:number;

    hospitalScore:number;

    acuityScore:number;

    forecastScore:number;

    scorePassed:boolean;

    statePassed:boolean;

    passed:boolean;

    scoreDeviation:number;

    drivers:string[];

}

/**
 * Run all configured EDORI scenarios.
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

            demandScore:
                scenarioResult.result.demandScore,

            boardingScore:
                scenarioResult.result.boardingScore,

            hospitalScore:
                scenarioResult.result.hospitalScore,

            acuityScore:
                scenarioResult.result.acuityScore,

            forecastScore:
                scenarioResult.result.forecastScore,

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

            "EDORI scenario results were copied to the clipboard."

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

                Demand:
                    row.demandScore,

                Boarding:
                    row.boardingScore,

                Hospital:
                    row.hospitalScore,

                Acuity:
                    row.acuityScore,

                Forecast:
                    row.forecastScore,

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
 * Evaluate one EDORI scenario.
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

        `EDORI Scenario Report — ${passedCount}/${results.length} Passed`

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

                Demand:
                    scenarioResult.result.demandScore,

                Boarding:
                    scenarioResult.result.boardingScore,

                Hospital:
                    scenarioResult.result.hospitalScore,

                Acuity:
                    scenarioResult.result.acuityScore,

                Forecast:
                    scenarioResult.result.forecastScore

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

            demand:
                result.demandScore,

            boarding:
                result.boardingScore,

            hospital:
                result.hospitalScore,

            acuity:
                result.acuityScore,

            forecast:
                result.forecastScore

        }

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