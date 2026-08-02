/**
 * OperationalForecast
 *
 * Produces a transparent, directional 2-hour and
 * 4-hour ED operational outlook.
 *
 * This is a scenario estimate rather than a
 * clinically validated predictive model.
 *
 * Inputs:
 *
 * - Current ED volume
 * - Expected arrivals
 * - Expected departures
 * - Current boarding burden
 * - Recent EDORI score movement
 *
 * This component does not modify EDORI results,
 * application state, or snapshot history.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    HOSPITAL

}

from "../config/constants";


import {

    getOperationalState

}

from "../config/operationalStates";


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

    projectedCapacityPercent:number;

    projectedScore:number;

    projectedLevel:string;

    projectedLevelIcon:string;

    projectedLevelColor:string;

    scoreChange:number;

    direction:

        | "Improving"

        | "Stable"

        | "Worsening"

        | "Rapidly Worsening";

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
                        Directional 2-hour and 4-hour scenario estimates
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


    const result = getLatestResult();


    if(!result){

        container.innerHTML =

            createAwaitingAssessmentState();


        return;

    }


    try {

        const assessment = getState();

        const snapshots = getSnapshots();


        const expectedNetFlow =

            assessment.expectedArrivals

            -

            assessment.expectedDepartures;


        const recentHourlyScoreChange =

            determineRecentHourlyScoreChange(

                snapshots,

                result.score

            );


        const boardingPressure =

            calculateBoardingPressure(

                assessment.boardedPatients,

                assessment.expectedBoarders

            );


        const twoHourEstimate =

            createForecastEstimate({

                horizonHours:
                    2,

                currentVolume:
                    assessment.totalEDVolume,

                expectedNetFlow,

                currentScore:
                    result.score,

                recentHourlyScoreChange,

                boardingPressure

            });


        const fourHourEstimate =

            createForecastEstimate({

                horizonHours:
                    4,

                currentVolume:
                    assessment.totalEDVolume,

                expectedNetFlow,

                currentScore:
                    result.score,

                recentHourlyScoreChange,

                boardingPressure

            });


        container.innerHTML =

            createForecastMarkup({

                currentScore:
                    result.score,

                currentVolume:
                    assessment.totalEDVolume,

                expectedNetFlow,

                recentHourlyScoreChange,

                boardingPressure,

                twoHourEstimate,

                fourHourEstimate

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
 * The estimate combines:
 *
 * 1. Expected census movement.
 * 2. Recent score trajectory.
 * 3. Boarding pressure.
 * 4. Projected ED capacity use.
 */
function createForecastEstimate(

    options:{

        horizonHours:number;

        currentVolume:number;

        expectedNetFlow:number;

        currentScore:number;

        recentHourlyScoreChange:number;

        boardingPressure:number;

    }

):ForecastEstimate {

    const projectedVolume = Math.max(

        0,

        options.currentVolume

        +

        options.expectedNetFlow

        *

        options.horizonHours

    );


    const projectedCapacityPercent =

        calculatePercentage(

            projectedVolume,

            HOSPITAL.ED_BEDS

        );


    /*
     * Volume movement contribution:
     *
     * Each projected patient above or below current
     * volume changes the directional score estimate
     * by 0.55 points.
     */
    const projectedVolumeChange =

        projectedVolume

        -

        options.currentVolume;


    const volumeScoreAdjustment =

        projectedVolumeChange

        *

        0.55;


    /*
     * Recent trajectory contribution:
     *
     * Continue only half of the recent hourly score
     * movement to reduce overreaction to one change.
     */
    const trajectoryAdjustment =

        options.recentHourlyScoreChange

        *

        options.horizonHours

        *

        0.5;


    /*
     * Boarding contribution:
     *
     * Boarding above expectation creates a modest
     * sustained upward adjustment.
     */
    const boardingAdjustment =

        options.boardingPressure

        *

        options.horizonHours

        *

        0.3;


    const capacityAdjustment =

        calculateCapacityAdjustment(

            projectedCapacityPercent

        );


    const projectedScore = clampScore(

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

        getOperationalState(

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

        direction:
            determineForecastDirection(
                scoreChange
            )

    };

}


/**
 * Add score pressure when projected census crosses
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
 * Measure boarding pressure above the expected
 * historical baseline.
 */
function calculateBoardingPressure(

    boardedPatients:number,

    expectedBoarders:number

):number {

    return Math.max(

        0,

        boardedPatients

        -

        expectedBoarders

    );

}


/**
 * Estimate recent hourly EDORI movement.
 *
 * This uses up to the two most recent valid saved
 * assessments. When assessment timestamps are too
 * close together or unavailable, the raw score
 * difference is used conservatively.
 */
function determineRecentHourlyScoreChange(

    snapshots:EdoriSnapshot[],

    currentScore:number

):number {

    const validSnapshots = snapshots

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


    let comparisonSnapshot:EdoriSnapshot | null = null;

    let latestScore = currentScore;

    let latestTime = Date.now();


    if(currentResultAlreadyStored){

        if(validSnapshots.length < 2){

            return 0;

        }


        comparisonSnapshot =

            validSnapshots[

                validSnapshots.length - 2

            ];


        latestTime = new Date(

            latestSnapshot.timestamp

        ).getTime();

    }
    else {

        comparisonSnapshot =

            latestSnapshot;

    }


    const comparisonTime = new Date(

        comparisonSnapshot.timestamp

    ).getTime();


    const elapsedHours = Math.max(

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


    /*
     * Prevent one unusual interval from creating an
     * extreme directional forecast.
     */
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

        expectedNetFlow:number;

        recentHourlyScoreChange:number;

        boardingPressure:number;

        twoHourEstimate:ForecastEstimate;

        fourHourEstimate:ForecastEstimate;

    }

):string {

    const overallDirection =

        determineOverallDirection(

            options.twoHourEstimate,

            options.fourHourEstimate

        );


    return `

        <div class="operational-forecast-summary">

            <div>

                <span>
                    Current EDORI
                </span>

                <strong>
                    ${Math.round(
                        options.currentScore
                    )}
                </strong>

            </div>


            <div>

                <span>
                    Current ED Volume
                </span>

                <strong>
                    ${formatNumber(
                        options.currentVolume
                    )}
                </strong>

            </div>


            <div>

                <span>
                    Expected Net Flow
                </span>

                <strong class="${createSignedValueClass(
                    options.expectedNetFlow
                )}">

                    ${formatSignedNumber(
                        options.expectedNetFlow
                    )}

                </strong>

            </div>


            <div>

                <span>
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

        </div>


        <div class="operational-forecast-grid">

            ${createForecastCard(
                options.twoHourEstimate
            )}

            ${createForecastCard(
                options.fourHourEstimate
            )}

        </div>


        <div class="operational-forecast-assumptions">

            <h4>
                Scenario assumptions
            </h4>


            <div class="operational-forecast-assumption-grid">

                ${createAssumptionCard(

                    "Hourly Net Flow",

                    formatSignedNumber(
                        options.expectedNetFlow
                    ),

                    "Expected arrivals minus expected departures are applied for each forecast hour."

                )}


                ${createAssumptionCard(

                    "Recent Score Movement",

                    `${formatSignedNumber(
                        options.recentHourlyScoreChange
                    )} per hour`,

                    "Only half of the recent score trajectory is continued to limit overreaction."

                )}


                ${createAssumptionCard(

                    "Boarding Above Expected",

                    formatNumber(
                        options.boardingPressure
                    ),

                    "Boarding above the historical baseline adds sustained pressure to the scenario."

                )}

            </div>

        </div>


        <div class="operational-forecast-disclaimer">

            <strong>
                Directional estimate only
            </strong>

            <p>
                This outlook is a transparent scenario calculation. It has not been clinically validated and should support, not replace, operational judgment.
            </p>

        </div>

    `;

}


/**
 * Create one forecast horizon card.
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
                        Forecast Horizon
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


            <div class="operational-forecast-level">

                <span>
                    Projected Level
                </span>

                <strong>

                    ${escapeHtml(
                        estimate.projectedLevel
                    )}

                </strong>

            </div>


            <div class="operational-forecast-score">

                <span>
                    Projected EDORI
                </span>

                <strong>

                    ${formatNumber(
                        estimate.projectedScore
                    )}

                </strong>


                <small class="${createSignedValueClass(
                    estimate.scoreChange
                )}">

                    ${formatSignedNumber(
                        estimate.scoreChange
                    )}

                    from current

                </small>

            </div>


            <div class="operational-forecast-metrics">

                <div>

                    <span>
                        Projected Volume
                    </span>

                    <strong>

                        ${formatNumber(
                            estimate.projectedVolume
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        ED Capacity Use
                    </span>

                    <strong>

                        ${formatNumber(
                            estimate.projectedCapacityPercent
                        )}%

                    </strong>

                </div>


                <div>

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

            </div>

        </article>

    `;

}


/**
 * Create one forecast-assumption card.
 */
function createAssumptionCard(

    label:string,

    value:string,

    description:string

):string {

    return `

        <div class="operational-forecast-assumption">

            <span>

                ${escapeHtml(label)}

            </span>

            <strong>

                ${escapeHtml(value)}

            </strong>

            <p>

                ${escapeHtml(description)}

            </p>

        </div>

    `;

}


/**
 * Determine directional interpretation from the
 * projected score change.
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
 * Determine the overall outlook using the more
 * severe of the two horizons.
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
 * Create a CSS class for signed numerical values.
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
 * Create the initial state.
 */
function createAwaitingAssessmentState():string {

    return `

        <div class="operational-forecast-empty">

            <strong>
                Awaiting assessment
            </strong>

            <p>
                Calculate EDORI to generate the 2-hour and 4-hour operational outlook.
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

                ${escapeHtml(reason)}

            </p>

        </div>

    `;

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

        return `+${formatNumber(value)}`;

    }


    return formatNumber(value);

}


/**
 * Escape text inserted into HTML.
 */
function escapeHtml(

    value:string

):string {

    return value

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll("\"", "&quot;")

        .replaceAll("'", "&#039;");

}


/**
 * Escape text inserted into HTML attributes.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(value);

}