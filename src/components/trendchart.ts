/**
 * TrendChart
 *
 * Displays persistent EDORI score history.
 *
 * SnapshotService is the authoritative source,
 * accessed through TrendService.
 *
 * This component:
 *
 * - Does not calculate EDORI
 * - Does not save snapshots
 * - Does not maintain a separate history array
 * - Refreshes after RESULT_CHANGED
 */

import {

    CategoryScale,

    Chart,

    Legend,

    LinearScale,

    LineController,

    LineElement,

    PointElement,

    Tooltip

}

from "chart.js";


import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    subscribe

}

from "../services/EventService";


import {

    getRecentTrendHistory

}

from "../services/TrendService";


import type {

    TrendPoint

}

from "../services/TrendService";


const MAXIMUM_CHART_POINTS = 50;


let chart:Chart<

    "line",

    number[],

    string

> | null = null;


let chartRegistered = false;


/**
 * Render the trend panel.
 */
export function TrendChart():string {

    return `

        <section class="trend-container">

            <div class="panel-header">

                <div>

                    <h3>
                        EDORI Trend
                    </h3>

                    <p class="panel-description">
                        Submitted EDORI assessments over time
                    </p>

                </div>

            </div>


            <div class="trend-chart-wrapper">

                <canvas
                    id="edoriTrendChart"
                    aria-label="EDORI score trend chart"
                    role="img"
                >
                </canvas>

            </div>


            <div
                id="trend-summary"
                class="trend-summary"
                aria-live="polite"
            >
                No EDORI assessments recorded.
            </div>

        </section>

    `;

}


/**
 * Initialize the trend chart.
 */
export function initializeTrendChart():void {

    registerChartComponents();

    updateTrend();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateTrend

    );


    /*
     * Reserved for future history deletion,
     * import, or synchronization.
     */

    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateTrend

    );

}


/**
 * Register required Chart.js components once.
 */
function registerChartComponents():void {

    if(chartRegistered){

        return;

    }


    Chart.register(

        LineController,

        LineElement,

        PointElement,

        LinearScale,

        CategoryScale,

        Tooltip,

        Legend

    );


    chartRegistered = true;

}


/**
 * Refresh the chart from persistent snapshots.
 */
function updateTrend():void {

    const canvas = document.getElementById(

        "edoriTrendChart"

    ) as HTMLCanvasElement | null;


    if(!canvas){

        return;

    }


    const history = getRecentTrendHistory(

        MAXIMUM_CHART_POINTS

    );


    destroyChart();


    if(history.length === 0){

        clearCanvas(

            canvas

        );


        updateTrendSummary(

            history

        );


        return;

    }


    chart = new Chart(

        canvas,

        {

            type:"line",

            data:{

                labels:history.map(

                    point => formatChartTimestamp(

                        point.timestamp

                    )

                ),

                datasets:[

                    {

                        label:"EDORI Score",

                        data:history.map(

                            point => Math.round(

                                point.score

                            )

                        ),

                        borderWidth:3,

                        pointRadius:4,

                        pointHoverRadius:6,

                        tension:0.25,

                        fill:false

                    }

                ]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                animation:{

                    duration:250

                },

                interaction:{

                    intersect:false,

                    mode:"index"

                },

                scales:{

                    x:{

                        title:{

                            display:true,

                            text:"Assessment Time"

                        },

                        ticks:{

                            maxRotation:45,

                            minRotation:0,

                            autoSkip:true,

                            maxTicksLimit:12

                        }

                    },

                    y:{

                        min:0,

                        max:100,

                        title:{

                            display:true,

                            text:"EDORI Score"

                        },

                        ticks:{

                            stepSize:20

                        }

                    }

                },

                plugins:{

                    legend:{

                        display:true,

                        position:"bottom"

                    },

                    tooltip:{

                        callbacks:{

                            label:(context) => {

                                const value =

                                    context.parsed.y;


                                return `EDORI Score: ${value}`;

                            }

                        }

                    }

                }

            }

        }

    );


    updateTrendSummary(

        history

    );

}


/**
 * Destroy the existing Chart.js instance.
 */
function destroyChart():void {

    if(!chart){

        return;

    }


    chart.destroy();

    chart = null;

}


/**
 * Update the text summary beneath the chart.
 */
function updateTrendSummary(

    history:TrendPoint[]

):void {

    const element = document.getElementById(

        "trend-summary"

    );


    if(!element){

        return;

    }


    if(history.length === 0){

        element.textContent =

            "No EDORI assessments recorded.";


        return;

    }


    const current = history[

        history.length - 1

    ];


    if(history.length === 1){

        element.textContent =

            `Current Score: ${Math.round(current.score)} | One submitted assessment`;


        return;

    }


    const previous = history[

        history.length - 2

    ];


    const difference = Math.round(

        current.score -

        previous.score

    );


    element.textContent =

        `Current Score: ${Math.round(current.score)} | Trend: ${getTrendDirection(difference)} (${formatDifference(difference)}) | ${history.length} assessments shown`;

}


/**
 * Determine the operational trend direction.
 */
function getTrendDirection(

    difference:number

):string {

    if(difference > 0){

        return "Increasing";

    }


    if(difference < 0){

        return "Improving";

    }


    return "Stable";

}


/**
 * Format the change between the latest scores.
 */
function formatDifference(

    difference:number

):string {

    if(difference > 0){

        return `+${difference}`;

    }


    return String(

        difference

    );

}


/**
 * Format a timestamp for the chart x-axis.
 */
function formatChartTimestamp(

    timestamp:Date

):string {

    if(Number.isNaN(timestamp.getTime())){

        return "Unknown";

    }


    const dateText = timestamp.toLocaleDateString(

        [],

        {

            month:"short",

            day:"numeric"

        }

    );


    const timeText = timestamp.toLocaleTimeString(

        [],

        {

            hour:"2-digit",

            minute:"2-digit"

        }

    );


    return `${dateText} ${timeText}`;

}


/**
 * Clear residual chart pixels when no history exists.
 */
function clearCanvas(

    canvas:HTMLCanvasElement

):void {

    const context = canvas.getContext(

        "2d"

    );


    if(!context){

        return;

    }


    context.clearRect(

        0,

        0,

        canvas.width,

        canvas.height

    );

}