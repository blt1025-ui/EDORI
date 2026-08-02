/**
 * TrendChart
 *
 * Displays the saved EDORI score trend using the
 * Alpha–Echo operational-level model.
 *
 * The chart reads persistent SnapshotService data.
 *
 * It does not:
 *
 * - Calculate EDORI
 * - Evaluate operational triggers
 * - Save or alter snapshot history
 * - Reconstruct past trigger-adjusted levels
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    getOperationalState

}

from "../config/operationalStates";


import {

    subscribe

}

from "../services/EventService";


import {

    getSnapshots

}

from "../services/SnapshotService";


import type {

    EdoriSnapshot

}

from "../types/EdoriSnapshot";


/**
 * Maximum number of trend points shown.
 */
const MAXIMUM_TREND_POINTS = 24;


/**
 * SVG layout constants.
 */
const SVG_WIDTH = 760;

const SVG_HEIGHT = 320;

const PLOT_LEFT = 54;

const PLOT_RIGHT = 22;

const PLOT_TOP = 20;

const PLOT_BOTTOM = 48;


interface TrendPoint {

    snapshot:EdoriSnapshot;

    x:number;

    y:number;

    score:number;

}


/**
 * Render the EDORI Trend panel.
 */
export function TrendChart():string {

    return `

        <section class="trend-chart-container">

            <div class="panel-header">

                <div>

                    <h3>
                        EDORI Trend
                    </h3>

                    <p class="panel-description">
                        Saved operational-readiness scores over time
                    </p>

                </div>


                <span
                    id="trendPointCount"
                    class="trend-point-count"
                >
                    0 points
                </span>

            </div>


            <div class="trend-level-legend">

                ${createLevelLegendItem(
                    "Alpha",
                    "0–20",
                    "#16A34A"
                )}

                ${createLevelLegendItem(
                    "Bravo",
                    "21–40",
                    "#EAB308"
                )}

                ${createLevelLegendItem(
                    "Charlie",
                    "41–60",
                    "#F97316"
                )}

                ${createLevelLegendItem(
                    "Delta",
                    "61–80",
                    "#DC2626"
                )}

                ${createLevelLegendItem(
                    "Echo",
                    "81–100",
                    "#111827"
                )}

            </div>


            <div
                id="trendChartContent"
                class="trend-chart-content"
                aria-live="polite"
            >

                ${createEmptyTrendState()}

            </div>

        </section>

    `;

}


/**
 * Initialize the trend chart.
 */
export function initializeTrendChart():void {

    updateTrendChart();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateTrendChart

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateTrendChart

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateTrendChart

    );

}


/**
 * Refresh the trend chart from saved snapshots.
 */
function updateTrendChart():void {

    const container = document.getElementById(

        "trendChartContent"

    );


    if(!container){

        return;

    }


    try {

        const snapshots =

            getValidChronologicalSnapshots();


        updateTrendPointCount(

            snapshots.length

        );


        if(snapshots.length === 0){

            container.innerHTML =

                createEmptyTrendState();


            return;

        }


        const visibleSnapshots = snapshots.slice(

            -MAXIMUM_TREND_POINTS

        );


        container.innerHTML =

            createTrendChartMarkup(

                visibleSnapshots,

                snapshots.length

            );

    }
    catch(error){

        console.error(

            "Unable to update the EDORI trend chart:",

            error

        );


        updateTrendPointCount(

            0

        );


        container.innerHTML = `

            <div class="trend-chart-empty error">

                <strong>
                    Trend unavailable
                </strong>

                <p>
                    Review the browser console for additional details.
                </p>

            </div>

        `;

    }

}


/**
 * Return valid snapshots in chronological order.
 */
function getValidChronologicalSnapshots():

EdoriSnapshot[] {

    return getSnapshots()

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

        .map(

            snapshot => ({

                ...snapshot,

                operationalState:{

                    ...snapshot.operationalState

                },

                timestamp:new Date(

                    snapshot.timestamp

                )

            })

        )

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

}


/**
 * Create the completed chart.
 */
function createTrendChartMarkup(

    snapshots:EdoriSnapshot[],

    totalSnapshotCount:number

):string {

    const points = createTrendPoints(

        snapshots

    );


    const polylinePoints = points

        .map(

            point =>

                `${roundCoordinate(point.x)},${roundCoordinate(point.y)}`

        )

        .join(" ");


    const latestPoint = points[

        points.length - 1

    ];


    const previousPoint = points.length > 1

        ? points[points.length - 2]

        : null;


    const latestState = getOperationalState(

        latestPoint.score

    );


    const latestChange = previousPoint

        ? latestPoint.score

            -

            previousPoint.score

        : null;


    return `

        <div class="trend-chart-current-summary">

            <div>

                <span>
                    Latest Score
                </span>

                <strong>
                    ${Math.round(latestPoint.score)}
                </strong>

            </div>


            <div>

                <span>
                    Current Level
                </span>

                <strong>

                    ${escapeHtml(
                        `${latestState.icon} ${latestState.title}`
                    )}

                </strong>

            </div>


            <div>

                <span>
                    Latest Change
                </span>

                <strong
                    class="${createScoreChangeClass(
                        latestChange
                    )}"
                >

                    ${createScoreChangeText(
                        latestChange
                    )}

                </strong>

            </div>

        </div>


        <div class="trend-chart-scroll">

            <svg
                class="trend-chart-svg"
                viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}"
                role="img"
                aria-labelledby="
                    trendChartTitle
                    trendChartDescription
                "
            >

                <title id="trendChartTitle">
                    EDORI score trend
                </title>


                <desc id="trendChartDescription">
                    Saved EDORI scores displayed across Alpha, Bravo, Charlie, Delta, and Echo operational levels.
                </desc>


                ${createOperationalBands()}

                ${createHorizontalGridLines()}

                ${createVerticalAxisLabels()}

                ${createLevelLabels()}

                ${createTimeLabels(points)}

                ${points.length > 1

                    ? `

                        <polyline
                            class="trend-score-line"
                            points="${polylinePoints}"
                            fill="none"
                        />

                    `

                    : ""

                }

                ${points

                    .map(

                        point =>

                            createTrendPointMarkup(

                                point

                            )

                    )

                    .join("")}

            </svg>

        </div>


        <div class="trend-chart-footnote">

            ${totalSnapshotCount > MAXIMUM_TREND_POINTS

                ? `Showing the most recent ${MAXIMUM_TREND_POINTS} of ${totalSnapshotCount} saved assessments.`

                : `${totalSnapshotCount} saved assessment${totalSnapshotCount === 1 ? "" : "s"} displayed.`

            }

            Historical points use the score-derived Alpha–Echo level stored by the EDORI score.

        </div>

    `;

}


/**
 * Convert snapshots into chart coordinates.
 */
function createTrendPoints(

    snapshots:EdoriSnapshot[]

):TrendPoint[] {

    const plotWidth =

        SVG_WIDTH

        -

        PLOT_LEFT

        -

        PLOT_RIGHT;


    const plotHeight =

        SVG_HEIGHT

        -

        PLOT_TOP

        -

        PLOT_BOTTOM;


    return snapshots.map(

        (

            snapshot,

            index

        ) => {

            const score = clampScore(

                snapshot.score

            );


            const x = snapshots.length === 1

                ? PLOT_LEFT

                    +

                    plotWidth / 2

                : PLOT_LEFT

                    +

                    (

                        index

                        /

                        (

                            snapshots.length - 1

                        )

                    )

                    *

                    plotWidth;


            const y = PLOT_TOP

                +

                (

                    1

                    -

                    score / 100

                )

                *

                plotHeight;


            return {

                snapshot,

                x,

                y,

                score

            };

        }

    );

}


/**
 * Draw colored Alpha–Echo background bands.
 */
function createOperationalBands():string {

    const plotHeight =

        SVG_HEIGHT

        -

        PLOT_TOP

        -

        PLOT_BOTTOM;


    const bandHeight =

        plotHeight / 5;


    const bands = [

        {

            title:"Echo",

            fill:"#111827",

            opacity:.09,

            index:0

        },

        {

            title:"Delta",

            fill:"#DC2626",

            opacity:.10,

            index:1

        },

        {

            title:"Charlie",

            fill:"#F97316",

            opacity:.11,

            index:2

        },

        {

            title:"Bravo",

            fill:"#EAB308",

            opacity:.12,

            index:3

        },

        {

            title:"Alpha",

            fill:"#16A34A",

            opacity:.10,

            index:4

        }

    ];


    return bands

        .map(

            band => `

                <rect
                    class="trend-level-band"
                    x="${PLOT_LEFT}"
                    y="${roundCoordinate(
                        PLOT_TOP

                        +

                        band.index * bandHeight
                    )}"
                    width="${SVG_WIDTH - PLOT_LEFT - PLOT_RIGHT}"
                    height="${roundCoordinate(bandHeight)}"
                    fill="${band.fill}"
                    fill-opacity="${band.opacity}"
                >

                    <title>
                        ${band.title} operational range
                    </title>

                </rect>

            `

        )

        .join("");

}


/**
 * Draw score grid lines at 0, 20, 40, 60,
 * 80, and 100.
 */
function createHorizontalGridLines():string {

    const values = [

        0,

        20,

        40,

        60,

        80,

        100

    ];


    return values

        .map(

            value => {

                const y = scoreToY(

                    value

                );


                return `

                    <line
                        class="trend-grid-line"
                        x1="${PLOT_LEFT}"
                        y1="${roundCoordinate(y)}"
                        x2="${SVG_WIDTH - PLOT_RIGHT}"
                        y2="${roundCoordinate(y)}"
                    />

                `;

            }

        )

        .join("");

}


/**
 * Draw numerical vertical-axis labels.
 */
function createVerticalAxisLabels():string {

    const values = [

        0,

        20,

        40,

        60,

        80,

        100

    ];


    return values

        .map(

            value => `

                <text
                    class="trend-axis-label"
                    x="${PLOT_LEFT - 12}"
                    y="${roundCoordinate(
                        scoreToY(value) + 4
                    )}"
                    text-anchor="end"
                >

                    ${value}

                </text>

            `

        )

        .join("");

}


/**
 * Draw Alpha–Echo labels within each band.
 */
function createLevelLabels():string {

    const labels = [

        {

            title:"Echo",

            score:90

        },

        {

            title:"Delta",

            score:70

        },

        {

            title:"Charlie",

            score:50

        },

        {

            title:"Bravo",

            score:30

        },

        {

            title:"Alpha",

            score:10

        }

    ];


    return labels

        .map(

            item => `

                <text
                    class="trend-level-label"
                    x="${SVG_WIDTH - PLOT_RIGHT - 8}"
                    y="${roundCoordinate(
                        scoreToY(item.score) + 4
                    )}"
                    text-anchor="end"
                >

                    ${item.title}

                </text>

            `

        )

        .join("");

}


/**
 * Draw a limited number of time-axis labels.
 */
function createTimeLabels(

    points:TrendPoint[]

):string {

    if(points.length === 0){

        return "";

    }


    const labelIndexes = new Set<number>([

        0,

        points.length - 1

    ]);


    if(points.length >= 3){

        labelIndexes.add(

            Math.floor(

                (

                    points.length - 1

                )

                / 2

            )

        );

    }


    if(points.length >= 8){

        labelIndexes.add(

            Math.floor(

                (

                    points.length - 1

                )

                / 4

            )

        );


        labelIndexes.add(

            Math.floor(

                (

                    points.length - 1

                )

                *

                3

                /

                4

            )

        );

    }


    return Array.from(

        labelIndexes

    )

        .sort(

            (

                first,

                second

            ) => first - second

        )

        .map(

            index => {

                const point =

                    points[index];


                return `

                    <text
                        class="trend-time-label"
                        x="${roundCoordinate(point.x)}"
                        y="${SVG_HEIGHT - 17}"
                        text-anchor="${getTimeLabelAnchor(
                            index,
                            points.length
                        )}"
                    >

                        ${escapeHtml(
                            formatShortDateTime(
                                new Date(
                                    point.snapshot.timestamp
                                )
                            )
                        )}

                    </text>

                `;

            }

        )

        .join("");

}


/**
 * Create one score point.
 */
function createTrendPointMarkup(

    point:TrendPoint

):string {

    const state = getOperationalState(

        point.score

    );


    return `

        <circle
            class="trend-score-point"
            cx="${roundCoordinate(point.x)}"
            cy="${roundCoordinate(point.y)}"
            r="6"
            fill="${escapeAttribute(state.color)}"
            stroke="#ffffff"
            stroke-width="3"
            tabindex="0"
            aria-label="${escapeAttribute(
                `${formatLongDateTime(
                    new Date(
                        point.snapshot.timestamp
                    )
                )}: EDORI ${Math.round(point.score)}, level ${state.title}`
            )}"
        >

            <title>

                ${escapeHtml(
                    formatLongDateTime(
                        new Date(
                            point.snapshot.timestamp
                        )
                    )
                )}

                — EDORI ${Math.round(point.score)}

                — ${escapeHtml(state.title)}

            </title>

        </circle>

    `;

}


/**
 * Create one legend item.
 */
function createLevelLegendItem(

    level:string,

    range:string,

    color:string

):string {

    return `

        <div class="trend-level-legend-item">

            <span
                class="trend-level-legend-swatch"
                style="background:${escapeAttribute(color)};"
                aria-hidden="true"
            >
            </span>

            <strong>
                ${escapeHtml(level)}
            </strong>

            <span>
                ${escapeHtml(range)}
            </span>

        </div>

    `;

}


/**
 * Convert a score to a Y coordinate.
 */
function scoreToY(

    score:number

):number {

    const plotHeight =

        SVG_HEIGHT

        -

        PLOT_TOP

        -

        PLOT_BOTTOM;


    return PLOT_TOP

        +

        (

            1

            -

            clampScore(score)

            /

            100

        )

        *

        plotHeight;

}


/**
 * Determine time-label anchoring.
 */
function getTimeLabelAnchor(

    index:number,

    pointCount:number

):"start" | "middle" | "end" {

    if(index === 0){

        return "start";

    }


    if(index === pointCount - 1){

        return "end";

    }


    return "middle";

}


/**
 * Create score-change text.
 */
function createScoreChangeText(

    scoreChange:number | null

):string {

    if(scoreChange === null){

        return "Initial entry";

    }


    const rounded = Math.round(

        scoreChange

    );


    if(rounded > 0){

        return `+${rounded}`;

    }


    return String(

        rounded

    );

}


/**
 * Create score-change CSS class.
 */
function createScoreChangeClass(

    scoreChange:number | null

):string {

    if(scoreChange === null){

        return "trend-change-initial";

    }


    if(scoreChange <= -5){

        return "trend-change-improving";

    }


    if(scoreChange >= 10){

        return "trend-change-critical";

    }


    if(scoreChange > 0){

        return "trend-change-increasing";

    }


    return "trend-change-stable";

}


/**
 * Update the point count.
 */
function updateTrendPointCount(

    count:number

):void {

    const element = document.getElementById(

        "trendPointCount"

    );


    if(!element){

        return;

    }


    element.textContent = count === 1

        ? "1 point"

        : `${count} points`;

}


/**
 * Create the empty chart state.
 */
function createEmptyTrendState():string {

    return `

        <div class="trend-chart-empty">

            <strong>
                No trend data
            </strong>

            <p>
                Saved EDORI assessments will appear after calculation.
            </p>

        </div>

    `;

}


/**
 * Format a compact chart date.
 */
function formatShortDateTime(

    date:Date

):string {

    return date.toLocaleString(

        [],

        {

            month:
                "short",

            day:
                "numeric",

            hour:
                "numeric"

        }

    );

}


/**
 * Format a detailed point date.
 */
function formatLongDateTime(

    date:Date

):string {

    return date.toLocaleString(

        [],

        {

            month:
                "short",

            day:
                "numeric",

            year:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"

        }

    );

}


/**
 * Clamp score between 0 and 100.
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
 * Round an SVG coordinate.
 */
function roundCoordinate(

    value:number

):number {

    return Math.round(

        value * 10

    ) / 10;

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