/**
 * OperationalForecast
 *
 * Produces a transparent, directional 2-hour and
 * 4-hour Hospital Readiness operational outlook.
 *
 * This is a scenario estimate rather than a
 * clinically validated predictive model.
 *
 * Inputs:
 *
 * - Current ED volume relative to the historical
 *   weekday/hour census baseline
 * - Future historical ED census and boarding baselines
 *   at +2 hours and +4 hours
 * - Current boarding burden relative to expectation
 * - Version 2.2 projected acute-bed availability using
 *   known demand, expected additional ED admissions, and
 *   expected inpatient departures
 * - Recent Hospital Readiness score movement
 *
 * This component does not modify Hospital Readiness results,
 * application state, or snapshot history.
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

    futureExpectedVolume:number;

    futureExpectedBoarders:number;

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


        /*
         * Near-Term Outlook methodology:
         *
         * ED census is projected from the historical
         * weekday/hour pattern rather than hospital
         * inpatient net flow.
         *
         * The current deviation from historical ED census
         * is carried forward to the future historical
         * census bucket:
         *
         * scenario ED volume =
         * future historical ED volume
         * +
         * current ED deviation from expectation
         *
         * Boarding uses the same approach and is clamped
         * between 0 and the projected ED census.
         *
         * Version 2.2 projected acute-bed availability remains
         * available as separate hospital-capacity context.
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


        const twoHourEstimate =

            createForecastEstimate({

                horizonHours:
                    2,

                currentVolume:
                    assessment.totalEDVolume,

                currentScore:
                    result.score,

                currentVolumeDeviation,

                currentBoardingDeviation,

                futureExpectedVolume:
                    twoHourHistorical.expectedEDVolume,

                futureExpectedBoarders:
                    twoHourHistorical.expectedEDBoarders,

                recentHourlyScoreChange

            });


        const fourHourEstimate =

            createForecastEstimate({

                horizonHours:
                    4,

                currentVolume:
                    assessment.totalEDVolume,

                currentScore:
                    result.score,

                currentVolumeDeviation,

                currentBoardingDeviation,

                futureExpectedVolume:
                    fourHourHistorical.expectedEDVolume,

                futureExpectedBoarders:
                    fourHourHistorical.expectedEDBoarders,

                recentHourlyScoreChange

            });


        container.innerHTML =

            createForecastMarkup({

                currentScore:
                    result.score,

                currentVolume:
                    assessment.totalEDVolume,

                currentBoarders:
                    assessment.boardedPatients,

                currentExpectedVolume:
                    assessment.expectedEDVolume,

                currentExpectedBoarders:
                    assessment.expectedEDBoarders,

                currentVolumeDeviation,

                currentBoardingDeviation,

                currentDirectAdmissions:
                    assessment.currentDirectAdmissions,

                currentSurgicalAdmissions:
                    assessment.currentSurgicalAdmissions,

                expectedEDAdmissions4h:
                    assessment.expectedEDAdmissions4h,

                expectedInpatientDepartures4h:
                    assessment.expectedInpatientDepartures4h,

                projectedAvailableAcuteCareBeds:
                    result.projectedAvailableAcuteCareBeds,

                recentHourlyScoreChange,

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

        currentScore:number;

        currentVolumeDeviation:number;

        currentBoardingDeviation:number;

        futureExpectedVolume:number;

        futureExpectedBoarders:number;

        recentHourlyScoreChange:number;

    }

):ForecastEstimate {

    const projectedVolume = Math.max(

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


    const configuration =

        getConfiguration();


    const edCapacity =

        Math.max(

            1,

            configuration.hospital.edCapacity

        );


    const projectedCapacityPercent =

        calculatePercentage(

            projectedVolume,

            edCapacity

        );


    /*
     * Volume movement contribution:
     *
     * Scenario HRI remains a directional estimate.
     *
     * ED-volume movement now comes from the historical
     * future-hour census pattern plus the current deviation
     * from expectation. This replaces the prior use of
     * hospital inpatient net flow as an ED-census proxy.
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
     * Projected boarding above the future historical
     * expectation adds sustained scenario pressure.
     */
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

        futureExpectedVolume:
            roundToOneDecimal(
                options.futureExpectedVolume
            ),

        futureExpectedBoarders:
            roundToOneDecimal(
                options.futureExpectedBoarders
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
 * Estimate recent hourly Hospital Readiness movement.
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

        currentBoarders:number;

        currentExpectedVolume:number;

        currentExpectedBoarders:number;

        currentVolumeDeviation:number;

        currentBoardingDeviation:number;

        currentDirectAdmissions:number;

        currentSurgicalAdmissions:number;

        expectedEDAdmissions4h:number;

        expectedInpatientDepartures4h:number;

        projectedAvailableAcuteCareBeds:number;

        recentHourlyScoreChange:number;

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
                    Current Hospital Readiness
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
                    Current ED Boarders
                </span>

                <strong>
                    ${formatNumber(
                        options.currentBoarders
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
                Scenario basis
            </h4>


            <div class="operational-forecast-assumption-grid">

                ${createAssumptionCard(

                    "ED Census Position",

                    formatSignedNumber(
                        options.currentVolumeDeviation
                    ),

                    `Current ED census is ${formatDifferenceDescription(
                        options.currentVolumeDeviation
                    )} the historical weekday/hour expectation. That deviation is carried forward across the future historical ED census pattern.`

                )}


                ${createAssumptionCard(

                    "Boarding Position",

                    formatSignedNumber(
                        options.currentBoardingDeviation
                    ),

                    `Current boarding is ${formatDifferenceDescription(
                        options.currentBoardingDeviation
                    )} the historical weekday/hour expectation. The same deviation is carried forward against future historical boarding expectations.`

                )}


                ${createAssumptionCard(

                    "Projected Acute-Bed Position",

                    formatSignedNumber(
                        options.projectedAvailableAcuteCareBeds
                    ),

                    `Projected availability reflects ${formatNumber(
                        options.currentBoarders
                    )} current ED boarders, ${formatNumber(
                        options.currentDirectAdmissions
                    )} known direct admissions, ${formatNumber(
                        options.currentSurgicalAdmissions
                    )} known surgical/procedural admissions, ${formatNumber(
                        options.expectedEDAdmissions4h
                    )} expected additional ED admissions, and ${formatNumber(
                        options.expectedInpatientDepartures4h
                    )} expected inpatient departures.`

                )}


                ${createAssumptionCard(

                    "Recent HRI Movement",

                    `${formatSignedNumber(
                        options.recentHourlyScoreChange
                    )} per hour`,

                    "Only half of the recent HRI trajectory is continued in the scenario estimate to reduce overreaction to one change."

                )}

            </div>

        </div>


        <div class="operational-forecast-disclaimer">

            <strong>
                Directional scenario only
            </strong>

            <p>
                Scenario HRI and Scenario Level are transparent operational estimates, not validated predictions of the future HRI. They should support, not replace, operational judgment.
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
                        Scenario Horizon
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
                    Scenario Level
                </span>

                <strong>

                    ${escapeHtml(
                        estimate.projectedLevel
                    )}

                </strong>

            </div>


            <div class="operational-forecast-score">

                <span>
                    Scenario HRI
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
                        Scenario ED Volume
                    </span>

                    <strong>

                        ${formatNumber(
                            estimate.projectedVolume
                        )}

                    </strong>

                    <small>
                        Historical ${formatNumber(
                            estimate.futureExpectedVolume
                        )}
                    </small>

                </div>


                <div>

                    <span>
                        Scenario Boarders
                    </span>

                    <strong>

                        ${formatNumber(
                            estimate.projectedBoarders
                        )}

                    </strong>

                    <small>
                        Historical ${formatNumber(
                            estimate.futureExpectedBoarders
                        )}
                    </small>

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
                Calculate Hospital Readiness to generate the 2-hour and 4-hour scenario outlook.
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
 * Describe a signed difference relative to expectation.
 */
function formatDifferenceDescription(

    value:number

):string {

    if(value > 0){

        return `${formatNumber(
            value
        )} above`;

    }


    if(value < 0){

        return `${formatNumber(
            Math.abs(value)
        )} below`;

    }


    return "at";

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