/**
 * OperationalForecast
 *
 * Produces a transparent, directional 2-hour and
 * 4-hour Hospital Readiness operational outlook.
 *
 * Historical weekday/hour patterns are used internally
 * to estimate future ED census and boarding conditions.
 *
 * The user-facing presentation emphasizes:
 *
 * - Current conditions
 * - Expected change from current
 * - +2 hour operational outlook
 * - +4 hour operational outlook
 * - Scenario HRI impact
 * - Projected acute-care bed availability
 *
 * This is a directional operational scenario rather than
 * a clinically validated predictive model.
 */

import {
    APP_EVENTS
}
from "../config/appEvents";


import {
    getConfiguration
}
from "../services/ConfigurationService";


import {
    getHistoricalExpectation
}
from "../services/HistoricalDataService";


import {
    getConfiguredOperationalState
}
from "../services/OperationalStateService";


import {
    subscribe
}
from "../services/EventService";


import {
    getLatestResult,
    getResultInvalidationReason
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


import type {
    EdoriSnapshot
}
from "../types/EdoriSnapshot";


interface ForecastEstimate {

    horizonHours:number;

    projectedVolume:number;

    projectedBoarders:number;

    projectedCapacityPercent:number;

    projectedScore:number;

    projectedLevel:string;

    projectedLevelIcon:string;

    projectedLevelColor:string;

    scoreChange:number;

    volumeChange:number;

    boarderChange:number;

    capacityChange:number;

    direction:
        | "Improving"
        | "Stable"
        | "Worsening"
        | "Rapidly Worsening";

}


interface AcuteCapacityProjection {

    currentAvailableBeds:number;

    projectedAvailableBeds:number;

    change:number;

    boardedPatients:number;

    directAdmissions:number;

    surgicalAdmissions:number;

    expectedEDAdmissions:number;

    expectedDepartures:number;

}


/**
 * Render the Operational Forecast panel.
 */
export function OperationalForecast():string {

    return `

        <section class="operational-forecast-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Operational Outlook
                    </h3>

                    <p class="panel-description">
                        Expected operational change over the next 2 and 4 hours
                    </p>

                </div>

            </div>


            <div
                id="operationalForecastContent"
                class="operational-forecast-content"
                aria-live="polite"
            >

                ${createAwaitingAssessmentState()}

            </div>

        </section>

    `;

}


/**
 * Initialize forecast behavior.
 */
export function initializeOperationalForecast():void {

    updateOperationalForecast();


    subscribe(
        APP_EVENTS.RESULT_CHANGED,
        updateOperationalForecast
    );


    subscribe(
        APP_EVENTS.HISTORY_CHANGED,
        updateOperationalForecast
    );


    subscribe(
        APP_EVENTS.HISTORICAL_DATA_CHANGED,
        updateOperationalForecast
    );

}


/**
 * Refresh the operational outlook.
 */
function updateOperationalForecast():void {

    const container = document.getElementById(
        "operationalForecastContent"
    );


    if(!container){

        return;

    }


    const invalidationReason =
        getResultInvalidationReason();


    if(invalidationReason){

        container.innerHTML =
            createRecalculationRequiredState(
                invalidationReason
            );

        return;

    }


    if(!hasCommittedAssessment()){

        container.innerHTML =
            createAwaitingAssessmentState();

        return;

    }


    const result =
        getLatestResult();


    if(!result){

        container.innerHTML =
            createAwaitingAssessmentState();

        return;

    }


    try {

        const assessment =
            getState();


        const snapshots =
            getSnapshots();


        /*
         * Historical data remains the basis of the
         * ED forecast, but historical normals are no
         * longer the primary user-facing comparison.
         *
         * Future ED volume:
         *
         * future historical ED volume
         * +
         * current deviation from historical expectation
         *
         * Future boarding:
         *
         * future historical boarders
         * +
         * current deviation from historical expectation
         */

        const currentVolumeDeviation =
            assessment.totalEDVolume
            -
            assessment.expectedEDVolume;


        const currentBoardingDeviation =
            assessment.boardedPatients
            -
            assessment.expectedEDBoarders;


        const recentHourlyScoreChange =
            determineRecentHourlyScoreChange(
                snapshots,
                result.score
            );


        const twoHourFuturePeriod =
            resolveFutureDayHour(
                assessment.day,
                assessment.hour,
                2
            );


        const fourHourFuturePeriod =
            resolveFutureDayHour(
                assessment.day,
                assessment.hour,
                4
            );


        const twoHourHistorical =
            getHistoricalExpectation(
                twoHourFuturePeriod.day,
                twoHourFuturePeriod.hour
            );


        const fourHourHistorical =
            getHistoricalExpectation(
                fourHourFuturePeriod.day,
                fourHourFuturePeriod.hour
            );


        const configuration =
            getConfiguration();


        const edCapacity =
            Math.max(
                1,
                configuration.hospital.edCapacity
            );


        const currentCapacityPercent =
            calculatePercentage(
                assessment.totalEDVolume,
                edCapacity
            );


        const twoHourEstimate =
            createForecastEstimate({

                horizonHours:
                    2,

                currentVolume:
                    assessment.totalEDVolume,

                currentBoarders:
                    assessment.boardedPatients,

                currentCapacityPercent,

                currentScore:
                    result.score,

                currentVolumeDeviation,

                currentBoardingDeviation,

                futureExpectedVolume:
                    twoHourHistorical.expectedEDVolume,

                futureExpectedBoarders:
                    twoHourHistorical.expectedEDBoarders,

                recentHourlyScoreChange,

                edCapacity

            });


        const fourHourEstimate =
            createForecastEstimate({

                horizonHours:
                    4,

                currentVolume:
                    assessment.totalEDVolume,

                currentBoarders:
                    assessment.boardedPatients,

                currentCapacityPercent,

                currentScore:
                    result.score,

                currentVolumeDeviation,

                currentBoardingDeviation,

                futureExpectedVolume:
                    fourHourHistorical.expectedEDVolume,

                futureExpectedBoarders:
                    fourHourHistorical.expectedEDBoarders,

                recentHourlyScoreChange,

                edCapacity

            });


        /*
         * Current available acute-care beds.
         *
         * Support both current and legacy field names.
         */

        const staffedAcuteBeds =
            getNumericAssessmentValue(
                assessment,
                "staffedAcuteCareBeds",
                "staffedAcuteBeds"
            );


        const occupiedAcuteBeds =
            getNumericAssessmentValue(
                assessment,
                "occupiedAcuteCareBeds",
                "occupiedAcuteBeds"
            );


        const currentAvailableAcuteBeds =
            staffedAcuteBeds
            -
            occupiedAcuteBeds;


        const acuteCapacityProjection:
            AcuteCapacityProjection = {

                currentAvailableBeds:
                    currentAvailableAcuteBeds,

                projectedAvailableBeds:
                    result.projectedAvailableAcuteCareBeds,

                change:
                    result.projectedAvailableAcuteCareBeds
                    -
                    currentAvailableAcuteBeds,

                boardedPatients:
                    assessment.boardedPatients,

                directAdmissions:
                    assessment.currentDirectAdmissions,

                surgicalAdmissions:
                    assessment.currentSurgicalAdmissions,

                expectedEDAdmissions:
                    assessment.expectedEDAdmissions4h,

                expectedDepartures:
                    assessment.expectedInpatientDepartures4h

            };


        container.innerHTML =
            createForecastMarkup({

                currentScore:
                    result.score,

                currentVolume:
                    assessment.totalEDVolume,

                currentBoarders:
                    assessment.boardedPatients,

                currentCapacityPercent,

                recentHourlyScoreChange,

                twoHourEstimate,

                fourHourEstimate,

                acuteCapacityProjection

            });

    }
    catch(error){

        console.error(
            "Unable to update the operational outlook:",
            error
        );


        container.innerHTML = `

            <div class="operational-forecast-empty error">

                <strong>
                    Forecast unavailable
                </strong>

                <p>
                    Review the browser console for additional details.
                </p>

            </div>

        `;

    }

}


/**
 * Create one horizon estimate.
 *
 * Historical hour-of-week patterns estimate future
 * ED volume and boarding. The display emphasizes how
 * those estimates differ from CURRENT conditions.
 */
function createForecastEstimate(

    options:{

        horizonHours:number;

        currentVolume:number;

        currentBoarders:number;

        currentCapacityPercent:number;

        currentScore:number;

        currentVolumeDeviation:number;

        currentBoardingDeviation:number;

        futureExpectedVolume:number;

        futureExpectedBoarders:number;

        recentHourlyScoreChange:number;

        edCapacity:number;

    }

):ForecastEstimate {

    const projectedVolume =
        Math.max(
            0,
            options.futureExpectedVolume
            +
            options.currentVolumeDeviation
        );


    const projectedBoarders =
        Math.min(

            projectedVolume,

            Math.max(
                0,
                options.futureExpectedBoarders
                +
                options.currentBoardingDeviation
            )

        );


    const projectedCapacityPercent =
        calculatePercentage(
            projectedVolume,
            options.edCapacity
        );


    const volumeChange =
        projectedVolume
        -
        options.currentVolume;


    const boarderChange =
        projectedBoarders
        -
        options.currentBoarders;


    const capacityChange =
        projectedCapacityPercent
        -
        options.currentCapacityPercent;


    /*
     * Scenario HRI impact.
     *
     * This preserves the existing transparent directional
     * forecast methodology.
     *
     * It does not modify the actual Version 2.2 HRI result.
     */

    const volumeScoreAdjustment =
        volumeChange
        *
        0.55;


    const trajectoryAdjustment =
        options.recentHourlyScoreChange
        *
        options.horizonHours
        *
        0.5;


    const projectedBoardingPressure =
        Math.max(
            0,
            projectedBoarders
            -
            options.futureExpectedBoarders
        );


    const boardingAdjustment =
        projectedBoardingPressure
        *
        options.horizonHours
        *
        0.3;


    const capacityAdjustment =
        calculateCapacityAdjustment(
            projectedCapacityPercent
        );


    const projectedScore =
        clampScore(

            options.currentScore
            +
            volumeScoreAdjustment
            +
            trajectoryAdjustment
            +
            boardingAdjustment
            +
            capacityAdjustment

        );


    const operationalState =
        getConfiguredOperationalState(
            projectedScore
        );


    const scoreChange =
        projectedScore
        -
        options.currentScore;


    return {

        horizonHours:
            options.horizonHours,

        projectedVolume:
            roundToOneDecimal(
                projectedVolume
            ),

        projectedBoarders:
            roundToOneDecimal(
                projectedBoarders
            ),

        projectedCapacityPercent:
            roundToOneDecimal(
                projectedCapacityPercent
            ),

        projectedScore:
            roundToOneDecimal(
                projectedScore
            ),

        projectedLevel:
            operationalState.title,

        projectedLevelIcon:
            operationalState.icon,

        projectedLevelColor:
            operationalState.color,

        scoreChange:
            roundToOneDecimal(
                scoreChange
            ),

        volumeChange:
            roundToOneDecimal(
                volumeChange
            ),

        boarderChange:
            roundToOneDecimal(
                boarderChange
            ),

        capacityChange:
            roundToOneDecimal(
                capacityChange
            ),

        direction:
            determineForecastDirection(
                scoreChange
            )

    };

}


/**
 * Add score pressure when projected ED census crosses
 * increasingly strained capacity ranges.
 */
function calculateCapacityAdjustment(

    capacityPercent:number

):number {

    if(capacityPercent >= 150){

        return 12;

    }


    if(capacityPercent >= 130){

        return 8;

    }


    if(capacityPercent >= 115){

        return 5;

    }


    if(capacityPercent >= 100){

        return 2;

    }


    return 0;

}


/**
 * Estimate recent hourly Hospital Readiness movement.
 *
 * Uses the most recent valid snapshots and limits
 * extreme single-interval movement.
 */
function determineRecentHourlyScoreChange(

    snapshots:EdoriSnapshot[],

    currentScore:number

):number {

    const validSnapshots =
        snapshots

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

            .slice()

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


    if(validSnapshots.length === 0){

        return 0;

    }


    const latestSnapshot =
        validSnapshots[
            validSnapshots.length - 1
        ];


    const currentResultAlreadyStored =
        Math.abs(
            latestSnapshot.score
            -
            currentScore
        )
        <
        0.001;


    let comparisonSnapshot:
        EdoriSnapshot | null =
            null;


    let latestScore =
        currentScore;


    let latestTime =
        Date.now();


    if(currentResultAlreadyStored){

        if(validSnapshots.length < 2){

            return 0;

        }


        comparisonSnapshot =
            validSnapshots[
                validSnapshots.length - 2
            ];


        latestTime =
            new Date(
                latestSnapshot.timestamp
            ).getTime();

    }
    else {

        comparisonSnapshot =
            latestSnapshot;

    }


    const comparisonTime =
        new Date(
            comparisonSnapshot.timestamp
        ).getTime();


    const elapsedHours =
        Math.max(

            0.25,

            (
                latestTime
                -
                comparisonTime
            )
            /
            3_600_000

        );


    const rawHourlyChange =
        (
            latestScore
            -
            comparisonSnapshot.score
        )
        /
        elapsedHours;


    return Math.min(
        10,
        Math.max(
            -10,
            rawHourlyChange
        )
    );

}


/**
 * Create the completed forecast display.
 */
function createForecastMarkup(

    options:{

        currentScore:number;

        currentVolume:number;

        currentBoarders:number;

        currentCapacityPercent:number;

        recentHourlyScoreChange:number;

        twoHourEstimate:ForecastEstimate;

        fourHourEstimate:ForecastEstimate;

        acuteCapacityProjection:
            AcuteCapacityProjection;

    }

):string {

    const overallDirection =
        determineOverallDirection(
            options.twoHourEstimate,
            options.fourHourEstimate
        );


    return `

        <div class="operational-forecast-outlook-header">

            <div>

                <span class="operational-forecast-eyebrow">
                    Overall Outlook
                </span>

                <strong class="${createDirectionClass(
                    overallDirection
                )}">

                    ${escapeHtml(
                        overallDirection
                    )}

                </strong>

            </div>


            <p>
                Expected change from the current operational position
            </p>

        </div>


        <div class="operational-forecast-comparison-grid">

            ${createCurrentCard({

                currentScore:
                    options.currentScore,

                currentVolume:
                    options.currentVolume,

                currentBoarders:
                    options.currentBoarders,

                currentCapacityPercent:
                    options.currentCapacityPercent

            })}


            ${createForecastCard(
                options.twoHourEstimate
            )}


            ${createForecastCard(
                options.fourHourEstimate
            )}

        </div>


        ${createAcuteCapacityMarkup(
            options.acuteCapacityProjection
        )}


        <div class="operational-forecast-basis">

            <div class="operational-forecast-basis-header">

                <div>

                    <span>
                        Forecast Basis
                    </span>

                    <strong>
                        Directional operational scenario
                    </strong>

                </div>

            </div>


            <div class="operational-forecast-basis-grid">

                <div>

                    <span>
                        Recent HRI Movement
                    </span>

                    <strong class="${createSignedValueClass(
                        options.recentHourlyScoreChange
                    )}">

                        ${formatSignedNumber(
                            options.recentHourlyScoreChange
                        )}
                        / hr

                    </strong>

                </div>


                <div>

                    <span>
                        ED Forecast Method
                    </span>

                    <strong>
                        Historical pattern + current variance
                    </strong>

                </div>


                <div>

                    <span>
                        Comparison
                    </span>

                    <strong>
                        Future vs current
                    </strong>

                </div>

            </div>

        </div>


        <div class="operational-forecast-disclaimer">

            <strong>
                Directional scenario only
            </strong>

            <p>
                Projected HRI values estimate the potential impact of the displayed operational scenario. Historical weekday/hour patterns are used as the forecasting basis, while displayed changes are compared with current conditions. These estimates are not validated predictions of future HRI and should support, not replace, operational judgment.
            </p>

        </div>

    `;

}


/**
 * Create the current-state comparison card.
 *
 * The invisible direction placeholder preserves the
 * same vertical spacing used by the +2 and +4 hour cards.
 * This keeps all major metrics aligned horizontally.
 */
function createCurrentCard(

    options:{

        currentScore:number;

        currentVolume:number;

        currentBoarders:number;

        currentCapacityPercent:number;

    }

):string {

    return `

        <article
            class="
                operational-forecast-card
                operational-forecast-current-card
            "
        >

            <div class="operational-forecast-card-header">

                <div>

                    <span>
                        Current State
                    </span>

                    <h4>
                        Now
                    </h4>

                </div>

            </div>


            <div
                class="
                    operational-forecast-direction-row
                    operational-forecast-direction-placeholder
                "
                aria-hidden="true"
            >

                <span>
                    Direction
                </span>

                <strong>
                    Current
                </strong>

            </div>


            ${createMetric(

                "Current HRI",

                formatNumber(
                    options.currentScore
                ),

                "Current calculated score",

                ""

            )}


            ${createMetric(

                "ED Volume",

                formatNumber(
                    options.currentVolume
                ),

                "Current census",

                ""

            )}


            ${createMetric(

                "ED Boarders",

                formatNumber(
                    options.currentBoarders
                ),

                "Current boarding burden",

                ""

            )}


            ${createMetric(

                "ED Capacity Use",

                `${formatNumber(
                    options.currentCapacityPercent
                )}%`,

                "Current ED census / capacity",

                ""

            )}

        </article>

    `;

}


/**
 * Create one future forecast card.
 */
function createForecastCard(

    estimate:ForecastEstimate

):string {

    return `

        <article
            class="operational-forecast-card"
            style="
                --forecast-level-color:
                ${escapeAttribute(
                    estimate.projectedLevelColor
                )};
            "
        >

            <div class="operational-forecast-card-header">

                <div>

                    <span>
                        Projected State
                    </span>

                    <h4>
                        +${estimate.horizonHours} Hours
                    </h4>

                </div>


                <span
                    class="operational-forecast-level-icon"
                    aria-hidden="true"
                >

                    ${escapeHtml(
                        estimate.projectedLevelIcon
                    )}

                </span>

            </div>


            <div class="operational-forecast-direction-row">

                <span>
                    Direction
                </span>

                <strong class="${createDirectionClass(
                    estimate.direction
                )}">

                    ${escapeHtml(
                        estimate.direction
                    )}

                </strong>

            </div>


            ${createMetric(

                "Projected HRI",

                formatNumber(
                    estimate.projectedScore
                ),

                `${formatSignedNumber(
                    estimate.scoreChange
                )} from current`,

                createSignedValueClass(
                    estimate.scoreChange
                )

            )}


            ${createMetric(

                "Projected ED Volume",

                formatNumber(
                    estimate.projectedVolume
                ),

                `${formatSignedNumber(
                    estimate.volumeChange
                )} from current`,

                createSignedValueClass(
                    estimate.volumeChange
                )

            )}


            ${createMetric(

                "Projected Boarders",

                formatNumber(
                    estimate.projectedBoarders
                ),

                `${formatSignedNumber(
                    estimate.boarderChange
                )} from current`,

                createSignedValueClass(
                    estimate.boarderChange
                )

            )}


            ${createMetric(

                "Projected ED Capacity",

                `${formatNumber(
                    estimate.projectedCapacityPercent
                )}%`,

                `${formatSignedNumber(
                    estimate.capacityChange
                )} percentage points from current`,

                createSignedValueClass(
                    estimate.capacityChange
                )

            )}


            <div class="operational-forecast-level">

                <span>
                    Scenario Level
                </span>

                <strong>
                    ${escapeHtml(
                        estimate.projectedLevel
                    )}
                </strong>

            </div>

        </article>

    `;

}


/**
 * Create one metric row.
 */
function createMetric(

    label:string,

    value:string,

    comparison:string,

    comparisonClass:string

):string {

    return `

        <div class="operational-forecast-metric">

            <div>

                <span>
                    ${escapeHtml(
                        label
                    )}
                </span>

                <strong>
                    ${escapeHtml(
                        value
                    )}
                </strong>

            </div>


            <small class="${escapeAttribute(
                comparisonClass
            )}">

                ${escapeHtml(
                    comparison
                )}

            </small>

        </div>

    `;

}


/**
 * Create projected acute-care capacity section.
 *
 * The projected +4 hour value is displayed once in
 * the section header. The summary therefore contains
 * only current availability and expected change.
 */
function createAcuteCapacityMarkup(

    projection:AcuteCapacityProjection

):string {

    return `

        <section class="operational-forecast-acute-capacity">

            <div class="operational-forecast-acute-header">

                <div>

                    <span>
                        Projected Hospital Capacity
                    </span>

                    <h4>
                        Acute-Care Bed Availability
                    </h4>

                </div>


                <div class="operational-forecast-acute-result">

                    <span>
                        Projected +4 Hours
                    </span>

                    <strong class="${createBedAvailabilityClass(
                        projection.projectedAvailableBeds
                    )}">

                        ${formatSignedBedCount(
                            projection.projectedAvailableBeds
                        )}

                    </strong>

                </div>

            </div>


            <div class="operational-forecast-acute-summary">

                <div>

                    <span>
                        Current Available
                    </span>

                    <strong class="${createBedAvailabilityClass(
                        projection.currentAvailableBeds
                    )}">

                        ${formatSignedBedCount(
                            projection.currentAvailableBeds
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        Expected Change
                    </span>

                    <strong class="${createBedChangeClass(
                        projection.change
                    )}">

                        ${formatSignedBedChange(
                            projection.change
                        )}

                    </strong>

                </div>

            </div>


            <div class="operational-forecast-capacity-flow">

                ${createCapacityFlowItem(
                    "ED admissions awaiting beds",
                    projection.boardedPatients,
                    "demand"
                )}


                ${createCapacityFlowItem(
                    "Known direct admissions",
                    projection.directAdmissions,
                    "demand"
                )}


                ${createCapacityFlowItem(
                    "Known surgical / procedural admissions",
                    projection.surgicalAdmissions,
                    "demand"
                )}


                ${createCapacityFlowItem(
                    "Expected additional ED admissions",
                    projection.expectedEDAdmissions,
                    "demand"
                )}


                ${createCapacityFlowItem(
                    "Expected inpatient departures",
                    projection.expectedDepartures,
                    "relief"
                )}

            </div>


            <p class="operational-forecast-capacity-note">
                Negative projected availability represents demand exceeding staffed acute-care capacity.
            </p>

        </section>

    `;

}


/**
 * Create one acute-capacity flow item.
 */
function createCapacityFlowItem(

    label:string,

    value:number,

    type:
        | "demand"
        | "relief"

):string {

    const signedValue =
        type === "relief"
            ? Math.abs(value)
            : -Math.abs(value);


    return `

        <div class="operational-forecast-capacity-flow-item">

            <span>
                ${escapeHtml(
                    label
                )}
            </span>

            <strong class="${
                type === "relief"
                    ? "forecast-value-improving"
                    : "forecast-value-increasing"
            }">

                ${formatSignedNumber(
                    signedValue
                )}

            </strong>

        </div>

    `;

}


/**
 * Determine directional interpretation from the
 * projected HRI change.
 */
function determineForecastDirection(

    scoreChange:number

):ForecastEstimate["direction"] {

    if(scoreChange >= 10){

        return "Rapidly Worsening";

    }


    if(scoreChange >= 3){

        return "Worsening";

    }


    if(scoreChange <= -3){

        return "Improving";

    }


    return "Stable";

}


/**
 * Determine overall outlook using the more severe
 * of the two forecast horizons.
 */
function determineOverallDirection(

    twoHourEstimate:ForecastEstimate,

    fourHourEstimate:ForecastEstimate

):ForecastEstimate["direction"] {

    const ranks:Record<
        ForecastEstimate["direction"],
        number
    > = {

        Improving:
            1,

        Stable:
            2,

        Worsening:
            3,

        "Rapidly Worsening":
            4

    };


    return ranks[fourHourEstimate.direction]
        >=
        ranks[twoHourEstimate.direction]

            ? fourHourEstimate.direction

            : twoHourEstimate.direction;

}


/**
 * Create a direction-specific CSS class.
 */
function createDirectionClass(

    direction:ForecastEstimate["direction"]

):string {

    return `forecast-direction-${direction

        .toLowerCase()

        .replace(
            /[^a-z0-9]+/g,
            "-"
        )}`;

}


/**
 * Create CSS class for signed numerical values.
 *
 * Positive values generally indicate increasing
 * operational pressure.
 */
function createSignedValueClass(

    value:number

):string {

    if(value > 0){

        return "forecast-value-increasing";

    }


    if(value < 0){

        return "forecast-value-improving";

    }


    return "forecast-value-stable";

}


/**
 * Bed availability itself is interpreted opposite
 * pressure measures: positive beds are favorable.
 */
function createBedAvailabilityClass(

    value:number

):string {

    if(value < 0){

        return "forecast-value-increasing";

    }


    if(value > 0){

        return "forecast-value-improving";

    }


    return "forecast-value-stable";

}


/**
 * A positive change in available beds is favorable.
 */
function createBedChangeClass(

    value:number

):string {

    if(value < 0){

        return "forecast-value-increasing";

    }


    if(value > 0){

        return "forecast-value-improving";

    }


    return "forecast-value-stable";

}


/**
 * Create the initial state.
 */
function createAwaitingAssessmentState():string {

    return `

        <div class="operational-forecast-empty">

            <strong>
                Awaiting assessment
            </strong>

            <p>
                Calculate Hospital Readiness to generate the 2-hour and 4-hour operational outlook.
            </p>

        </div>

    `;

}


/**
 * Create the recalculation-required state.
 */
function createRecalculationRequiredState(

    reason:string

):string {

    return `

        <div class="operational-forecast-empty warning">

            <strong>
                Recalculation required
            </strong>

            <p>
                ${escapeHtml(
                    reason
                )}
            </p>

        </div>

    `;

}


/**
 * Resolve a future weekday/hour while correctly
 * rolling across midnight and week boundaries.
 */
function resolveFutureDayHour(

    day:string,

    hour:number,

    hoursAhead:number

):{

    day:
        | "Sunday"
        | "Monday"
        | "Tuesday"
        | "Wednesday"
        | "Thursday"
        | "Friday"
        | "Saturday";

    hour:number;

} {

    const days = [

        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"

    ] as const;


    const dayIndex =
        Math.max(
            0,
            days.indexOf(
                day as typeof days[number]
            )
        );


    const totalHours =
        dayIndex * 24
        +
        hour
        +
        hoursAhead;


    const normalizedTotalHours =
        (
            totalHours
            %
            (7 * 24)
            +
            (7 * 24)
        )
        %
        (7 * 24);


    const futureDayIndex =
        Math.floor(
            normalizedTotalHours / 24
        );


    const futureHour =
        normalizedTotalHours % 24;


    return {

        day:
            days[
                futureDayIndex
            ],

        hour:
            futureHour

    };

}


/**
 * Safely retrieve a numeric assessment value while
 * supporting legacy/current acute-bed field names.
 */
function getNumericAssessmentValue(

    assessment:unknown,

    ...keys:string[]

):number {

    if(
        !assessment
        ||
        typeof assessment !== "object"
    ){

        return 0;

    }


    const record =
        assessment as Record<
            string,
            unknown
        >;


    for(const key of keys){

        const value =
            record[key];


        if(
            typeof value === "number"
            &&
            Number.isFinite(value)
        ){

            return value;

        }

    }


    return 0;

}


/**
 * Calculate a safe percentage.
 */
function calculatePercentage(

    numerator:number,

    denominator:number

):number {

    if(
        !Number.isFinite(numerator)
        ||
        !Number.isFinite(denominator)
        ||
        denominator <= 0
    ){

        return 0;

    }


    return numerator
        /
        denominator
        *
        100;

}


/**
 * Clamp a score to 0–100.
 */
function clampScore(

    value:number

):number {

    if(!Number.isFinite(value)){

        return 0;

    }


    return Math.min(
        100,
        Math.max(
            0,
            value
        )
    );

}


/**
 * Round to one decimal place.
 */
function roundToOneDecimal(

    value:number

):number {

    return Math.round(
        value * 10
    ) / 10;

}


/**
 * Format a number.
 */
function formatNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(Number.isInteger(value)){

        return String(value);

    }


    return value

        .toFixed(1)

        .replace(
            /\.0$/,
            ""
        );

}


/**
 * Format a signed number.
 */
function formatSignedNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(value > 0){

        return `+${formatNumber(
            value
        )}`;

    }


    return formatNumber(
        value
    );

}


/**
 * Format an available-bed position.
 */
function formatSignedBedCount(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(value > 0){

        return `+${formatNumber(
            value
        )} beds`;

    }


    if(value < 0){

        return `${formatNumber(
            value
        )} beds`;

    }


    return "0 beds";

}


/**
 * Format the change in available beds.
 */
function formatSignedBedChange(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(value > 0){

        return `+${formatNumber(
            value
        )} beds`;

    }


    if(value < 0){

        return `${formatNumber(
            value
        )} beds`;

    }


    return "No change";

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