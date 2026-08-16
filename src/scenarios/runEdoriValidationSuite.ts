/**
 * EDORI Validation Suite
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Consolidated development validation for:
 *
 * - Pure Hospital Readiness calculation scenarios
 * - Operational-state expectations
 * - Historical baseline repository integrity
 * - Administrative configuration integrity
 * - Current operational-trigger evaluation
 * - Trigger supersession behavior
 * - Current OperationalAssessment consistency
 *
 * IMPORTANT:
 *
 * This runner does not modify StateService, ResultService,
 * SnapshotService, historical data, or configuration.
 *
 * Scenario calculations remain pure through
 * runEdoriScenarios.ts.
 */

import {

    getEdoriScenarioCalibrationRows

}

from "./runEdoriScenarios";


import {

    evaluateOperationalTriggers

}

from "../services/OperationalTriggerService";


import {

    createOperationalAssessment

}

from "../services/OperationalAssessmentService";


import {

    getConfiguration

}

from "../services/ConfigurationService";


import {

    getHistoricalRepositoryStatus

}

from "../services/HistoricalDataRepository";


import {

    getLatestResult

}

from "../services/ResultService";


import {

    getSnapshots

}

from "../services/SnapshotService";


import {

    getState,

    hasCommittedAssessment

}

from "../services/StateService";


export type ValidationStatus =

    | "PASS"

    | "FAIL"

    | "SKIP";


export interface ValidationCheck {

    id:string;

    category:string;

    name:string;

    status:ValidationStatus;

    details:string;

}


export interface ValidationSuiteResult {

    passed:boolean;

    passCount:number;

    failCount:number;

    skipCount:number;

    totalChecks:number;

    checks:ValidationCheck[];

    ranAt:Date;

}


/**
 * Run the complete non-mutating EDORI development
 * validation suite.
 */
export function runEdoriValidationSuite():

ValidationSuiteResult {

    const checks:ValidationCheck[] = [];


    checks.push(

        ...validateCalculationScenarios()

    );


    checks.push(

        ...validateHistoricalRepository()

    );


    checks.push(

        ...validateConfiguration()

    );


    checks.push(

        ...validateCurrentOperationalAssessment()

    );


    const passCount = checks.filter(

        check => check.status === "PASS"

    ).length;


    const failCount = checks.filter(

        check => check.status === "FAIL"

    ).length;


    const skipCount = checks.filter(

        check => check.status === "SKIP"

    ).length;


    const result:ValidationSuiteResult = {

        passed:
            failCount === 0,

        passCount,

        failCount,

        skipCount,

        totalChecks:
            checks.length,

        checks,

        ranAt:
            new Date()

    };


    printValidationSuiteReport(

        result

    );


    return result;

}


/**
 * Validate all configured pure calculation scenarios.
 */
function validateCalculationScenarios():

ValidationCheck[] {

    const rows =

        getEdoriScenarioCalibrationRows();


    const checks:ValidationCheck[] = [];


    rows.forEach(

        row => {

            checks.push({

                id:
                    `scenario-score-${row.id}`,

                category:
                    "Calculation Scenarios",

                name:
                    `${row.scenario} — score range`,

                status:
                    row.scorePassed

                        ? "PASS"

                        : "FAIL",

                details:
                    row.scorePassed

                        ? `HRI ${row.score} is within expected range ${row.expectedMinimum}-${row.expectedMaximum}.`

                        : `HRI ${row.score} is outside expected range ${row.expectedMinimum}-${row.expectedMaximum}.`

            });


            if(

                row.expectedOperationalState

                ===

                null

            ){

                checks.push({

                    id:
                        `scenario-state-${row.id}`,

                    category:
                        "Operational State Mapping",

                    name:
                        `${row.scenario} — operational state`,

                    status:
                        "SKIP",

                    details:
                        `No expected operational state is configured. Actual state: ${row.operationalState}.`

                });

            }
            else{

                checks.push({

                    id:
                        `scenario-state-${row.id}`,

                    category:
                        "Operational State Mapping",

                    name:
                        `${row.scenario} — operational state`,

                    status:
                        row.statePassed

                            ? "PASS"

                            : "FAIL",

                    details:
                        row.statePassed

                            ? `Actual state ${row.operationalState} matches expected state ${row.expectedOperationalState}.`

                            : `Actual state ${row.operationalState} does not match expected state ${row.expectedOperationalState}.`

                });

            }

        }

    );


    return checks;

}


/**
 * Validate the active historical baseline source.
 */
function validateHistoricalRepository():

ValidationCheck[] {

    const status =

        getHistoricalRepositoryStatus();


    return [

        {

            id:
                "historical-record-count",

            category:
                "Historical Baseline",

            name:
                "Historical dataset completeness",

            status:
                status.complete

                    &&

                    status.recordCount

                    ===

                    status.expectedRecordCount

                        ? "PASS"

                        : "FAIL",

            details:
                `${status.recordCount}/${status.expectedRecordCount} records available from ${formatHistoricalSource(status.source)}.`

        },

        {

            id:
                "historical-required-168",

            category:
                "Historical Baseline",

            name:
                "Weekly weekday/hour coverage",

            status:
                status.expectedRecordCount === 168

                    ? "PASS"

                    : "FAIL",

            details:
                `Repository expects ${status.expectedRecordCount} records; EDORI requires 7 weekdays × 24 hours = 168.`

        }

    ];

}


/**
 * Validate administrative configuration invariants.
 */
function validateConfiguration():

ValidationCheck[] {

    const configuration =

        getConfiguration();


    const domainWeightTotal =

        configuration.domainWeights.edPressure

        +

        configuration.domainWeights.acuteCapacity

        +

        configuration.domainWeights.criticalCapacity

        +

        configuration.domainWeights.inflow

        +

        configuration.domainWeights.projectedCapacity;


    const edPressureWeightTotal =

        configuration.edPressureWeights.volume

        +

        configuration.edPressureWeights.boarding

        +

        configuration.edPressureWeights.acuity;


    const levels = [

        ...configuration.operationalLevels

    ].sort(

        (
            first,
            second
        ) => first.minimum - second.minimum

    );


    const levelCoverageValid =

        levels.length === 5

        &&

        levels[0]?.minimum === 0

        &&

        levels[levels.length - 1]?.maximum === 100

        &&

        levels.every(

            (
                level,
                index
            ) => {

                if(

                    level.minimum

                    >

                    level.maximum

                ){

                    return false;

                }


                if(index === 0){

                    return true;

                }


                const previous =

                    levels[index - 1];


                return level.minimum

                    ===

                    previous.maximum + 1;

            }

        );


    return [

        {

            id:
                "configuration-domain-weights",

            category:
                "Configuration Integrity",

            name:
                "Hospital Readiness domain weights",

            status:
                approximatelyEqual(
                    domainWeightTotal,
                    1
                )

                    ? "PASS"

                    : "FAIL",

            details:
                `Effective domain weights total ${roundValue(domainWeightTotal)}; expected 1.0.`

        },

        {

            id:
                "configuration-ed-pressure-weights",

            category:
                "Configuration Integrity",

            name:
                "ED pressure component weights",

            status:
                approximatelyEqual(
                    edPressureWeightTotal,
                    1
                )

                    ? "PASS"

                    : "FAIL",

            details:
                `ED pressure component weights total ${roundValue(edPressureWeightTotal)}; expected 1.0.`

        },

        {

            id:
                "configuration-operational-levels",

            category:
                "Configuration Integrity",

            name:
                "Alpha–Echo score coverage",

            status:
                levelCoverageValid

                    ? "PASS"

                    : "FAIL",

            details:
                levelCoverageValid

                    ? "Five configured levels continuously cover HRI scores 0 through 100."

                    : "Operational-level ranges do not provide continuous five-level coverage from 0 through 100."

        },

        {

            id:
                "configuration-ed-capacity",

            category:
                "Configuration Integrity",

            name:
                "ED treatment capacity",

            status:
                Number.isFinite(
                    configuration.hospital.edCapacity
                )

                &&

                configuration.hospital.edCapacity > 0

                    ? "PASS"

                    : "FAIL",

            details:
                `Configured ED treatment capacity: ${configuration.hospital.edCapacity}.`

        }

    ];

}


/**
 * Validate the currently committed operational
 * assessment without modifying application state.
 *
 * Current-state checks are skipped when no calculated
 * assessment is available.
 */
function validateCurrentOperationalAssessment():

ValidationCheck[] {

    if(!hasCommittedAssessment()){

        return [

            createSkippedCurrentCheck(

                "current-operational-assessment",

                "Current operational assessment",

                "No committed assessment is available."

            ),

            createSkippedCurrentCheck(

                "current-trigger-engine",

                "Current trigger engine",

                "No committed assessment is available."

            )

        ];

    }


    const result =

        getLatestResult();


    if(!result){

        return [

            createSkippedCurrentCheck(

                "current-operational-assessment",

                "Current operational assessment",

                "No current calculated result is available."

            ),

            createSkippedCurrentCheck(

                "current-trigger-engine",

                "Current trigger engine",

                "No current calculated result is available."

            )

        ];

    }


    const context = {

        assessment:
            getState(),

        result,

        snapshots:
            getSnapshots(),

        evaluatedAt:
            new Date()

    };


    const rawTriggerResults =

        evaluateOperationalTriggers(

            context

        );


    const operationalAssessment =

        createOperationalAssessment(

            context

        );


    const rawActiveIds = new Set(

        rawTriggerResults

            .filter(
                item => item.active
            )

            .map(
                item => item.trigger.id
            )

    );


    const effectiveActiveIds =

        operationalAssessment.activeTriggers.map(

            item => item.trigger.id

        );


    const effectiveSet = new Set(

        effectiveActiveIds

    );


    const effectiveSubsetOfRaw =

        effectiveActiveIds.every(

            id => rawActiveIds.has(id)

        );


    const noEffectiveDuplicates =

        effectiveSet.size

        ===

        effectiveActiveIds.length;


    const baseStateMatchesResult =

        operationalAssessment
            .baseOperationalState
            .title

        ===

        result.operationalState.title;


    const momentumPillar =

        operationalAssessment.pillarDetails.find(

            pillar =>
                pillar.id
                ===
                "operationalMomentum"

        );


    const stableMomentumConsistent =

        operationalAssessment.riskDirection

        !==

        "Stable"

        ||

        momentumPillar?.score

        ===

        0;


    const severeProjectedTrigger =

        operationalAssessment.activeTriggers.find(

            item =>
                item.trigger.id
                ===
                "severe-projected-acute-capacity-deficit"

        );


    const severeProjectedConsistent =

        !severeProjectedTrigger

        ||

        (
            result.projectedAvailableAcuteCareBeds <= -10

            &&

            result.projectedCapacityScore >= 80
        );


    return [

        {

            id:
                "current-trigger-effective-subset",

            category:
                "Trigger Supersession",

            name:
                "Effective triggers originate from raw active triggers",

            status:
                effectiveSubsetOfRaw

                    ? "PASS"

                    : "FAIL",

            details:
                `${effectiveActiveIds.length} effective active triggers; ${rawActiveIds.size} raw active triggers.`

        },

        {

            id:
                "current-trigger-no-duplicates",

            category:
                "Trigger Supersession",

            name:
                "No duplicate effective triggers",

            status:
                noEffectiveDuplicates

                    ? "PASS"

                    : "FAIL",

            details:
                noEffectiveDuplicates

                    ? "Effective active-trigger identifiers are unique."

                    : "Duplicate trigger identifiers were found after supersession."

        },

        {

            id:
                "current-base-state-consistency",

            category:
                "Operational Assessment",

            name:
                "Base operational state matches HRI result",

            status:
                baseStateMatchesResult

                    ? "PASS"

                    : "FAIL",

            details:
                `Result state ${result.operationalState.title}; OperationalAssessment base state ${operationalAssessment.baseOperationalState.title}.`

        },

        {

            id:
                "current-stable-momentum",

            category:
                "Operational Assessment",

            name:
                "Stable risk direction has zero momentum pressure",

            status:
                stableMomentumConsistent

                    ? "PASS"

                    : "FAIL",

            details:
                `Risk direction: ${operationalAssessment.riskDirection}; momentum pressure: ${momentumPillar?.score ?? "Unavailable"}.`

        },

        {

            id:
                "current-severe-projected-capacity",

            category:
                "Trigger Calibration",

            name:
                "Severe projected deficit requires absolute and normalized severity",

            status:
                severeProjectedConsistent

                    ? "PASS"

                    : "FAIL",

            details:
                severeProjectedTrigger

                    ? `Trigger active with projected beds ${roundValue(result.projectedAvailableAcuteCareBeds)} and projected-capacity score ${roundValue(result.projectedCapacityScore)}.`

                    : `Trigger inactive; projected beds ${roundValue(result.projectedAvailableAcuteCareBeds)}, projected-capacity score ${roundValue(result.projectedCapacityScore)}.`

        }

    ];

}


/**
 * Print a concise but complete console report.
 */
function printValidationSuiteReport(

    result:ValidationSuiteResult

):void {

    console.group(

        `EDORI Validation Suite — ${

            result.passed

                ? "PASS"

                : "FAIL"

        }`

    );


    console.log(

        "Summary:",

        {

            Passed:
                result.passCount,

            Failed:
                result.failCount,

            Skipped:
                result.skipCount,

            Total:
                result.totalChecks,

            RanAt:
                result.ranAt.toISOString()

        }

    );


    console.table(

        createCategorySummary(

            result.checks

        )

    );


    console.table(

        result.checks.map(

            check => ({

                Category:
                    check.category,

                Check:
                    check.name,

                Result:
                    check.status,

                Details:
                    check.details

            })

        )

    );


    const failures =

        result.checks.filter(

            check =>
                check.status
                ===
                "FAIL"

        );


    if(failures.length > 0){

        console.error(

            "Validation failures:",

            failures

        );

    }
    else{

        console.log(

            "No validation failures detected."

        );

    }


    console.groupEnd();

}


/**
 * Summarize checks by category.
 */
function createCategorySummary(

    checks:ValidationCheck[]

):Array<{

    Category:string;

    Passed:number;

    Failed:number;

    Skipped:number;

    Total:number;

    Result:string;

}> {

    const categories =

        Array.from(

            new Set(

                checks.map(

                    check =>
                        check.category

                )

            )

        );


    return categories.map(

        category => {

            const categoryChecks =

                checks.filter(

                    check =>
                        check.category
                        ===
                        category

                );


            const passed =

                categoryChecks.filter(

                    check =>
                        check.status
                        ===
                        "PASS"

                ).length;


            const failed =

                categoryChecks.filter(

                    check =>
                        check.status
                        ===
                        "FAIL"

                ).length;


            const skipped =

                categoryChecks.filter(

                    check =>
                        check.status
                        ===
                        "SKIP"

                ).length;


            return {

                Category:
                    category,

                Passed:
                    passed,

                Failed:
                    failed,

                Skipped:
                    skipped,

                Total:
                    categoryChecks.length,

                Result:
                    failed > 0

                        ? "FAIL"

                        : skipped
                            ===
                            categoryChecks.length

                            ? "SKIP"

                            : "PASS"

            };

        }

    );

}


/**
 * Create one skipped current-state check.
 */
function createSkippedCurrentCheck(

    id:string,

    name:string,

    details:string

):ValidationCheck {

    return {

        id,

        category:
            "Current Operational State",

        name,

        status:
            "SKIP",

        details

    };

}


/**
 * Compare floating-point configuration totals.
 */
function approximatelyEqual(

    first:number,

    second:number,

    tolerance:number = 0.0001

):boolean {

    return Math.abs(

        first - second

    )

    <=

    tolerance;

}


/**
 * Format active historical source.
 */
function formatHistoricalSource(

    source:
        | "imported"
        | "built-in"

):string {

    return source === "imported"

        ? "the imported CSV dataset"

        : "the built-in development dataset";

}


/**
 * Round report values without changing calculations.
 */
function roundValue(

    value:number

):number {

    return Math.round(

        value * 10

    )

    /

    10;

}